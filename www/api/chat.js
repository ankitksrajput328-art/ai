export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt required' });

  const systemMsg = 'You are Nexus AI Ultra, a brilliant and helpful AI assistant. Answer clearly and helpfully. If the user writes in Hindi, reply in Hindi. If English, reply in English. Be friendly, detailed, and knowledgeable.';

  // Provider 1: Google Gemini (free, 15 req/min)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const gr = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemMsg + '\n\nUser: ' + prompt }] }]
        })
      });
      if (gr.ok) {
        const gd = await gr.json();
        const text = gd?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return res.status(200).json({ reply: text, provider: 'gemini' });
      }
    } catch (e) { console.error('Gemini failed:', e.message); }
  }

  // Provider 2: Pollinations (free, no key)
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 8000);
    const pr = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`, { signal: ctrl.signal });
    if (pr.ok) {
      const text = await pr.text();
      if (text && text.trim().length > 5) return res.status(200).json({ reply: text, provider: 'pollinations' });
    }
  } catch (e) { console.error('Pollinations failed:', e.message); }

  // Provider 3: Groq (free tier)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const qr = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: systemMsg }, { role: 'user', content: prompt }],
          max_tokens: 1024
        })
      });
      if (qr.ok) {
        const qd = await qr.json();
        const text = qd?.choices?.[0]?.message?.content;
        if (text) return res.status(200).json({ reply: text, provider: 'groq' });
      }
    } catch (e) { console.error('Groq failed:', e.message); }
  }

  // Provider 4: Server-side intelligent fallback
  return res.status(200).json({ reply: getSmartReply(prompt), provider: 'local' });
}

function getSmartReply(prompt) {
  const p = prompt.toLowerCase();
  if (/\b(hi|hello|hey|namaste|namaskar)\b/.test(p))
    return "👋 Namaste! Main Nexus AI Ultra hoon. Aap kuch bhi pooch sakte hain — coding, science, math, history, ya kuch bhi! Batayein, kaise madad karoon? 🚀";
  if (/\b(ai|artificial intelligence)\b/.test(p))
    return "🤖 **Artificial Intelligence (AI)** ek powerful technology hai.\n\n**Types:**\n- **Machine Learning** — Data se seekhna\n- **Deep Learning** — Neural networks use karna\n- **NLP** — Bhasha samajhna\n- **Computer Vision** — Images analyze karna\n- **Generative AI** — Naya content banana (jaise ChatGPT)\n\nAI aaj healthcare, finance, education, aur entertainment mein use ho raha hai. Nexus AI Ultra bhi ek advanced AI system hai! ✨";
  if (/\b(weather|mausam)\b/.test(p))
    return "🌤️ Main real-time weather data access nahi kar sakta abhi, lekin aap Google Weather ya weather.com check kar sakte hain. Koi aur sawaal ho toh zaroor poochein!";
  if (/\b(code|coding|program|python|javascript|html)\b/.test(p))
    return "💻 Main coding mein expert hoon! Aap mujhe specifically batayein:\n- Kaunsi language? (Python, JavaScript, HTML, etc.)\n- Kya banana hai?\n- Koi error fix karna hai?\n\nExample: \"Write a Python function to sort a list\" ya \"Fix this JavaScript code\" likh sakte hain!";
  if (/\b(math|calculate|ganit)\b/.test(p))
    return "🔢 Math problems solve karne ke liye mujhe specific question batayein! Jaise:\n- Algebra equations\n- Geometry formulas\n- Statistics\n- Calculus\n\nExample: \"Solve x^2 + 5x + 6 = 0\" likh sakte hain!";
  if (/\b(who are you|kaun ho|kon ho|tum kaun)\b/.test(p))
    return "🧠 Main **Nexus AI Ultra v3.5** hoon — ek state-of-the-art neural intelligence platform.\n\n**Mere features:**\n- 💬 Multi-lingual chat (Hindi + English)\n- 🎨 Image generation\n- 🔬 Deep research\n- 💻 Code generation\n- 🗣️ Voice interaction\n\nMujhse kuch bhi poochein! 🚀";
  if (/\b(thank|dhanyavad|shukriya|thanks)\b/.test(p))
    return "😊 Aapka swagat hai! Kuch aur help chahiye toh zaroor poochein. Main hamesha ready hoon! 🌟";
  return `💡 **Nexus AI Ultra**\n\nAapka sawaal mila: "${prompt}"\n\nAbhi main AI server se connect ho raha hoon. Server busy hai toh thodi der mein dobara try karein.\n\n**Tip:** Aap ye pooch sakte hain:\n- \"What is AI?\"\n- \"Write Python code for...\"\n- \"Generate image of...\"\n- \"Explain quantum physics\"`;
}
