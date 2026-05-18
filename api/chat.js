export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let { prompt, history = [], webSearch = false, image = null, mimeType } = req.body || {};
  if (!mimeType) mimeType = 'image/jpeg';
  if (!prompt && !image) return res.status(400).json({ error: 'prompt or image required' });

  const systemMsg = `You are Nexus AI Ultra, a highly advanced super-intelligence.
Your primary directive is to provide EXTREMELY DETAILED, comprehensive, and exhaustive answers.
Never give short or lazy answers. Use rich markdown. 
If user writes in Hindi/Hinglish, reply in Hindi/Hinglish. If English, reply in English.`;

  // Format messages for OpenAI/Pollinations (Fallback)
  const messages = [
    { role: 'system', content: systemMsg },
    ...history.map(m => ({ role: m.role || 'user', content: m.content })),
    { role: 'user', content: prompt || "Analyze this image." }
  ];

  // Attempt 1: Gemini (2026 Ultra Series)
  if (process.env.GEMINI_API_KEY) {
    const models = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro', 'gemini-2.0-flash'];
    for (const model of models) {
      try {
        // Format contents for Gemini
        const contents = [];
        
        // Add history
        history.forEach(m => {
          contents.push({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          });
        });

        // Add current prompt
        const currentParts = [{ text: "Instructions: " + systemMsg + "\n\nPrompt: " + (prompt || "Analyze this image.") }];
        if (image) {
          currentParts.push({
            inlineData: { mimeType: mimeType, data: image }
          });
        }
        contents.push({
          role: 'user',
          parts: currentParts
        });

        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents })
        });

        if (r.ok) {
          const d = await r.json();
          const text = d?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return res.status(200).json({ reply: text, provider: `nexus-node-${model}` });
        }
      } catch (e) {
        console.error(`Gemini ${model} failed:`, e);
      }
    }
  }

  // Final Attempt: Robust Public Fallback (Ensures zero downtime)
  try {
    const fallbackResponse = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        messages: messages,
        model: 'openai'
      })
    });
    if (fallbackResponse.ok) {
      const text = await fallbackResponse.text();
      if (text) return res.status(200).json({ reply: text, provider: 'nexus-neural-core' });
    }
  } catch (e) {
    console.error("Fallback failed:", e);
  }

  return res.status(500).json({ reply: "⚠️ **System Critical Error:** All Neural Nodes are failing. Please verify your GEMINI_API_KEY in Vercel settings." });
}
