/**
 * Voice AI Worker — runs Kokoro TTS and Whisper STT off the main thread so the UI stays responsive.
 * Protocol:
 *   Main → Worker:  { type: 'PREWARM' }
 *                   { type: 'TTS', id: number, text: string }
 *                   { type: 'STT', id: number, audioData: Float32Array }
 *
 *   Worker → Main:  { type: 'PREWARM_DONE' }
 *                   { type: 'PREWARM_ERROR', error: string }
 *                   { type: 'TTS_RESULT', id: number, audio: Float32Array, samplingRate: number }
 *                   { type: 'STT_RESULT', id: number, text: string }
 *                   { type: 'ERROR', id: number, error: string }
 */

// Patch fetch BEFORE loading transformers so the library uses our URL rewriting.
import {
  getModelBaseUrl,
  setFetchDebugCallback,
  setModelBaseUrl,
} from './voice.worker.fetch-patch';

import { pipeline, env } from '@huggingface/transformers';

setFetchDebugCallback((url, rewritten) => {
  self.postMessage({ type: 'VOICE_FETCH_DEBUG', url, rewritten });
});

// Use hub's local path as our proxy URL so the library fetches from there (no global fetch patch needed).
env.useFS = false;
env.remotePathTemplate = '{model}/resolve/{revision}/';

function setRemoteHost(proxyUrl: string | undefined): void {
  const rawBase =
    proxyUrl && typeof proxyUrl === 'string' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(proxyUrl.replace(/\/$/, ''))
      ? proxyUrl.replace(/\/?$/, '/')
      : proxyUrl;
  setModelBaseUrl(rawBase);
  let base = getModelBaseUrl();
  // Use same-origin proxy path in worker so Vite forwards to 8080 (avoids CORS).
  const useViteProxy =
    typeof self !== 'undefined' &&
    self.location &&
    (base.startsWith('http://localhost:8080') || base.startsWith('http://127.0.0.1:8080'));
  if (useViteProxy) {
    base = self.location.origin + '/voice-models/';
    setModelBaseUrl(base);
  }
  env.remoteHost = base;
  const useLocalProxy =
    base !== 'https://huggingface.co/' &&
    (base.startsWith('http://localhost') || base.startsWith('http://127.0.0.1') || base.startsWith('https://') || base.startsWith('/'));
  if (useLocalProxy) {
    env.allowRemoteModels = false;
    env.allowLocalModels = true;
    env.localModelPath = base;
  } else {
    env.allowLocalModels = false;
    env.allowRemoteModels = true;
  }
}

/** Ensure we never fetch with empty/same-origin base (would return index.html → JSON parse error). */
function ensureRemoteHost(): void {
  if (env.localModelPath && env.allowLocalModels) return; // already using proxy as local path
  const h = env.remoteHost;
  if (!h || h.startsWith('/') || !/^https?:\/\//i.test(h)) {
    env.remoteHost = 'https://huggingface.co/';
    setModelBaseUrl(undefined);
  }
}

// Use main-thread proxy URL when sent via CONFIG; else fallback to worker's import.meta.env (may be empty in worker bundle).
const workerEnvProxy =
  typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: { VITE_TTS_MODEL_PROXY_URL?: string } }).env?.VITE_TTS_MODEL_PROXY_URL;
setRemoteHost(workerEnvProxy);

// ASR pipeline accepts decoded Float32Array; AudioContext is not available in workers.
type AsrPipeline = (
  input: Float32Array,
  options?: { chunk_length_s?: number; stride_length_s?: number },
) => Promise<{ text?: string } | string>;

type KokoroTTSInstance = import('kokoro-js').KokoroTTS;
let kokoroTts: KokoroTTSInstance | null = null;
let kokoroLoadPromise: Promise<KokoroTTSInstance> | null = null;
let sttPipeline: AsrPipeline | null = null;

// British female default (bf_lily). Overridden by CONFIG.voice from main thread.
const defaultTtsVoice =
  typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: { VITE_TTS_VOICE?: string } }).env?.VITE_TTS_VOICE;
let ttsVoice: string = defaultTtsVoice && typeof defaultTtsVoice === 'string' ? defaultTtsVoice : 'bf_lily';

async function getKokoroTts(): Promise<KokoroTTSInstance> {
  if (kokoroTts) {
    self.postMessage({ type: 'VOICE_FETCH_DEBUG', url: '(Kokoro cached)', rewritten: null });
    return kokoroTts;
  }
  if (!kokoroLoadPromise) {
    self.postMessage({ type: 'VOICE_FETCH_DEBUG', url: '(Kokoro loading from ' + (env.localModelPath || env.remoteHost || 'hub') + ')', rewritten: null });
    const { KokoroTTS } = await import('kokoro-js');
    kokoroLoadPromise = KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
      dtype: 'q8', // model_uint8.onnx (177 MB); q4 is larger in this repo. Keeps good quality and faster than fp32.
      device: 'wasm',
      progress_callback: (info: { status?: string; progress?: number }) => {
        if (info?.status === 'progress' && typeof info.progress === 'number') {
          self.postMessage({ type: 'PREWARM_PROGRESS', progress: info.progress });
        }
      },
    }).then((tts) => {
      kokoroTts = tts;
      return tts;
    }).catch((err) => {
      kokoroLoadPromise = null;
      throw err;
    });
  }
  return kokoroLoadPromise;
}

/** Whisper ASR pipeline. Console may show "dtype not specified for encoder_model/decoder_model_merged" — expected from ONNX runtime, safe to ignore. */
async function getAsrPipeline(): Promise<AsrPipeline> {
  if (!sttPipeline) {
    sttPipeline = (await (pipeline as (task: string, model: string) => Promise<unknown>)(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny.en',
    )) as unknown as AsrPipeline;
  }
  return sttPipeline;
}

self.addEventListener('message', async (event: MessageEvent) => {
  const msg = event.data as {
    type: string;
    id?: number;
    text?: string;
    proxyUrl?: string;
    voice?: string;
    audioData?: Float32Array;
  };

  const { type, id } = msg;

  // ── CONFIG (must run before any model load so fetches use correct base URL) ─
  if (type === 'CONFIG') {
    setRemoteHost(msg.proxyUrl);
    if (typeof msg.voice === 'string' && msg.voice) ttsVoice = msg.voice;
    self.postMessage({ type: 'VOICE_FETCH_DEBUG', url: '(config)', rewritten: getModelBaseUrl() });
    return;
  }

  // ── PREWARM ──────────────────────────────────────────────────────────────
  if (type === 'PREWARM') {
    ensureRemoteHost();
    try {
      await getKokoroTts();
      self.postMessage({ type: 'PREWARM_DONE' });
    } catch (error) {
      self.postMessage({ type: 'PREWARM_ERROR', error: String(error) });
    }
    return;
  }

  // ── TTS (full generate: one continuous clip, no gaps between sentences)
  if (type === 'TTS' && typeof id === 'number' && typeof msg.text === 'string') {
    try {
      const tts = await getKokoroTts();
      const result = await tts.generate(msg.text, { voice: ttsVoice as keyof typeof import('kokoro-js').VOICES, speed: 1 });
      if (!result.audio || result.audio.length === 0) {
        self.postMessage({ type: 'ERROR', id, error: 'No audio from TTS' });
        return;
      }
      const audioOut = new Float32Array(result.audio);
      self.postMessage(
        { type: 'TTS_CHUNK', id, chunkIndex: 0, audio: audioOut, samplingRate: result.sampling_rate },
        { transfer: [audioOut.buffer] },
      );
      self.postMessage({ type: 'TTS_STREAM_END', id, chunkCount: 1 });
    } catch (error) {
      self.postMessage({ type: 'ERROR', id, error: String(error) });
    }
    return;
  }

  // ── STT ──────────────────────────────────────────────────────────────────
  if (type === 'STT' && typeof id === 'number' && msg.audioData instanceof Float32Array) {
    ensureRemoteHost();
    try {
      const asr = await getAsrPipeline();
      // Audio is already decoded to Float32Array on the main thread (no AudioContext needed here).
      const result = await asr(msg.audioData, { chunk_length_s: 30, stride_length_s: 5 });
      const transcribed =
        typeof result === 'object' && result !== null && 'text' in result
          ? String((result as { text: string }).text).trim()
          : String(result).trim();
      self.postMessage({ type: 'STT_RESULT', id, text: transcribed || '' });
    } catch (error) {
      self.postMessage({ type: 'ERROR', id, error: String(error) });
    }
    return;
  }
});
