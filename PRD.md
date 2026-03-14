# PRD — Varkly

**Version:** 3.0  
**Last updated:** 2026-03-14  
**Status:** Active development

---

## 1. Problem Statement

Most people interact with AI assistants the same way every day: they type a question, get a generic response, and never think to tell the AI how they actually want to receive information. The AI defaults to a one-size-fits-all communication style that works for nobody in particular.

This is a solved problem in human learning science. The VARK framework has been used for decades to categorize how people best absorb and process new information across four dimensions: **Visual**, **Auditory**, **Read/Write**, and **Kinesthetic**. But almost no one applies this knowledge to their AI usage — not because they don't want to, but because the cognitive overhead of figuring out their own VARK profile and then translating it into a usable AI prompt is too high.

**Varkly eliminates that overhead entirely.**

A user takes a 13-question assessment. Varkly scores their VARK profile. Then it generates two ready-to-use AI prompts — one to paste into any AI tool before a conversation begins, one to drop into any live conversation mid-session. The user never has to explain how they learn to an AI again.

---

## 2. What Varkly Is

Varkly is a 13-question VARK framework assessment that determines how a person best receives and processes information across four dimensions:

| Dimension | Code | Description |
|---|---|---|
| Visual | V | Processes information through spatial organization, diagrams, charts, color, and visual structure |
| Auditory | A | Processes information through listening, discussion, spoken explanation, and verbal patterns |
| Read/Write | R | Processes information through words — reading, taking notes, written lists, and definitions |
| Kinesthetic | K | Processes information through experience, examples, practice, and physical engagement with material |

Each of the 13 questions presents a real-world scenario with four response options — one anchored to each VARK dimension. Users can select multiple answers per question. Their final scores are the raw counts of each dimension selected across the full assessment.

A user's **dominant style** is the dimension with the highest score. If two or more dimensions tie for the highest score, the user is **multimodal** — meaning they draw on more than one style with equal strength.

**Varkly is entirely stateless.** No user data is collected, no accounts are required, and nothing is stored on a server. All scoring happens in the browser. Results live in the URL.

---

## 3. Why It Exists

The core purpose of Varkly is to reduce the cognitive load of humans interacting with AI.

Most people don't know how to prompt AI in a way that matches how they actually learn and think. When a Visual learner asks ChatGPT to explain a concept, they get prose. When a Kinesthetic learner asks Claude for guidance, they get bullet-pointed theory. The AI isn't wrong — it's just not calibrated to the person.

Varkly solves that by turning a person's VARK score into two immediately usable AI prompts. The quiz is the mechanism. The prompts are the product.

---

## 4. The Core Output: Two AI Prompts

### 4.1 System Prompt

**What it is:** A prompt the user pastes into any AI tool before a conversation begins — into ChatGPT's "Custom Instructions", Claude's "System Prompt", a GPT's system field, or any equivalent configuration layer.

**What it does:** Pre-configures the AI to deliver all information in the communication style that matches the user's VARK profile. This is **proactive** — set it once, and every conversation benefits automatically without the user having to think about it.

**When to use it:** At the start of setting up any AI tool for ongoing use. A one-time paste that changes how every future session feels.

**Character and tone constraints:**
- Must be written in first person ("I am a...")
- Must be direct and instruction-oriented — the AI will act on it
- Must specify the dominant VARK dimension(s) by name
- Must include concrete instructions for how the AI should structure responses
- Must include a check-in instruction for when the user seems confused
- Target length: 100–150 words

**Example — Visual dominant (V=9, A=2, R=1, K=1):**
> I am a Visual learner (VARK: V=9, A=2, R=1, K=1). When explaining anything, structure your response with clear visual hierarchy: headers, sub-headers, and bullet points over long prose. Use diagrams, flowcharts, tables, and spatial metaphors wherever useful. If you're describing a process, map it out step-by-step with visible structure rather than embedding it in sentences. Avoid dense unbroken paragraphs. When I seem confused or ask for clarification, default to offering a diagram, a visual analogy, or a restructured layout of the same information.

**Example — Kinesthetic dominant (V=2, A=1, R=2, K=8):**
> I am a Kinesthetic learner (VARK: V=2, A=1, R=2, K=8). When explaining anything, ground it in a real-world example or scenario first, before introducing theory. I learn by doing and by seeing how something applies in practice. Walk me through concrete cases, step-by-step instructions I can follow, or exercises I can try. Avoid leading with definitions or abstract concepts. When I seem confused, offer a different example or a practical exercise rather than rephrasing the theory.

---

### 4.2 Conversation Prompt

**What it is:** A short, reusable prompt the user drops into any existing AI conversation to immediately reorient the AI's communication style. No setup required — works in any chat window, with any AI, at any point in a session.

**What it does:** Reactively recalibrates an AI that has drifted into a communication style that isn't working. One sentence changes the rest of the conversation.

**When to use it:** Mid-session, when a response lands wrong. When the AI gives an abstract explanation to someone who needed an example. When it gives a wall of text to someone who needed a diagram. Copy, paste, move on.

**Character and tone constraints:**
- Maximum 2 sentences
- Conversational and direct — this gets pasted into a live chat
- Must name the VARK style
- Must contain a clear, specific reorientation instruction
- Target length: 25–40 words

**Example — Visual dominant:**
> I'm a Visual learner — I process information better with structure, diagrams, and visual organization than with prose. Can you reframe your last response using headers, a table, or a visual breakdown?

**Example — Auditory dominant:**
> I'm an Auditory learner — I follow explanations better when they're conversational and talk me through things step by step. Can you walk me through that again as if you're explaining it out loud?

**Example — Read/Write dominant:**
> I'm a Read/Write learner — I absorb information best through clear written definitions, structured lists, and labeled terminology. Can you restate that as a numbered list or a defined set of terms?

**Example — Kinesthetic dominant:**
> I'm a Kinesthetic learner — theory doesn't land for me until I can see how it applies. Can you give me a concrete real-world example or a step-by-step walkthrough I can follow?

---

## 5. VARK Score-to-Prompt Generation Logic

This is a first-class product requirement. The generation logic must be deterministic, transparent, and accurate to the user's actual score profile.

### 5.1 Determining Dominant Style

```
dominantScore = max(V, A, R, K)
dominantStyles = all dimensions where score === dominantScore
```

- If `dominantStyles.length === 1` → single-style prompt
- If `dominantStyles.length === 2` → two-style multimodal prompt
- If `dominantStyles.length === 3` or `4` → broad multimodal prompt

### 5.2 Score Context in Prompts

Every generated prompt must include the user's actual VARK scores (e.g. `V=9, A=2, R=1, K=1`). This serves two functions:

1. It grounds the AI's understanding — it knows the relative weighting, not just the dominant label
2. It allows the user to see the score directly in the prompt they're pasting, building confidence that it reflects their real result

### 5.3 Style Instruction Bank

Each dimension maps to a fixed set of communication instructions. These instructions are combined when generating multimodal prompts.

**Visual (V):**
- Structure responses with headers, sub-headers, and bullet points
- Use diagrams, tables, flowcharts, and spatial metaphors
- Map processes step-by-step with visible structure
- Avoid dense unbroken prose
- Offer diagrams or restructured layouts when clarification is needed

**Auditory (A):**
- Use conversational language and rhetorical questions
- Walk through explanations verbally, step by step, as if speaking
- Use rhythm, analogy, and dialogue patterns
- Avoid dry bullet lists — write as you would speak
- Offer to re-explain using a different verbal framing when asked to clarify

**Read/Write (R):**
- Use precise written definitions, numbered lists, and labeled terminology
- Provide structured summaries with headings and sub-points
- Reference exact words and defined concepts rather than analogies
- Avoid visual metaphors — convey meaning through written precision
- Offer a written outline or definitions-first restatement when clarifying

**Kinesthetic (K):**
- Lead with a concrete real-world example or scenario before theory
- Provide step-by-step instructions the user can actually follow
- Frame explanations around doing: "here's how you'd apply this"
- Avoid opening with abstract definitions or conceptual overviews
- Offer a different example or practical exercise when clarifying

### 5.4 Multimodal Blending Rules

When two styles tie for dominant:
- Both style instruction sets are included in the system prompt, ordered by score descending (or alphabetically if tied)
- The check-in instruction references both styles
- The conversation prompt mentions both styles by name

When three or more styles tie:
- The system prompt describes the user as a "highly multimodal learner" and notes their adaptability
- The conversation prompt asks the AI to vary its format freely across styles

### 5.5 Generation Constraints

- System prompt: 100–150 words maximum
- Conversation prompt: 25–40 words maximum
- Both prompts must be copy-ready — no placeholders, no ellipsis, no formatting instructions to the user
- Both prompts must work when pasted cold into a new AI session with no surrounding context

---

## 6. User Personas

### The AI Power User
Uses multiple AI tools daily (ChatGPT, Claude, Gemini, Perplexity). Knows that prompting matters but hasn't had a systematic way to configure their tools for how they think. Will immediately see the value of the system prompt and use it.

### The AI Beginner
Has started using AI tools but finds the responses hit-or-miss. Doesn't know why some explanations click and others don't. Varkly gives them a vocabulary and a practical fix for the friction they've been experiencing.

### The Coaching Client
Onboarding with a coach or educator who has sent them to Varkly as part of an intake process. Comes with a specific purpose. Will likely read the full results and use both prompts.

### The Curious Self-Improver
Interested in learning science and personal development. Will take the quiz to understand themselves better. May or may not be a heavy AI user today, but the prompts are a useful takeaway regardless.

---

## 7. User Stories

### Assessment

- As a user, I can complete the 13-question VARK assessment without creating an account so that the barrier to entry is zero.
- As a user, I can select multiple answers per question so that I can represent genuinely mixed preferences rather than forcing a single choice.
- As a user, I can skip a question so that I'm not blocked by a scenario that doesn't apply to me.
- As a user, I can go back to a previous question so that I can reconsider an answer.
- As a user, my progress is preserved if I refresh the page so that I don't lose my answers mid-quiz.
- As a user, I see a progress indicator so that I know how many questions remain.

### Results

- As a user, I see my four VARK dimension scores immediately after completing the assessment.
- As a user, I see which dimension(s) are dominant and what that means for how I process information.
- As a user, I receive a shareable URL for my results that I can bookmark or send to others.
- As a user accessing a shared result URL, I can see the full results without taking the quiz myself.

### System Prompt

- As a user, I see a generated System Prompt on my results page that I can copy with a single click.
- As a user, the System Prompt reflects my actual VARK scores — not a generic template — so I can trust it represents me.
- As a user, the System Prompt is short enough to paste into any AI tool without reading it first — I shouldn't need to edit it.
- As a user, I understand what the System Prompt is for, presented clearly on the results page before I copy it.
- As a user accessing my results via a shared URL, I also see the System Prompt so I can use it even if someone else sent me the link.

### Conversation Prompt

- As a user, I see a generated Conversation Prompt on my results page that I can copy with a single click.
- As a user, the Conversation Prompt is short enough that I can memorise or quickly find it during a live AI session.
- As a user, the Conversation Prompt tells the AI what I need in a single paste — I shouldn't need to add context or edit it.
- As a user, I understand the difference between the System Prompt and the Conversation Prompt, and when to use each.

---

## 8. Success Metrics

Success for Varkly is measured primarily on prompt adoption — the degree to which users take the generated prompts and put them to use.

| Metric | Definition | Target |
|---|---|---|
| **System Prompt copy rate** | % of results page visitors who copy the System Prompt | > 40% |
| **Conversation Prompt copy rate** | % of results page visitors who copy the Conversation Prompt | > 30% |
| **Both prompts copied** | % of results page visitors who copy both prompts | > 20% |
| **Quiz completion rate** | % of users who reach `/quiz` and complete all 13 questions | > 70% |
| **Shareable URL engagement** | % of shared result URLs that are opened by someone other than the original user | Tracked; no initial target |
| **Prompt-to-share ratio** | % of users who both copy a prompt and share their results URL | Tracked; indicates high-value session |

### Interpretation Notes

- If the System Prompt copy rate is high but the Conversation Prompt rate is low, consider improving the explanation of when to use the conversation prompt.
- If quiz completion is high but prompt copy rate is low, the results page is not effectively communicating the value of the prompts — investigate copy, placement, or visual treatment.

---

## 9. Out of Scope (for this version)

- Email capture, email delivery, or any server-side data persistence
- User accounts or authentication
- Historical results lookup
- Unsubscribe flows
- Admin analytics dashboards
- AI prompt personalisation beyond VARK score (e.g. topic-specific prompts, tone customisation)
- Direct AI integrations (e.g. a browser extension that auto-pastes the system prompt)
- Team or organizational dashboards
- Prompt effectiveness tracking (whether the prompts actually improve AI responses for users)
- A/B testing of prompt copy variations
