# AGENTS.md — ZooTech Hackathon 2026

Durable workspace facts and correction patterns for agents (Cursor, Cline, and other harnesses).

---

## Learned User Preferences

- Voice interaction for the demo should sound natural and have as low latency as possible.
- Provide an explicit way to stop playback (e.g. Esc key or Stop button); stop must work reliably.
- Support both on-screen and keyboard-driven mic control where it improves the voice flow (e.g. hold-to-speak in addition to UI buttons).
- User adds API keys (e.g. OpenRouter) manually to `.env`; provide example/placeholder config only.
- Voice TTS/STT should work without OpenAI; prefer local models (e.g. Kokoro, Whisper) or optional minimal backend; user does not want OpenAI dependency for voice.
- Voice answers should map from natural speech to the closest VARK options for each question, including multiple option IDs when the wording spans more than one style (additive VARK scoring, same idea as multi-select on the text quiz).

---

## Learned Workspace Facts

- Canonical memory bank is the Cline-origin asset: `.cline/memory-bank/` under the repo root (not `memory-bank/` at root or a generic docs file). Schema is exactly five files — `00_project-brief.md`, `01_current-goal.md`, `02_decisions.md`, `03_progress-log.md`, `04_open-questions.md` — per the user’s global Cline rules; do not substitute other file names (e.g. `projectbrief.md`, `activeContext.md`).
- The voice folder at `@/Users/jj/voice/` is for project assistance only; it is not inside the repo and must not be git-tracked.
- App is frontend-only demo: no database, no email capture, no persistent quiz data. Voice VARK mapping uses `VITE_OPENROUTER_API_KEY` and/or team-only `VITE_LLM_BASE_URL` (never commit real proxy hosts). No OpenAI required for TTS/STT when using local models.
- Implementation base for team work is the teammate’s fork (e.g. `aibraincoach/ZooTech-Hackathon-2026`); work on a branch of that fork and pull from fork/main as needed.
- When working with collaborators, avoid large or breaking changes to shared code where possible; some code cannot be changed freely.
- Voice quiz route: `/quiz/voice`. Register it in the router before `/quiz` so `/quiz/voice` matches correctly. Lazy-load the voice quiz chunk so the landing page is not blocked by large TTS/STT bundles.
- Kokoro default voice **`bf_lily`** (`VITE_TTS_VOICE`). First-question audio starts on **Start voice quiz**; StrictMode must not stop that clip on remount (see `VoiceQuizQuestions` cleanup). Handover: `docs/handover-voice-quiz-bugfixing.md`. `.cline/memory-bank/` is often gitignored—update it locally when instructed.
- Mic permission is not required for the voice page to render; Chrome asks for the microphone only when the user starts recording. A blank voice screen is often stale quiz state in `sessionStorage` (e.g. index past the last question after the text quiz)—reset voice intro or clear session storage for the origin.
