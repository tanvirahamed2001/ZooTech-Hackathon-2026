# Voice backend — &lt;2s latency for 180s demo

**Goal:** 13 questions in 180 seconds. TTS and STT must start within ~2 seconds so the demo is viable.

## Approach

- **Backend-first:** The app tries `/api/tts` and `/api/stt` first (OpenAI TTS + Whisper). If the backend is up, no in-browser model load; first speech and first transcription are fast.
- **Fallback:** If the backend is down or returns an error, the app falls back to the in-browser worker (Kokoro + Whisper). Prewarm still runs on the intro when the backend is unavailable.

## Run the backend (required for &lt;2s latency)

1. **Get an OpenAI API key**  
   https://platform.openai.com/api-keys

2. **Add to `.env`** (server reads it; do not commit):
   ```bash
   OPENAI_API_KEY=sk-your-key-here
   ```

3. **Two terminals:**
   - **Terminal 1 — backend:**  
     `npm run server`  
     Starts Express on port 3001 (TTS + STT).
   - **Terminal 2 — frontend:**  
     `npm run dev`  
     Vite proxies `/api` to the backend.

4. Open **http://localhost:5173/quiz/voice**.  
   The intro will show “Voice model ready” quickly (backend health check).  
   “Play question” and “Hold to speak” use the backend; first TTS and first STT should stay under ~2 seconds.

## Production

- **Build:** `npm run build`
- **Run:** `OPENAI_API_KEY=sk-... node server/index.js`  
  Serves `dist` and `/api/tts`, `/api/stt`, `/api/voice/health` on the same host.

Or deploy the static build to a host and the API to a serverless/Node service, and set `VITE_VOICE_BACKEND_URL` to the API base URL so the client calls that host for `/api/*`.

## 180s demo pacing

- ~13.8 s per question on average (intro + 13 questions + results).
- Keep question text short so TTS stays well under 2 s.
- Use “Play question” → user answers → “Hold to speak” → release; backend TTS/STT keeps latency low so you can stay within 180 s.
