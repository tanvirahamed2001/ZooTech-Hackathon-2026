#!/usr/bin/env npx tsx
/**
 * Pre-generate WAV audio for each voice quiz question so "Play" is instant.
 *
 * Prereqs:
 *   1. npm run download-voice-models
 *   2. npm run serve-models   (in another terminal; serves local-models on :8080)
 *
 * Run: npm run pregenerate-quiz-audio
 *
 * Writes: public/quiz-audio/q0.wav, q1.wav, ... (one per question index).
 * The app will use these when available and skip live TTS.
 */

import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
// @ts-expect-error no types for kokoro-js
import { KokoroTTS } from 'kokoro-js';
import { env } from '@huggingface/transformers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'quiz-audio');
const MODEL_BASE = 'http://localhost:8080/';

// Strip markdown emphasis so TTS doesn't say "asterisk really asterisk". Must match app's stripMarkdownForTts.
function stripMarkdownForTts(text: string): string {
  return text
    .replace(/\*+/g, '')
    .replace(/_+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Same TTS text as the app: scenario (stripped) + " Answer in your own words."
function getTtsText(scenario: string): string {
  return `${stripMarkdownForTts(scenario)} Answer in your own words.`;
}

async function main() {
  console.log('Pre-generating quiz audio (model from', MODEL_BASE, ')…\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  const check = await fetch(`${MODEL_BASE}onnx-community/Kokoro-82M-v1.0-ONNX/config.json`, {
    signal: controller.signal,
  }).catch(() => null);
  clearTimeout(timeout);
  if (!check?.ok) {
    console.error('Models server not reachable at', MODEL_BASE);
    console.error('Start it first: npm run serve-models (in another terminal)\n');
    process.exit(1);
  }

  const { questions } = await import('../src/data/questions.ts');
  await mkdir(OUT_DIR, { recursive: true });

  env.remoteHost = MODEL_BASE;
  env.allowRemoteModels = true;
  env.allowLocalModels = false;

  const ttsVoice = process.env.VITE_TTS_VOICE || 'bf_lily';
  console.log('TTS voice:', ttsVoice, '\n');

  const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
    dtype: 'q8',
    device: 'cpu',
    progress_callback: (info: { status?: string; progress?: number }) => {
      if (info?.status === 'progress' && typeof info.progress === 'number') {
        process.stdout.write(`  Loading model… ${Math.round(info.progress)}%\r`);
      }
    },
  });
  console.log('Model loaded.\n');

  for (let i = 0; i < questions.length; i++) {
    const text = getTtsText(questions[i].scenario);
    process.stdout.write(`Question ${i + 1}/${questions.length}… `);
    const raw = await tts.generate(text, { voice: ttsVoice as keyof typeof import('kokoro-js').VOICES, speed: 1 });
    const wav = raw.toWav();
    const outPath = path.join(OUT_DIR, `q${i}.wav`);
    await writeFile(outPath, Buffer.from(wav));
    console.log(outPath);
  }

  process.stdout.write('Confirmation got-it.wav… ');
  const gotItRaw = await tts.generate('Got it.', { voice: ttsVoice as keyof typeof import('kokoro-js').VOICES, speed: 1 });
  const gotItWav = gotItRaw.toWav();
  await writeFile(path.join(OUT_DIR, 'got-it.wav'), Buffer.from(gotItWav));
  console.log(path.join(OUT_DIR, 'got-it.wav'));

  console.log('\nDone. Audio files in public/quiz-audio/');
  console.log('Play in the app will use these when available.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
