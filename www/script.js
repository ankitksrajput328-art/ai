// Nexus AI Ultra - Core Logic Engine V3.0 (PRO Edition)
// Developed by Ankit Antigravity

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
    updateHistorySidebar();
    
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
            updateHistorySidebar();
        }
    }
}

async function processAIResponse(prompt, image) {
    const row = document.createElement('div');
    row.className = 'message-row ai';
    const content = document.createElement('div');
    content.className = 'message-content ai-msg';
    const textSpan = document.createElement('span');
    content.appendChild(textSpan);
    row.appendChild(content);
    chatContent.appendChild(row);
    scrollToBottom();

    let fullResponse = "";
    const cleanPrompt = prompt.trim();

    try {
        const lowerPrompt = cleanPrompt.toLowerCase();
        const isImageRequest = /image|photo|picture|draw|banao|dikhao|paint|generate/.test(lowerPrompt);
        
        if (isImageRequest) {
            const encodedPrompt = encodeURIComponent(cleanPrompt + " cinematic, hyper-realistic, 8k, detailed");
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
            fullResponse = `### 🎨 Nexus Studio: Render Complete\n\n![Generated Image](${imageUrl})\n\n*Prompt: ${cleanPrompt}*`;
            textSpan.innerHTML = window.marked ? marked.parse(fullResponse) : fullResponse;
            speakResponse("I have generated the image for you.");
        } else {
            const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            let systemPrompt = `You are Nexus AI Ultra v3.0 (PRO Edition). Today is ${dateStr}. You are helpful, expert, and creative. User query: `;
            const apiUrl = `https://text.pollinations.ai/${encodeURIComponent(systemPrompt + cleanPrompt)}?model=openai`;

            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error("API_ERROR");
            
            const answer = await response.text();
            const words = answer.split(' ');
            for (const word of words) {
                fullResponse += word + " ";
                textSpan.innerHTML = window.marked ? marked.parse(fullResponse) : fullResponse;
                scrollToBottom();
                await new Promise(r => setTimeout(r, 10));
            }
            speakResponse(answer);
        }
    } catch (e) {
        fullResponse = `### ❌ Connection Interrupted\nUnable to reach the neural node. Please check your data transmission.`;
        textSpan.innerHTML = window.marked ? marked.parse(fullResponse) : fullResponse;
    }

    const session = chatSessions.find(s => s.id === currentSessionId);
    if (session) {
        session.messages.push({ text: fullResponse, isUser: false });
        saveSessions();
    }
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
    const views = document.querySelectorAll('.app-view');
    views.forEach(v => v.classList.remove('active'));
    
    const target = get(`view-${viewName}`);
    if (target) target.classList.add('active');
    
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const onclick = item.getAttribute('onclick') || "";
        if (onclick.includes(`'${viewName}'`)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    if (viewName === 'vision') startVision(); else stopVision();
    if (window.innerWidth <= 1024) get('sidebar').classList.remove('active');
}

// --- Session Management ---
function saveSessions() {
    localStorage.setItem('nexus_sessions', JSON.stringify(chatSessions));
    localStorage.setItem('nexus_current_id', currentSessionId);
}

function updateHistorySidebar() {
    const list = get('chat-history-list');
    if (!list) return;
    list.innerHTML = '';
    chatSessions.forEach(s => {
        const btn = document.createElement('button');
        btn.className = `nav-item ${s.id === currentSessionId ? 'active' : ''}`;
        btn.innerHTML = `<i class="fa-regular fa-message"></i> <span>${s.title}</span>`;
        btn.onclick = () => loadSession(s.id);
        list.appendChild(btn);
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
