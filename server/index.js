/**
 * Minimal voice backend: OpenAI TTS + Whisper for <2s latency.
 * Run: OPENAI_API_KEY=sk-... node server/index.js
 * Dev: Vite proxies /api -> http://localhost:3001
 */
import express from 'express';
import multer from 'multer';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import path from 'path';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(express.json({ limit: '10kb' }));

// ── TTS: POST /api/tts { "text": "..." } → audio/mpeg stream
app.post('/api/tts', async (req, res) => {
  if (!OPENAI_API_KEY) {
    res.status(503).json({ error: 'OPENAI_API_KEY not set' });
    return;
  }
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) {
    res.status(400).json({ error: 'Missing or empty text' });
    return;
  }
  if (text.length > 4096) {
    res.status(400).json({ error: 'Text too long' });
    return;
  }
  try {
    const r = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'alloy',
        response_format: 'mp3',
      }),
    });
    if (!r.ok) {
      const err = await r.text();
      res.status(r.status).set('Content-Type', 'text/plain').send(err);
      return;
    }
    res.setHeader('Content-Type', 'audio/mpeg');
    Readable.fromWeb(r.body).pipe(res);
  } catch (e) {
    console.error('TTS error:', e);
    res.status(500).json({ error: String(e.message) });
  }
});

// ── STT: POST /api/stt multipart file → { "text": "..." }
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
app.post('/api/stt', upload.single('file'), async (req, res) => {
  if (!OPENAI_API_KEY) {
    res.status(503).json({ error: 'OPENAI_API_KEY not set' });
    return;
  }
  const file = req.file;
  if (!file?.buffer) {
    res.status(400).json({ error: 'No file' });
    return;
  }
  try {
    const form = new FormData();
    form.append('file', new Blob([file.buffer]), file.originalname || 'audio.webm');
    form.append('model', 'whisper-1');
    form.append('response_format', 'json');
    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: form,
    });
    if (!r.ok) {
      const err = await r.text();
      res.status(r.status).json({ error: err });
      return;
    }
    const data = await r.json();
    res.json({ text: data.text || '' });
  } catch (e) {
    console.error('STT error:', e);
    res.status(500).json({ error: String(e.message) });
  }
});

// Health for frontend to detect backend
app.get('/api/voice/health', (_req, res) => {
  res.json({ ok: true, tts: !!OPENAI_API_KEY, stt: !!OPENAI_API_KEY });
});

// Static (prod): serve dist — only for non-API
const dist = path.join(__dirname, '..', 'dist');
app.use(express.static(dist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(dist, 'index.html'), (err) => { if (err) next(err); });
});

app.listen(PORT, () => {
  console.log(`Voice backend http://localhost:${PORT} (TTS+STT: ${OPENAI_API_KEY ? 'on' : 'OPENAI_API_KEY missing'})`);
});
