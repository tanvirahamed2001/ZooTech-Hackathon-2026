# Cursor Rules — Varkly Project

These are the operating rules for every AI session working on this codebase.

---

## Session Start Protocol

At the beginning of every new conversation:

1. **Read `planning.md`** — Understand the current architecture, tech stack decisions, and known risks before touching any code.
2. **Read `tasks.md`** — See what's completed, what's in progress, and what's next. Do not start work that is already done or that conflicts with in-progress work.
3. **Read `PRD.md`** if the task involves a feature, a user flow, or a product decision — confirm your understanding of the requirement before implementing.

---

## Task Management Rules

- **Check `tasks.md` before starting any work.** If your task isn't listed, add it before beginning.
- **Mark tasks complete immediately** when finished — include the completion date in `[YYYY-MM-DD]` format next to the checkbox.
- **Add newly discovered tasks as you go.** If you find a bug, a missing edge case, a tech debt item, or a future improvement while working, add it to the appropriate milestone in `tasks.md` before ending the session.
- **Only work on one task at a time.** Do not begin the next task until the current one is committed, pushed, and marked complete.
- **Update `planning.md`** if you make a meaningful architectural decision, add a new dependency, change a Supabase schema, or deploy a new Edge Function.

---

## Code Rules

### General
- Read every file you plan to edit before making changes.
- Do not remove or rewrite existing logic without understanding why it exists.
- Do not add comments that just describe what the code does — only comment non-obvious intent, trade-offs, or constraints.
- Preserve the existing code style: React functional components, TypeScript strict mode, Tailwind utility classes, Framer Motion for animation.

### TypeScript
- All new components and utilities must be fully typed — no implicit `any`.
- New data shapes used across components must be added to `src/types/index.ts`.

### Styling
- Use Tailwind utility classes exclusively — do not add inline styles or new CSS files unless absolutely necessary.
- Dark mode: always include `dark:` variants for any new text, background, or border colors.
- Follow the existing design tokens: `violet-*` for primary, `indigo-*` for secondary, `emerald-*` for success, `red-*` for error, `gray-*` for neutral.

### State & Data
- Quiz state lives in `QuizContext` + `sessionStorage`. Do not add local component state for quiz data.
- Score calculation and results URL encoding are pure client-side operations — no network calls.

---

## Git Rules

- Commit after each logical unit of work — do not batch unrelated changes.
- Commit messages must be descriptive: `feat: add AI prompts card to results page`, not `update stuff`.
- Always run `git push -u origin <branch>` after committing.
- Never force push to the main branch.

---

## Current Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | 18.3 |
| Language | TypeScript | 5.5 |
| Build tool | Vite | 5.4 |
| Routing | React Router DOM | 6.22 |
| Styling | Tailwind CSS | 3.4 |
| Animation | Framer Motion | 11.18 |
| Icons | Lucide React | 0.344 |
| Charts | Recharts | 2.12 |
| Deployment | Vercel | — |

---

## Environment Variables Reference

No environment variables are required. The app is fully stateless and runs with zero configuration.

---

## File Map (Quick Reference)

```
src/
  App.tsx                          All routes (/, /quiz, /results, /r/:hash)
  types/index.ts                   Core types (Question, VarkScores, QuizState)
  data/questions.ts                13 VARK quiz questions
  contexts/QuizContext.tsx         Quiz state management (sessionStorage)
  contexts/ThemeContext.tsx        Dark/light mode (localStorage)
  components/landing/              LandingPage
  components/quiz/                 QuizContainer, QuizIntro, Question, ProgressBar
  utils/aiPrompts.ts               AI prompt generation (pure function)
  utils/__tests__/aiPrompts.test.ts  Vitest tests for prompt generation
  components/results/              ResultsPage, ResultsChart, ResultsExplanation, AIPromptsCard
  components/shared/               ThemeToggle
```

---

## Session Summaries

### 2026-03-14 — Project baseline setup
- Read entire codebase
- Generated `README.md`, `PRD.md`, `cursor.md`, `planning.md`, `tasks.md`
- Established project documentation framework and AI Prompts feature spec

### 2026-03-14 — Milestone 4: Stateless refactor
- Removed all Supabase, Edge Functions, email capture, analytics, and reCAPTCHA code
- Deleted: `src/utils/supabase.ts`, `src/utils/analytics.ts`, `src/types/supabase.ts`, `src/types/analytics.ts`
- Deleted: `MyResultsPage`, `UnsubscribePage`, `VisitorTracker`, `AnalyticsPage`
- Removed routes `/my-results`, `/u/:id`, `/analytics` from `App.tsx`
- Uninstalled `@supabase/supabase-js`, `ua-parser-js`, `@types/ua-parser-js`
- App is now fully stateless — no network calls, no env vars required

### 2026-03-14 — Milestone 6: Shareable link + codebase audit

**Shareable results link**
- Added "Your results link" card at the bottom of `ResultsPage` (between `AIPromptsCard` and Retake Quiz), visible on both `/results` and `/r/:hash`
- Displays the full `/r/:hash` URL in a monospaced selectable box with a single "Copy link" button
- Button shows emerald "Copied!" feedback for 2 s, independent of the Share/Copy buttons at the top of the page

**Codebase audit — removed files**
- `.bolt/` — entire StackBlitz scaffolding directory (`config.json`, `prompt`, `supabase_discarded_migrations/`)
- `supabase/functions/` — 6 Edge Functions: `analytics-data`, `analytics-data-enriched`, `analytics-data-multi-site`, `enrich-analytics`, `get-my-results`, `send-vark-report`
- `supabase/migrations/` — 9 SQL migration files from pre-stateless architecture
- `scripts/` — 3 Supabase maintenance scripts (`check-connection.js`, `integrity-check.js`, `list-tables.js`); `list-tables.js` contained a hardcoded service role key
- `public/AI braintrust logo transparent.png` + copy — stale branding assets from old project name
- `public/_redirects` — Netlify-specific rewrite config (app deploys on Vercel via `vercel.json`)

### 2026-03-14 — Milestone 5: AI Prompts feature
- Created `src/utils/aiPrompts.ts` — pure function `generateAIPrompts(scores)` returns personalised system + conversation prompts
- Templates for all 4 pure styles, all two-style combinations, and 3+ multimodal
- Style instruction bank per VARK dimension (communication, structure, check-in)
- Built `AIPromptsCard` component with labeled System Prompt and Conversation Prompt blocks
- Copy button with "Copied!" feedback state (2s) on each block
- Clipboard API with `execCommand` fallback
- Explanatory text above each prompt block
- Full dark mode styling
- Inserted in `ResultsPage` between `ResultsExplanation` and Retake Quiz card
- Renders on both `/results` and `/r/:hash`
- 37 Vitest unit tests for `generateAIPrompts` — all passing
- Installed Vitest as devDependency; added `test` and `test:watch` npm scripts
