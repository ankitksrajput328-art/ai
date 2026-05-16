export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { prompt, history = [], webSearch = false } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt required' });

  let systemMsg = `You are Nexus AI Ultra, a highly advanced super-intelligence.
Your primary directive is to provide EXTREMELY DETAILED, comprehensive, and exhaustive answers, rivaling ChatGPT Plus and Gemini Advanced. 
Never give short or lazy answers. If asked a concept, explain it deeply with examples, bullet points, and step-by-step logic.
Use rich markdown formatting (bolding, lists, code blocks). 
Remember previous conversation context. If the user writes in Hindi/Hinglish, reply in Hindi/Hinglish. If English, reply in English.`;

  let userPrompt = prompt;

  if (webSearch) {
    systemMsg += "\n[WEB SEARCH MODE ACTIVE] You have been asked to provide real-time or deep information. Provide comprehensive, up-to-date analysis.";
    userPrompt = "Please search your knowledge base and provide a highly detailed, accurate response to: " + prompt;
  }

  // Format history for Gemini/Groq
  const messages = [
    { role: 'system', content: systemMsg },
    ...history.map(m => ({ role: m.role || 'user', content: m.content })),
    { role: 'user', content: userPrompt }
  ];

  // Provider 1: Groq (Llama 3 70B) - Fastest and smartest free API
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const qr = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: messages,
          max_tokens: 2048
        })
      });
      if (qr.ok) {
        const qd = await qr.json();
        const text = qd?.choices?.[0]?.message?.content;
        if (text) return res.status(200).json({ reply: text, provider: 'groq' });
      }
    } catch (e) { console.error('Groq failed:', e.message); }
  }

  // Provider 2: Google Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      // Fix history mapping for Gemini strictly alternating user/model
      let geminiHistory = [];
      for (let i = 0; i < history.length; i++) {
        let m = history[i];
        let role = m.role === 'assistant' ? 'model' : 'user';
        if (geminiHistory.length > 0 && geminiHistory[geminiHistory.length-1].role === role) {
           geminiHistory[geminiHistory.length-1].parts[0].text += "\\n" + m.content;
        } else {
           geminiHistory.push({ role: role, parts: [{ text: m.content }] });
        }
      }
      
      // Ensure the last message in history isn't also a 'user' if we're adding userPrompt
      if (geminiHistory.length > 0 && geminiHistory[geminiHistory.length-1].role === 'user') {
          geminiHistory.push({ role: 'model', parts: [{ text: 'Understood.' }] });
      }

      geminiHistory.push({ role: 'user', parts: [{ text: userPrompt }] });

      const requestBody = {
        system_instruction: { parts: [{ text: systemMsg }] },
        contents: geminiHistory
      };

      const gr = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (gr.ok) {
        const gd = await gr.json();
        const text = gd?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return res.status(200).json({ reply: text, provider: 'gemini' });
      } else {
        const errorText = await gr.text();
        console.error('Gemini API Error Response:', errorText);
        return res.status(500).json({ reply: '⚠️ **Gemini API Error:** ' + errorText });
      }
    } catch (e) { console.error('Gemini failed:', e.message); }
  }

  // If no providers succeeded, return an error
  return res.status(500).json({ reply: "⚠️ **System Error:** Failed to generate response from Cloud Providers. Please verify your GEMINI_API_KEY in Vercel settings.", provider: 'error' });
}
