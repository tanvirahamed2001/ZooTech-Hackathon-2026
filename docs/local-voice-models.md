# Local voice models — no OpenAI, no cloud after first download

You can run the voice quiz **entirely on your machine** using small, open models (Kokoro TTS + Whisper STT). No API keys and no dependency on OpenAI or Hugging Face after a one-time download.

## One-time setup

### 1. Download the models to your computer

From the project root:

```bash
npm run download-voice-models
```

This fetches:

- **Kokoro TTS** (onnx-community/Kokoro-82M-v1.0-ONNX) — ~177 MB for the q8 model + config/tokenizer.
- **Whisper STT** (Xenova/whisper-tiny.en) — quantized encoder/decoder + tokenizer (~50 MB).

Files are written to `./local-models/` (gitignored) in two layouts: HF-style (`repo/resolve/main/...`) and flat (`repo/...`) so the app can load via the hub’s `localModelPath`. Total size is about **230 MB**. If you already ran the script before, run it again to get the flat paths and the voice file (`voices/af_heart.bin`).

### 2. Serve the models from disk

In a **separate terminal** (keep it running while you use the app):

```bash
npm run serve-models
```

This serves `local-models/` at **http://localhost:8080**. In development, Vite proxies `/voice-models` to 8080 so the worker loads models same-origin (no CORS).

### 3. Point the app at your local server

In `.env`:

```bash
VITE_TTS_MODEL_PROXY_URL=http://localhost:8080
```

(No trailing slash.)

### 4. Run the app

```bash
npm run dev
```

Open **http://localhost:5173/quiz/voice**. The app will load Kokoro and Whisper from `http://localhost:8080` (i.e. from disk). No OpenAI and no Hugging Face requests after the first load.

## Why this helps

- **No API keys** — TTS and STT run locally.
- **Faster after first load** — Models are on disk; the browser reads them from your machine instead of the network.
- **Works offline** — Once `local-models/` is present and you run `serve-models`, you can disconnect from the internet and still use the voice quiz.
- **Same small models** — Same Kokoro (q8) and Whisper tiny as the in-browser fallback; you’re just serving them from a folder instead of Hugging Face.

## Flow

1. **First time:** Run `download-voice-models` once. Then always run `serve-models` when you want to use the voice quiz.
2. **When you open the voice quiz:** The worker requests model files from `http://localhost:8080/...`. Those requests hit your local server and are served from `local-models/`.
3. **If the local server isn’t running:** The app falls back to loading from Hugging Face (same as before). So you can still use the app without `serve-models`; it will just use the network.

## Production / sharing

- `local-models/` is gitignored. To run the same setup on another machine, run `npm run download-voice-models` there and serve the folder (or deploy the same directory to a static host and set `VITE_TTS_MODEL_PROXY_URL` to that host).
- For **&lt;2 s latency** in a short demo, the optional **OpenAI backend** (see [docs/voice-backend.md](voice-backend.md)) is still the fastest option; local models are for privacy, offline use, and avoiding API keys.
