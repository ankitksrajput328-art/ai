# 🎙️ Nexus AI: Real-Time Voice Intelligence System

The Nexus Voice System is designed for zero-latency human-like conversation. It uses a **Stream-In, Stream-Out** architecture to minimize the "Thinking Delay."

---

## 1. High-Level Architecture
```mermaid
graph LR
    User[User Audio] --> WS_In[WebSocket In]
    WS_In --> Whisper[OpenAI Whisper - STT]
    Whisper --> LLM[Gemini / GPT-4o]
    LLM --> SSE[Text Streaming]
    SSE --> ElevenLabs[ElevenLabs - TTS]
    ElevenLabs --> WS_Out[WebSocket Out]
    WS_Out --> Audio[User Speaker]
```

---

## 2. The Audio Pipeline (Zero Latency)

### A. Speech-to-Text (STT)
- **Model:** OpenAI Whisper (Medium/Large).
- **Optimization:** We use **VAD (Voice Activity Detection)** to start transcribing as soon as the user pauses, rather than waiting for them to finish the entire sentence.

### B. Text-to-Speech (TTS)
- **Model:** ElevenLabs Multilingual v2.
- **Optimization:** We use **Streaming TTS**. As soon as the AI generates the first 5 words, we send them to ElevenLabs and start playing the audio, while the rest of the sentence is still being generated.

### C. Voice Interruption
- If the user starts speaking while the AI is talking, the **WebSocket Handler** sends a "STOP" command to the Audio Player, instantly silencing the AI to allow the user to take over.

---

## 3. Latency Optimization Techniques
- **Chunked Processing:** Audio is sent in 20ms chunks.
- **Turbo Models:** Use the ElevenLabs "Turbo v2.5" model for sub-300ms latency.
- **WebSocket Binary:** Send raw PCM data instead of Base64 to save bandwidth and CPU.

---

**Architect's Note:** This system is the "Holy Grail" of AI interaction. It transforms the app from a chatbot into a **Virtual Companion** that you can talk to naturally, just like a human.
