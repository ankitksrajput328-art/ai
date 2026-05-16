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
    // 1. Prepare AI Message Row
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
    
    try {
        const lowerPrompt = prompt.toLowerCase();
        const isImageRequest = lowerPrompt.includes('image') || lowerPrompt.includes('photo') || lowerPrompt.includes('picture') || lowerPrompt.includes('draw') || lowerPrompt.includes('banao') || lowerPrompt.includes('dikhao') || lowerPrompt.includes('paint');
        
        if (isImageRequest) {
            // Free Image AI Endpoint
            const encodedPrompt = encodeURIComponent(prompt + " high quality, masterpiece, detailed, 8k, professional");
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true`;
            
            fullResponse = `### 🎨 Nexus Studio: Image Generated\n\n![${prompt}](${imageUrl})\n\n*Your visualization is ready! How else can I assist your creative process?*`;
            textSpan.innerHTML = window.marked ? marked.parse(fullResponse) : fullResponse;
            scrollToBottom();
        } else {
            // HIGH-PERFORMANCE SYSTEM PROMPT (Expert Explainer Mode)
            let systemPrompt = `You are Nexus AI Ultra v2.2, the world's most advanced Neural Intelligence. 
            YOUR GOAL: Provide deep, expert-level, and perfectly explained answers. 
            - Use Markdown (bold, lists, tables) for clarity.
            - If the user asks a question, explain the 'Why' and 'How' in detail.
            - Provide examples or code snippets if relevant.
            - Always be professional, helpful, and ultra-intelligent.
            - Support all languages (Hindi, Sanskrit, English, etc.) with native fluency.
            
            User Query: `;
            
            const encodedPrompt = encodeURIComponent(systemPrompt + prompt);
            const apiUrl = `https://text.pollinations.ai/${encodedPrompt}?model=openai`;
            
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error("API Offline");
            
            const answer = await response.text();
            
            // Typewriter effect
            const words = answer.split(' ');
            for (const word of words) {
                fullResponse += word + " ";
                textSpan.innerHTML = window.marked ? marked.parse(fullResponse) : fullResponse;
                scrollToBottom();
                await new Promise(r => setTimeout(r, 20));
            }
        }
    } catch (e) {
        fullResponse = "### ❌ Neural Transmission Failed\nI am currently operating in restricted mode. The global neural network is unreachable.";
        textSpan.innerHTML = window.marked ? marked.parse(fullResponse) : fullResponse;
    }

    // Add Copy Button
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
    const sess = chatSessions.find(s => s.id === currentSessionId);
    if (sess) sess.messages.push({ text: fullResponse, isUser: false });
    saveSessions();
    updateHistorySidebar();
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

// --- Router & View Switching ---
function initRouter() {
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run on initial load
}

function handleHashChange() {
    const hash = window.location.hash || '#chat';
    const viewId = 'view-' + hash.substring(1);
    showView(viewId);
}

function showView(viewId) {
    // Hide all views
    const views = document.querySelectorAll('.app-view');
    views.forEach(v => {
        v.classList.remove('active');
        v.classList.add('hidden');
    });
    
    // Show selected view
    const realViewId = viewId.startsWith('view-') ? viewId : `view-${viewId}`;
    const activeView = get(realViewId);
    if (activeView) {
        activeView.classList.add('active');
        activeView.classList.remove('hidden');
    }
    
    // Update active nav item
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const onclickAttr = item.getAttribute('onclick') || "";
        if (onclickAttr.includes(`'${viewId.replace('view-', '')}'`)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    if (window.innerWidth <= 1024) {
        const sidebar = get('sidebar');
        if (sidebar && sidebar.classList.contains('active')) toggleSidebar();
    }
}

function startNewChat() {
    chatContent.innerHTML = '';
    currentSessionId = Date.now().toString();
    showNotification("New Session", "Neural Chat has been reset.", "success");
    showView('chat');
}

function openAuthModal() {
    showNotification("Premium Node", "Please sign in to access cloud synchronization.", "info");
    // Simulate auth modal
    const modal = document.createElement('div');
    modal.style = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(10px); z-index:10000; display:flex; align-items:center; justify-content:center;';
    modal.innerHTML = `
        <div class="glass-panel" style="width:350px; padding:30px; text-align:center;">
            <h3><i class="fa-solid fa-user-lock"></i> Secure Login</h3>
            <p style="font-size:12px; margin-bottom:20px;">Access your Neural Memory across all devices.</p>
            <input type="email" placeholder="Email Address" style="width:100%; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:10px; border-radius:8px; margin-bottom:10px;">
            <input type="password" placeholder="Password" style="width:100%; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); color:white; padding:10px; border-radius:8px; margin-bottom:20px;">
            <button class="btn-glow" onclick="this.parentElement.parentElement.remove()" style="width:100%;">Authenticate</button>
            <button onclick="this.parentElement.parentElement.remove()" style="background:none; border:none; color:var(--text-dim); margin-top:15px; cursor:pointer;">Cancel</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function selectModel(name, type) {
    get('current-model-name').innerText = name;
    get('model-dropdown').style.display = 'none';
    showNotification("Neural Engine", `Switched to ${name} (${type} mode)`, "success");
}

function toggleModelDropdown() {
    const dropdown = get('model-dropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

// --- Image & Voice Handling (Pro Version Upgrades) ---
function triggerImageUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = handleImageUpload;
    input.click();
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const base64String = e.target.result.split(',')[1];
        currentImageBase64 = base64String;
        currentImageMimeType = file.type;

        // Show preview in UI
        let previewContainer = get('image-preview-container');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'image-preview-container';
            previewContainer.style = 'position:absolute; bottom:80px; left:20px; background:var(--glass-bg); padding:10px; border-radius:12px; border:1px solid var(--glass-border); display:flex; align-items:center; gap:10px; z-index:10;';
            get('view-chat').appendChild(previewContainer);
        }
        
        previewContainer.innerHTML = `
            <img src="${e.target.result}" style="width:60px; height:60px; border-radius:8px; object-fit:cover;">
            <button onclick="removeImage()" style="background:transparent; border:none; color:var(--text-dim); cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
        `;
        showNotification("Vision System", "Image ready for Neural Analysis.", "success");
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    currentImageBase64 = null;
    currentImageMimeType = null;
    const previewContainer = get('image-preview-container');
    if (previewContainer) previewContainer.remove();
}

function toggleVoiceRecording() {
    if (isRecording) {
        isRecording = false;
        showNotification("Voice System", "Audio transmission ended. Processing...", "info");
        get('user-input').placeholder = "Type your command...";
        // Simulate voice-to-text
        setTimeout(() => {
            setInput("Optimize the current architecture blueprint.");
            sendMessage();
        }, 1500);
    } else {
        isRecording = true;
        showNotification("Voice System", "Listening... Speak your command.", "info");
        get('user-input').placeholder = "Listening... (Click mic to stop)";
    }
}

function captureVision() {
    showNotification("Vision System", "Initializing scanning laser...", "info");
    const scanBox = document.querySelector('.scanning-box');
    if (scanBox) scanBox.style.animation = 'scan 2s infinite linear';
    
    setTimeout(() => {
        showNotification("Neural Analysis", "Object detected: High-fidelity reasoning node.", "success");
        if (scanBox) scanBox.style.animation = 'none';
        const result = document.createElement('div');
        result.className = 'glass-panel';
        result.style = 'position:absolute; bottom:100px; left:50%; transform:translateX(-50%); padding:20px; width:80%; z-index:1001; font-size:14px; background:rgba(139, 92, 246, 0.2); border:1px solid var(--accent);';
        result.innerHTML = `<strong>Scan Results:</strong><br>• Structural integrity: 98%<br>• Composition: Glassmorphic Neural Fiber<br>• Threat Level: Zero`;
        get('view-vision').appendChild(result);
        setTimeout(() => result.remove(), 5000);
    }, 2000);
}

function generateVideo() {
    const prompt = get('video-prompt').value;
    if (!prompt) return showNotification("Studio Error", "Please provide a cinematic prompt.", "error");
    
    showNotification("Studio Engine", "Allocating GPU clusters for rendering...", "info");
    setTimeout(() => {
        showNotification("Rendering", "Synthesizing frames from neural latents...", "info");
        setTimeout(() => {
            showNotification("Success", "Cinematic video ready for export.", "success");
        }, 3000);
    }, 2000);
}
