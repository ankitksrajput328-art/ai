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

  // Attempt 2: Gemini (Standard)
  if (process.env.GEMINI_API_KEY) {
    try {
      // Use v1beta with 1.5-flash-latest
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: "Instructions: " + systemMsg + "\n\nPrompt: " + prompt }] }] })
      });
      if (r.ok) {
        const d = await r.json();
        const text = d?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return res.status(200).json({ reply: text, provider: 'gemini' });
      }
    } catch (e) {}
  }

  // Final Attempt: Public Ultra-High Speed Fallback (Ensures zero downtime)
  try {
    const r = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model: 'openai', system: systemMsg })
    });
    if (r.ok) {
      const text = await r.text();
      return res.status(200).json({ reply: text, provider: 'nexus-fallback' });
    }
  } catch (e) {}

  return res.status(500).json({ reply: "⚠️ **Neural Node Congestion:** Connection failed. Please check your API keys in Vercel." });
}
