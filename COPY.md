# COPY.md — Varkly Customer-Facing Text

> Read-only extraction for copy review. Every piece of customer-facing text in the app, organized by page and component. No text has been altered.

---

## Table of Contents

1. [HTML / Page Meta](#1-html--page-meta)
2. [Shared Navigation](#2-shared-navigation)
3. [Shared — Theme Toggle](#3-shared--theme-toggle)
4. [Landing Page (`/`)](#4-landing-page-)
5. [Quiz Intro Screen](#5-quiz-intro-screen)
6. [Quiz Container (`/quiz`)](#6-quiz-container-quiz)
7. [Question Component — Tooltips](#7-question-component--tooltips)
8. [Question Component — Navigation Controls](#8-question-component--navigation-controls)
9. [Quiz Questions & Answer Options](#9-quiz-questions--answer-options)
10. [Results Page — Loading State (`/results`, `/r/:hash`)](#10-results-page--loading-state)
11. [Results Page — Header & Score Card](#11-results-page--header--score-card)
12. [Results Page — Share Your Results](#12-results-page--share-your-results)
13. [Results Page — Your Results Link Card](#13-results-page--your-results-link-card)
14. [Results Page — Retake Quiz Card](#14-results-page--retake-quiz-card)
15. [Results Chart](#15-results-chart)
16. [Results Explanation — Section Header & States](#16-results-explanation--section-header--states)
17. [Results Explanation — Visual Learner](#17-results-explanation--visual-learner)
18. [Results Explanation — Auditory Learner](#18-results-explanation--auditory-learner)
19. [Results Explanation — Read/Write Learner](#19-results-explanation--readwrite-learner)
20. [Results Explanation — Kinesthetic Learner](#20-results-explanation--kinesthetic-learner)
21. [Results Explanation — Balanced Learner (default fallback)](#21-results-explanation--balanced-learner-default-fallback)
22. [Results Explanation — Closing Quote](#22-results-explanation--closing-quote)
23. [AI Prompts Card — Card Header & Labels](#23-ai-prompts-card--card-header--labels)
24. [AI Prompts Card — System Prompt Templates](#24-ai-prompts-card--system-prompt-templates)
25. [AI Prompts Card — Conversation Prompt Templates](#25-ai-prompts-card--conversation-prompt-templates)
26. [Web Share API Metadata](#26-web-share-api-metadata)
27. [Error / Alert Messages](#27-error--alert-messages)
28. [404 Page](#28-404-page)

---

## 1. HTML / Page Meta

**Source:** `index.html`

| Field | Text |
|---|---|
| `<title>` | Varkly — VARK Learning Style Quiz |
| `<meta name="description">` | Discover your unique learning style with the Varkly VARK questionnaire. Understand if you're Visual, Auditory, Read/Write, or Kinesthetic learner. |

---

## 2. Shared Navigation

**Source:** `LandingPage.tsx`, `QuizIntro.tsx`, `QuizContainer.tsx`, `ResultsPage.tsx`

The navigation bar appears on every page with a logo and the brand name.

| Element | Text |
|---|---|
| Logo `alt` attribute | Varkly |
| Brand name text | Varkly |

---

## 3. Shared — Theme Toggle

**Source:** `src/components/shared/ThemeToggle.tsx`

The button's accessible label changes based on current mode.

| State | `aria-label` |
|---|---|
| Currently in dark mode | Switch to light mode |
| Currently in light mode | Switch to dark mode |

---

## 4. Landing Page (`/`)

**Source:** `src/components/landing/LandingPage.tsx`

### Hero

| Element | Text |
|---|---|
| H1 | The best way to understand how you learn. |
| Subheading (`<p>`) | Take the VARK quiz. Get your results in minutes. |

### Main Card

| Element | Text |
|---|---|
| H2 | Why Is Your Brain Ignoring Half Of What You Learn? |
| Body paragraph | Everyone's brain has a preferred way of processing information - and when you learn in a way that doesn't match your style, it's like trying to watch Netflix with dial-up internet. Painful and inefficient. |

### Pull Quote

> "Find out why your teachers made learning feel like trying to eat soup with a fork. Turns out, it might not have been your fault after all."

### Learning Style Grid

| Element | Text |
|---|---|
| H3 | Take the VARK Learning Style Quiz |
| Intro sentence | This quiz helps you discover if you're a: |

**Visual Learner tile**

| Element | Text |
|---|---|
| Tile heading | Visual Learner |
| Tile description | You process information best through charts, diagrams, and seeing things demonstrated |

**Auditory Learner tile**

| Element | Text |
|---|---|
| Tile heading | Auditory Learner |
| Tile description | You learn best through listening, discussions, and verbal instructions |

**Read/Write Learner tile**

| Element | Text |
|---|---|
| Tile heading | Read/Write Learner |
| Tile description | You prefer information displayed as words, lists, and written materials |

**Kinesthetic Learner tile**

| Element | Text |
|---|---|
| Tile heading | Kinesthetic Learner |
| Tile description | You learn through doing, experiencing, and hands-on activities |

### Call to Action

| Element | Text |
|---|---|
| Primary button label | Start Your Free Quiz (Press Enter) |
| Button `aria-label` | Start Your Free Quiz (Press Enter) |

### Footer Note

| Line | Text |
|---|---|
| Line 1 | 13 questions • Takes about 3 minutes • No login required |
| Line 2 | Results available immediately |

---

## 5. Quiz Intro Screen

**Source:** `src/components/quiz/QuizIntro.tsx`

Shown at question index `-1` (before the first question).

### Heading

| Element | Text |
|---|---|
| H3 | Let's Discover Your Learning Style! |

### Instruction Bullets

1. Select **all answers** that apply to you in each scenario
2. Skip questions that don't resonate with you
3. Be honest - this isn't a test, it's about understanding your natural preferences
4. Takes about 3 minutes to complete all 13 questions

### Pull Quote

> "Your brain is unique, like a fingerprint but with more opinions and a weird obsession with cat videos. Let's figure out how it actually works!"
>
> — RayRayRay

### Button

| Element | Text |
|---|---|
| Primary button | Let's Begin! |

---

## 6. Quiz Container (`/quiz`)

**Source:** `src/components/quiz/QuizContainer.tsx`

### Progress Bar Labels (dynamic)

| Element | Text |
|---|---|
| Left label | Question {n} of {total} |
| Right label | {n}% complete |

### Footer Hint

| Element | Text |
|---|---|
| Footer note | Select all answers that apply to you, or skip if none do |

### Empty State (no questions loaded)

| Element | Text |
|---|---|
| H2 | No questionnaire loaded |
| Description | Add questions to `src/data/questions.ts` or import from `src/data/questionnaires/` to get started. |

---

## 7. Question Component — Tooltips

**Source:** `src/components/quiz/Question.tsx` (`getSimplifiedExplanation`)

Each question displays a small explanatory tooltip box. The text is keyed to question ID.

| Question ID | Tooltip Text |
|---|---|
| 1 | We want to know how you prefer to learn when building something new. Do you like watching videos, talking it through, reading instructions, or just trying it yourself? |
| 2 | This question helps us understand how you learn new skills in the kitchen. Do you prefer visual guides, verbal instructions, written recipes, or hands-on experience? |
| 3 | When helping others find their way, your method of explaining directions reveals your natural communication style. |
| 4 | Your preparation style for presentations shows how you best organize and remember information. |
| 5 | Learning a musical instrument requires different approaches. Your preference here shows how you naturally tackle new skills. |
| 6 | This question reveals how you best absorb information in learning environments like classrooms or meetings. |
| 7 | Memorizing numbers is a specific type of learning task. Your approach shows your natural memory strategy. |
| 8 | Planning activities shows how you prefer to gather and process new information. |
| 9 | Your approach to learning new technology reveals your preferred way of understanding complex systems. |
| 10 | Remember names? This shows your natural strategy for connecting new information to memory. |
| 11 | How you choose restaurants shows your preferred way of making decisions based on information. |
| 12 | Handling problems shows how you prefer to communicate and solve issues. |
| 13 | Your relaxation preferences often match how your brain naturally processes information. |
| Default (fallback) | Choose the options that best match your natural behavior in this situation. |

---

## 8. Question Component — Navigation Controls

**Source:** `src/components/quiz/Question.tsx`

| Element | Text |
|---|---|
| Back button | Previous |
| Skip button | Skip (Space) |
| Next button (mid-quiz) | Next (Enter) |
| Next button (last question) | Finish (Enter) |
| Keyboard shortcut hint on each option | Press {1 / 2 / 3 / 4} |

---

## 9. Quiz Questions & Answer Options

**Source:** `src/data/questions.ts`

---

### Question 1

**Scenario:**
You need to assemble some flat-pack furniture that looks suspiciously like a puzzle designed by a mischievous gnome. The instructions are... well, let's call them "minimalist." What's your first move?

| Option | Type | Text |
|---|---|---|
| A | V | You hunt down a video tutorial online. Seeing someone else wrestle with it first is essential. |
| B | A | You groan, then bribe a friend to talk you through it while you both question your life choices. |
| C | R | You spread out the paper instructions (all six pages of diagrams!) and meticulously read every single step, possibly with a highlighter. |
| D | K | Instructions? Please. You dive right in, figuring it out by trial, error, and maybe a few leftover screws you hope weren't important. |

---

### Question 2

**Scenario:**
You're trying to learn a fancy new recipe to impress someone (or just yourself, no judgment). How do you tackle it?

| Option | Type | Text |
|---|---|---|
| A | V | You need visuals! Pictures of each step, or better yet, a cooking show video where they make it look effortless. |
| B | A | You prefer listening to the recipe explained, maybe on a podcast or having someone dictate it as you go. |
| C | R | You print out the recipe, read it thoroughly, make notes in the margins, and double-check ingredient lists. |
| D | K | You get hands-on immediately. Measuring cups are suggestions, right? You learn best by doing (and tasting). |

---

### Question 3

**Scenario:**
Someone asks you for directions in a place you know reasonably well. How do you guide this lost soul?

| Option | Type | Text |
|---|---|---|
| A | V | You instinctively start drawing a map on a napkin or gesturing wildly, pointing out landmarks. |
| B | A | You give clear, spoken step-by-step instructions: "Go left at the weird statue, then right after you hear the faint sound of despair..." |
| C | R | You write down the directions, complete with street names and maybe even little arrows. |
| D | K | You say, "Follow me!" and physically walk them at least part of the way, or mime the turns. |

---

### Question 4

**Scenario:**
You've got a big presentation coming up. Forget the content for a second – how are you *really* preparing to deliver it smoothly?

| Option | Type | Text |
|---|---|---|
| A | V | You create visually appealing slides with charts, images, and minimal text. It's all about the visual flow. |
| B | A | You rehearse out loud, maybe recording yourself to catch the rhythm and tone. You might even talk it through with your pet goldfish. |
| C | R | You write out detailed notes or even a full script. Having the words in front of you is comforting. |
| D | K | You practice by pacing around the room, using hand gestures, and physically running through the motions of the presentation. |

---

### Question 5

**Scenario:**
You're picking up a new skill, say, learning basic guitar chords. What's your jam?

| Option | Type | Text |
|---|---|---|
| A | V | Watching video lessons where you can see finger placements clearly. |
| B | A | Listening intently to the sound of the chords, maybe using an app that plays them back, or having a teacher guide you by ear. |
| C | R | Using chord diagrams, sheet music, or written tutorials explaining the theory and finger positions. |
| D | K | Just grabbing the guitar and trying to mimic shapes and sounds, getting the feel for it through practice and muscle memory. |

---

### Question 6

**Scenario:**
You're in a meeting or lecture, and important information is being shared. How do you make sure it sticks?

| Option | Type | Text |
|---|---|---|
| A | V | You're drawn to diagrams, charts, or mind maps shown. If the speaker uses visuals, you're golden. |
| B | A | You focus intently on listening, catching nuances in tone. You might even repeat key phrases quietly to yourself. |
| C | R | You're taking detailed notes, maybe even transcribing large parts of what's being said or written. |
| D | K | You need to *do* something. Doodling related concepts, fidgeting slightly, or imagining applying the information helps you focus. |

---

### Question 7

**Scenario:**
You need to remember someone's phone number. Just saying "put it in your contacts" is cheating. How does your brain attempt this heroic feat?

| Option | Type | Text |
|---|---|---|
| A | V | You visualize the numbers written down or on a keypad. |
| B | A | You say the number out loud, maybe in a sing-song rhythm. |
| C | R | You write the number down. Multiple times. On different surfaces. |
| D | K | You practice dialing the number on your phone or keypad. |

---

### Question 8

**Scenario:**
You're planning a trip. Forget budget airlines for a sec, how are you figuring out what to *do* there?

| Option | Type | Text |
|---|---|---|
| A | V | You're scrolling through travel photos, watching vlogs, looking at maps and brochures. |
| B | A | You're listening to travel podcasts, talking to friends who've been there, soaking up stories and recommendations. |
| C | R | You're reading travel guides, blogs, articles, and making detailed lists of sights and restaurants. |
| D | K | You're looking at interactive maps, maybe doing a virtual tour, or focusing on activities like hikes, cooking classes, or workshops you can physically participate in. |

---

### Question 9

**Scenario:**
Okay, tech wizard. There's a new app everyone's raving about, promising to organize your sock drawer via Bluetooth (don't ask). How do you figure this thing out?

| Option | Type | Text |
|---|---|---|
| A | V | Watch the official demo videos or look for screenshot tutorials. Seeing is believing... or at least understanding. |
| B | A | Listen to a podcast review explaining its features or have a tech-savvy friend walk you through it over the phone. |
| C | R | Dive into the user manual, FAQs, or online help articles. You need the written word! |
| D | K | Just start tapping buttons and exploring menus. You learn by doing, even if it means accidentally ordering 100 pairs of argyle socks. |

---

### Question 10

**Scenario:**
You're at a gathering, meeting a dozen new people whose names instantly try to escape your brain. What's your strategy to avoid calling everyone "buddy"?

| Option | Type | Text |
|---|---|---|
| A | V | You try to associate their face with their name, maybe visualizing the name written on their forehead (discreetly, of course). |
| B | A | You repeat their name back to them when introduced and try to use it in conversation soon after. Hearing it helps. |
| C | R | You discreetly jot down names and maybe a defining feature ("Dave - loud shirt") on your phone or a napkin. |
| D | K | You rely on a firm handshake and try to connect the name to the physical interaction or the context of how you met them. |

---

### Question 11

**Scenario:**
Decision time! You and your friends are hungry, bordering on hangry. How do you usually pick a place to eat?

| Option | Type | Text |
|---|---|---|
| A | V | You scroll through food pics online, look at photos of the restaurant's ambiance, or check out its menu design. |
| B | A | You rely on word-of-mouth recommendations, listen to friends debate options, or call the restaurant to ask about specials. |
| C | R | You read online reviews, check detailed menu descriptions, or compare written lists of pros and cons for different places. |
| D | K | You prefer places you've physically been to before, or you might suggest walking around to see what looks good in person. |

---

### Question 12

**Scenario:**
Something went wrong – maybe a delivery was incorrect, or a service wasn't up to par. How do you typically approach resolving it?

| Option | Type | Text |
|---|---|---|
| A | V | You prefer to see evidence, like photos of the issue, or use a live video chat if possible to show the problem. |
| B | A | You want to talk it through on the phone or in person, explaining the situation and listening to the response. |
| C | R | You write a detailed email or letter outlining the problem, referencing order numbers and dates. You want a written record. |
| D | K | You might physically take the item back to the store or prefer a face-to-face interaction to demonstrate the issue. |

---

### Question 13

**Scenario:**
The day has beaten you up a bit. How do you typically unwind and recharge your batteries?

| Option | Type | Text |
|---|---|---|
| A | V | Watching a movie, scrolling through visually pleasing social media, or looking at art/photography. |
| B | A | Listening to music, a podcast, an audiobook, or just enjoying some peace and quiet. |
| C | R | Reading a book, catching up on news articles, or writing in a journal. |
| D | K | Engaging in a physical activity like exercise, cooking, gardening, crafting, or taking a long bath. |

---

## 10. Results Page — Loading State

**Source:** `src/components/results/ResultsPage.tsx`

Shown for ~500 ms while scores are decoded/calculated.

| Element | Text |
|---|---|
| H3 | Analyzing Your Results... |
| Subtext | We're calculating your learning style preferences |

---

## 11. Results Page — Header & Score Card

**Source:** `src/components/results/ResultsPage.tsx`

### Page Header

| Element | Text |
|---|---|
| H1 | Your Results |
| Subtitle | VARK Learning Style |

### Congratulations Message (dynamic, H3)

The message shown depends on the user's dominant learning style(s).

| Condition | Text |
|---|---|
| Single dominant: Visual | You're primarily a Visual learner! |
| Single dominant: Auditory | You're primarily an Auditory learner! |
| Single dominant: Read/Write | You're primarily a Read/Write learner! |
| Single dominant: Kinesthetic | You're primarily a Kinesthetic learner! |
| Default / fallback | Congratulations on completing the assessment! |
| Multimodal (2+ dominant styles) | You have a multimodal learning style with strengths in {Style} and {Style}! |

### Score Card Subtext

| Element | Text |
|---|---|
| Description | Here's how your brain prefers to process information |

---

## 12. Results Page — Share Your Results

**Source:** `src/components/results/ResultsPage.tsx`

| Element | Text |
|---|---|
| Section heading (H4) | Share Your Results |
| Copy button (default state) | Copy |
| Copy button (post-click state) | Copied! |
| Copy button `title` tooltip | Copy to clipboard |
| Share button label | Share |
| Share button `title` tooltip | Share results |

---

## 13. Results Page — Your Results Link Card

**Source:** `src/components/results/ResultsPage.tsx`

| Element | Text |
|---|---|
| Card heading (H3) | Your results link |
| Card description | Bookmark or share this URL to return to your results any time — no retake needed. |
| Copy link button (default state) | Copy link |
| Copy link button (post-click state) | Copied! |

---

## 14. Results Page — Retake Quiz Card

**Source:** `src/components/results/ResultsPage.tsx`

| Element | Text |
|---|---|
| Card heading (H3) | Want to try again? |
| Retake button | Retake Quiz |

---

## 15. Results Chart

**Source:** `src/components/results/ResultsChart.tsx`

### Bar Labels (below each bar)

| Code | Label |
|---|---|
| V | Visual |
| A | Auditory |
| R | Read/Write |
| K | Kinesthetic |

### Legend (bottom grid)

| Cell | Text |
|---|---|
| V | V: Visual |
| A | A: Auditory |
| R | R: Read/Write |
| K | K: Kinesthetic |

---

## 16. Results Explanation — Section Header & States

**Source:** `src/components/results/ResultsExplanation.tsx`

| Element | Text |
|---|---|
| Section heading (H3) | Understanding Your Learning Style |
| Empty state (no questions answered) | Complete more questions to see your results! |

### Multimodal State (3+ dominant styles)

| Element | Text |
|---|---|
| Paragraph 1 | You have a **multimodal learning style** with strengths across several categories. This means you're adaptable and can learn effectively through different methods. |
| RayRayRay quote | RayRayRay says: *"Your brain is like a learning Swiss Army knife — ready for whatever information comes your way. Lucky you!"* |

---

## 17. Results Explanation — Visual Learner

**Source:** `src/components/results/ResultsExplanation.tsx`

| Element | Text |
|---|---|
| Title (H4) | Visual Learner |
| Description | You process information best when it's presented visually. Charts, diagrams, and demonstrations help you understand and remember concepts more effectively. |
| Tips heading (H5) | Learning Tips: |

**Tips:**
1. Use color-coding and highlighters in your notes
2. Convert text information into diagrams, charts, and mindmaps
3. Watch video demonstrations before attempting new tasks
4. Use flashcards with images and visual cues

---

## 18. Results Explanation — Auditory Learner

**Source:** `src/components/results/ResultsExplanation.tsx`

| Element | Text |
|---|---|
| Title (H4) | Auditory Learner |
| Description | You learn best through listening and verbal communication. Discussions, lectures, and talking through ideas help you process information effectively. |
| Tips heading (H5) | Learning Tips: |

**Tips:**
1. Record lectures or read your notes aloud to review later
2. Discuss concepts with others to solidify understanding
3. Use mnemonic devices and rhymes to remember information
4. Consider audiobooks or podcast learning materials

---

## 19. Results Explanation — Read/Write Learner

**Source:** `src/components/results/ResultsExplanation.tsx`

| Element | Text |
|---|---|
| Title (H4) | Read/Write Learner |
| Description | You prefer information displayed as words. Reading and writing help you understand and remember concepts most effectively. |
| Tips heading (H5) | Learning Tips: |

**Tips:**
1. Take detailed notes and rewrite them to enhance memory
2. Convert diagrams and charts into written descriptions
3. Create lists, headings, and organized notes
4. Look for text-based resources rather than visual or interactive ones

---

## 20. Results Explanation — Kinesthetic Learner

**Source:** `src/components/results/ResultsExplanation.tsx`

| Element | Text |
|---|---|
| Title (H4) | Kinesthetic Learner |
| Description | You learn through doing, experiencing, and hands-on activities. Physical involvement helps you understand and remember information. |
| Tips heading (H5) | Learning Tips: |

**Tips:**
1. Use physical objects or models when possible
2. Take breaks to move around while studying
3. Apply concepts to real-world scenarios or case studies
4. Create physical flashcards you can manipulate and arrange

---

## 21. Results Explanation — Balanced Learner (default fallback)

**Source:** `src/components/results/ResultsExplanation.tsx`

Shown when no dominant style is identified.

| Element | Text |
|---|---|
| Title (H4) | Balanced Learner |
| Description | You have a flexible learning style and can adapt to different teaching methods. |
| Tips heading (H5) | Learning Tips: |

**Tips:**
1. Use a variety of learning techniques
2. Adapt your approach based on the subject matter
3. Take advantage of different resources available
4. Share your learning flexibility with teachers and peers

---

## 22. Results Explanation — Closing Quote

**Source:** `src/components/results/ResultsExplanation.tsx`

Shown at the bottom of the Results Explanation card regardless of style.

> "Knowing your learning style is like having the cheat code for your brain. Now you can stop forcing yourself to learn like everyone else and start playing to your strengths!"
>
> — RayRayRay

---

## 23. AI Prompts Card — Card Header & Labels

**Source:** `src/components/results/AIPromptsCard.tsx`

### Card Header

| Element | Text |
|---|---|
| H3 | Your AI Learning Prompts |
| Description | Copy these prompts into any AI tool — ChatGPT, Claude, Gemini, or any other — to make it adapt to your learning style instantly. |

### System Prompt Block

| Element | Text |
|---|---|
| Block label (H4) | System Prompt |
| Block description | Paste this into a custom instructions or system prompt field to pre-configure any AI tool for your learning style. |
| Copy button (default) | Copy |
| Copy button (post-click) | Copied! |

### Conversation Prompt Block

| Element | Text |
|---|---|
| Block label (H4) | Conversation Prompt |
| Block description | Drop this into any live AI chat to immediately reorient the conversation to your VARK style. |
| Copy button (default) | Copy |
| Copy button (post-click) | Copied! |

---

## 24. AI Prompts Card — System Prompt Templates

**Source:** `src/utils/aiPrompts.ts`

These are the exact text strings injected into the generated System Prompt. The final output is assembled dynamically from the templates below.

### Style Descriptions (used in opening sentence)

| Style | Description string |
|---|---|
| V | visual |
| A | auditory |
| R | read/write |
| K | kinesthetic |

### Opening Sentence Patterns

| Condition | Pattern |
|---|---|
| Single dominant style | `I am a {style} learner (VARK: V={V}, A={A}, R={R}, K={K}).` |
| Two dominant styles | `I am a {styleA}-{styleB} learner (VARK: V={V}, A={A}, R={R}, K={K}).` |
| Three or more dominant styles | `I am a highly multimodal learner with strengths in {style1}, {style2}, … (VARK: V={V}, A={A}, R={R}, K={K}).` |

### Communication Instructions (per style)

**Visual (V):**
> Structure every response with clear headers, sub-headers, and bullet points instead of dense paragraphs. Use tables, diagrams (ASCII or described), flowcharts, and spatial metaphors whenever they can clarify a concept.

**Auditory (A):**
> Use conversational, spoken-style language. Explain concepts as if you are walking me through them out loud — use rhetorical questions, verbal analogies, and storytelling to make ideas stick.

**Read/Write (R):**
> Use precise written definitions, labeled terminology, and numbered lists. Provide structured summaries with clear headings and sub-points so information reads like well-organized reference material.

**Kinesthetic (K):**
> Lead with a concrete, real-world example or hands-on scenario before introducing any theory. Frame every explanation around doing — "here's how you'd apply this" — rather than abstract description.

### Structure Instructions (per style)

**Visual (V):**
> Favor visual hierarchy — indent, bold key terms, and separate ideas with whitespace so the page layout itself communicates structure.

**Auditory (A):**
> Avoid dry bullet lists when a flowing narrative would be clearer. Write the way a great teacher speaks.

**Read/Write (R):**
> Prioritize accuracy of wording — define terms before using them and provide written outlines for complex topics.

**Kinesthetic (K):**
> Provide step-by-step practical exercises, worked examples, or "try this now" activities wherever possible.

### Check-In Instructions (per style)

**Visual (V):**
> When I seem stuck, offer a diagram, visual analogy, or restructured layout to reframe the idea.

**Auditory (A):**
> When I seem stuck, re-explain using a different verbal framing or a fresh analogy.

**Read/Write (R):**
> When I seem stuck, offer a definitions-first restatement or a written outline of the key points.

**Kinesthetic (K):**
> When I seem stuck, offer a different practical example or a step-by-step exercise I can work through.

### Dual-Style Check-In Pattern

> When I seem stuck, try both: {check-in action A} Alternatively, {check-in action B (lowercased first letter)}

### Three-or-More Styles — Full Fixed Body

> Vary your response format freely — mix visual structure (headers, bullet points, tables) with conversational explanations, precise written definitions, and concrete real-world examples. Match the format to whatever makes each concept clearest.
>
> Don't lock into one communication style. Switch between diagrams, narratives, structured lists, and hands-on exercises depending on the topic.
>
> When I seem stuck, try reframing with a completely different format — a diagram if you used prose, a practical example if you used a list, or a verbal walkthrough if you used a table.

---

## 25. AI Prompts Card — Conversation Prompt Templates

**Source:** `src/utils/aiPrompts.ts`

### Style Preference Phrases (per style)

| Style | Preference phrase |
|---|---|
| V | I understand best through diagrams, charts, visual hierarchy, and structured layouts |
| A | I learn best through conversational explanations, verbal walkthroughs, and spoken-style analogies |
| R | I learn best through precise definitions, numbered lists, structured text, and written summaries |
| K | I learn best through real-world examples, hands-on exercises, and step-by-step practical walkthroughs |

### Conversation Prompt Patterns

| Condition | Pattern |
|---|---|
| Single dominant style | `I'm a {Style} learner — {preference phrase}. Please adapt your responses to match this style.` |
| Two dominant styles | `I'm a {StyleA}-{StyleB} learner — {preference A}, and {preference B (lowercased)}. Please adapt your responses to blend both styles.` |
| Three or more dominant styles | `I'm a multimodal learner (VARK: V={V}, A={A}, R={R}, K={K}) — I learn through a mix of visual, verbal, written, and hands-on approaches. Please vary your format to match whatever makes each concept clearest.` |

### Example Generated Outputs (illustrative — actual output is score-dependent)

**Pure Visual (e.g. V=9, A=1, R=1, K=2):**
```
I'm a Visual learner — I understand best through diagrams, charts, visual hierarchy, and structured layouts. Please adapt your responses to match this style.
```

**Visual-Kinesthetic tie (e.g. V=6, A=2, R=1, K=6):**
```
I'm a Visual-Kinesthetic learner — I understand best through diagrams, charts, visual hierarchy, and structured layouts, and I learn best through real-world examples, hands-on exercises, and step-by-step practical walkthroughs. Please adapt your responses to blend both styles.
```

**Highly multimodal (e.g. V=4, A=4, R=4, K=4):**
```
I'm a multimodal learner (VARK: V=4, A=4, R=4, K=4) — I learn through a mix of visual, verbal, written, and hands-on approaches. Please vary your format to match whatever makes each concept clearest.
```

---

## 26. Web Share API Metadata

**Source:** `src/components/results/ResultsPage.tsx`

Used when the native OS share sheet is triggered via the Share button.

| Field | Text |
|---|---|
| `title` | My Varkly Learning Style Results |
| `text` | Check out my learning style profile! |

---

## 27. Error / Alert Messages

**Source:** `src/components/results/ResultsPage.tsx`

| Trigger | Message |
|---|---|
| Clipboard write fails on the "Copy" or "Share" button | Could not copy to clipboard. Please copy the URL manually. |
| Clipboard write fails on the "Copy link" button | Could not copy to clipboard. Please copy the URL manually. |
| Invalid or malformed `/r/:hash` URL | *(Silent redirect to `/` — no user-facing message)* |

---

## 28. 404 Page

**Source:** `src/components/shared/NotFoundPage.tsx`

| Element | Text |
|---|---|
| Page title (H1) | 404 |
| Heading (H2) | Page not found |
| Body text | The page you're looking for doesn't exist or has been moved. |
| CTA button | Back to Home |
