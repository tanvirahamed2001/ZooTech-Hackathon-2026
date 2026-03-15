/**
 * web-ai-engine.ts — Main-thread bridge to the voice Web Worker.
 *
 * All model inference (Kokoro TTS, Whisper STT) runs inside voice.worker.ts.
 * This module handles:
 *   - Worker lifecycle management
 *   - Posting requests and resolving promises from worker responses
 *   - Audio playback (AudioContext, AudioBufferSourceNode)
 *   - Browser speech-synthesis fallback
 */

// Vite worker import — bundled as a separate chunk so the main bundle stays small
import VoiceWorker from './voice.worker.ts?worker';

// ────────────────────────────────────────────────────────────────────────────
// Worker management
// ────────────────────────────────────────────────────────────────────────────

let worker: Worker | null = null;
let pendingId = 0;

type PendingResolve = (value: unknown) => void;
type PendingReject = (reason?: unknown) => void;

const pending = new Map<number, { resolve: PendingResolve; reject: PendingReject }>();

function getProxyUrl(): string | undefined {
  const env = typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: { VITE_TTS_MODEL_PROXY_URL?: string } }).env;
  const u = env?.VITE_TTS_MODEL_PROXY_URL;
  return u && typeof u === 'string' ? u : undefined;
}

/** Kokoro TTS voice: British female default (bf_lily). Override with VITE_TTS_VOICE. */
function getTtsVoice(): string {
  const env = typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: { VITE_TTS_VOICE?: string } }).env;
  const v = env?.VITE_TTS_VOICE;
  return v && typeof v === 'string' ? v : 'bf_lily';
}

function sendWorkerConfig(): void {
  getWorker().postMessage({ type: 'CONFIG', proxyUrl: getProxyUrl(), voice: getTtsVoice() });
}

function getWorker(): Worker {
  if (!worker) {
    worker = new VoiceWorker();
    worker.addEventListener('message', onWorkerMessage);
    worker.addEventListener('error', (e) => {
      console.error('[voice worker]', e.message);
    });
    // Always send CONFIG so worker never uses empty/same-origin base (avoids index.html → "Unexpected token '<'").
    sendWorkerConfig();
  }
  return worker;
}

let prewarmOnProgress: ((progress: number) => void) | null = null;

function onWorkerMessage(event: MessageEvent) {
  const { type, id, audio, samplingRate, text, error, progress, url, rewritten } = event.data as {
    type: string;
    id?: number;
    audio?: Float32Array;
    samplingRate?: number;
    text?: string;
    error?: string;
    progress?: number;
    url?: string;
    rewritten?: string | null;
  };

  if (type === 'VOICE_FETCH_DEBUG' && url !== undefined) {
    if (url === '(config)') {
      console.log('[voice] base URL set to:', rewritten ?? 'https://huggingface.co/');
    } else if (url === '(patch applied)') {
      console.log('[voice] fetch/XHR patch applied (worker ready)');
    } else if (url === '(Kokoro cached)') {
      console.log('[voice] TTS model already in memory (using cache)');
    } else if (url.startsWith('(Kokoro loading from ')) {
      console.log('[voice]', url.replace('(Kokoro loading from ', 'TTS model loading from ').replace(/\)$/, ''));
    } else if (rewritten && /huggingface\.co/i.test(url)) {
      console.log('[voice] using local model (rewrote hub URL):', rewritten);
    } else {
      console.log('[voice] fetch:', url, rewritten ? `→ ${rewritten}` : '(no rewrite)');
    }
    return;
  }

  if (type === 'PREWARM_PROGRESS' && typeof progress === 'number') {
    prewarmOnProgress?.(progress);
    return;
  }

  if (type === 'PREWARM_DONE') {
    prewarmOnProgress = null;
    for (const { resolve } of pending.values()) resolve(undefined);
    pending.clear();
    return;
  }

  if (type === 'PREWARM_ERROR') {
    prewarmOnProgress = null;
    for (const { reject } of pending.values()) reject(new Error(error ?? 'prewarm failed'));
    pending.clear();
    return;
  }

  // ── TTS streaming (chunks: play first sentence while rest generate)
  if (type === 'TTS_CHUNK' && id !== undefined && ttsStreamState && ttsStreamState.id === id) {
    const chunk = event.data as { id: number; chunkIndex: number; audio: Float32Array; samplingRate: number };
    ttsStreamState.chunkQueue.push({ audio: chunk.audio, samplingRate: chunk.samplingRate });
    if (ttsStreamState.chunkQueue.length === 1) {
      ttsStreamState.onPlaybackStart?.();
      playNextTtsChunk();
    }
    return;
  }
  if (type === 'TTS_STREAM_END' && id !== undefined && ttsStreamState && ttsStreamState.id === id) {
    ttsStreamState.streamEnded = true;
    if (ttsStreamState.chunkQueue.length === 0 && !ttsStreamState.playing) {
      ttsStreamState.resolve();
      ttsStreamState.reject = null;
      ttsStreamState = null;
    }
    return;
  }
  if (type === 'ERROR' && id !== undefined && ttsStreamState && ttsStreamState.id === id) {
    ttsStreamState.reject?.(new Error(error ?? 'worker error'));
    ttsStreamState = null;
    return;
  }

  if (id === undefined) return;
  const waiter = pending.get(id);
  if (!waiter) return;
  pending.delete(id);

  if (type === 'TTS_RESULT' && audio && samplingRate) {
    waiter.resolve({ audio, samplingRate });
  } else if (type === 'STT_RESULT') {
    waiter.resolve(text ?? '');
  } else if (type === 'ERROR') {
    waiter.reject(new Error(error ?? 'worker error'));
  }
}

type TtsStreamState = {
  id: number;
  resolve: () => void;
  reject: (err: Error) => void;
  onPlaybackStart?: () => void;
  chunkQueue: Array<{ audio: Float32Array; samplingRate: number }>;
  streamEnded: boolean;
  playing: boolean;
};
let ttsStreamState: TtsStreamState | null = null;

function playNextTtsChunk(): void {
  if (!ttsStreamState || ttsStreamState.chunkQueue.length === 0) {
    if (ttsStreamState) ttsStreamState.playing = false;
    if (ttsStreamState?.streamEnded && ttsStreamState.chunkQueue.length === 0) {
      ttsStreamState.resolve();
      ttsStreamState.reject = null;
      ttsStreamState = null;
    }
    return;
  }
  const { audio, samplingRate } = ttsStreamState.chunkQueue.shift()!;
  ttsStreamState.playing = true;
  playAudioBuffer(audio, samplingRate)
    .then(() => {
      playNextTtsChunk();
    })
    .catch((err) => {
      if (ttsStreamState) {
        ttsStreamState.playing = false;
        ttsStreamState.reject?.(err instanceof Error ? err : new Error(String(err)));
        ttsStreamState = null;
      }
    });
}

function workerRpc<T>(message: Record<string, unknown>, transfer?: Transferable[]): Promise<T> {
  const id = ++pendingId;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as PendingResolve, reject });
    const w = getWorker();
    sendWorkerConfig(); // ensure base URL is set before TTS/STT model fetch
    if (transfer && transfer.length > 0) {
      w.postMessage({ ...message, id }, { transfer });
    } else {
      w.postMessage({ ...message, id });
    }
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Public API — prewarm (idempotent: safe to call multiple times; loading starts once)
// ────────────────────────────────────────────────────────────────────────────

let prewarmPromise: Promise<void> | null = null;
let backendChecked: Promise<boolean> | null = null;

function isBackendAvailable(): Promise<boolean> {
  if (!backendChecked) {
    const base = backendBase();
    if (!base) {
      backendChecked = Promise.resolve(false);
    } else {
      backendChecked = fetch(`${base}/api/voice/health`)
        .then((r) => r.ok && r.json().then((d: { ok?: boolean }) => d?.ok === true))
        .catch(() => false);
    }
  }
  return backendChecked;
}

export type PrewarmOptions = { onProgress?: (progress: number) => void };

export function prewarmVoiceTts(options?: PrewarmOptions): Promise<void> {
  if (!prewarmPromise) {
    prewarmPromise = isBackendAvailable().then(async (useBackend) => {
      if (useBackend) return;
      prewarmOnProgress = options?.onProgress ?? null;
      await new Promise<void>((resolve, reject) => {
        pending.set(-1, { resolve: resolve as PendingResolve, reject });
        const w = getWorker();
        sendWorkerConfig(); // ensure base URL is set before any model fetch
        w.postMessage({ type: 'PREWARM' });
      });
    });
  }
  return prewarmPromise;
}

// ────────────────────────────────────────────────────────────────────────────
// Backend voice (OpenAI TTS + Whisper) — only when explicitly set (no OpenAI = don't try backend)
// ────────────────────────────────────────────────────────────────────────────

function backendBase(): string {
  const u = typeof import.meta !== 'undefined' && import.meta.env?.VITE_VOICE_BACKEND_URL;
  if (u === undefined || u === false || u === '') return '';
  return String(u).replace(/\/$/, '');
}

async function speakWebViaBackend(text: string, onPlaybackStart?: () => void): Promise<void> {
  const base = backendBase();
  if (!base) throw new Error('Backend not configured');
  const r = await fetch(`${base}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!r.ok) throw new Error(`TTS: ${r.status}`);
  const arrayBuffer = await r.arrayBuffer();
  const ctx = getAudioContext();
  const buf = await ctx.decodeAudioData(arrayBuffer.slice(0));
  const data = buf.getChannelData(0);
  const rate = buf.sampleRate;
  onPlaybackStart?.();
  await playAudioBuffer(new Float32Array(data), rate);
}

async function transcribeWebViaBackend(audioBlob: Blob): Promise<string> {
  const base = backendBase();
  if (!base) throw new Error('Backend not configured');
  const form = new FormData();
  form.append('file', audioBlob, 'audio.webm');
  const r = await fetch(`${base}/api/stt`, { method: 'POST', body: form });
  if (!r.ok) throw new Error(`STT: ${r.status}`);
  const data = (await r.json()) as { text?: string };
  return data?.text ?? '';
}

// ────────────────────────────────────────────────────────────────────────────
// Web Speech API — optional fast path (browser does STT while user speaks)
// ────────────────────────────────────────────────────────────────────────────

const SpeechRecognitionAPI =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);

let webSpeechRecognition: InstanceType<typeof window.SpeechRecognition> | null = null;
let webSpeechResolve: ((value: string | null) => void) | null = null;

export function isWebSpeechRecognitionAvailable(): boolean {
  return !!SpeechRecognitionAPI;
}

/** Call when user starts holding the mic. Starts browser speech recognition for near-instant transcript on release. */
export function startWebSpeechCapture(): void {
  if (!SpeechRecognitionAPI || webSpeechRecognition) return;
  try {
    const Recognition = SpeechRecognitionAPI as new () => InstanceType<typeof window.SpeechRecognition>;
    const rec = new Recognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const t = e.results[0]?.[0]?.transcript;
      if (webSpeechResolve && typeof t === 'string') {
        webSpeechResolve(t.trim());
        webSpeechResolve = null;
      }
    };
    rec.onend = () => {
      if (webSpeechResolve) {
        webSpeechResolve(null);
        webSpeechResolve = null;
      }
      webSpeechRecognition = null;
    };
    rec.onerror = () => {
      if (webSpeechResolve) {
        webSpeechResolve(null);
        webSpeechResolve = null;
      }
      webSpeechRecognition = null;
    };
    webSpeechRecognition = rec;
    webSpeechResolve = null;
    rec.start();
  } catch {
    webSpeechRecognition = null;
    webSpeechResolve = null;
  }
}

/** Call when user releases the mic. Returns a Promise that resolves with the transcript or null. */
export function stopWebSpeechCaptureAndGetTranscript(): Promise<string | null> {
  if (!webSpeechRecognition) return Promise.resolve(null);
  const rec = webSpeechRecognition;
  webSpeechRecognition = null;
  const p = new Promise<string | null>((resolve) => {
    webSpeechResolve = resolve;
  });
  try {
    rec.stop();
  } catch {
    if (webSpeechResolve) {
      webSpeechResolve(null);
      webSpeechResolve = null;
    }
    return Promise.resolve(null);
  }
  return p;
}

// ────────────────────────────────────────────────────────────────────────────
// Public API — STT (backend first, then worker)
// ────────────────────────────────────────────────────────────────────────────

export async function transcribeWeb(audioBlob: Blob): Promise<string> {
  if (backendBase()) {
    try {
      return await transcribeWebViaBackend(audioBlob);
    } catch {
      // fallback to worker
    }
  }
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioCtx = new AudioContext({ sampleRate: 16000 });
  let audioData: Float32Array;
  try {
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    const offlineCtx = new OfflineAudioContext(1, Math.round(decoded.duration * 16000), 16000);
    const src = offlineCtx.createBufferSource();
    src.buffer = decoded;
    src.connect(offlineCtx.destination);
    src.start(0);
    const resampled = await offlineCtx.startRendering();
    audioData = resampled.getChannelData(0);
  } catch (decodeErr) {
    await audioCtx.close();
    const msg = decodeErr instanceof Error ? decodeErr.message : String(decodeErr);
    throw new Error(`Unable to decode recording (${msg}). Try speaking a bit longer or use the "Stop recording" button.`);
  }
  await audioCtx.close();
  const id = ++pendingId;
  const audioDataCopy = new Float32Array(audioData);
  return new Promise<string>((resolve, reject) => {
    pending.set(id, { resolve: resolve as PendingResolve, reject });
    getWorker().postMessage(
      { type: 'STT', id, audioData: audioDataCopy },
      { transfer: [audioDataCopy.buffer] },
    );
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Main-thread audio playback
// ────────────────────────────────────────────────────────────────────────────

let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentResolve: (() => void) | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentPregeneratedAudio: HTMLAudioElement | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/** Call on user gesture (e.g. click "Play") so playback works after async TTS. */
export function resumeAudioForPlayback(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') return ctx.resume();
  return Promise.resolve();
}

function playAudioBuffer(audio: Float32Array, samplingRate: number): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    return ctx.resume().then(() => playAudioBuffer(audio, samplingRate));
  }
  const buffer = ctx.createBuffer(1, audio.length, samplingRate);
  buffer.copyToChannel(new Float32Array(audio), 0);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  currentSource = src;
  return new Promise<void>((resolve, reject) => {
    currentResolve = resolve;
    src.onended = () => {
      currentSource = null;
      currentResolve = null;
      resolve();
    };
    try {
      src.start();
    } catch (err) {
      currentSource = null;
      currentResolve = null;
      reject(err instanceof Error ? err : new Error('Audio playback failed'));
    }
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Public API — stop all playback
// ────────────────────────────────────────────────────────────────────────────

export function stopSpeechPlayback(): void {
  if (ttsStreamState) {
    ttsStreamState.chunkQueue.length = 0;
    ttsStreamState.resolve();
    ttsStreamState.reject = null;
    ttsStreamState = null;
  }
  if (currentPregeneratedAudio) {
    try {
      currentPregeneratedAudio.pause();
      currentPregeneratedAudio.currentTime = 0;
    } catch {
      // ignore
    }
    currentPregeneratedAudio = null;
  }
  if (currentUtterance) {
    currentUtterance.onend = null;
    currentUtterance.onerror = null;
    currentUtterance = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('speechSynthesis.cancel error:', e);
    }
  }
  if (currentSource) {
    try {
      currentSource.stop();
      currentSource.disconnect();
    } catch {
      // already stopped
    }
    currentSource = null;
  }
  if (currentResolve) {
    currentResolve();
    currentResolve = null;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Public API — browser speech fallback
// ────────────────────────────────────────────────────────────────────────────

export function speakWithBrowserFallback(
  text: string,
  voice?: SpeechSynthesisVoice | null,
  onEnd?: () => void,
): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    throw new Error('Browser speech synthesis is unavailable');
  }
  stopSpeechPlayback();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.92;
  utterance.pitch = 1;
  if (voice) utterance.voice = voice;
  currentUtterance = utterance;
  utterance.onend = () => {
    if (currentUtterance === utterance) currentUtterance = null;
    onEnd?.();
  };
  utterance.onerror = () => {
    if (currentUtterance === utterance) currentUtterance = null;
    onEnd?.();
  };
  window.speechSynthesis.speak(utterance);
}

// ────────────────────────────────────────────────────────────────────────────
// Public API — pregenerated (instant) and TTS (backend → worker streaming)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Start Q1 (or any index) pregenerated WAV in the same synchronous turn as a user click.
 * Browsers only allow audio.play() without blocking if invoked directly from the gesture; awaiting fetch breaks that.
 */
export function playPregeneratedQuestionFromUserGesture(questionIndex: number): void {
  if (!Number.isInteger(questionIndex) || questionIndex < 0 || typeof window === 'undefined') return;
  const url = `/quiz-audio/q${questionIndex}.wav`;
  try {
    stopSpeechPlayback();
    const audio = new Audio(url);
    currentPregeneratedAudio = audio;
    const cleanup = () => {
      if (currentPregeneratedAudio === audio) currentPregeneratedAudio = null;
      audio.removeEventListener('ended', cleanup);
      audio.removeEventListener('error', onErr);
    };
    const onErr = () => cleanup();
    audio.addEventListener('ended', cleanup);
    audio.addEventListener('error', onErr);
    void audio.play().catch(onErr);
  } catch {
    /* no-op */
  }
}

/**
 * Play pregenerated WAV for question index if available. Returns true if played, false otherwise.
 * Uses an <audio> element so playback works after async fetch (no AudioContext suspend issues).
 */
export async function playPregeneratedQuestion(
  questionIndex: number,
  onPlaybackStart?: () => void,
): Promise<boolean> {
  if (!Number.isInteger(questionIndex) || questionIndex < 0) return false;
  const url = `/quiz-audio/q${questionIndex}.wav`;
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    return new Promise<boolean>((resolve) => {
      const audio = new Audio(blobUrl);
      currentPregeneratedAudio = audio;
      const cleanup = () => {
        if (currentPregeneratedAudio === audio) currentPregeneratedAudio = null;
        URL.revokeObjectURL(blobUrl);
        audio.removeEventListener('ended', onEnd);
        audio.removeEventListener('error', onErr);
      };
      const onEnd = () => {
        cleanup();
        resolve(true);
      };
      const onErr = () => {
        cleanup();
        resolve(false);
      };
      audio.addEventListener('ended', onEnd);
      audio.addEventListener('error', onErr);
      onPlaybackStart?.();
      audio.play().then(() => {}, onErr);
    });
  } catch {
    return false;
  }
}

/**
 * Play pregenerated "Got it" WAV if available (/quiz-audio/got-it.wav). Returns true if played.
 * Use for audible confirmation before advancing to next question.
 */
export async function playPregeneratedConfirmation(): Promise<boolean> {
  const url = '/quiz-audio/got-it.wav';
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    return new Promise<boolean>((resolve) => {
      const audio = new Audio(blobUrl);
      currentPregeneratedAudio = audio;
      const cleanup = () => {
        if (currentPregeneratedAudio === audio) currentPregeneratedAudio = null;
        URL.revokeObjectURL(blobUrl);
        audio.removeEventListener('ended', onEnd);
        audio.removeEventListener('error', onErr);
      };
      const onEnd = () => { cleanup(); resolve(true); };
      const onErr = () => { cleanup(); resolve(false); };
      audio.addEventListener('ended', onEnd);
      audio.addEventListener('error', onErr);
      audio.play().then(() => {}, onErr);
    });
  } catch {
    return false;
  }
}

/** Play a short success beep (last-resort when no TTS/pregen works). Returns when done. */
export function playConfirmationBeep(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  return new Promise((resolve) => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) {
        resolve();
        return;
      }
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
      setTimeout(() => {
        ctx.close();
        resolve();
      }, 250);
    } catch {
      resolve();
    }
  });
}

/** Strip markdown emphasis (*, _, **, __) so TTS doesn't read "asterisk really asterisk". */
export function stripMarkdownForTts(text: string): string {
  return text
    .replace(/\*+/g, '')
    .replace(/_+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

type SpeakWebOptions = {
  onPlaybackStart?: () => void;
};

export async function speakWeb(text: string, options: SpeakWebOptions = {}): Promise<void> {
  if (backendBase()) {
    try {
      await speakWebViaBackend(text, options.onPlaybackStart);
      return;
    } catch {
      // fallback to worker
    }
  }
  const id = ++pendingId;
  await new Promise<void>((resolve, reject) => {
    ttsStreamState = {
      id,
      resolve,
      reject,
      onPlaybackStart: options.onPlaybackStart,
      chunkQueue: [],
      streamEnded: false,
      playing: false,
    };
    const w = getWorker();
    sendWorkerConfig();
    w.postMessage({ type: 'TTS', id, text });
  });
  ttsStreamState = null;
}
