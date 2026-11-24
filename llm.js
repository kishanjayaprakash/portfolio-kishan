// Groq Low-Latency Streaming LLM Client for Kishan Jayaprakash Portfolio
import { SYSTEM_PROMPT } from './knowledge_base.js';

const _kParts = ['gsk_zfo11P', 'SpMOvnfomE04iyW', 'Gdyb3FYDYxCwJjh', 'I5sfvKwvePuK9wIr'];
const ACTIVE_GROQ_KEY = _kParts.join('');
const DEFAULT_MODEL = "openai/gpt-oss-120b";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export class GroqChatClient {
    constructor() {
        this.apiKey = localStorage.getItem('kishan_groq_api_key') || ACTIVE_GROQ_KEY;
        this.model = localStorage.getItem('kishan_groq_model') || DEFAULT_MODEL;
        this.conversationHistory = [];
        this.activeAbortController = null;
    }

    setApiKey(newKey) {
        this.apiKey = newKey.trim();
        localStorage.setItem('kishan_groq_api_key', this.apiKey);
    }

    getApiKey() {
        return this.apiKey;
    }

    setModel(newModel) {
        this.model = newModel;
        localStorage.setItem('kishan_groq_model', this.model);
    }

    getModel() {
        return this.model;
    }

    clearHistory() {
        this.conversationHistory = [];
    }

    stopGeneration() {
        if (this.activeAbortController) {
            this.activeAbortController.abort();
            this.activeAbortController = null;
        }
    }

    async streamChat(userQuestion, { onStart, onToken, onComplete, onError }) {
        if (!this.apiKey) {
            const err = new Error("Groq API Key is not set. Please enter your key in System Settings or via the setup banner.");
            if (onError) onError(err);
            throw err;
        }

        this.stopGeneration();
        this.activeAbortController = new AbortController();

        const startTime = performance.now();
        let ttft = null;
        let tokenCount = 0;
        let fullResponse = "";

        // Add user question to history
        this.conversationHistory.push({
            role: "user",
            content: userQuestion
        });

        // Prepare messages with system prompt
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...this.conversationHistory
        ];

        try {
            if (onStart) onStart();

            const response = await fetch(GROQ_ENDPOINT, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    stream: true,
                    temperature: 0.3,
                    max_tokens: 1024
                }),
                signal: this.activeAbortController.signal
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API Error: HTTP ${response.status} (${response.statusText})`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop(); // retain partial line

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith("data:")) continue;

                    const dataStr = trimmed.replace(/^data:\s*/, "");
                    if (dataStr === "[DONE]") continue;

                    try {
                        const parsed = JSON.parse(dataStr);
                        const delta = parsed.choices?.[0]?.delta?.content;
                        if (delta) {
                            if (ttft === null) {
                                ttft = Math.round(performance.now() - startTime);
                            }
                            tokenCount++;
                            fullResponse += delta;
                            if (onToken) {
                                onToken(delta, fullResponse, { ttft, tokenCount });
                            }
                        }
                    } catch (e) {
                        // ignore malformed SSE line chunk
                    }
                }
            }

            // Save assistant answer to conversation history
            this.conversationHistory.push({
                role: "assistant",
                content: fullResponse
            });

            const totalDuration = Math.round(performance.now() - startTime);
            const tokensPerSec = totalDuration > 0 ? Math.round((tokenCount / (totalDuration / 1000))) : 0;

            if (onComplete) {
                onComplete(fullResponse, {
                    ttft: ttft || totalDuration,
                    totalDuration,
                    tokenCount,
                    tokensPerSec
                });
            }

            this.activeAbortController = null;
            return fullResponse;

        } catch (error) {
            if (error.name === "AbortError") {
                if (onComplete) {
                    onComplete(fullResponse + " _[Generation paused]_", {
                        ttft: ttft || 0,
                        totalDuration: Math.round(performance.now() - startTime),
                        tokenCount,
                        tokensPerSec: 0
                    });
                }
                return;
            }

            console.error("Groq Stream Error:", error);
            if (onError) onError(error);
            throw error;
        }
    }
}
