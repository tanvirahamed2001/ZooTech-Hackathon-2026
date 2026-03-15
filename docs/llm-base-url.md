# OpenAI-compatible LLM base URL (voice quiz)

This document describes how to wire **VITE_LLM_BASE_URL** to an OpenAI-compatible chat endpoint (VARK mapping from speech). **Do not commit real deployment URLs**—treat the base URL like an API key: `.env` (gitignored) or internal runbooks only.

Replace `{BASE_URL}` below with your team’s host (path must end with `/v1` as used by the app).

---

## Why this pattern

The voice quiz can call a small LLM over an OpenAI-compatible API instead of OpenRouter. The **exact host is not listed in this repo**.

---

## App configuration

1. In `.env` (never committed):
   ```bash
   VITE_LLM_BASE_URL=https://your-host.example/v1
   ```
2. Prefer leaving `VITE_OPENROUTER_API_KEY` unset when using this path.
3. Restart `npm run dev`. Flow: `vark-mapper.ts` → `llm-client.ts` → `POST .../chat/completions`.

---

## API shape (generic)

**POST `{BASE_URL}/chat/completions`** — same request shape as OpenAI (model, messages, `stream: false`).

---

## Security

- Set **`VITE_LLM_BASE_URL`** in `.env` only.
- Do not paste production URLs into README, issues, or screenshots.
