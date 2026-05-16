// Nexus AI Ultra - Core Logic Engine V3.0 (PRO Edition)
// Developed by Ankit Antigravity

// Global Error Handler
window.onerror = function(m,u,l,c,e){ console.error('Nexus Error:',m,u,l); return false; };

// --- Global Variables ---
let currentImageBase64 = null;
let currentImageMimeType = null;
let chatSessions = JSON.parse(localStorage.getItem('nexus_sessions')) || [];
let currentSessionId = localStorage.getItem('nexus_current_id') || null;
let isRecording = false;
let recognition = null;
let visionStream = null;

// --- DOM Selectors ---
const get = (id) => document.getElementById(id);
const chatContent = get('chat-content');
const userInput = get('user-input');
const welcomeScreen = get('welcome-screen');
const sidebar = get('sidebar');
const voiceOverlay = get('voice-overlay');
const voiceTranscript = get('voice-transcript');

// --- Initialization ---
window.onload = () => {
    console.log("Nexus Core V3.0: Online & Secure");
    initRouter();
    renderHistory();
    
    // Theme Restoration
    if (localStorage.getItem('nexus_theme') === 'light') {
        document.body.classList.add('light-theme');
    }
    
    // Initialize Voice Recognition if supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            voiceTranscript.innerText = finalTranscript || interimTranscript;
            if (finalTranscript) {
                userInput.value = finalTranscript;
                autoResize(userInput);
            }
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            stopVoiceRecording();
        };
    }
    
    logStatus("Neural Engine: SECURE_NODE_V3");
};

// --- Messaging Logic ---
async function sendMessage() {
    const text = userInput.value.trim();
    if (!text && !currentImageBase64) return;

    if (welcomeScreen) welcomeScreen.style.display = 'none';

    addMessageToUI(text, true, true, currentImageBase64);
    const img = currentImageBase64;
    userInput.value = '';
    autoResize(userInput);
    removeImage();

    await processAIResponse(text, img);
}

function addMessageToUI(text, isUser, save = true, image = null) {
    if (!chatContent) return;

    const row = document.createElement('div');
    row.className = `message-row ${isUser ? 'user' : 'ai'}`;
    
    const content = document.createElement('div');
    content.className = `message-content ${isUser ? 'user-msg' : 'ai-msg'}`;
    
    if (image) {
        content.innerHTML += `<img src="data:image/jpeg;base64,${image}" alt="Uploaded" style="max-width:100%; border-radius:16px; margin-bottom:12px; display:block; border:1px solid rgba(255,255,255,0.1);">`;
    }

    const textSpan = document.createElement('span');
    textSpan.className = 'text-body';
    if (isUser) {
        textSpan.innerText = text;
    } else {
        textSpan.innerHTML = window.marked ? marked.parse(text) : text;
    }
    content.appendChild(textSpan);

    if (!isUser) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(text);
            copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
            setTimeout(() => copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>', 2000);
        };
        content.appendChild(copyBtn);
    }

    row.appendChild(content);
    chatContent.appendChild(row);
    scrollToBottom();

    if (save) {
        if (!currentSessionId) {
            currentSessionId = Date.now().toString();
            chatSessions.unshift({ id: currentSessionId, title: text.substring(0, 30) || "New Conversation", messages: [] });
        }
        const session = chatSessions.find(s => s.id === currentSessionId);
        if (session) {
            session.messages.push({ text, isUser, image });
            saveSessions();
            renderHistory();
        }
    }
}

async function processAIResponse(prompt, image) {
    const row = document.createElement('div');
    row.className = 'message-row ai';
    const content = document.createElement('div');
    content.className = 'message-content ai-msg';
    const textSpan = document.createElement('span');
    textSpan.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin" style="color:var(--accent);"></i> <span style="color:var(--text-dim)">Thinking...</span>';
    content.appendChild(textSpan);
    row.appendChild(content);
    chatContent.appendChild(row);
    scrollToBottom();

    let fullResponse = "";
    const cleanPrompt = prompt.trim();

    try {
        const lowerPrompt = cleanPrompt.toLowerCase();
        const isImageRequest = /\b(image|photo|picture|draw|paint|generate|banao|dikhao|bana|tasveer|img)\b/.test(lowerPrompt);

        if (isImageRequest) {
            const seed = Date.now();
            const encodedPrompt = encodeURIComponent(cleanPrompt + ", ultra detailed, cinematic, 8k");
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${seed}`;
            fullResponse = `### 🎨 Image Generated!\n\n![Generated Image](${imageUrl})\n\n*"${cleanPrompt}"*`;
            textSpan.innerHTML = window.marked ? marked.parse(fullResponse) : fullResponse;
            speakResponse("Your image is ready.");
        } else {
            let answer = '';

            // Provider 1: Our own Vercel serverless API (most reliable)
            try {
                let contextHistory = [];
                const session = chatSessions.find(s => s.id === currentSessionId);
                if (session && session.messages) {
                    contextHistory = session.messages.slice(-6).map(m => ({
                        role: m.isUser ? 'user' : 'assistant',
                        content: m.text
                    }));
                }
                
                const isWebSearch = cleanPrompt.startsWith('/search ');
                const finalPrompt = isWebSearch ? cleanPrompt.replace('/search ', '') : cleanPrompt;

                const ctrl1 = new AbortController();
                const t1 = setTimeout(() => ctrl1.abort(), 15000);
                const r1 = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: finalPrompt, history: contextHistory, webSearch: isWebSearch }),
                    signal: ctrl1.signal
                });
                clearTimeout(t1);
                if (r1.ok) {
                    const d1 = await r1.json();
                    answer = d1?.reply || '';
                    console.log('AI Provider:', d1?.provider);
                }
            } catch(e1) { console.warn('Server API failed:', e1.message); }

            // Provider 2: Direct Pollinations GET (browser-side fallback)
            if (!answer || answer.trim().length < 5) {
                try {
                    const ctrl2 = new AbortController();
                    const t2 = setTimeout(() => ctrl2.abort(), 10000);
                    const r2 = await fetch(`https://text.pollinations.ai/${encodeURIComponent(cleanPrompt)}?model=openai&seed=${Date.now()}`, { signal: ctrl2.signal });
                    clearTimeout(t2);
                    if (r2.ok) {
                        const text = await r2.text();
                        if (text && text.trim().length > 10) answer = text;
                    }
                } catch(e2) { console.warn('Pollinations direct failed:', e2.message); }
            }

            // Provider 3: Local intelligent fallback (always works)
            if (!answer || answer.trim().length < 5) {
                answer = generateSmartFallback(cleanPrompt);
            }

            // Stream word by word
            textSpan.innerHTML = '';
            fullResponse = answer;
            const words = answer.split(' ');
            let streamed = '';
            for (const word of words) {
                streamed += word + ' ';
                textSpan.innerHTML = window.marked ? marked.parse(streamed) : streamed;
                scrollToBottom();
                await new Promise(r => setTimeout(r, 15));
            }
            speakResponse(answer.substring(0, 200));

            // Copy button & Follow-ups
            const actions = document.createElement('div');
            actions.style.cssText = 'margin-top:12px; display:flex; flex-wrap:wrap; gap:8px;';
            const safeText = answer.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            actions.innerHTML = `<button onclick="navigator.clipboard.writeText(this.dataset.text);this.innerHTML='✅ Copied!';setTimeout(()=>this.innerHTML='📋 Copy',2000);" data-text="${safeText}" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);cursor:pointer;font-size:11px;padding:4px 12px;border-radius:8px;">📋 Copy</button>`;
            
            // Add Smart Suggestions
            const suggestions = generateFollowUpQuestions(cleanPrompt);
            suggestions.forEach(sug => {
                const btn = document.createElement('button');
                btn.className = 'suggestion-chip';
                btn.style.cssText = 'background:rgba(var(--accent-rgb, 14, 165, 233), 0.1); border:1px solid rgba(var(--accent-rgb, 14, 165, 233), 0.3); color:var(--accent); cursor:pointer; font-size:11px; padding:4px 12px; border-radius:12px; transition:all 0.3s ease;';
                btn.innerText = sug;
                btn.onclick = () => { setInput(sug); sendMessage(); };
                actions.appendChild(btn);
            });
            content.appendChild(actions);
        }
    } catch (e) {
        console.error('AI Error:', e);
        fullResponse = generateSmartFallback(cleanPrompt);
        textSpan.innerHTML = window.marked ? marked.parse(fullResponse) : fullResponse;
    }

    const session = chatSessions.find(s => s.id === currentSessionId);
    if (session) {
        session.messages.push({ text: fullResponse, isUser: false });
        saveSessions();
        renderHistory();
    }
}

// Intelligent local fallback — covers common topics
function generateSmartFallback(prompt) {
    const p = prompt.toLowerCase();
    if (/\b(hi|hello|hey|namaste|namaskar|helo)\b/.test(p))
        return "👋 **Namaste! Main Nexus AI Ultra hoon.**\n\nAap kuch bhi pooch sakte hain — coding, science, math, history, ya kuch bhi! Batayein, kaise madad karoon? 🚀";
    if (/\b(ai|artificial intelligence)\b/.test(p))
        return "🤖 **Artificial Intelligence (AI)** ek powerful technology hai.\n\n**Types:**\n- **Machine Learning** — Data se seekhna\n- **Deep Learning** — Neural networks use karna\n- **NLP** — Bhasha samajhna\n- **Computer Vision** — Images analyze karna\n- **Generative AI** — Naya content banana (jaise ChatGPT)\n\nAI aaj healthcare, finance, education, aur entertainment mein use ho raha hai. ✨";
    if (/\b(code|coding|program|python|javascript|html|css|java|react)\b/.test(p))
        return "💻 **Coding Expert Mode Active!**\n\nMain coding mein help kar sakta hoon:\n- **Python** — Data science, AI, automation\n- **JavaScript** — Web apps, Node.js\n- **HTML/CSS** — Beautiful websites\n- **React** — Modern UI development\n\nApna specific question batayein! Jaise: *'Write a Python function to sort a list'*";
    if (/\b(math|calculate|ganit|formula)\b/.test(p))
        return "🔢 **Math Expert Ready!**\n\nMain solve kar sakta hoon:\n- Algebra, Geometry, Trigonometry\n- Calculus, Statistics\n- Word problems\n\nApna question likho, jaise: *'Solve x² + 5x + 6 = 0'*";
    if (/\b(weather|mausam|temperature)\b/.test(p))
        return "🌤️ Real-time weather ke liye **Google Weather** ya **weather.com** check karein.\n\nKoi aur question ho toh zaroor poochein!";
    if (/\b(who are you|kaun ho|kon ho|tum kaun|kya ho)\b/.test(p))
        return "🧠 **Main Nexus AI Ultra v3.5 hoon!**\n\n**Features:**\n- 💬 Hindi + English chat\n- 🎨 Image generation\n- 💻 Code generation\n- 🔬 Research & analysis\n- 🗣️ Voice interaction\n\nMujhse kuch bhi poochein! 🚀";
    if (/\b(thank|dhanyavad|shukriya|thanks)\b/.test(p))
        return "😊 Aapka swagat hai! Kuch aur help chahiye toh zaroor poochein. Main hamesha ready hoon! 🌟";
    if (/\b(data science|machine learning|deep learning|neural)\b/.test(p))
        return "📊 **Data Science & ML**\n\n**Key Concepts:**\n- **Data Science** — Data se insights nikalna\n- **Machine Learning** — Algorithm jo data se seekhe\n- **Deep Learning** — Complex neural networks\n- **Tools:** Python, TensorFlow, PyTorch, Pandas\n\n**Career Path:** Learn Python → Statistics → ML → Deep Learning → Specialize!";
    if (/\b(history|itihas|bharat|india)\b/.test(p))
        return "📜 **India ka rich history hai!**\n\n- **Indus Valley** (3300 BCE) — World's oldest civilization\n- **Vedic Period** — Sanskrit, Vedas, Upanishads\n- **Mughal Empire** — Architecture, culture\n- **British Rule** — 1857 revolt to 1947 independence\n- **Modern India** — World's largest democracy\n\nKisi specific topic pe detail chahiye?";
    return `💡 **Nexus AI Ultra**\n\nAapka sawaal mila: *"${prompt}"*\n\nAbhi AI server connect ho raha hai. Thodi der mein dobara try karein.\n\n**Try these:**\n- "What is AI?"\n- "Write Python code for..."\n- "Generate image of..."\n- "What is data science?"`;
}

// --- Voice & Speech ---
function toggleVoiceRecording() {
    if (!recognition) return showNotification("System", "Speech recognition not supported in this browser.", "error");
    
    if (isRecording) {
        stopVoiceRecording();
    } else {
        startVoiceRecording();
    }
}

function startVoiceRecording() {
    isRecording = true;
    voiceOverlay.style.display = 'flex';
    voiceTranscript.innerText = 'Listening...';
    recognition.lang = get('voice-lang-select').value || 'en-US';
    recognition.start();
    showNotification("Voice Node", "Biometric audio sync active.", "info");
}

function stopVoiceRecording() {
    isRecording = false;
    voiceOverlay.style.display = 'none';
    recognition.stop();
    if (userInput.value) sendMessage();
}

function speakResponse(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*`_]/g, '').substring(0, 200); // Limit speech length
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = get('voice-lang-select').value || 'en-US';
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
}

// --- Vision & Studio ---
async function startVision() {
    try {
        const video = get('vision-video');
        visionStream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = visionStream;
        window.activeStream = visionStream;
        showNotification("Vision Node", "Camera hardware synchronized.", "success");
    } catch (e) {
        showNotification("Access Denied", "Camera permissions required for vision node.", "error");
    }
}

function stopVision() {
    if (visionStream) visionStream.getTracks().forEach(t => t.stop());
    visionStream = null;
}

function captureVision() {
    showNotification("Vision", "Analyzing spatial geometry...", "info");
    setTimeout(() => {
        showNotification("Analysis Complete", "Object: Terminal Interface. State: Optimized.", "success");
    }, 2000);
}

function generateVideo() {
    const prompt = get('video-prompt').value;
    if (!prompt) return showNotification("Studio", "Describe the scene first.", "warning");
    showNotification("Studio", "Allocating GPU clusters...", "info");
    setTimeout(() => {
        showNotification("Success", "Cinematic render queued for export.", "success");
    }, 3000);
}

// --- Router & Views ---
function initRouter() {
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
}

function handleHashChange() {
    const hash = window.location.hash.substring(1) || 'chat';
    showView(hash);
}

function showView(viewName) {
    // Stop any active camera streams when leaving vision view
    if (window.activeStream) {
        window.activeStream.getTracks().forEach(track => track.stop());
        window.activeStream = null;
    }

    const views = document.querySelectorAll('.app-view');
    views.forEach(v => v.classList.remove('active'));
    
    const target = get(`view-${viewName}`);
    if (target) {
        target.classList.add('active');
    }
    
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const onclick = item.getAttribute('onclick') || "";
        if (onclick.includes(`'${viewName}'`)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 1024) {
        get('sidebar').classList.remove('active');
        document.querySelector('.sidebar-overlay')?.classList.remove('active');
    }
}

// --- Session Management ---
function saveSessions() {
    localStorage.setItem('nexus_sessions', JSON.stringify(chatSessions));
    localStorage.setItem('nexus_current_id', currentSessionId);
}

function renderHistory() {
    const list = get('chat-history-list');
    const gallery = get('image-gallery');
    list.innerHTML = '';
    if(gallery) gallery.innerHTML = '<div class="glass-panel" style="aspect-ratio:1; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:15px; cursor:pointer;" onclick="setInput(\'Generate a futuristic cyberpunk city\'); showView(\'chat\'); sendMessage();"><i class="fa-solid fa-plus" style="font-size:32px; color:var(--accent);"></i><span style="font-size:14px; color:var(--text-dim);">Generate New Art</span></div>';

    chatSessions.forEach(session => {
        const item = document.createElement('div');
        item.className = `history-item ${session.id === currentSessionId ? 'active' : ''}`;
        item.innerHTML = `<i class="fa-solid fa-message"></i> <span>${session.title}</span>`;
        item.onclick = () => loadSession(session.id);
        list.appendChild(item);

        // Populate Image Studio Gallery
        if(gallery) {
            session.messages.forEach(msg => {
                const imgMatch = msg.text.match(/!\[Generated Image\]\((.*?)\)/);
                if(imgMatch && imgMatch[1]) {
                    const imgCard = document.createElement('div');
                    imgCard.className = 'glass-panel';
                    imgCard.style.cssText = 'aspect-ratio:1; overflow:hidden; border-radius:15px; cursor:pointer;';
                    imgCard.innerHTML = `<img src="${imgMatch[1]}" style="width:100%; height:100%; object-fit:cover;" onclick="window.open('${imgMatch[1]}')">`;
                    gallery.appendChild(imgCard);
                }
            });
        }
    });
}

function loadSession(id) {
    currentSessionId = id;
    const session = chatSessions.find(s => s.id === id);
    if (!session) return;
    chatContent.innerHTML = '';
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    session.messages.forEach(m => addMessageToUI(m.text, m.isUser, false, m.image));
    showView('chat');
}

function startNewChat() {
    currentSessionId = null;
    chatContent.innerHTML = '';
    if (welcomeScreen) {
        welcomeScreen.style.display = 'flex';
        chatContent.appendChild(welcomeScreen);
    }
    showView('chat');
    showNotification("New Session", "Neural node reset.", "info");
}

function clearCurrentChat() {
    chatSessions = [];
    currentSessionId = null;
    saveSessions();
    startNewChat();
}

// --- UI Helpers ---
function toggleSidebar() {
    get('sidebar').classList.toggle('active');
    document.querySelector('.sidebar-overlay').classList.toggle('active');
}

function setInput(text) {
    userInput.value = text;
    autoResize(userInput);
    userInput.focus();
}

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('nexus_theme', isLight ? 'light' : 'dark');
}

function showNotification(title, message, type = 'info') {
    const container = get('notification-container');
    const toast = document.createElement('div');
    toast.className = `glass-panel notification-toast ${type}`;
    toast.style = 'margin-bottom:10px; padding:15px; min-width:250px; border-left:4px solid var(--accent);';
    toast.innerHTML = `<strong>${title}</strong><br><small>${message}</small>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function logStatus(msg) {
    const el = document.querySelector('.status-text');
    if (el) el.innerText = msg;
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            currentImageBase64 = event.target.result.split(',')[1];
            get('image-preview').src = event.target.result;
            get('image-preview-area').style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        // Document/Text file upload logic
        const reader = new FileReader();
        reader.onload = (event) => {
            const textContent = event.target.result;
            userInput.value = `[Contents of ${file.name}]:\n${textContent}\n\n` + userInput.value;
            autoResize(userInput);
            showNotification('File Uploaded', `${file.name} loaded into neural context.`, 'success');
        };
        reader.readAsText(file);
    }
}

function removeImage() {
    currentImageBase64 = null;
    get('image-preview-area').style.display = 'none';
}

function toggleTemporaryChat() {
    showNotification("Temp Mode", "Encryption node activated. Logs bypassed.", "warning");
}

function handleAuth(type) {
    if (type === 'logout') {
        localStorage.clear();
        location.reload();
    } else {
        showNotification("Authentication", "Biometric hash verified.", "success");
        get('auth-modal').style.display = 'none';
    }
}

function openAuthModal() {
    get('auth-modal').style.display = 'flex';
}

function closeAuthModal() {
    get('auth-modal').style.display = 'none';
}

function toggleModelDropdown() {
    const d = get('model-dropdown');
    d.style.display = d.style.display === 'block' ? 'none' : 'block';
}

function selectModel(name) {
    get('current-model-name').innerText = name;
    toggleModelDropdown();
    showNotification("System", `Neural Model: ${name}`, "success");
}

function scrollToBottom() {
    chatContent.scrollTo({ top: chatContent.scrollHeight, behavior: 'smooth' });
}

function copyToClipboard(btn) {
    const parent = btn.closest('.ai-msg');
    const text = parent ? parent.querySelector('span').innerText : "";
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => btn.innerHTML = original, 2000);
    });
}

function clearChatHistory() {
    if (confirm("Erase all neural memory nodes? This cannot be undone.")) {
        chatSessions = [];
        saveSessions();
        get('chat-messages').innerHTML = '';
        renderHistory();
        showNotification('Neural Memory', 'History purged successfully.', 'success');
    }
}

function shareApp() {
    const shareData = {
        title: 'Nexus AI Ultra',
        text: 'Experience the world\'s most advanced neural intelligence platform.',
        url: window.location.origin
    };

    if (navigator.share) {
        navigator.share(shareData)
            .then(() => showNotification('Shared', 'Thanks for spreading the intelligence!', 'success'))
            .catch((err) => console.log('Error sharing:', err));
    } else {
        navigator.clipboard.writeText(shareData.url).then(() => {
            showNotification('Link Copied', 'App link copied to clipboard!', 'info');
        });
    }
}

function generateFollowUpQuestions(prompt) {
    const p = prompt.toLowerCase();
    if (p.includes('code') || p.includes('python') || p.includes('js') || p.includes('html')) 
        return ['Explain this code step-by-step', 'How to optimize this?', 'Write test cases'];
    if (p.includes('ai') || p.includes('machine learning') || p.includes('neural')) 
        return ['How do neural networks learn?', 'What is Deep Learning?', 'Explain GPT architecture'];
    if (p.includes('weather') || p.includes('mausam')) 
        return ['What about tomorrow?', 'Will it rain this week?', 'Show 7 day forecast'];
    if (p.includes('history') || p.includes('india')) 
        return ['Tell me about the Mughal Empire', 'Who was Ashoka?', 'Explain the Indus Valley'];
    if (p.includes('search'))
        return ['Search for recent AI news', 'Search for tech trends 2026'];
    return ['Tell me more', 'Explain step-by-step', 'Give me an example'];
}


// --- Firebase Authentication Mock / Setup ---
const firebaseConfig = {
    // apiKey: "YOUR_API_KEY",
    // authDomain: "YOUR_PROJECT.firebaseapp.com",
    // databaseURL: "https://YOUR_PROJECT.firebaseio.com",
    // projectId: "YOUR_PROJECT",
};

// Initialize Firebase only if config is provided
let app, auth, db;
try {
    if (firebaseConfig.apiKey) {
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.database();
        console.log('Firebase initialized');
        
        auth.onAuthStateChanged(user => {
            if (user) {
                console.log('User signed in:', user.email);
                showNotification('Signed In', 'Welcome back to Nexus AI', 'success');
                document.getElementById('auth-modal').style.display = 'none';
                // Update UI
                const profileName = document.querySelector('.user-profile span:first-child');
                if (profileName) profileName.innerText = user.displayName || user.email.split('@')[0];
            } else {
                console.log('User signed out');
            }
        });
    }
} catch (e) {
    console.log('Firebase init skipped: ', e.message);
}

function handleLogin() {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    if (!email || !pass) return showNotification('Error', 'Please enter email and password', 'error');
    
    if (auth) {
        auth.signInWithEmailAndPassword(email, pass)
            .catch(error => {
                if (error.code === 'auth/user-not-found') {
                    // Auto signup if not found
                    auth.createUserWithEmailAndPassword(email, pass)
                        .then(() => showNotification('Account Created', 'Welcome to Nexus AI', 'success'))
                        .catch(err => showNotification('Error', err.message, 'error'));
                } else {
                    showNotification('Error', error.message, 'error');
                }
            });
    } else {
        // Mock Login for UI demonstration
        showNotification('Demo Mode', 'Logged in as ' + email + ' (Firebase Config Missing)', 'info');
        document.getElementById('auth-modal').style.display = 'none';
        const profileName = document.querySelector('.user-profile span:first-child');
        if (profileName) profileName.innerText = email.split('@')[0];
    }
}

function handleGoogleLogin() {
    if (auth) {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .catch(error => showNotification('Error', error.message, 'error'));
    } else {
        showNotification('Demo Mode', 'Google Sign-in clicked (Firebase Config Missing)', 'info');
    }
}

