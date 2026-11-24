// Kishan Jayaprakash - macOS Desktop Portfolio & AI Assistant Engine
import { GroqChatClient } from './llm.js';

const chatClient = new GroqChatClient();

// Native macOS UI Audio Synthesis via Web Audio API (no external files)
class MacOSAudio {
    constructor() {
        this.ctx = null;
        this.enabled = localStorage.getItem('macos_sound') !== 'false';
    }

    init() {
        if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
        }
    }

    playClick() {
        if (!this.enabled) return;
        try {
            this.init();
            if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.03);
            gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.03);
        } catch (e) {}
    }

    playDone() {
        if (!this.enabled) return;
        try {
            this.init();
            if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(587.33, now); // D5
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
            gain.gain.setValueAtTime(0.035, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.18);
        } catch (e) {}
    }
}
const macAudio = new MacOSAudio();

// =====================================================================
// WINDOW MANAGER & DRAGGING
// =====================================================================
let zIndexCounter = 100;

export function bringToFront(win) {
    if (!win) return;
    zIndexCounter += 2;
    win.style.zIndex = zIndexCounter;

    document.querySelectorAll('.macos-window').forEach(w => w.classList.remove('active-window'));
    win.classList.add('active-window');

    const appTitle = win.getAttribute('data-title') || 'Portfolio';
    const topBarTitle = document.getElementById('active-app-name');
    if (topBarTitle) topBarTitle.textContent = appTitle.split('—')[0].trim();
}

export function openWindow(winId) {
    macAudio.playClick();
    const win = document.getElementById(winId);
    if (!win) return;

    if (window.innerWidth <= 768) {
        win.style.left = '2.5vw';
        win.style.top = '34px';
        win.style.width = '95vw';
        win.style.height = `${window.innerHeight - 34 - 72}px`;
    }

    win.style.display = 'flex';
    win.classList.remove('minimized');
    bringToFront(win);

    const dot = document.getElementById(`dot-${winId}`);
    if (dot) dot.classList.add('active');

    if (winId === 'win-llm') {
        setTimeout(() => {
            const input = document.getElementById('chat-input');
            if (input) input.focus();
        }, 120);
    } else if (winId === 'win-terminal') {
        setTimeout(() => {
            const input = document.getElementById('terminal-input');
            if (input) input.focus();
        }, 120);
    }
}

export function closeWindow(winId) {
    macAudio.playClick();
    const win = document.getElementById(winId);
    if (!win) return;
    win.style.display = 'none';

    const dot = document.getElementById(`dot-${winId}`);
    if (dot) dot.classList.remove('active');

    const topBarTitle = document.getElementById('active-app-name');
    if (topBarTitle) topBarTitle.textContent = 'Portfolio';
}

export function minimizeWindow(winId) {
    macAudio.playClick();
    const win = document.getElementById(winId);
    if (!win) return;
    win.style.display = 'none';
}

export function maximizeWindow(winId) {
    macAudio.playClick();
    const win = document.getElementById(winId);
    if (!win) return;
    win.classList.toggle('maximized');
    bringToFront(win);
}

function initWindowDragging() {
    document.querySelectorAll('.macos-window').forEach(win => {
        const titlebar = win.querySelector('.window-titlebar');
        if (!titlebar) return;

        win.addEventListener('mousedown', () => bringToFront(win));

        let isDragging = false;
        let startX = 0, startY = 0;
        let origLeft = 0, origTop = 0;

        const onPointerDown = (e) => {
            if (window.innerWidth <= 768) return; // Keep windows static & centered on mobile
            if (e.target.closest('.traffic-lights') || e.target.closest('.titlebar-actions')) return;
            if (win.classList.contains('maximized')) return;

            isDragging = true;
            bringToFront(win);

            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);

            startX = clientX;
            startY = clientY;

            const rect = win.getBoundingClientRect();
            origLeft = rect.left;
            origTop = rect.top;

            document.addEventListener('mousemove', onPointerMove);
            document.addEventListener('mouseup', onPointerUp);
            document.addEventListener('touchmove', onPointerMove, { passive: false });
            document.addEventListener('touchend', onPointerUp);
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;
            if (e.cancelable) e.preventDefault();

            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);

            const dx = clientX - startX;
            const dy = clientY - startY;

            let newLeft = origLeft + dx;
            let newTop = origTop + dy;

            newTop = Math.max(28, Math.min(window.innerHeight - 80, newTop));
            newLeft = Math.max(-120, Math.min(window.innerWidth - 120, newLeft));

            win.style.left = `${newLeft}px`;
            win.style.top = `${newTop}px`;
        };

        const onPointerUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onPointerMove);
            document.removeEventListener('mouseup', onPointerUp);
            document.removeEventListener('touchmove', onPointerMove);
            document.removeEventListener('touchend', onPointerUp);
        };

        titlebar.addEventListener('mousedown', onPointerDown);
        titlebar.addEventListener('touchstart', onPointerDown, { passive: true });
    });
}

// =====================================================================
// CLEAN CHAT & STREAMING LOGIC
// =====================================================================
const chatThread = document.getElementById('chat-thread');
const chatWelcomeHero = document.getElementById('chat-welcome-hero');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const chatStopBtn = document.getElementById('chat-stop-btn');
const clearBtn = document.getElementById('llm-clear-btn');

function renderMarkdown(raw) {
    if (!raw) return "";
    let s = raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Code blocks ```...```
    s = s.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // Inline code `...`
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Strip markdown headers — convert ### Title → bold text
    s = s.replace(/^#{1,6}\s+(.*)$/gm, '<strong>$1</strong>');

    // Strip markdown table rows — convert | col | col | to plain text
    s = s.replace(/^\|[-:\s|]+\|$/gm, ''); // remove separator rows like |---|---|
    s = s.replace(/^\|(.+)\|$/gm, (_, row) => row.split('|').map(c => c.trim()).filter(Boolean).join(' — '));

    // Bold **...**
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Links [title](url)
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1 ↗</a>');

    // Lists
    s = s.replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
    s = s.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Paragraphs
    return s.split('\n\n').map(p => {
        p = p.trim();
        if (!p) return '';
        if (p.startsWith('<pre>') || p.startsWith('<ul>')) return p;
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('');
}

function appendUserBubble(text) {
    if (chatWelcomeHero) chatWelcomeHero.style.display = 'none';
    const row = document.createElement('div');
    row.className = 'chat-row user';
    row.innerHTML = `
        <div class="chat-bubble-wrap">
            <div class="bubble">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
        <div class="chat-avatar user-avatar">You</div>
    `;
    chatThread.appendChild(row);
    chatThread.scrollTop = chatThread.scrollHeight;
}

function createAssistantBubble() {
    const row = document.createElement('div');
    row.className = 'chat-row assistant';
    row.innerHTML = `
        <div class="chat-avatar assistant-avatar">KJ</div>
        <div class="chat-bubble-wrap">
            <div class="bubble">
                <span class="bubble-text"></span>
                <span class="streaming-dot"></span>
            </div>
            <div class="chat-latency-note" style="display:none;"></div>
        </div>
    `;
    chatThread.appendChild(row);
    chatThread.scrollTop = chatThread.scrollHeight;

    const textSpan = row.querySelector('.bubble-text');
    const cursor = row.querySelector('.streaming-dot');
    const latencyNote = row.querySelector('.chat-latency-note');
    return { row, textSpan, cursor, latencyNote };
}

export async function askQuestion(question) {
    if (!question || !question.trim()) return;
    const clean = question.trim();

    chatInput.value = '';
    chatInput.style.height = 'auto';

    appendUserBubble(clean);

    const { textSpan, cursor, latencyNote } = createAssistantBubble();

    chatSendBtn.style.display = 'none';
    chatStopBtn.style.display = 'inline-flex';
    macAudio.playClick();

    try {
        await chatClient.streamChat(clean, {
            onToken: (chunk, fullText, { ttft }) => {
                textSpan.innerHTML = renderMarkdown(fullText);
                chatThread.scrollTop = chatThread.scrollHeight;
            },
            onComplete: (fullText, stats) => {
                textSpan.innerHTML = renderMarkdown(fullText);
                cursor.remove();
                chatStopBtn.style.display = 'none';
                chatSendBtn.style.display = 'inline-flex';

                if (stats.totalDuration) {
                    latencyNote.textContent = `Completed in ${(stats.totalDuration / 1000).toFixed(2)}s via Groq`;
                    latencyNote.style.display = 'block';
                }

                macAudio.playDone();
            },
            onError: (err) => {
                cursor.remove();
                chatStopBtn.style.display = 'none';
                chatSendBtn.style.display = 'inline-flex';
                textSpan.innerHTML = `<span style="color: #FF453A;">Error connecting to model: ${err.message}. Please check your connection or API key.</span>`;
            }
        });
    } catch (e) {
        console.error("Chat error:", e);
    }
}

export function sendQuickPrompt(promptText) {
    openWindow('win-llm');
    askQuestion(promptText);
}

export function handleChatSubmit(e) {
    if (e) e.preventDefault();
    const val = chatInput.value;
    if (val) askQuestion(val);
}

chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 110) + 'px';
});

chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleChatSubmit();
    }
});

chatStopBtn.addEventListener('click', () => {
    chatClient.stopGeneration();
    chatStopBtn.style.display = 'none';
    chatSendBtn.style.display = 'inline-flex';
});

if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        macAudio.playClick();
        chatClient.clearHistory();
        chatThread.innerHTML = '';
        if (chatWelcomeHero) {
            chatThread.appendChild(chatWelcomeHero);
            chatWelcomeHero.style.display = 'flex';
        }
        showToast('Chat history cleared');
    });
} else {
    // Fallback: attach after DOM is loaded in case of timing issue
    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('llm-clear-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                macAudio.playClick();
                chatClient.clearHistory();
                chatThread.innerHTML = '';
                const hero = document.getElementById('chat-welcome-hero');
                if (hero) {
                    document.getElementById('chat-thread').appendChild(hero);
                    hero.style.display = 'flex';
                }
                showToast('Chat history cleared');
            });
        }
    });
}

// =====================================================================
// TERMINAL.APP EMULATOR
// =====================================================================
const termInput = document.getElementById('terminal-input');
const termLog = document.getElementById('term-log');
const cmdHistory = [];
let cmdIndex = -1;

export function focusTerminalInput() {
    if (termInput) termInput.focus();
}

function appendTermLine(html) {
    const div = document.createElement('div');
    div.className = 'term-row';
    div.innerHTML = html;
    termLog.appendChild(div);
    termLog.scrollTop = termLog.scrollHeight;
}

termInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        const cmd = termInput.value.trim();
        termInput.value = '';
        if (!cmd) return;

        cmdHistory.push(cmd);
        cmdIndex = cmdHistory.length;

        appendTermLine(`kishan@MacBook-Pro ~ % ${cmd}`);
        executeTerminalCommand(cmd);
    } else if (e.key === 'ArrowUp') {
        if (cmdIndex > 0) {
            cmdIndex--;
            termInput.value = cmdHistory[cmdIndex] || '';
        }
    } else if (e.key === 'ArrowDown') {
        if (cmdIndex < cmdHistory.length - 1) {
            cmdIndex++;
            termInput.value = cmdHistory[cmdIndex] || '';
        } else {
            cmdIndex = cmdHistory.length;
            termInput.value = '';
        }
    }
});

function executeTerminalCommand(cmdText) {
    const parts = cmdText.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    switch (command) {
        case 'help':
            appendTermLine(`Commands: <span class="term-cyan">about</span>, <span class="term-cyan">skills</span>, <span class="term-cyan">projects</span>, <span class="term-cyan">research</span>, <span class="term-cyan">cgpa</span>, <span class="term-cyan">ask &lt;question&gt;</span>, <span class="term-cyan">clear</span>`);
            break;
        case 'about':
            appendTermLine(`Kishan Jayaprakash: B.Tech Computer Science student, Saintgits College of Engineering (KTU 2020 Scheme, 2027).`);
            appendTermLine(`Focus: Speech Technology, Real-Time Streaming & AI Engineering.`);
            break;
        case 'cgpa':
            appendTermLine(`Academic Status: 7th Semester. Verified CGPA: <span class="term-cyan">6.66 through Semester 6</span>.`);
            break;
        case 'skills':
            appendTermLine(`PyTorch, FastSpeech 2, Montreal Forced Aligner, WebRTC, RTMP, FFmpeg, Node.js, Java, Python, PostgreSQL, Docker.`);
            break;
        case 'projects':
            appendTermLine(`1. <span class="term-cyan">ProTTS (Flagship Project)</span>: Prominence-Aware Malayalam TTS (FastSpeech 2, PyTorch, LTRC IIIT Hyderabad)`);
            appendTermLine(`2. <span class="term-cyan">VibeStream</span>: Live-streaming studio (FFmpeg, RTMP, WebSockets, Docker)`);
            appendTermLine(`3. <span class="term-cyan">Multimodal Emotion Recognition</span>: BiLSTM speech/text classifier (52.37% accuracy)`);
            appendTermLine(`4. <span class="term-cyan">Resilient Stream</span>: Hack@Cooee 1st Prize Winner (₹17,500)`);
            break;
        case 'research':
        case 'protts':
            appendTermLine(`IIIT Hyderabad (LTRC) — ProTTS: Prominence-Aware Malayalam TTS using FastSpeech 2 and K-means stress centroids.`);
            break;
        case 'ask':
            if (!args) {
                appendTermLine(`Usage: ask &lt;question&gt;`);
                return;
            }
            openWindow('win-llm');
            askQuestion(args);
            break;
        case 'clear':
            termLog.innerHTML = '';
            break;
        default:
            appendTermLine(`zsh: command not found: ${command}. Type <span class="term-cyan">help</span> for commands.`);
            break;
    }
}

// =====================================================================
// SYSTEM PREFERENCES & NOTIFICATIONS
// =====================================================================
export function updateModelSelection(model) {
    chatClient.setModel(model);
    const tag = document.getElementById('llm-model-status');
    if (tag) tag.textContent = `Groq / ${model}`;
    showToast(`Model: ${model}`);
}

export function toggleSound(enabled) {
    macAudio.enabled = enabled;
    localStorage.setItem('macos_sound', enabled ? 'true' : 'false');

    if (!enabled && macAudio.ctx) {
        macAudio.ctx.suspend().catch(() => {});
    } else if (enabled && macAudio.ctx && macAudio.ctx.state === 'suspended') {
        macAudio.ctx.resume().catch(() => {});
    }

    const icon = document.getElementById('sound-icon');
    if (icon) icon.textContent = enabled ? '🔊' : '🔇';

    const checkbox = document.getElementById('setting-sound');
    if (checkbox) checkbox.checked = enabled;

    showToast(enabled ? 'Sound Effects Enabled 🔊' : 'Sound Effects Muted 🔇');
}

// =====================================================================
// SPOTLIGHT SEARCH ENGINE
// =====================================================================
const SPOTLIGHT_ITEMS = [
    { title: "Ask Kishan AI Assistant", cat: "Applications", sub: "LLM streaming chatbot tuned with Kishan's knowledge base", icon: "🤖", action: () => openWindow('win-llm') },
    { title: "Projects — Portfolio", cat: "Applications", sub: "Explore ProTTS Flagship, VibeStream, Emotion ML", icon: "📁", action: () => openWindow('win-projects') },
    { title: "Research — IIIT Hyderabad", cat: "Applications", sub: "Speech Processing Lab, LTRC ProTTS internship", icon: "🔬", action: () => openWindow('win-research') },
    { title: "Resume.pdf — Preview", cat: "Documents", sub: "Preview & download KishanJayaprakash_CV.pdf", icon: "📄", action: () => openWindow('win-resume') },
    { title: "About This Mac", cat: "System", sub: "Saintgits KTU B.Tech CSE, 6.66 CGPA through Semester 6", icon: "👨‍💻", action: () => openWindow('win-about') },
    { title: "Terminal", cat: "Developer", sub: "Interactive -zsh shell with portfolio CLI commands", icon: "💻", action: () => openWindow('win-terminal') },
    { title: "System Settings", cat: "Preferences", sub: "Configure Groq model, sounds, and preferences", icon: "⚙️", action: () => openWindow('win-settings') },
    { title: "ProTTS (Flagship Project)", cat: "Projects", sub: "Prominence-Aware Malayalam Neural TTS (FastSpeech 2, PyTorch)", icon: "⭐", action: () => openWindow('win-projects') },
    { title: "VibeStream Live Studio", cat: "Projects", sub: "Live-streaming studio with FFmpeg, RTMP, Docker, WebSockets", icon: "🎥", action: () => window.open('https://github.com/kishanjayaprakash/VibeStream', '_blank') },
    { title: "Multimodal Emotion Recognition", cat: "Projects", sub: "BiLSTM speech & text model (52.37% speaker-independent mean)", icon: "🧠", action: () => window.open('https://github.com/kishanjayaprakash/Multimodal-Emotion-Recognition', '_blank') },
    { title: "Resilient Stream (Hack@Cooee)", cat: "Achievements", sub: "1st Prize Winner (₹17,500) • Adaptive WebRTC video streaming", icon: "🏆", action: () => openWindow('win-projects') },
    { title: "LeetCode (100+ Solved)", cat: "Developer", sub: "100+ Data Structures & Algorithms problems solved", icon: "🧩", action: () => window.open('https://leetcode.com/u/Kishan_Jayaprakash', '_blank') },
    { title: "Download Resume PDF", cat: "Actions", sub: "Download KishanJayaprakash_CV.pdf to your computer", icon: "⬇️", action: () => { const a = document.createElement('a'); a.href = 'KishanJayaprakash_CV.pdf'; a.download = 'KishanJayaprakash_CV.pdf'; a.click(); } },
    { title: "Email Kishan Jayaprakash", cat: "Contact", sub: "kishanjayaprakash05@gmail.com", icon: "✉️", action: () => { window.location.href = 'mailto:kishanjayaprakash05@gmail.com'; } },
    { title: "LinkedIn Profile", cat: "Social", sub: "linkedin.com/in/kishan-jayaprakash-a68407290", icon: "🌐", action: () => window.open('https://linkedin.com/in/kishan-jayaprakash-a68407290', '_blank') },
    { title: "GitHub Profile", cat: "Social", sub: "github.com/kishanjayaprakash", icon: "🐙", action: () => window.open('https://github.com/kishanjayaprakash', '_blank') }
];

let selectedSpotlightIndex = 0;

export function toggleSpotlight() {
    const overlay = document.getElementById('spotlight-overlay');
    if (!overlay) return;
    if (overlay.classList.contains('active')) {
        closeSpotlight();
    } else {
        openSpotlight();
    }
}

export function openSpotlight() {
    const overlay = document.getElementById('spotlight-overlay');
    const input = document.getElementById('spotlight-input');
    if (!overlay || !input) return;

    overlay.classList.add('active');
    input.value = '';
    renderSpotlightResults('');
    setTimeout(() => input.focus(), 60);
}

export function closeSpotlight(e) {
    if (e && e.target && e.target.closest('.spotlight-modal')) return;
    const overlay = document.getElementById('spotlight-overlay');
    if (overlay) overlay.classList.remove('active');
}

function renderSpotlightResults(query) {
    const resultsContainer = document.getElementById('spotlight-results');
    if (!resultsContainer) return;

    const q = query.toLowerCase().trim();
    let matches = [];

    if (!q) {
        matches = SPOTLIGHT_ITEMS.slice(0, 7);
    } else {
        matches = SPOTLIGHT_ITEMS.filter(item => 
            item.title.toLowerCase().includes(q) || 
            item.sub.toLowerCase().includes(q) || 
            item.cat.toLowerCase().includes(q)
        );
    }

    let html = '';
    if (!q) {
        html += `<div class="spotlight-category-header">Suggested</div>`;
    } else {
        html += `<div class="spotlight-category-header">Search Results (${matches.length})</div>`;
    }

    matches.forEach((item, idx) => {
        const isSel = idx === selectedSpotlightIndex ? 'selected' : '';
        html += `
            <div class="spotlight-item ${isSel}" data-index="${idx}" onclick="executeSpotlightItem(${idx})">
                <span class="spotlight-item-icon">${item.icon}</span>
                <div class="spotlight-item-details">
                    <div class="spotlight-item-title">${item.title}</div>
                    <div class="spotlight-item-sub">${item.sub}</div>
                </div>
                <span class="spotlight-item-cat">${item.cat}</span>
            </div>
        `;
    });

    if (q) {
        html += `
            <div class="spotlight-item" data-index="ai" onclick="askSpotlightAI('${q.replace(/'/g, "\\'")}')">
                <span class="spotlight-item-icon">💬</span>
                <div class="spotlight-item-details">
                    <div class="spotlight-item-title">Ask AI: "${q}"</div>
                    <div class="spotlight-item-sub">Stream answer from Kishan AI Assistant</div>
                </div>
                <span class="spotlight-item-cat">AI Query</span>
            </div>
        `;
    }

    resultsContainer.innerHTML = html;
}

window.executeSpotlightItem = function(idx) {
    const input = document.getElementById('spotlight-input');
    const q = input ? input.value.toLowerCase().trim() : '';
    let matches = !q ? SPOTLIGHT_ITEMS.slice(0, 7) : SPOTLIGHT_ITEMS.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.sub.toLowerCase().includes(q) || 
        item.cat.toLowerCase().includes(q)
    );

    if (matches[idx]) {
        closeSpotlight();
        matches[idx].action();
    }
};

window.askSpotlightAI = function(question) {
    closeSpotlight();
    openWindow('win-llm');
    askQuestion(question);
};

function initSpotlightEvents() {
    const input = document.getElementById('spotlight-input');
    if (input) {
        input.addEventListener('input', (e) => {
            selectedSpotlightIndex = 0;
            renderSpotlightResults(e.target.value);
        });

        input.addEventListener('keydown', (e) => {
            const items = document.querySelectorAll('.spotlight-item');
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (selectedSpotlightIndex < items.length - 1) {
                    selectedSpotlightIndex++;
                    updateSpotlightSelection();
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (selectedSpotlightIndex > 0) {
                    selectedSpotlightIndex--;
                    updateSpotlightSelection();
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const sel = items[selectedSpotlightIndex];
                if (sel) sel.click();
            } else if (e.key === 'Escape') {
                closeSpotlight();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
            e.preventDefault();
            toggleSpotlight();
        } else if (e.key === 'Escape') {
            closeSpotlight();
        }
    });
}

function updateSpotlightSelection() {
    const items = document.querySelectorAll('.spotlight-item');
    items.forEach((item, idx) => {
        item.classList.toggle('selected', idx === selectedSpotlightIndex);
        if (idx === selectedSpotlightIndex) {
            item.scrollIntoView({ block: 'nearest' });
        }
    });
}

const soundBtn = document.getElementById('sound-btn');
if (soundBtn) {
    soundBtn.addEventListener('click', () => {
        toggleSound(!macAudio.enabled);
    });
}

export function showToast(msg) {
    const toast = document.getElementById('macos-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 2200);
}

function initClock() {
    const clockEl = document.getElementById('menu-clock');
    const update = () => {
        const now = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = days[now.getDay()];
        const month = months[now.getMonth()];
        const date = now.getDate();
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;

        if (clockEl) {
            clockEl.textContent = `${day} ${month} ${date} ${hours}:${minutes} ${ampm}`;
        }
    };
    update();
    setInterval(update, 1000);
}

// Menu Bar Actions
export function getActiveWindow() {
    return document.querySelector('.macos-window.active-window') || document.querySelector('.macos-window[style*="display: flex"]');
}

export function closeActiveWindow() {
    const active = getActiveWindow();
    if (active) closeWindow(active.id);
}

export function minimizeActiveWindow() {
    const active = getActiveWindow();
    if (active) minimizeWindow(active.id);
}

export function maximizeActiveWindow() {
    const active = getActiveWindow();
    if (active) maximizeWindow(active.id);
}

export function clearChatHistory() {
    macAudio.playClick();
    chatClient.clearHistory();
    chatThread.innerHTML = '';
    if (chatWelcomeHero) {
        chatThread.appendChild(chatWelcomeHero);
        chatWelcomeHero.style.display = 'flex';
    }
    showToast('Chat history cleared');
}

export function copyContactEmail() {
    navigator.clipboard.writeText('kishanjayaprakash05@gmail.com').then(() => {
        showToast('Email copied to clipboard');
    }).catch(() => {
        showToast('Email: kishanjayaprakash05@gmail.com');
    });
}

export function saveBannerApiKey() {
    const input = document.getElementById('banner-key-input');
    if (!input) return;
    const val = input.value.trim();
    if (!val) {
        showToast('Please enter a valid key');
        return;
    }
    chatClient.setApiKey(val);
    const settingKey = document.getElementById('setting-key');
    if (settingKey) settingKey.value = val;
    const banner = document.getElementById('api-key-banner');
    if (banner) banner.style.display = 'none';
    showToast('Groq API Key saved successfully');
}

// Generalized Dropdown Handling
function initDropdownMenus() {
    document.querySelectorAll('.dropdown').forEach(dd => {
        dd.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasActive = dd.classList.contains('active');
            document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('active'));
            if (!wasActive) dd.classList.add('active');
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('active'));
    });
}

export function restartDesktop() {
    location.reload();
}

export function toggleResumeView() {
    macAudio.playClick();
    const sheetView = document.getElementById('resume-sheet-view');
    const pdfView = document.getElementById('resume-pdf-view');
    const btn = document.getElementById('resume-toggle-btn');
    if (!sheetView || !pdfView) return;

    if (sheetView.style.display === 'none') {
        sheetView.style.display = 'flex';
        pdfView.style.display = 'none';
        if (btn) btn.textContent = 'View Raw PDF';
    } else {
        sheetView.style.display = 'none';
        pdfView.style.display = 'block';
        if (btn) btn.textContent = 'View Formatted Sheet';
    }
}

// Expose functions globally for onclick attributes
window.openWindow = openWindow;
window.closeWindow = closeWindow;
window.minimizeWindow = minimizeWindow;
window.maximizeWindow = maximizeWindow;
window.closeActiveWindow = closeActiveWindow;
window.minimizeActiveWindow = minimizeActiveWindow;
window.maximizeActiveWindow = maximizeActiveWindow;
window.clearChatHistory = clearChatHistory;
window.copyContactEmail = copyContactEmail;
window.saveBannerApiKey = saveBannerApiKey;
window.sendQuickPrompt = sendQuickPrompt;
window.handleChatSubmit = handleChatSubmit;
window.focusTerminalInput = focusTerminalInput;
window.updateModelSelection = updateModelSelection;
window.toggleSound = toggleSound;
window.restartDesktop = restartDesktop;
window.toggleResumeView = toggleResumeView;
window.toggleSpotlight = toggleSpotlight;
window.openSpotlight = openSpotlight;
window.closeSpotlight = closeSpotlight;

document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initWindowDragging();
    initDropdownMenus();
    initSpotlightEvents();

    // Synchronize initial sound state
    const savedSound = localStorage.getItem('macos_sound') !== 'false';
    const icon = document.getElementById('sound-icon');
    if (icon) icon.textContent = savedSound ? '🔊' : '🔇';
    const soundCheck = document.getElementById('setting-sound');
    if (soundCheck) soundCheck.checked = savedSound;

    // Setup API Key state
    const settingKey = document.getElementById('setting-key');
    if (settingKey) {
        settingKey.addEventListener('change', () => {
            if (settingKey.value.trim()) {
                chatClient.setApiKey(settingKey.value.trim());
                showToast('API key updated in Settings');
            }
        });
    }

    // Default open Ask Kishan on startup
    setTimeout(() => {
        openWindow('win-llm');
    }, 250);
});
