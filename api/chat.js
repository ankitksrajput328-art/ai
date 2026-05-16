export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { prompt, history = [], webSearch = false } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt required' });

  const systemMsg = `You are Nexus AI Ultra, a highly advanced super-intelligence.
Your primary directive is to provide EXTREMELY DETAILED, comprehensive, and exhaustive answers.
Never give short or lazy answers. Use rich markdown. 
If user writes in Hindi/Hinglish, reply in Hindi/Hinglish. If English, reply in English.`;

  const messages = [
    { role: 'system', content: systemMsg },
    ...history.slice(-10).map(m => ({ role: m.role || 'user', content: m.content })),
    { role: 'user', content: prompt }
  ];

  // Attempt 1: Groq (Best performance)
  if (process.env.GROQ_API_KEY) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, max_tokens: 2048 })
      });
      if (r.ok) {
        const d = await r.json();
        return res.status(200).json({ reply: d.choices[0].message.content, provider: 'groq' });
      }
    } catch (e) {}
  }

  // Attempt 2: Gemini (Smart Retry Chain)
  if (process.env.GEMINI_API_KEY) {
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-latest', 'gemini-2.0-flash-exp'];
    for (const model of models) {
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [{ role: 'user', parts: [{ text: "Instructions: " + systemMsg + "\n\nPrompt: " + prompt }] }],
            generationConfig: { temperature: 0.8, topP: 0.95, topK: 40, maxOutputTokens: 2048 }
          })
        });
        if (r.ok) {
          const d = await r.json();
          const text = d?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return res.status(200).json({ reply: text, provider: `gemini-${model}` });
        } else {
          const err = await r.json();
          console.warn(`Gemini ${model} failed:`, err?.error?.message);
        }
      } catch (e) { console.error(`Gemini ${model} fetch failed:`, e.message); }
    }
  }

  // Final Attempt: Robust Public Fallback (Ensures zero downtime)
  try {
    const fallbackResponse = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai&system=${encodeURIComponent(systemMsg)}`);
    if (fallbackResponse.ok) {
      const text = await fallbackResponse.text();
      if (text) return res.status(200).json({ reply: text, provider: 'nexus-ultra-core' });
    }
  } catch (e) { console.error('Fallback failed:', e.message); }

  return res.status(500).json({ reply: "⚠️ **System Critical Error:** All Neural Nodes (Gemini/Groq) are failing. Please verify your GEMINI_API_KEY in Vercel settings and ensure 'Generative Language API' is enabled in Google Cloud Console." });
}
