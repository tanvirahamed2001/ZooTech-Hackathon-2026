# Varkly — VARK Learning Style Quiz

Varkly is a fast, frictionless web app that helps you discover your VARK learning style and immediately apply it to every AI tool you use. The experience is instant, playful, and genuinely useful — no accounts, no database, no server.

---

## Features

- **13-question VARK quiz** — Scenario-based, humorous multiple-choice questions (multi-select per question). Quiz state is persisted in `sessionStorage` so progress is never lost on a refresh.
- **Instant shareable results** — Scores are base64-encoded into a unique URL (`/r/:hash`) that anyone can open without an account or server lookup.
- **AI Prompts** — Copy-ready system and conversation prompts generated client-side from your VARK scores, ready to paste into any AI tool.
- **Dark mode** — Full dark/light mode switching persisted in `localStorage`.

---

## Architecture

Varkly is entirely stateless. There is no backend, no database, and no API calls during the quiz or results flow. Everything runs in the browser.

```
Browser (React SPA)
    │
    ├── Quiz state         → sessionStorage (ephemeral, cleared on tab close)
    ├── Theme preference   → localStorage
    ├── Score calculation  → in-memory (QuizContext.calculateScores)
    └── Results sharing    → URL encoding (btoa/atob, no server involved)
```

### Shareable URL encoding

```
scores string: "V-A-R-K"  (e.g. "9-2-1-1")
base64 encode: btoa("9-2-1-1") = "OS0yLTEtMQ=="
strip padding: "OS0yLTEtMQ"
final URL:     https://varkly.app/r/OS0yLTEtMQ
```

Anyone with a `/r/:hash` link can view the results without any server request. The URL is fully self-contained.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Routing | React Router DOM v6 |
| Styling | Tailwind CSS v3 |
| Animations | Framer Motion v11 |
| Icons | Lucide React |
| Charts | Recharts |
| Deployment | Vercel |

---

## Project Structure

```
src/
├── App.tsx                        # Root component — routes: /, /quiz, /results, /r/:hash
├── main.tsx                       # App entry point
├── index.css                      # Global Tailwind styles
├── types/
│   └── index.ts                   # Core types: Question, VarkScores, QuizState
├── data/
│   └── questions.ts               # All 13 VARK quiz questions
├── contexts/
│   ├── QuizContext.tsx            # Quiz state management (answers, navigation, scoring)
│   └── ThemeContext.tsx           # Dark/light mode context
└── components/
    ├── landing/LandingPage.tsx    # Home page with quiz intro
    ├── quiz/
    │   ├── QuizContainer.tsx      # Quiz flow orchestration
    │   ├── QuizIntro.tsx          # Pre-quiz intro screen
    │   ├── Question.tsx           # Individual question component
    │   └── ProgressBar.tsx        # Progress indicator
    ├── results/
    │   ├── ResultsPage.tsx        # Results display and shareable URL
    │   ├── ResultsChart.tsx       # VARK score bar chart
    │   └── ResultsExplanation.tsx # Per-style tips and explanations
    └── shared/
        └── ThemeToggle.tsx        # Dark/light mode toggle button
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18

### Install and run

```bash
npm install
npm run dev
```

No environment variables are required. The app is fully functional with zero configuration.

### Build for production

```bash
npm run build
```

The output is in `dist/`. The included `vercel.json` configures SPA rewrites for Vercel deployments so `/r/:hash` deep links work correctly.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
