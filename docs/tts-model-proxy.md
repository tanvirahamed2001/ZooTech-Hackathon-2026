# TTS model proxy — shorter prewarm with a minimal backend

The voice quiz loads Kokoro TTS (and Whisper STT) from Hugging Face in the browser. Prewarm time is dominated by **downloading** the model files (~177 MB for Kokoro q8, plus Whisper on first answer). A minimal backend that **proxies and caches** these files can shorten prewarm in two ways:

1. **Repeat visits** — Your backend (or CDN in front of it) caches the files. After the first load, users get the model from your edge instead of Hugging Face.
2. **Demo / pre-warm** — You can hit the proxy once before the demo so the cache is warm; then the first user gets a fast download from your server.

## How it works

The worker in `src/utils/voice/voice.worker.ts` uses `@huggingface/transformers` and sets:

- `env.remoteHost` — base URL for model files (default `https://huggingface.co/`)
- `env.remotePathTemplate` — `{model}/resolve/{revision}/`

So the client requests URLs like:

`{remoteHost}{model}/resolve/{revision}/onnx/model_uint8.onnx`

Example:  
`https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/onnx/model_uint8.onnx`

If you set `VITE_TTS_MODEL_PROXY_URL=https://your-app.vercel.app/api/hf-proxy`, then:

`https://your-app.vercel.app/api/hf-proxy/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/onnx/model_uint8.onnx`

Your backend must:

1. Accept GET requests for paths like `{model}/resolve/{revision}/...`.
2. Forward each request to `https://huggingface.co/{full-path}`.
3. Return the response with long-lived cache headers (e.g. `Cache-Control: public, max-age=31536000`) so browsers and CDNs cache it.

No auth or API key is required for public HF files.

## Example: Vercel serverless proxy

Create a single serverless function that proxies any path under `/api/hf-proxy/` to Hugging Face.

**1. Install Vercel (if needed) and add the function**

Example for Vercel (Node):

**`api/hf-proxy/[...path].js`** (or `.ts` if you use TypeScript in the API):

```js
const HF = 'https://huggingface.co';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }
  const path = req.query.path?.join('/') ?? '';
  if (!path) {
    res.status(400).send('Missing path');
    return;
  }
  const url = `${HF}/${path}`;
  const resp = await fetch(url, { headers: { 'User-Agent': 'Varkly-TTS-Proxy/1' } });
  if (!resp.ok) {
    res.status(resp.status).send(await resp.text());
    return;
  }
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Content-Type', resp.headers.get('Content-Type') || 'application/octet-stream');
  const buf = await resp.arrayBuffer();
  res.send(Buffer.from(buf));
}
```

**2. Deploy** (e.g. `vercel`) and set in `.env`:

```bash
VITE_TTS_MODEL_PROXY_URL=https://your-app.vercel.app/api/hf-proxy
```

**3. Pre-warm the cache** (optional, before a demo):

```bash
curl -s -o /dev/null "https://your-app.vercel.app/api/hf-proxy/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/onnx/model_uint8.onnx"
```

Then (re)build the app so the worker bundle picks up `VITE_TTS_MODEL_PROXY_URL`. Users will load the model from your proxy; first hit fills the cache, subsequent hits are fast.

## Example: Cloudflare Worker

Same idea: in the Worker, parse the path from the request URL, fetch from `https://huggingface.co/${path}`, and return the response with `Cache-Control: public, max-age=31536000`. Cloudflare will cache at the edge.

## When to use

- **No backend:** Prewarm stays as-is (direct HF). Use prewarm on intro + progress UI; wait for “Voice model ready” before starting the quiz.
- **With proxy:** Use when you want faster repeat loads or a pre-warmed cache for a demo. One-time setup; no change to app logic beyond the env var.

## Summary

| Goal | Approach |
|------|----------|
| Shorter **first-time** prewarm | Keep q8, use progress_callback, prewarm on intro (already done). Optional: deploy proxy and pre-warm its cache before the demo. |
| Shorter **repeat** prewarm | Deploy proxy; set `VITE_TTS_MODEL_PROXY_URL`; after first load, cache serves the model. |
