// Nexus AI Ultra - Core Logic Engine V2.2
// Developed by Ankit Antigravity

// --- Global Variables ---
let currentImageBase64 = null;
let currentImageMimeType = null;
let geminiApiKey = localStorage.getItem('gemini_api_key') || '';
let chatSessions = JSON.parse(localStorage.getItem('nexus_sessions')) || [];
let currentSessionId = localStorage.getItem('nexus_current_id') || null;
let isDemoMode = true;
let isRecording = false;
let visionStream = null;

// --- DOM Selectors ---
const get = (id) => document.getElementById(id);
const chatContent = get('chat-content');
const userInput = get('user-input');
const welcomeScreen = get('welcome-screen');
const sidebar = get('sidebar');

// --- Initialization & Security Check ---
window.onload = () => {
    console.log("Nexus Core: Synchronized & Secure");
    updateHistorySidebar();
    initRouter();
    
    // Theme Restoration
    if (localStorage.getItem('nexus_theme') === 'light') {
        document.body.classList.add('light-theme');
        const icon = get('theme-icon');
        if (icon) icon.className = 'fa-solid fa-sun';
    }
    logStatus("Neural Engine Online | SECURE NODE");
};

// // --- Messaging Logic (Advanced Streaming) ---
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
        content.innerHTML += `<img src="data:image/jpeg;base64,${image}" alt="Uploaded" style="max-width:100%; border-radius:12px; margin-bottom:10px; display:block;">`;
    }

    const textSpan = document.createElement('span');
    textSpan.className = 'text-body';
    if (isUser) {
        textSpan.innerText = text;
    } else {
        textSpan.innerHTML = window.marked ? marked.parse(text) : text;
    }
    content.appendChild(textSpan);

    // Add Copy Button for AI
    if (!isUser) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
        copyBtn.title = "Copy to clipboard";
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

    if (save && isUser) {
        if (!currentSessionId) {
            currentSessionId = Date.now().toString();
            chatSessions.unshift({ id: currentSessionId, title: text.substring(0, 30), messages: [] });
        }
        const session = chatSessions.find(s => s.id === currentSessionId);
        if (session) session.messages.push({ text, isUser, image });
        saveSessions();
    }
}

async function processAIResponse(prompt, image) {
    // 1. Show Thought Stream
    const thoughtContainer = document.createElement('div');
    thoughtContainer.className = 'thought-stream';
    thoughtContainer.innerHTML = '<h4><i class="fa-solid fa-brain"></i> Nexus Intelligence Hub</h4>';
    chatContent.appendChild(thoughtContainer);
    scrollToBottom();

    const steps = ["Decrypting neural pathways...", "Synthesizing multi-modal nodes...", "Finalizing transmission..."];
    for (const s of steps) {
        const step = document.createElement('div');
        step.className = 'thought-step active';
        step.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${s}`;
        thoughtContainer.appendChild(step);
        await new Promise(r => setTimeout(r, 600));
        step.classList.remove('active');
        step.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${s}`;
    }

    // 2. Prepare AI Message Row for Streaming
    const row = document.createElement('div');
    row.className = 'message-row ai';
    const content = document.createElement('div');
    content.className = 'message-content ai-msg';
    const textSpan = document.createElement('span');
    content.appendChild(textSpan);
    row.appendChild(content);
    chatContent.appendChild(row);

    let fullResponse = "";
    
    try {
        // Attempt Real Backend Connection
        const response = await fetch('http://localhost:8000/chat/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: "commander_ankit",
                prompt: prompt,
                history: chatSessions.find(s => s.id === currentSessionId)?.messages || []
            })
        });

        if (!response.ok) throw new Error("Backend offline");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const word = line.replace('data: ', '').trim();
                    fullResponse += word + " ";
                    textSpan.innerHTML = window.marked ? marked.parse(fullResponse) : fullResponse;
                    scrollToBottom();
                }
            }
        }
    } catch (e) {
        console.warn("Backend connection failed, using local simulation mode.");
        // Fallback to Simulated Streaming
        const mock = await getMockResponse(prompt);
        const words = mock.split(' ');
        for (const word of words) {
            fullResponse += word + " ";
            textSpan.innerHTML = window.marked ? marked.parse(fullResponse) : fullResponse;
            scrollToBottom();
            await new Promise(r => setTimeout(r, 30));
        }
    }

    // Add Copy Button after streaming is done
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(fullResponse);
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>', 2000);
    };
    content.appendChild(copyBtn);

    // Update Session
    const session = chatSessions.find(s => s.id === currentSessionId);
    if (session) session.messages.push({ text: fullResponse, isUser: false });
    saveSessions();
    updateHistorySidebar();
}

async function getMockResponse(prompt) {
    const lower = prompt.toLowerCase();
    if (lower.includes('vision')) return "I have activated my **Neural Vision** clusters. You can use the 'Vision' tab to scan objects in real-time. I can identify patterns, extract text, and analyze spatial geometry with 99.8% accuracy.";
    if (lower.includes('video')) return "My **Studio Engine** is ready. Switch to the 'Studio' view to render high-definition cinematic content. Our new V2.5 rendering pipeline supports temporal consistency and 4K upscaling.";
    
    return `### 🌐 Nexus Intelligence Synthesis
I have processed your query: "${prompt}".

**Key Strategic Insights:**
1. **Efficiency Node:** My neural clusters suggest a 45% optimization path for your current workflow.
2. **Predictive Analytics:** Data trends indicate high relevance for the upcoming quarterly cycle.

Nexus AI Ultra is currently operating at peak capacity. How else can I assist your command?`;
}

// --- UI Helpers ---
function scrollToBottom() {
    if (chatContent) {
        chatContent.scrollTo({ top: chatContent.scrollHeight, behavior: 'smooth' });
    }
}

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = (el.scrollHeight) + 'px';
    if (el.scrollHeight > 200) {
        el.style.overflowY = 'auto';
    } else {
        el.style.overflowY = 'hidden';
    }
}

function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function toggleSidebar() {
    const sb = get('sidebar');
    if (sb) {
        sb.classList.toggle('active');
        // Add overlay for mobile
        if (window.innerWidth <= 1024) {
            let overlay = document.querySelector('.sidebar-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'sidebar-overlay';
                overlay.onclick = toggleSidebar;
                document.body.appendChild(overlay);
            }
            overlay.classList.toggle('visible');
        }
    }
}

function setInput(text) {
    if (userInput) {
        userInput.value = text;
        autoResize(userInput);
        userInput.focus();
    }
}

// --- Status & Notifications ---
function logStatus(msg) {
    const el = document.querySelector('.status-text');
    if (el) {
        el.style.opacity = '0';
        setTimeout(() => {
            el.innerText = msg;
            el.style.opacity = '1';
        }, 200);
    }
}

function showNotification(title, message, type = 'info') {
    const container = get('notification-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `glass-panel notification-toast ${type}`;
    toast.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px;">
            <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-info'}"></i>
            <div>
                <div style="font-weight:700;">${title}</div>
                <div style="font-size:12px;color:var(--text-dim);">${message}</div>
            </div>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => { 
        toast.style.transform = 'translateX(100px)';
        toast.style.opacity = '0'; 
        setTimeout(() => toast.remove(), 500); 
    }, 4000);
}

// --- Model Selector ---
function toggleModelDropdown() {
    const d = get('model-dropdown');
    if (d) d.style.display = d.style.display === 'block' ? 'none' : 'block';
}

function selectModel(name, status) {
    const n = get('current-model-name');
    if (n) n.innerText = name;
    toggleModelDropdown();
    showNotification("System Update", `Neural Node switched to ${name}`, "success");
}

// --- Vision & Studio (Simulated) ---
async function startVision() {
    try {
        const video = get('vision-video');
        if (!video) return;
        visionStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = visionStream;
    } catch (e) { 
        showNotification("Security", "Camera access required for vision node.", "error"); 
    }
}

function stopVision() {
    if (visionStream) visionStream.getTracks().forEach(t => t.stop());
    visionStream = null;
}

function captureVision() {
    showNotification("Vision", "Analyzing spatial geometry...", "info");
    setTimeout(() => {
        showNotification("Vision", "Object recognized: Humanoid Terminal User.", "success");
    }, 2000);
}

function generateVideo() {
    const p = get('video-prompt').value;
    if (!p) return showNotification("Studio", "Describe the scene to render.", "warning");
    showNotification("Studio", "Initializing Stable Diffusion Pipeline...", "info");
    setTimeout(() => {
        showNotification("Studio", "Rendering complete. Accessing cinematic output...", "success");
    }, 4000);
}

// --- Session & History ---
function saveSessions() {
    localStorage.setItem('nexus_sessions', JSON.stringify(chatSessions));
    localStorage.setItem('nexus_current_id', currentSessionId);
}

function startNewChat() {
    currentSessionId = null;
    if (chatContent) {
        chatContent.innerHTML = '';
        if (welcomeScreen) {
            chatContent.appendChild(welcomeScreen);
            welcomeScreen.style.display = 'block';
        }
    }
    updateHistorySidebar();
    if (window.innerWidth <= 1024) toggleSidebar();
}

function loadSession(id) {
    const session = chatSessions.find(s => s.id === id);
    if (!session) return;
    currentSessionId = id;
    chatContent.innerHTML = '';
    welcomeScreen.style.display = 'none';
    session.messages.forEach(m => addMessageToUI(m.text, m.isUser, false, m.image));
    updateHistorySidebar();
    if (window.innerWidth <= 1024) toggleSidebar();
}

function updateHistorySidebar() {
    const list = get('chat-history-list');
    if (!list) return;
    list.innerHTML = '';
    chatSessions.forEach(s => {
        const item = document.createElement('button');
        item.className = `nav-item ${s.id === currentSessionId ? 'active' : ''}`;
        item.style.marginBottom = '4px';
        item.innerHTML = `<i class="fa-regular fa-message"></i> <span>${s.title}</span>`;
        item.onclick = () => loadSession(s.id);
        list.appendChild(item);
    });
}

function clearCurrentChat() {
    chatSessions = [];
    currentSessionId = null;
    saveSessions();
    startNewChat();
}

// --- Settings & Auth ---
function toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    const icon = get('theme-icon');
    if (icon) icon.className = isLight ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    localStorage.setItem('nexus_theme', isLight ? 'light' : 'dark');
}

function handleAuth(type) {
    if (type === 'logout') {
        localStorage.clear();
        location.reload();
    } else {
        showNotification("Authentication", "Verifying biometric hash...", "info");
        setTimeout(() => { 
            closeAuthModal(); 
            showNotification("Success", "Access Granted. Welcome, Commander.", "success"); 
        }, 1500);
    }
}

function openAuthModal() { get('auth-modal').style.display = 'flex'; }
function closeAuthModal() { get('auth-modal').style.display = 'none'; }
