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

  // Attempt 1: Gemini (2026 Ultra Series)
  if (process.env.GEMINI_API_KEY) {
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3.1-flash-lite-preview', 'gemini-2.5-pro'];
    for (const model of models) {
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [{ role: 'user', parts: [{ text: "Instructions: " + systemMsg + "\n\nPrompt: " + prompt }] }]
          })
        });
        if (r.ok) {
          const d = await r.json();
          const text = d?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return res.status(200).json({ reply: text, provider: `nexus-node-${model}` });
        }
      } catch (e) {}
    }
  }

  // Final Attempt: Robust Public Fallback (Ensures zero downtime)
  try {
    const fallbackResponse = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        messages: [{ role: 'system', content: systemMsg }, { role: 'user', content: prompt }],
        model: 'openai'
      })
    });
    if (fallbackResponse.ok) {
      const text = await fallbackResponse.text();
      if (text) return res.status(200).json({ reply: text, provider: 'nexus-neural-core' });
    }
  } catch (e) {}

  return res.status(500).json({ reply: "⚠️ **System Critical Error:** All Neural Nodes are failing. Please verify your GEMINI_API_KEY in Vercel settings." });
}
