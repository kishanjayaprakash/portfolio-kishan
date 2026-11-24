# Kishan Jayaprakash - macOS Desktop Portfolio & AI Assistant

An interactive personal portfolio website inspired by the macOS Sonoma/Sequoia desktop experience, featuring a streaming AI chatbot powered by Groq and full client-side window management.

## ✨ Features

- **macOS Desktop Environment**:
  - Authentically styled menu bar with custom silver Apple logo, menus, and real-time clock.
  - Interactive Sonoma-style dock with app magnification and running status indicators.
  - Spotlight Search (`Cmd/Ctrl + Space`) supporting rapid navigation across projects, skills, research, and contact links.
  - Multi-window manager supporting draggability, active focus, minimize, maximize, and smooth animations.
  - Integrated Web Audio API sound effects for clicks, window actions, and completion chimes.
- **Ask Kishan AI (Apple Intelligence Inspired)**:
  - Streaming conversational agent tuned specifically to Kishan's academic background, research at IIIT Hyderabad, and projects.
  - Powered by Groq LLM streaming inference (`openai/gpt-oss-120b`).
  - Clear conversation controls, stop-generation capabilities, and pre-configured prompt pills.
- **Projects & Research Showcases**:
  - **ProTTS (Flagship)**: Prosody-aware Malayalam Text-to-Speech research at IIIT Hyderabad using FastSpeech 2.
  - **MazhaVeyil (NEXATHON 2nd Place)**: Sustainability platform combining solar analytics and rainwater harvesting for Kerala households.
  - **VibeStream**: WebRTC adaptive video streaming pipeline under network packet loss.
  - **Multimodal Emotion Recognition**: Emotion classification fusing speech acoustic features and text representations.
- **Interactive Terminal & PDF Resume Viewer**:
  - macOS Terminal emulator (`kishan@MacBook-Pro ~ %`) with custom commands (`help`, `projects`, `skills`, `clear`, etc.).
  - Integrated dual-mode resume reader with direct PDF download support.

## 🛠 Tech Stack

- **Frontend**: Vanilla HTML5, Modern CSS3 (CSS Variables, Flexbox/Grid, Backdrop Filters), Vanilla JavaScript (ES Modules).
- **AI & Streaming**: Groq Cloud API, Server-Sent Events (SSE).
- **Audio Engine**: Web Audio API (Synthesized waveforms, zero external audio assets).

## 🚀 Local Development

To run locally without dependencies:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .
```

Open `http://localhost:8000` in your browser.
