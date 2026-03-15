# Path to Near Real-Time Voice

**Current pipeline (where latency is):**
1. **Question audio** — Solved with pregenerated WAVs (instant).
2. **User speaks** — Hold to record; on release, blob is sent.
3. **STT** — Full blob → backend `/api/stt` or worker Whisper. This is the main wait (network or CPU inference).
4. **VARK classification** — LLM call (OpenRouter or custom base in `.env`; can be fast).
5. **Confirmation** — Pregenerated "Got it" WAV (instant when file exists).

So the biggest remaining latency is **STT**: we only start transcribing *after* the user releases the mic, and then we wait for the full result.

---

## High-impact, feasible steps (in order)

### 1. **Web Speech API for STT (quick win, ~30–45 min)**  
Use the browser’s built-in speech recognition so the browser is transcribing while the user speaks. On release you get a result immediately (or very soon).  
- **Pros:** No server round-trip for STT, feels real-time, works in Chrome/Edge.  
- **Cons:** Quality/language may differ from Whisper; not available in all browsers (Safari limited).  
- **Implementation:** Optional path in the voice quiz: try Web Speech first; if unavailable or empty, fall back to current blob → backend/worker STT.

### 2. **Streaming STT (medium effort)**  
Send audio chunks to the backend/worker as they’re recorded; start transcription before the user releases. When they release, you already have a partial or final result.  
- **Pros:** Reduces perceived latency without changing model.  
- **Cons:** Backend/worker must support streaming input and (optionally) partial results; more wiring.

### 3. **Overlap pipeline**  
Start VARK classification as soon as you have a *partial* transcript (e.g. from streaming STT or Web Speech interim), or start TTS for a short confirmation as soon as you have enough to classify.  
- **Pros:** Shaves off hundreds of ms.  
- **Cons:** Depends on (2) or (1); need to define “enough” for classification.

### 4. **Faster / smaller models**  
- **STT:** Smaller Whisper or a streaming-capable model in the worker; or rely on backend if it’s faster.  
- **TTS:** You already stream Kokoro chunks; pregen covers fixed prompts. For dynamic agent replies, keep using streaming TTS.  
- **LLM:** Keep VARK mapping on your chosen low-latency endpoint (see `.env`).

---

## What’s already in place

- **Streaming TTS** in the worker (`TTS_CHUNK`); first chunk plays while the rest generate.
- **Pregenerated questions + confirmation** for zero-latency playback where scripted.
- **Backend-first STT** then worker fallback; backend can be tuned or replaced with a faster service.

---

## Suggested order for the next ~2 hours

1. **Ship the pregen flow** (audible “Got it”, autoplay, nav) and confirm it’s solid for the demo.  
2. **Add Web Speech API as an optional STT path** so that in supported browsers, “release → transcript” is effectively instant; fall back to current STT otherwise.  
3. **Document** in the repo (this file) and in the pitch: “We use pregen for scripted audio and optional browser speech recognition for low-latency STT; next step is streaming STT + overlapping pipeline for full real-time feel.”

That gives you a demo that *feels* much closer to real-time without rewriting the backend or worker in the remaining time.
