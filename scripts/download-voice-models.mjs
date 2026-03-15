#!/usr/bin/env node
/**
 * One-time download of Kokoro TTS + Whisper STT models to ./local-models/
 * so the app can load from disk (no OpenAI, no HF after first run).
 *
 * Run: node scripts/download-voice-models.mjs
 * Then: npm run serve-models  (in another terminal)
 * Set in .env: VITE_TTS_MODEL_PROXY_URL=http://localhost:8080
 *
 * Requires Node 18+ (fetch).
 */

import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'local-models');

const REPOS = [
  {
    id: 'onnx-community/Kokoro-82M-v1.0-ONNX',
    revision: 'main',
    // q8 model (library expects onnx/model_quantized.onnx for dtype q8) + voice we use (af_heart)
    files: [
      'config.json',
      'tokenizer.json',
      'tokenizer_config.json',
      'onnx/model_quantized.onnx',
      'voices/af_heart.bin',
    ],
  },
  {
    id: 'Xenova/whisper-tiny.en',
    revision: 'main',
    // Minimal set for ASR pipeline (quantized encoder + decoder)
    files: [
      'config.json',
      'tokenizer.json',
      'tokenizer_config.json',
      'generation_config.json',
      'preprocessor_config.json',
      'special_tokens_map.json',
      'added_tokens.json',
      'merges.txt',
      'vocab.json',
      'normalizer.json',
      'quant_config.json',
      'quantize_config.json',
      'onnx/encoder_model_quantized.onnx',
      'onnx/decoder_model_merged_quantized.onnx',
      'onnx/decoder_with_past_model_quantized.onnx',
    ],
  },
];

async function downloadFile(repoId, revision, filePath) {
  const url = `https://huggingface.co/${repoId}/resolve/${revision}/${filePath}`;
  const outPath = path.join(OUT_DIR, repoId, 'resolve', revision, filePath);
  const flatPath = path.join(OUT_DIR, repoId, filePath); // hub localModelPath expects repoId/filePath
  await mkdir(path.dirname(outPath), { recursive: true });
  await mkdir(path.dirname(flatPath), { recursive: true });
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(outPath, buf);
  await writeFile(flatPath, buf);
  return outPath;
}

async function main() {
  console.log('Downloading voice models to', OUT_DIR, '...\n');
  await mkdir(OUT_DIR, { recursive: true });

  for (const repo of REPOS) {
    console.log('Repo:', repo.id);
    for (const filePath of repo.files) {
      try {
        const out = await downloadFile(repo.id, repo.revision, filePath);
        console.log('  ✓', filePath);
      } catch (e) {
        console.error('  ✗', filePath, e.message);
      }
    }
    console.log('');
  }

  console.log('Done. Next steps:');
  console.log('  1. npm run serve-models   (serve local-models on port 8080)');
  console.log('  2. In .env set: VITE_TTS_MODEL_PROXY_URL=http://localhost:8080');
  console.log('  3. npm run dev');
}

main().catch((e) => { console.error(e); process.exit(1); });
