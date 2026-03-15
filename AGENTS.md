# AGENTS.md — ZooTech Hackathon 2026

Durable workspace facts and correction patterns for agents (Cursor, Cline, and other harnesses).

---

## Learned User Preferences

- Voice interaction for the demo should sound natural and have as low latency as possible.
- Provide an explicit way to stop playback (e.g. Esc key or Stop button); stop must work reliably.
- User adds API keys (e.g. OpenRouter) manually to `.env`; provide example/placeholder config only.
- Voice TTS/STT should work without OpenAI; prefer local models (e.g. Kokoro, Whisper) or optional minimal backend; user does not want OpenAI dependency for voice.

---

## Learned Workspace Facts

- Canonical memory bank is the Cline-origin asset: `.cline/memory-bank/` under the repo root (not `memory-bank/` at root or a generic docs file).
- Memory bank schema: exactly five files — `00_project-brief.md`, `01_current-goal.md`, `02_decisions.md`, `03_progress-log.md`, `04_open-questions.md`. File names and structure come from the user's global Cline rules (e.g. `Documents/Cline/Rules/01-memory-bank.md`), not from public Cline docs or other templates.
- Do not invent or reuse a different memory-bank file set (e.g. `projectbrief.md`, `activeContext.md`, `progress.md`); that schema is wrong for this workspace.
- The voice folder (e.g. `@/Users/jj/voice/`) is for project assistance only; it is not part of the repo and must not be added to git tracking.
- App is frontend-only demo: no database, no email capture, no persistent data. Voice response mapping (VARK from transcript) uses VITE_LLM_BASE_URL (e.g. ChatJimmy proxy) or OpenRouter; no OpenAI required for TTS/STT when using local models.
- Implementation base for team work is the teammate's fork (e.g. `aibraincoach/ZooTech-Hackathon-2026`); work on a branch of that fork and pull from fork/main as needed.
- When working with collaborators, avoid large or breaking changes to shared code where possible; some code cannot be changed freely.
- Voice quiz route: `/quiz/voice`. Kokoro default voice **`bf_lily`** (`VITE_TTS_VOICE`). First-question audio starts on **Start voice quiz**; StrictMode must not stop that clip on remount (see `VoiceQuizQuestions` cleanup). Handover: `docs/handover-voice-quiz-bugfixing.md`. Memory bank: `.cline/memory-bank/` (often gitignored—update locally).
