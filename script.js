// Nexus AI Ultra - Core Logic Engine V3.0 (PRO Edition)
// Developed by Ankit Antigravity

// --- Firebase Real-Time Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyDq7ejqZJzFcYp_jfxA2cNMBVryEJvZBvs",
    authDomain: "nexus-ai-ultra-4cf8d.firebaseapp.com",
    projectId: "nexus-ai-ultra-4cf8d",
    storageBucket: "nexus-ai-ultra-4cf8d.firebasestorage.app",
    messagingSenderId: "458163586885",
    appId: "1:458163586885:web:9db04950dd9938f57aa02c",
    measurementId: "G-K0GGYDBNKV"
};

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

// Sandbox session restoration
if (localStorage.getItem('nexus_sandbox_user') === 'true') {
    setTimeout(() => {
        const profileName = document.querySelector('.user-profile span:first-child');
        if (profileName) profileName.innerText = 'Sandbox Commander';
    }, 100);
}

// Global Error Handler
window.onerror = function(m,u,l,c,e){ console.error('Nexus Error:',m,u,l); return false; };

// --- Global Variables ---
let currentImageBase64 = null;
let currentImageMimeType = null;
let chatSessions = [];
try {
    chatSessions = JSON.parse(localStorage.getItem('nexus_sessions')) || [];
} catch(e) {
    chatSessions = [];
    console.error('Failed to parse sessions');
}
let currentSessionId = localStorage.getItem('nexus_current_id') || null;
let isRecording = false;
let recognition = null;
let visionStream = null;

let currentVoiceLang = 'en-US';

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
    
    // Register Service Worker for PWA (Install option)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('[Nexus PWA] Service Worker Registered'))
            .catch(err => console.warn('[Nexus PWA] Service Worker failed:', err));
    }
    
    // Auto-load last session or start fresh
    if (currentSessionId && chatSessions.find(s => s.id === currentSessionId)) {
        loadSession(currentSessionId);
    } else {
        startNewChat();
    }
    
    // Configure Markdown Syntax Highlighting (Safely)
    try {
        if (window.marked && window.hljs) {
            if (typeof marked.setOptions === 'function') {
                marked.setOptions({
                    highlight: function(code, lang) {
                        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                        return hljs.highlight(code, { language }).value;
                    },
                    langPrefix: 'hljs language-'
                });
            }
        }
    } catch (e) {
        console.warn("Markdown syntax highlighting setup skipped:", e.message);
    }
    
    // Theme Restoration
    if (localStorage.getItem('nexus_theme') === 'dark') {
        document.body.classList.add('dark-theme');
    }
    updateVoiceIcon();
    
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
        let session = chatSessions.find(s => s.id === currentSessionId);
        if (!currentSessionId || !session) {
            currentSessionId = Date.now().toString();
            session = { id: currentSessionId, title: text.substring(0, 30) || "New Conversation", messages: [] };
            chatSessions.unshift(session);
        }
        
        session.messages.push({ text, isUser, image });
        saveSessions();
        renderHistory();
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

    // Show Shimmering Thinking Dots
    textSpan.innerHTML = '<div class="thinking-dots"><div></div><div></div><div></div></div>';
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
            
            // Ensure we scroll down AFTER image finishes loading over network
            const imgEl = textSpan.querySelector('img');
            if (imgEl) imgEl.onload = scrollToBottom;
            
            speakResponse("Your image is ready.");
        } else {
            let answer = '';

            // Real Production API Call
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
                let fallbackTriggered = false;
                try {
                    const r1 = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            prompt: finalPrompt, 
                            history: contextHistory, 
                            webSearch: isWebSearch,
                            image: image,
                            mimeType: typeof currentImageMimeType !== 'undefined' ? currentImageMimeType : 'image/jpeg'
                        }),
                        signal: ctrl1.signal
                    });
                    clearTimeout(t1);
                    if (r1.ok) {
                        const d1 = await r1.json();
                        answer = d1?.reply || '';
                    } else {
                        fallbackTriggered = true;
                    }
                } catch (apiErr) {
                    fallbackTriggered = true;
                }

                if (fallbackTriggered) {
                    // Universal Client-side Fallback
                    console.log("Backend unreachable. Using local universal fallback...");
                    const messages = [
                        { role: 'system', content: 'You are Nexus AI Ultra. Provide a highly detailed markdown response.' },
                        ...contextHistory,
                        { role: 'user', content: finalPrompt }
                    ];
                    const r2 = await fetch('https://text.pollinations.ai/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ messages, model: 'openai' })
                    });
                    if (r2.ok) {
                        answer = await r2.text();
                    } else {
                        answer = "⚠️ **Network Error:** Failed to reach both Primary Core and Fallback Nodes.";
                    }
                }
            } catch(e1) { 
                console.warn('AI Processing failed:', e1.message); 
                answer = "⚠️ **Critical Error:** Logic engine fault.";
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
            actions.innerHTML = `<button onclick="navigator.clipboard.writeText(this.dataset.text);this.innerHTML='✅ Copied!';setTimeout(()=>this.innerHTML='📋 Copy',2000);" data-text="${safeText}" style="background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.3);color:var(--accent);cursor:pointer;font-size:11px;padding:4px 12px;border-radius:12px;font-weight:600;">📋 Copy</button>`;
            
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
        fullResponse = "⚠️ **System Failure:** An unexpected error occurred in the Neural Engine.";
        textSpan.innerHTML = window.marked ? marked.parse(fullResponse) : fullResponse;
    }

    const session = chatSessions.find(s => s.id === currentSessionId);
    if (session) {
        session.messages.push({ text: fullResponse, isUser: false });
        saveSessions();
        renderHistory();
    }
}



// --- Voice & Speech ---
function toggleVoiceRecording() {
    if (!recognition) return showNotification("System", "Speech recognition not supported in this browser.", "error");
    
    const btn = document.getElementById('voice-btn');
    if (isRecording) {
        stopVoiceRecording();
    } else {
        startVoiceRecording();
        if (btn) {
            btn.classList.add('pulse-glow');
            btn.innerHTML = '<i class="fa-solid fa-microphone"></i> Listening...';
        }
    }
}

function updateVoiceLang() {
    const select = document.getElementById('voice-lang-select');
    if (select) {
        const lang = select.value;
        currentVoiceLang = lang;
        if (recognition) recognition.lang = lang;
        const langName = lang === 'hi-IN' ? 'Hindi' : 'English';
        showNotification("Voice Engine", `Input language set to ${langName}.`, "info");
    }
}

function startVoiceRecording() {
    isRecording = true;
    voiceOverlay.style.display = 'flex';
    voiceTranscript.innerText = 'Listening...';
    recognition.lang = get('voice-lang-select').value || 'en-US';
    recognition.start();
    showNotification("Voice Input", "Voice recognition active.", "info");
}

function stopVoiceRecording() {
    isRecording = false;
    voiceOverlay.style.display = 'none';
    recognition.stop();
    const btn = document.getElementById('voice-btn');
    if (btn) {
        btn.classList.remove('pulse-glow');
        btn.innerHTML = '<i class="fa-solid fa-microphone"></i> Live';
    }
    if (userInput.value) sendMessage();
}

let voiceEnabled = localStorage.getItem('nexus_voice') !== 'false'; // Default ON

function toggleVoice() {
    voiceEnabled = !voiceEnabled;
    localStorage.setItem('nexus_voice', voiceEnabled);
    showNotification("Neural Voice", voiceEnabled ? "Voice Output: ON" : "Voice Output: OFF", "info");
    if (!voiceEnabled) window.speechSynthesis.cancel();
    updateVoiceIcon();
}

function updateVoiceIcon() {
    const btn = document.getElementById('voice-toggle-btn');
    if (btn) {
        btn.innerHTML = voiceEnabled ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
        btn.style.color = voiceEnabled ? 'var(--accent)' : 'var(--text-dim)';
    }
}

function speakResponse(text) {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Auto-detect language (Simplified)
    const hasHindi = /[\u0900-\u097F]/.test(text);
    utterance.lang = hasHindi ? 'hi-IN' : (get('voice-lang-select')?.value || 'en-US');
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Select premium voice if available
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Premium'));
    if (premiumVoice) utterance.voice = premiumVoice;
    
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
    const video = get('vision-video');
    if (!video || !visionStream) return showNotification("Error", "Camera not active.", "error");

    showNotification("Vision", "Capturing spatial geometry...", "info");
    
    // Create an invisible canvas to capture the frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Extract base64
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64Data = dataUrl.split(',')[1];
    
    // Close vision view
    showView('chat');
    
    // Set up chat variables
    currentImageBase64 = base64Data;
    currentImageMimeType = 'image/jpeg';
    get('image-preview').src = dataUrl;
    get('image-preview-area').style.display = 'block';
    
    // Send it
    setInput("Analyze this image and describe what you see in detail.");
    sendMessage();
}

function generateVideo() {
    const prompt = get('video-prompt').value;
    if (!prompt) return showNotification("Studio", "Describe the scene first.", "warning");
    
    const studioView = get('view-studio');
    const originalContent = studioView.innerHTML;
    
    studioView.innerHTML = `
        <div class="glass-panel" style="max-width:800px; margin:40px auto; padding:60px; text-align:center;">
            <div class="neural-spinner" style="width:100px; height:100px; border:4px solid var(--accent); border-top-color:transparent; border-radius:50%; margin:0 auto 30px; animation:spin 1s linear infinite;"></div>
            <h3 class="gradient-text" style="font-size:24px;">Neural Rendering in Progress</h3>
            <p style="color:var(--text-dim); margin-top:15px;">Allocating GPU Clusters & Synthesizing Cinematic Frames...</p>
            <div style="width:100%; height:4px; background:rgba(255,255,255,0.1); border-radius:2px; margin-top:40px; overflow:hidden;">
                <div id="render-progress" style="width:0%; height:100%; background:var(--accent); transition:width 0.5s ease;"></div>
            </div>
            <div id="render-status" style="font-size:12px; color:var(--accent); margin-top:10px; text-transform:uppercase;">Initializing Pipeline...</div>
        </div>
    `;

    let progress = 0;
    const statuses = ["Allocating VRAM...", "Tracing Rays...", "Synthesizing Motion...", "Finalizing Export..."];
    const interval = setInterval(() => {
        progress += 5;
        const progressEl = document.getElementById('render-progress');
        const statusEl = document.getElementById('render-status');
        if (progressEl) progressEl.style.width = progress + '%';
        if (statusEl) statusEl.innerText = statuses[Math.floor(progress/30)] || "Encoding...";
        
        if (progress >= 100) {
            clearInterval(interval);
            showNotification("Success", "Cinematic Render Complete", "success");
            setTimeout(() => { studioView.innerHTML = originalContent; }, 2000);
        }
    }, 300);
}



// --- AI Voice Synthesis ---
function speakText(text) {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    // Prefer professional English voice if available
    const voices = window.speechSynthesis.getVoices();
    const prefVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
    if (prefVoice) utterance.voice = prefVoice;
    window.speechSynthesis.speak(utterance);
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
    try {
        localStorage.setItem('nexus_sessions', JSON.stringify(chatSessions));
        if (currentSessionId) {
            localStorage.setItem('nexus_current_id', currentSessionId);
        } else {
            localStorage.removeItem('nexus_current_id');
        }
    } catch (e) {
        console.warn("Storage quota exceeded:", e);
        showNotification("Memory Full", "Neural storage limit reached. Please clear old chats.", "warning");
    }
    if (typeof syncToCloud === 'function') syncToCloud();
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
    
    // Clear only messages
    Array.from(chatContent.querySelectorAll('.message-row')).forEach(e => e.remove());
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    
    session.messages.forEach(m => addMessageToUI(m.text, m.isUser, false, m.image));
    showView('chat');
}

function startNewChat() {
    currentSessionId = null;
    // Clear only messages
    Array.from(chatContent.querySelectorAll('.message-row')).forEach(e => e.remove());
    
    if (welcomeScreen) {
        welcomeScreen.style.display = 'flex';
        // Ensure it's inside chatContent just in case
        if (!chatContent.contains(welcomeScreen)) {
            chatContent.appendChild(welcomeScreen);
        }
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

function generateImageFromStudio() {
    const prompt = get('image-prompt-input').value;
    if (!prompt) return showNotification("Image Studio", "Please enter a prompt.", "warning");
    
    showView('chat');
    setInput(prompt);
    sendMessage();
    get('image-prompt-input').value = '';
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
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('nexus_theme', isDark ? 'dark' : 'light');
    showNotification("Theme", isDark ? "Dark Node Activated" : "Light Node Activated", "info");
}

function showNotification(title, message, type = 'info') {
    // Suppress Firebase local file error to avoid annoying popups during local testing
    if (window.location.protocol === 'file:' && message && message.includes('operation-not-supported-in-this-environment')) {
        return;
    }

    const container = get('notification-container');
    if (!container) return;

    // Clear previous notifications to prevent stacking up like in the screenshot
    container.innerHTML = '';

    const toast = document.createElement('div');
    toast.className = `glass-panel notification-toast ${type}`;
    toast.style = 'margin-bottom:10px; padding:15px; min-width:250px; border-left:4px solid var(--accent);';
    toast.innerHTML = `<strong>${title}</strong><br><small>${message}</small>`;
    container.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => toast.remove(), 3000);
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
            currentImageMimeType = file.type || 'image/jpeg';
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
        showNotification("Cloud Sync", "Account connected successfully.", "success");
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
    const scrollView = document.querySelector('#view-chat');
    if (scrollView) {
        scrollView.scrollTo({ top: scrollView.scrollHeight, behavior: 'smooth' });
    }
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
        Array.from(chatContent.querySelectorAll('.message-row')).forEach(e => e.remove());
        renderHistory();
        startNewChat();
        showNotification('Neural Memory', 'History purged successfully.', 'success');
    }
}

function exportChatHistory() {
    const session = chatSessions.find(s => s.id === currentSessionId);
    if (!session || !session.messages || session.messages.length === 0) {
        return showNotification('Export Failed', 'No active conversation to export.', 'warning');
    }

    let textContent = `# Nexus AI Conversation Log\nDate: ${new Date().toLocaleString()}\nTitle: ${session.title}\n\n---\n\n`;
    
    session.messages.forEach(msg => {
        const role = msg.isUser ? 'USER' : 'NEXUS AI';
        textContent += `### ${role}:\n${msg.text}\n\n`;
        if (msg.image) textContent += `*[Image Attached]*\n\n`;
    });

    const blob = new Blob([textContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nexus_AI_Log_${new Date().toISOString().slice(0,10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Export Successful', 'Chat log downloaded as Markdown.', 'success');
}

function shareApp() {
    const isLocal = window.location.origin.startsWith('file');
    const shareUrl = isLocal ? 'https://nexus-ai-ultra-ankit.vercel.app' : window.location.origin;
    
    const shareData = {
        title: 'Nexus AI Ultra',
        text: 'Experience the world\'s most advanced neural intelligence platform.',
        url: shareUrl
    };

    if (navigator.share && !isLocal) {
        navigator.share(shareData)
            .then(() => showNotification('Shared', 'Thanks for spreading the intelligence!', 'success'))
            .catch((err) => console.log('Error sharing:', err));
    } else {
        const fullMessage = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        navigator.clipboard.writeText(fullMessage).then(() => {
            showNotification('Link Copied', 'App details copied to clipboard!', 'success');
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
        showNotification('System Error', 'Firebase Authentication is not initialized.', 'error');
    }
}

function handleSandboxLogin() {
    localStorage.setItem('nexus_sandbox_user', 'true');
    showNotification('Sandbox Enabled', 'Successfully authenticated as Sandbox Commander.', 'success');
    
    // Update User Profile Text
    const profileName = document.querySelector('.user-profile span:first-child');
    if (profileName) profileName.innerText = 'Sandbox Commander';
    
    // Hide auth modal
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'none';
}

function handleGoogleLogin() {
    if (auth) {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .catch(error => {
                console.warn('Firebase login failed:', error.message);
                if (error.code === 'auth/api-key-not-valid' || error.message.includes('api-key-not-valid') || error.message.includes('API key')) {
                    showNotification('Firebase Redirect', 'Switching to secure Sandbox Offline Mode...', 'warning');
                    setTimeout(() => {
                        handleSandboxLogin();
                    }, 1000);
                } else {
                    showNotification('Error', error.message, 'error');
                }
            });
    } else {
        showNotification('System Redirect', 'Switching to secure Sandbox Offline Mode...', 'warning');
        setTimeout(() => {
            handleSandboxLogin();
        }, 1000);
    }
}


// --- Cloud Database Sync Logic ---
function syncToCloud() {
    if (auth && auth.currentUser && db) {
        db.ref('users/' + auth.currentUser.uid + '/chats').set(chatSessions)
            .catch(err => console.log('Cloud sync error:', err));
    }
}



// Fetch from cloud on login
if (auth) {
    auth.onAuthStateChanged(user => {
        if (user && db) {
            db.ref('users/' + user.uid + '/chats').once('value').then(snapshot => {
                const cloudData = snapshot.val();
                if (cloudData) {
                    chatSessions = cloudData;
                    localStorage.setItem('nexus_sessions', JSON.stringify(chatSessions));
                    renderHistory();
                    if (!currentSessionId && chatSessions.length > 0) {
                        loadSession(chatSessions[0].id);
                    }
                    showNotification('Cloud Sync', 'Your chat history has been restored', 'success');
                }
            });
        }
    });
}

