# Planning — Varkly

**Last updated:** 2026-03-14

---

## 1. Vision

Varkly is the fastest, most frictionless way to discover your VARK learning style and immediately apply it to every AI tool you use. The experience is instant, playful, and genuinely useful — not another academic form. Every person who completes the quiz leaves with two copy-ready AI prompts that make every AI tool they use smarter about how they learn.

**Varkly is entirely stateless.** No user data is collected or stored. No accounts. No database. No server. Everything runs in the browser — scoring, prompt generation, and results encoding. The only persistence is the shareable URL, which encodes all scores client-side.

---

## 2. Architecture Overview

```
Browser (React SPA)
    │
    ├── Quiz state         → sessionStorage (ephemeral, cleared on tab close)
    ├── Theme preference   → localStorage
    ├── Score calculation  → in-memory (QuizContext.calculateScores)
    ├── AI prompt generation → in-memory (src/utils/aiPrompts.ts)
    └── Results sharing    → URL encoding (btoa/atob, no server involved)
```

There is no backend. There is no database. There are no API calls during the quiz or results flow. The app is a pure client-side SPA deployed as static files on Vercel.

---

## 3. Tech Stack with Rationale

### React 18 + TypeScript
- React chosen for its component model and the ecosystem of animation/chart libraries.
- TypeScript for correctness across the scoring, prompt generation, and URL encoding logic.

### Vite 5
- Dramatically faster HMR than Create React App. Native ESM. Smaller build output.

### React Router v6
- Declarative routing. `useParams` used to decode scores from the shareable `/r/:hash` URL pattern.

### Tailwind CSS v3
- Utility-first allows rapid UI iteration without naming collisions.
- `dark:` variants for dark mode support without a second stylesheet.
- `tailwind.config.js` customises the `card` and button utilities via `@layer components`.

### Framer Motion v11
- Page/card enter animations (opacity + y translate) used throughout.
- `whileHover` / `whileTap` on buttons for subtle tactile feedback.

### Recharts v2
- Bar chart for VARK score visualisation in `ResultsChart`.
- Chosen over Chart.js for its React-native API (no imperative DOM manipulation).

### Vercel
- Zero-config static SPA deployment. `vercel.json` adds a catch-all rewrite to `index.html` so React Router deep links (`/r/:hash`) work correctly.

---

## 4. Shareable Results URL Encoding

Results are encoded entirely client-side. No server lookup is required to view a shared result.

```
scores string: "V-A-R-K"  (e.g. "9-2-1-1")
base64 encode: btoa("9-2-1-1") = "OS0yLTEtMQ=="
strip padding: "OS0yLTEtMQ"
final URL:     https://varkly.app/r/OS0yLTEtMQ
```

On load, `ResultsPage` decodes `atob(hash)`, splits on `-`, and validates each value is a number between 0 and 13. Invalid hashes redirect to `/`.

**Implication:** The results URL is fully self-contained. Anyone with the link can view the results and generate the same AI prompts without any server request. The URL encodes scores only — not the full answer breakdown.

---

## 5. AI Prompts — Generation Design

### Approach
All prompts are generated entirely client-side from the `VarkScores` object. No API calls. No templates stored server-side. The generation function lives in `src/utils/aiPrompts.ts` and is pure — given the same scores, it always produces the same output.

### Dominant Style Determination
```typescript
const dominantScore = Math.max(V, A, R, K);
const dominantStyles = (['V', 'A', 'R', 'K'] as const).filter(k => scores[k] === dominantScore);
```

### System Prompt Template Structure
```
"I am a [style description] learner (VARK: V=[V], A=[A], R=[R], K=[K]).

[Style-specific communication instructions — 2–3 sentences]

[Style-specific structure instructions — 1–2 sentences]

[Check-in instruction — 1 sentence]"
```

### Conversation Prompt Template Structure
```
"I'm a [dominant style] learner — [one-sentence style preference statement]. [One-sentence reorientation request]."
```

### Style Instruction Bank (per dimension)

**Visual (V):**
- Structure responses with headers, sub-headers, and bullet points over prose
- Use diagrams, tables, flowcharts, and spatial metaphors wherever useful
- Avoid dense unbroken paragraphs
- Check-in: offer a diagram, visual analogy, or restructured layout

**Auditory (A):**
- Use conversational language, rhetorical questions, and verbal walkthroughs
- Write as you'd speak — avoid dry bullet lists
- Check-in: re-explain using a different verbal framing or analogy

**Read/Write (R):**
- Use precise written definitions, numbered lists, and labeled terminology
- Provide structured summaries with headings and sub-points
- Check-in: offer a written outline or definitions-first restatement

**Kinesthetic (K):**
- Lead with a concrete real-world example or scenario before any theory
- Frame explanations around doing: "here's how you'd apply this"
- Check-in: offer a different example or a step-by-step practical exercise

### Multimodal Blending
- Two dominant styles: merge instruction sets from both dimensions; check-in references both
- Three or more: describe user as "highly multimodal"; instruct AI to vary format freely

### Generation Constraints
- System prompt: 100–150 words maximum
- Conversation prompt: 25–40 words maximum
- Both prompts must be copy-ready: no placeholders, no ellipsis, no user-facing formatting instructions
- Both prompts must work pasted cold into a new AI session with no surrounding context

### Component Placement
`AIPromptsCard` is inserted in `ResultsPage` between `ResultsExplanation` and the "Retake Quiz" card. It renders on both fresh completions (`/results`) and shared result views (`/r/:hash`).

---

## 6. Vercel Deployment Config

`vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Ensures the deep-link route `/r/:hash` is served by the React app rather than returning a 404.

### Environment Variables
No environment variables are required for the core application. The app is fully functional with zero configuration.

---

## 7. Known Risks and Open Questions

| Risk | Severity | Notes |
|---|---|---|
| `btoa`/`atob` not available in very old browsers | **Low** | Target modern browsers only; add polyfill if needed |
| Shareable URL encodes scores only, not full answer breakdown | **Low** | Accepted tradeoff — scores are sufficient to generate prompts and render results |
| No analytics — no visibility into quiz completion or prompt copy rates | **Medium** | Success metrics defined in PRD have no current collection mechanism; consider adding privacy-preserving analytics (e.g. Plausible, Fathom) |
| No test suite | **Low** | Add Vitest for `calculateScores` and `generateAIPrompts` — both are pure functions and easy to test |
| AI prompt copy rate cannot be measured without some form of event tracking | **Medium** | The primary success metric (prompt copy rate) requires at least minimal client-side event tracking to measure |
