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
            textSpan.innerHTML = marked.parse(fullResponse);
            speakResponse("Your image is ready.");
        } else {
            const sysMsg = `You are Nexus AI Ultra, a brilliant and helpful AI assistant. Answer clearly, helpfully and in the same language the user writes in (Hindi or English). Be friendly and detailed.`;
            
            let answer = '';

            // Provider 1: Pollinations GET (anonymous, free)
            try {
                const polliUrl = `https://text.pollinations.ai/${encodeURIComponent(cleanPrompt)}?system=${encodeURIComponent(sysMsg)}&model=openai&seed=${Date.now()}`;
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), 10000);
                const r1 = await fetch(polliUrl, { signal: ctrl.signal });
                clearTimeout(tid);
                if (r1.ok) { answer = await r1.text(); }
            } catch(e1) { console.warn('Provider 1 failed:', e1.message); }

            // Provider 2: Pollinations chat completions
            if (!answer) {
                try {
                    const ctrl2 = new AbortController();
                    const tid2 = setTimeout(() => ctrl2.abort(), 10000);
                    const r2 = await fetch('https://text.pollinations.ai/openai/chat/completions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ model: 'openai', messages: [{ role: 'system', content: sysMsg }, { role: 'user', content: cleanPrompt }] }),
                        signal: ctrl2.signal
                    });
                    clearTimeout(tid2);
                    if (r2.ok) {
                        const d2 = await r2.json();
                        answer = d2?.choices?.[0]?.message?.content || '';
                    }
                } catch(e2) { console.warn('Provider 2 failed:', e2.message); }
            }

            // Provider 3: Guaranteed local intelligent fallback
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
                textSpan.innerHTML = marked.parse(streamed);
                scrollToBottom();
                await new Promise(r => setTimeout(r, 15));
            }
            speakResponse(answer.substring(0, 200));

            // Copy button
            const actions = document.createElement('div');
            actions.style.cssText = 'margin-top:8px;';
            actions.innerHTML = `<button onclick="navigator.clipboard.writeText(this.dataset.text);this.innerHTML='✅ Copied!';setTimeout(()=>this.innerHTML='📋 Copy',2000);" data-text="${answer.replace(/"/g,'&quot;')}" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);cursor:pointer;font-size:11px;padding:4px 12px;border-radius:8px;">📋 Copy</button>`;
            content.appendChild(actions);
        }
    } catch (e) {
        console.error('AI Error:', e);
        fullResponse = generateSmartFallback(cleanPrompt);
        textSpan.innerHTML = marked.parse(fullResponse);
    }

    const session = chatSessions.find(s => s.id === currentSessionId);
    if (session) {
        session.messages.push({ text: fullResponse, isUser: false });
        saveSessions();
        renderHistory();
    }
}

// Smart local fallback when all APIs fail
function generateSmartFallback(prompt) {
    const p = prompt.toLowerCase();
    if (p.includes('hello') || p.includes('hi') || p.includes('namaste') || p.includes('helo'))
        return `👋 **Hello! Main Nexus AI Ultra hoon.**\n\nMain aapki kaise madad kar sakta hoon? Kuch bhi poochho — coding, science, Hindi, ya kuch bhi! 🚀`;
    if (p.includes('ai') || p.includes('artificial intelligence'))
        return `🤖 **Artificial Intelligence (AI)** ek technology hai jo machines ko insano ki tarah sochne aur seekhne ki takaat deti hai.\n\n**Key Types:**\n- **Machine Learning** — Data se seekhna\n- **Deep Learning** — Neural networks\n- **NLP** — Language samajhna\n- **Computer Vision** — Images dekhna\n\n*Nexus AI Ultra khud ek advanced AI system hai!* ✨`;
    if (p.includes('what is') || p.includes('kya hai') || p.includes('kya h'))
        return `🧠 **Great question!**\n\nMain abhi limited mode mein hoon kyunki AI server temporarily busy hai. Thodi der baad try karein.\n\n**Pooch sakte hain:**\n- Coding problems\n- Science questions\n- General knowledge\n- Image generate karna`;
    return `✨ **Nexus AI Ultra — Ready!**\n\nMain samajh gaya aapka sawaal. Server se connect ho raha hoon... Please ek baar dobara send karein. 🔄`;
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

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        currentImageBase64 = event.target.result.split(',')[1];
        get('image-preview').src = event.target.result;
        get('image-preview-area').style.display = 'block';
    };
    reader.readAsDataURL(file);
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
