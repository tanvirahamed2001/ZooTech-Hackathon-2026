# Handover: Voice Quiz — Architecture, Root Cause History, and Remaining Work

**Audience:** Cursor (next agentic harness) taking over the voice quiz integration.  
**Status as of 2026-03-14-20:27:** Voice AI loop confirmed working end-to-end. Two UX issues remain.

---

## 1. Current working state

The voice quiz at `/quiz/voice` now:
- Reads each question aloud using **Kokoro AI TTS** (`onnx-community/Kokoro-82M-v1.0-ONNX`, `af_heart` voice, natural female AI voice)
- Records the user's spoken answer
- **Transcribes** with **Whisper STT** (`Xenova/whisper-tiny.en`)
- **Maps** to VARK option IDs via **OpenRouter LLM** (`google/gemini-2.0-flash-exp:free`)
- Shows a text "Got it!" confirmation message

**What does NOT work yet (your job):**
1. After a successful answer, the quiz does not advance to the next question automatically.
2. There is no "Next question →" button or clear affordance for the user to proceed.

---

## 2. Architecture overview

### Web Worker split

All model inference runs in `src/utils/voice/voice.worker.ts` (bundled as a separate ~2.2 MB chunk). The main thread never touches ONNX or model loading.

```
Main thread                     Web Worker (voice.worker.ts)
──────────────────────────────  ──────────────────────────────────────────
AudioContext.decodeAudioData()  Kokoro TTS (KokoroTTS.generate)
OfflineAudioContext resample    Whisper STT (pipeline ASR)
AudioBufferSourceNode.play()    No AudioContext (not available in workers)
speechSynthesis (fallback TTS)
React UI state
```

### Worker message protocol

```
Main → Worker:
  { type: 'PREWARM' }                      — load Kokoro model
  { type: 'TTS', id, text }                — generate speech audio
  { type: 'STT', id, audioData: Float32Array }  — transcribe audio

Worker → Main:
  { type: 'PREWARM_DONE' }
  { type: 'PREWARM_ERROR', error }
  { type: 'TTS_RESULT', id, audio: Float32Array, samplingRate }
  { type: 'STT_RESULT', id, text }
  { type: 'ERROR', id, error }
```

### Key file map

| File | Role |
|------|------|
| `src/utils/voice/voice.worker.ts` | All model inference (Kokoro TTS + Whisper STT) |
| `src/utils/voice/web-ai-engine.ts` | Main-thread bridge: worker RPC, audio decode, playback, stop/cancel |
| `src/components/quiz/VoiceQuizQuestions.tsx` | Quiz UI: play/stop, record, thinking phases, error state |
| `src/components/quiz/VoiceQuizContainer.tsx` | Intro screen + Kokoro prewarm on "Start voice quiz" |
| `src/utils/voice/vark-mapper.ts` | LLM prompt builder + option ID parser |
| `src/utils/voice/llm-client.ts` | OpenRouter API client with fallback |

---

## 3. Critical decisions and constraints (do not revert these)

### 3.1 `@huggingface/transformers` only — no `@xenova/transformers` in voice code
Both Kokoro and Whisper must use `@huggingface/transformers`. Using `@xenova/transformers` alongside it creates two ONNX runtimes in the same scope → `Can't create a session`.

### 3.2 Audio decoded on main thread, sent as Float32Array
`@huggingface/transformers` v3 ASR pipeline cannot use `AudioContext` inside a worker. The main thread decodes the recorded Blob using:
```js
const decoded = await audioCtx.decodeAudioData(arrayBuffer);
const offlineCtx = new OfflineAudioContext(1, Math.round(decoded.duration * 16000), 16000);
// resample to mono 16 kHz, extract Float32Array
// transfer to worker
```
Do NOT pass a Blob, URL, or ArrayBuffer to the STT worker — pass a Float32Array.

### 3.3 Direct HF loading — no localhost proxy
`env.remoteHost = 'https://huggingface.co/'` is set directly. The old `localhost:PORT/hf/` proxy approach caused `ERR_CONNECTION_REFUSED` and HTML JSON parse errors. Do not reintroduce proxy routing for model loading.

### 3.4 VoiceQuizContainer prewarm
On "Start voice quiz" click, the container calls `prewarmVoiceTts()` (loads Kokoro) before showing questions. This avoids the first-question freeze. The button shows "Loading voice model…" during this phase.

---

## 4. Remaining issues for Cursor to fix

### Issue A — Quiz does not advance after successful answer

**Symptom:** User records answer → transcription shows → "Got it!" appears as text → nothing else happens; the question replays.

**Root cause:** In `src/components/quiz/VoiceQuizQuestions.tsx` inside `mr.onstop`, after VARK mapping succeeds, the code does:
```js
await new Promise<void>((resolve) => {
  speakWithFallback('Got it.', () => resolve());
});
goToNextQuestion();
```
On some browser states, `SpeechSynthesisUtterance.onend` never fires, so the `Promise` never resolves and `goToNextQuestion()` is never reached.

**Fix:**
```js
// Fire-and-forget: don't await the confirmation
speakWithFallback('Got it.');
// Advance immediately
goToNextQuestion();
```

### Issue B — No "Next question" button or advancement affordance

**Symptom:** After a successful answer, the UI falls back to idle (`Play question / Hold to speak / Skip`). No indication the answer was captured.

**Fix plan:**
1. Add `'answered'` to the `VoiceStatus` type.
2. After successful mapping, set `setStatus('answered')`.
3. Add a green "Next question →" button shown when `status === 'answered'`.
4. Auto-advance with `setTimeout(goToNextQuestion, 3000)` so the user doesn't have to tap.
5. Clicking the button or pressing Space should cancel the timer and advance immediately.

---

## 5. How to run and test

**For &lt;2s latency (13 questions in 180s demo):** Use the voice backend.

```bash
npm install
# Terminal 1: backend (OpenAI TTS + Whisper). Requires OPENAI_API_KEY in .env.
npm run server
# Terminal 2: frontend (Vite proxies /api to backend)
npm run dev
# Open http://localhost:5173/quiz/voice
# Intro shows "Voice model ready" quickly (backend health). Click "Start voice quiz".
# "Play question" → TTS in &lt;2s. "Hold to speak" → STT via backend. See docs/voice-backend.md.
```

**Without backend (fallback):** `npm run dev` only. TTS/STT use in-browser worker (Kokoro + Whisper); first load ~1 min, then prewarm on intro.

### Latency (target &lt;2s for first speech)

- **Target:** First TTS after "Play question" &lt;2 seconds.
- **Current:** Kokoro cold load is ~1 min; once loaded, first inference is fast.
- **Implemented:** (1) Prewarm starts **on intro mount** (user sees intro while model loads). (2) Prewarm is **idempotent** (one load; repeated calls await same promise). (3) Intro copy shows "Voice model ready" when prewarm completes. (4) **Progress:** Worker uses `progress_callback`; intro shows "Loading voice model… 45%". (5) **Optional proxy:** Set `VITE_TTS_MODEL_PROXY_URL` to a backend that caches HF model files for faster repeat loads; see `docs/tts-model-proxy.md`. (6) **q8 dtype** keeps quality and uses model_uint8.onnx (177 MB) rather than larger variants.
- **Shortening prewarm further:** Use a minimal proxy (see above) and pre-warm its cache before the demo; or accept intro wait and "Voice model ready" for &lt;2s first speech.

---

## 6. Environment / API key

The VARK LLM mapping requires an OpenRouter API key in `.env`:
```
VITE_OPENROUTER_API_KEY=sk-or-v1-your-key-here
```
Without a valid key, the LLM client returns a fallback string and `parseOptionIds()` returns `[]` (empty option array). The quiz will still advance (with no VARK scores recorded for that question) — not ideal, but not a crash.

---

## 7. Root cause history (for context only)

| Date | Symptom | Root cause | Fix |
|------|---------|-----------|-----|
| 2026-03-14 early | `Unexpected token '<', "<!doctype"` | SpeechT5 model config fetched HTML instead of JSON; `env.allowLocalModels=true` caused `/models/...` lookups that returned app HTML | Switched to Kokoro; set `env.allowLocalModels=false`; direct HF URLs |
| 2026-03-14 mid | `Can't create a session` | `@xenova/transformers` and `@huggingface/transformers` loaded together = two ORT stacks | Unified on `@huggingface/transformers` only |
| 2026-03-14 mid | UI frozen 1–2 min | Model inference on main thread blocked React | Moved inference to Web Worker |
| 2026-03-14 late | `aud.subarray is not a function` | ASR pipeline received Blob; v3 expects Float32Array for direct input | Decode Blob to Float32Array on main thread |
| 2026-03-14 late | `AudioContext unavailable` | Worker tried to use `URL.createObjectURL` → pipeline tried to `fetch()` + `decodeAudioData()` | Decode on main thread; transfer Float32Array |
| 2026-03-14 late | `goToNextQuestion` not called | Awaited `SpeechSynthesisUtterance.onend` promise that never resolves | Fire-and-forget confirmation, advance immediately (not yet merged) |
| 2026-03-14 | `Unexpected token '<', "<!doctype"` again; browser fallback no sound | Proxy URL relative/same-origin → model fetch returned index.html; fallback after async gap blocked by browser autoplay | Worker: only use `VITE_TTS_MODEL_PROXY_URL` if it is absolute `https://` (not localhost). UI: add "Play with browser voice" button when AI fails so user gesture triggers fallback. Rebuild so worker bundle has correct env. |

---

## 8. Dependencies (relevant)

```json
{
  "kokoro-js": "^1.2.1",           // TTS — uses @huggingface/transformers internally
  "@xenova/transformers": "^2.17.2", // Whisper STT — used directly in voice.worker.ts
  "@huggingface/transformers": "^3.x" // Comes in via kokoro-js; we import it directly too
}
```

> Note: `@xenova/transformers` is still in `package.json` (it was the original dependency), but the voice code no longer imports it directly. The Whisper model (`Xenova/whisper-tiny.en`) is loaded via `@huggingface/transformers` pipeline in the worker.

---

*Updated: 2026-03-14-20:27 | [Harness: Cline]*
