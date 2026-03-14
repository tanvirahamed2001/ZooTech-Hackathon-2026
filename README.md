# Varkly — VARK Learning Style Quiz

Varkly is a web application that helps users discover how their brain prefers to process and learn information, based on the well-known **VARK model** (Visual, Auditory, Read/Write, Kinesthetic).

Users answer 13 scenario-based, lighthearted quiz questions and receive an instant shareable results page showing their VARK scores, a breakdown of their dominant learning style(s), and personalised coaching tips. Optionally, a detailed coaching report is emailed to them after completing the quiz.

---

## Features

- **13-question VARK quiz** — Scenario-based, humorous multiple-choice questions (multi-select per question). Quiz state is persisted in `sessionStorage` so progress is never lost on a refresh.
- **Instant shareable results** — Scores are base64-encoded into a unique URL (`/r/:hash`) that anyone can open without an account.
- **Email capture & personalised report** — Users optionally provide their name, email, and reason for taking the quiz. A Supabase Edge Function (`send-vark-report`) sends them a detailed report with personalised coaching strategies.
- **My Results page** (`/my-results`) — Look up past quiz attempts by email address.
- **Unsubscribe flow** (`/u/:id`) — Humorous one-click unsubscribe / re-subscribe page tied to each quiz record.
- **Dark mode** — Full dark/light mode switching persisted in `localStorage`.
- **Admin analytics dashboard** (`/analytics?admin_token=...`) — Token-protected dashboard with visitor charts (line, pie), top IPs/ISPs/referrers, city-level geography, and a raw visit log.
- **Visitor tracking** — Every page view is recorded in Supabase (`visitor_analytics`) with device, browser, OS, screen resolution, timezone, referrer, UTM parameters, and time-on-page. A Supabase Edge Function (`enrich-analytics`) handles server-side IP geolocation enrichment.
- **Spam protection** — Google reCAPTCHA v3 and honeypot fields on all forms.

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
| Backend / Database | Supabase (PostgreSQL + Edge Functions) |
| User-agent parsing | ua-parser-js |
| Spam protection | Google reCAPTCHA v3 + honeypot |
| Deployment | Vercel |

---

## Project Structure

```
src/
├── App.tsx                        # Root component with all routes
├── main.tsx                       # App entry point
├── index.css                      # Global Tailwind styles
├── types/
│   ├── index.ts                   # Core types: Question, VarkScores, QuizState, EmailCapture
│   ├── analytics.ts               # Analytics types
│   └── supabase.ts                # Supabase DB schema types
├── data/
│   └── questions.ts               # All 13 VARK quiz questions
├── contexts/
│   ├── QuizContext.tsx            # Quiz state management (answers, navigation, scoring)
│   └── ThemeContext.tsx           # Dark/light mode context
├── utils/
│   ├── supabase.ts                # DB helpers: save/update quiz responses, send report
│   └── analytics.ts               # trackVisitor / trackPageView functions
└── components/
    ├── landing/LandingPage.tsx    # Home page with quiz intro and email capture modal
    ├── quiz/
    │   ├── QuizContainer.tsx      # Quiz flow orchestration
    │   ├── QuizIntro.tsx          # Pre-quiz intro screen
    │   ├── Question.tsx           # Individual question component
    │   └── ProgressBar.tsx        # Progress indicator
    ├── results/
    │   ├── ResultsPage.tsx        # Results display, DB save, email send, share URL
    │   ├── ResultsChart.tsx       # VARK score visualisation
    │   └── ResultsExplanation.tsx # Per-style tips and explanations
    ├── my-results/
    │   └── MyResultsPage.tsx      # Email-based past results lookup
    ├── analytics/
    │   ├── VisitorTracker.tsx     # Invisible SPA page-view tracker
    │   └── AnalyticsPage.tsx      # Admin analytics dashboard
    ├── unsubscribe/
    │   └── UnsubscribePage.tsx    # Email unsubscribe / resubscribe flow
    └── shared/
        └── ThemeToggle.tsx        # Dark/light mode toggle button
```

---

## Database Schema (Supabase)

| Table | Purpose |
|---|---|
| `quiz_responses` | Stores each quiz submission — name, email, reason, VARK scores (JSONB), answers (JSONB), results URL, IP address, email-sent flag, unsubscribed flag |
| `emails` | Tracks outbound email records — recipient, subject, body, status, SMTP response |
| `visitor_analytics` | Per-page-view analytics — session ID, path, referrer, UTM params, device/browser/OS, screen dimensions, IP, geolocation, ISP, time-on-page |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A [Supabase](https://supabase.com) project

### Environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_v3_site_key   # optional
```

### Install and run

```bash
npm install
npm run dev
```

### Build for production

```bash
npm run build
```

The output is in `dist/`. The included `vercel.json` configures SPA rewrites for Vercel deployments.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
