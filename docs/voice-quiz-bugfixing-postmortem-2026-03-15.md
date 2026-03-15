# Voice Quiz Bugfixing Session — Post Mortem

**Date:** 2026-03-15  
**Branch:** voice-UI  
**Status:** Voice Q&A flow working for demo; some polish and edge cases remain.

---

## 1. Session goal

Get the voice quiz at `/quiz/voice` to a usable state for a demo: pregenerated question audio, audible “Got it” after a successful answer, advance to next question with a short delay, autoplay of the next question after a brief pause, and reliable navigation (prev/next/jump) plus stop-record and play-question controls.

---

## 2. What was broken vs what works now

| Area | Before | After |
|------|--------|--------|
| **Audible “Got it”** | No sound after transcription/classification; TTS often blocked after async gap | Pregenerated `got-it.wav` played first; fallback chain: speakWeb → browser TTS → short beep. Always await before scheduling advance. |
| **Autoplay next question** | No autoplay; user had to click Play every time | After advancing (from timeout or green button), 1.5 s delay then `speakQuestionRef.current()` runs to play the new question’s audio. |
| **Navigation** | No explicit prev/next or question jumper; users couldn’t jump for testing | Sticky header in **VoiceQuizContainer** with ← Prev, Next →, and Jump: 1–13. Nav lives in container chunk so it isn’t cached with the lazy VoiceQuizQuestions chunk. |
| **Double “Got it”** | Sometimes two “Got it”s played before advance | Set `recordingProcessedRef.current = true` at the very start of `mr.onstop` (before any await) so a second `onstop` exits immediately. |
| **Double advance (Q1 → Q3)** | Timeout from a previous answer could fire after advancing, or multiple timeouts | Guard in `advanceToNextQuestion`: only call `goToNextQuestion()` if `currentQuestionIdRef.current === scheduledAdvanceForQuestionIdRef.current`. Schedule ref set when setting the 2.5 s timeout; cleared when clearing timeouts or after advancing. |
| **Stop record unresponsive** | Had to click twice to stop listening | When `status === 'listening'`, show a dedicated **Stop recording** button with `onClick={stopRecording}`. Hold-to-speak still uses mouse/pointer/touch release; added `onPointerUp`/`onPointerLeave` and touch `preventDefault` for reliability. |
| **Play question button** | Sometimes didn’t start playback; cursor “bugging out” | Switched from `onMouseDown` to `onClick` to avoid double-fire. Added `try/finally` so `isPlayingRef` and status always reset when pregen/speakWeb finish or throw (with `fallbackPlaying` guard so browser fallback’s onEnd owns reset). Removed noisy console logs. |
| **Markdown in TTS** | “*really*” read as “asterisk really asterisk” | `stripMarkdownForTts()` in `web-ai-engine.ts` strips `*` and `_`; used for question text and in pregenerate script so regenerated WAVs are clean. |

---

## 3. Root causes and fixes (concise)

- **No audible “Got it”:** Browser TTS often doesn’t run when invoked after a long async chain (no user gesture). Fix: pregenerated `got-it.wav` + fallback chain; always await confirmation before scheduling advance.
- **No autoplay:** Effect that scheduled the 1.5 s timeout was clearing it in cleanup (e.g. Strict Mode), so the timeout never ran. Fix: don’t clear that timeout in effect cleanup; clear only on unmount. Later: use `scheduleAutoplay` state so advance sets it true and effect runs once per advance.
- **Nav not visible:** Nav was inside the lazy-loaded `VoiceQuizQuestions` chunk; browser served a cached chunk so updates never appeared. Fix: move nav into **VoiceQuizContainer** (loaded with the route) and pass `registerClearTimeouts` so the container can clear timeouts when user clicks Prev/Next/Jump.
- **Double “Got it”:** Two `MediaRecorder.onstop` handlers could run (e.g. mouse + touch). Fix: set `recordingProcessedRef.current = true` at the very start of the handler so the second run returns immediately.
- **Skip from Q1 to Q3:** Stale timeout from a previous answer could fire after we’d already advanced. Fix: only advance when `currentQuestionIdRef.current === scheduledAdvanceForQuestionIdRef.current`; set scheduled ref when setting the timeout; clear when clearing timeouts or after advancing. Green “Next question” button sets the ref before calling `advanceToNextQuestion` so manual advance still works.
- **speakQuestion “before initialization”:** `speakQuestionRef.current = speakQuestion` ran at top of component before `speakQuestion` was defined. Fix: remove that assignment; use `useEffect(() => { speakQuestionRef.current = speakQuestion; }, [speakQuestion])` so ref is updated after the callback exists.
- **Play button not playing / cursor:** `isPlayingRef` could stay true after a failed or hanging `speakWeb`, blocking future plays. Fix: `try/finally` to always reset state when not using browser fallback; Play button changed to `onClick` to avoid double-fire and cursor issues.

---

## 4. Architecture decisions this session

- **Pregenerated audio:** Questions use `public/quiz-audio/q0.wav` … `q12.wav`; confirmation uses `public/quiz-audio/got-it.wav`. Generated by `npm run pregenerate-quiz-audio` (Kokoro, script in `scripts/pregenerate-quiz-audio.ts`). Playback via `HTMLAudioElement` + blob URL so it works after async fetch (no AudioContext suspend issues).
- **Nav in container:** Prev/Next/Jump live in **VoiceQuizContainer** so they’re in the same chunk as the route; avoids cache hiding nav when only the lazy child is updated.
- **Advance guard:** Use refs `scheduledAdvanceForQuestionIdRef` and `currentQuestionIdRef` so the 2.5 s timeout only advances if we’re still on the same question (prevents double-advance from stale timeouts).
- **Confirmation order:** Try pregen got-it → speakWeb → browser fallback → beep; always await before `setTimeout(advanceToNextQuestion, 2500)`.

---

## 5. Key files

| File | Role |
|------|------|
| `src/components/quiz/VoiceQuizContainer.tsx` | Route-level container; sticky nav (Prev, Next, Jump 1–13); passes `registerClearTimeouts` to child. |
| `src/components/quiz/VoiceQuizQuestions.tsx` | Question card, Play/Hold to speak/Stop recording/Skip, recording pipeline, “Got it” + advance + autoplay logic. |
| `src/utils/voice/web-ai-engine.ts` | `playPregeneratedQuestion`, `playPregeneratedConfirmation`, `playConfirmationBeep`, `stripMarkdownForTts`, STT/TTS bridge, Web Speech API capture. |
| `src/contexts/QuizContext.tsx` | `goToNextQuestion`, `goToPreviousQuestion`, `goToQuestionIndex`. |
| `scripts/pregenerate-quiz-audio.ts` | Generates `public/quiz-audio/q0.wav` … `q12.wav` and `got-it.wav` (Kokoro, stripped markdown). |

---

## 6. How to verify / refresh / regen

- **Hard refresh:** After code changes, use Cmd+Shift+R (or Empty cache and hard reload) so the lazy chunk and nav updates load.
- **Restart dev server:** After changing `.env` or Vite config.
- **Pregenerated audio:** Run `npm run pregenerate-quiz-audio` (with `npm run serve-models` running) to (re)generate `public/quiz-audio/*.wav`. Then refresh the app.
- **Vite cache:** If nav or behavior doesn’t update, clear cache: `rm -rf node_modules/.vite`, restart `npm run dev`, then hard refresh.

---

## 7. Known remaining issues / polish

- Stop recording: first release can still be unreliable on some devices; dedicated “Stop recording” button is the reliable path.
- Play button: when pregenerated file is missing (e.g. 404 for `q3.wav`), worker TTS (`speakWeb`) is used; if it hangs, state can still get stuck despite `finally` (e.g. worker never resolves). Ensuring all question WAVs exist avoids this.
- Cold start / latency: pregen avoids TTS latency for questions and “Got it”; for true real-time feel, see `docs/voice-realtime-roadmap.md` (Web Speech API STT, streaming, etc.).

---

## 8. Related docs

- **`docs/handover-voice-quiz-bugfixing.md`** — Earlier handover; architecture and worker protocol still accurate; UX issues above supersede the “remaining issues” there.
- **`docs/voice-realtime-roadmap.md`** — Path to nearer real-time voice (Web Speech API, streaming STT, overlap pipeline).
- **`.cline/memory-bank/`** — Project brief, current goal, decisions, progress log, open questions.

---

**Updated by:** Cursor [2026-03-15]
