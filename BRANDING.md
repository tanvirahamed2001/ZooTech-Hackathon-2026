# Varkly — Brand Style Guide

Extracted from the production codebase for use in presentations, marketing materials, and design handoff.

---

## 1. Primary Colors (Violet / Indigo)

The core brand identity uses a violet-to-indigo spectrum for buttons, headings, focus rings, and accents.

| Token | Hex | Usage |
|---|---|---|
| `violet-400` | `#a78bfa` | Dark-mode gradient text, dark-mode button hover |
| `violet-500` | `#8b5cf6` | Primary button start, checkbox fill, focus rings, progress bar start |
| `violet-600` | `#7c3aed` | Primary button hover start, link/action text (light mode) |
| `indigo-400` | `#818cf8` | Dark-mode gradient text end |
| `indigo-500` | `#6366f1` | Primary button end, progress bar end |
| `indigo-600` | `#4f46e5` | Primary button hover end |

### Custom brand token

| Token | Hex | Usage |
|---|---|---|
| `varkly-violet` | `#8B5CF6` | Brand-level alias for violet-500 |
| `varkly-dark` | `#1e1b4b` | Dark-mode body gradient anchor |

---

## 2. VARK Category Colors

Each learning style has a dedicated accent color used in the results bar chart and category badges.

| Style | Hex | Tailwind Equivalent | Usage |
|---|---|---|---|
| **Visual (V)** | `#af52de` | Custom (≈ purple-500) | Bar chart, category badge |
| **Auditory (A)** | `#0071e3` | Custom (Apple-inspired blue) | Bar chart, category badge |
| **Read/Write (R)** | `#34c759` | Custom (≈ green-500) | Bar chart, category badge |
| **Kinesthetic (K)** | `#ff9f0a` | Custom (≈ amber-500) | Bar chart, category badge |

### Category Badge Backgrounds (Light / Dark)

| Style | Light BG | Dark BG | Light Border | Dark Border |
|---|---|---|---|---|
| Visual | `violet-50` | `violet-900/20` | `violet-100` | `violet-800` |
| Auditory | `blue-50` | `blue-900/20` | `blue-100` | `blue-800` |
| Read/Write | `emerald-50` | `emerald-900/20` | `emerald-100` | `emerald-800` |
| Kinesthetic | `amber-50` | `amber-900/20` | `amber-100` | `amber-800` |

---

## 3. Neutral Palette

| Token | Hex | Usage |
|---|---|---|
| `gray-100` | `#f3f4f6` | Code block background, border (light) |
| `gray-200` | `#e5e7eb` | Card shadow base, border (light), progress track |
| `gray-300` | `#d1d5db` | Checkbox border (unselected) |
| `gray-400` | `#9ca3af` | Hint text (dark mode) |
| `gray-500` | `#6b7280` | Secondary label text |
| `gray-600` | `#4b5563` | Body text (light mode) |
| `gray-700` | `#374151` | Dark-mode card border, dark-mode hover background |
| `gray-800` | `#1f2937` | Heading text (light mode), dark-mode card BG |
| `gray-900` | `#111827` | Nav background (dark mode) |
| `white` / `#ffffff` | — | Card BG (light), button BG (secondary light) |

---

## 4. Semantic / Feedback Colors

| Role | Token | Hex | Usage |
|---|---|---|---|
| Success | `emerald-100` / `emerald-700` | `#d1fae5` / `#047857` | "Copied!" feedback state |
| Error / Danger | `red-*` | (reserved) | Error states (design token defined, not yet used in UI) |
| Warning / Quote | `amber-50` → `orange-50` | `#fffbeb` → `#fff7ed` | Callout boxes, RayRayRay quotes |
| Warning text | `amber-900` | `#78350f` | Quote text (light mode) |

---

## 5. Gradients

### 5.1 Page Background — Light Mode

```css
background: linear-gradient(135deg,
  #f0e7ff   0%,    /* soft lavender */
  #e0f2fe  25%,    /* sky blue */
  #d1fae5  50%,    /* mint green */
  #fef3c7  75%,    /* warm cream */
  #fce7f3 100%     /* soft pink */
);
background-attachment: fixed;
```

### 5.2 Page Background — Dark Mode

```css
background: linear-gradient(135deg,
  #1e1b4b   0%,    /* deep indigo */
  #312e81  25%,    /* dark violet */
  #1e3a5f  50%,    /* midnight blue */
  #134e4a  75%,    /* dark teal */
  #451a03 100%     /* deep brown */
);
background-attachment: fixed;
```

### 5.3 Primary Button Gradient

```
Light: from-violet-500 (#8b5cf6) → to-indigo-500 (#6366f1)
Dark:  from-violet-600 (#7c3aed) → to-indigo-600 (#4f46e5)
Hover: from-violet-600 → to-indigo-600 (light) / inverted in dark
```

### 5.4 Heading Text Gradient

```
Light: from-violet-600 via-indigo-600 to-emerald-600
Dark:  from-violet-400 via-indigo-400 to-emerald-400
Applied with: bg-clip-text text-transparent
```

### 5.5 Results Page Title Gradient

```
Light: from-violet-600 → to-indigo-600
Dark:  from-violet-400 → to-indigo-400
```

### 5.6 Progress Bar Gradient

```
from-violet-500 → to-indigo-500 (same in both modes)
```

---

## 6. Typography

### Font Stack

```
Primary: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", Inter, system-ui, sans-serif
```

**Inter** is loaded from Google Fonts at weights 400, 500, 600, 700. The system font cascade ensures native feel on Apple devices and fast rendering on all others.

### Type Scale & Weights

| Element | Size (mobile) | Size (desktop) | Weight | Letter-spacing |
|---|---|---|---|---|
| Page title (h1) | `text-3xl` (1.875rem) | `text-4xl` / `text-5xl` | 700 (bold) | `tracking-tight` (−0.025em) |
| Section heading (h2) | `text-xl` (1.25rem) | `text-2xl` (1.5rem) | 600 (semibold) | `tracking-[-0.025em]` |
| Card heading (h3) | `text-xl` (1.25rem) | `text-2xl` (1.5rem) | 600 (semibold) | `tracking-[-0.025em]` |
| Subheading (h4) | `text-lg` (1.125rem) | — | 600 (semibold) | — |
| Body text | `text-base` (1rem) | `text-lg` / `text-xl` | 400 (regular) | — |
| Small label / hint | `text-sm` (0.875rem) | — | 400 / 500 | — |
| Micro text | `text-xs` (0.75rem) | — | 400 | — |
| Score number | `text-lg` (1.125rem) | — | 700 (bold) | — |

### Font Features

```css
font-feature-settings: "ss01", "ss02", "cv01", "cv02";
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

### Custom Letter-Spacing Tokens

| Token | Value | Usage |
|---|---|---|
| `apple-tight` | `−0.025em` | Heading tightening |
| `apple-tighter` | `−0.04em` | Display-level tightening (available, sparingly used) |

---

## 7. Spacing & Layout Conventions

### Container Widths

| Context | Max Width | Class |
|---|---|---|
| Nav bar content | `max-w-5xl` (64rem) | All pages |
| Main content | `max-w-4xl` (56rem) | Landing, Results |
| Quiz question card | `max-w-3xl` (48rem) | Quiz flow |
| Intro / 404 card | `max-w-2xl` (42rem) / `max-w-md` | Intro, 404 |

### Padding

| Context | Value |
|---|---|
| Page horizontal | `px-4` (1rem) |
| Card internal | `p-6` (1.5rem) → `md:p-8` (2rem) |
| Quiz option internal | `p-4` (1rem) |
| Button internal | `px-6 py-3.5` |
| Nav bar height | `h-14` (3.5rem) |

### Spacing Between Sections

| Context | Value |
|---|---|
| Between result cards | `space-y-8` (2rem) |
| Between quiz options | `space-y-4` (1rem) |
| Quiz intro tips | `space-y-5` (1.25rem) |
| Below header | `mb-8` to `mb-14` |

---

## 8. Border Radius

| Element | Radius | Class |
|---|---|---|
| Cards | `1rem` (16px) | `rounded-2xl` |
| Buttons | `1rem` (16px) | `rounded-2xl` |
| Quiz options | `0.75rem` (12px) | `rounded-xl` |
| Callout boxes | `0.75rem` (12px) | `rounded-xl` |
| Category badges | `0.75rem` (12px) | `rounded-xl` |
| Progress bar | `9999px` (full) | `rounded-full` |
| Theme toggle | `0.75rem` (12px) | `rounded-xl` |

---

## 9. Shadows

| Element | Shadow | Class |
|---|---|---|
| Card (light) | `0 20px 25px −5px rgb(229 231 235 / 0.5)` | `shadow-xl shadow-gray-200/50` |
| Card (dark) | None | `dark:shadow-none` |
| Primary button | `0 10px 15px −3px rgb(139 92 246 / 0.3)` | `shadow-lg shadow-violet-500/30` |
| Primary button hover | `0 20px 25px −5px rgb(139 92 246 / 0.4)` | `shadow-xl shadow-violet-500/40` |
| Nav bar | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | `shadow-sm` |
| Selected option | `0 10px 15px −3px rgb(196 181 253 / 0.5)` | `shadow-md shadow-violet-200/50` |

---

## 10. Motion & Animation

| Interaction | Property | Value |
|---|---|---|
| Page/card enter | opacity + translateY | `0 → 1`, `20px → 0`, duration `0.5s` |
| Question transition | opacity + translateX | Enter from right `(+20px)`, exit to left `(−20px)`, `0.3s` |
| Button hover | scale | `1.02` |
| Button tap | scale | `0.98` |
| Option stagger | delay | `0.1s` per item |
| Progress bar fill | width | `0.3s ease-out` |
| Active press (options) | scale | `0.995` |
| Spinner | rotation | `animate-spin` (infinite) |

---

## 11. Effects & Treatments

| Treatment | Properties |
|---|---|
| Glass nav | `bg-white/80 backdrop-blur-xl` (light), `bg-gray-900/80 backdrop-blur-xl` (dark) |
| Card glass | `bg-white/95 backdrop-blur` |
| Icon rendering | `shape-rendering: geometricPrecision` on all SVGs |
| Focus ring | `ring-2 ring-violet-500 ring-offset-2` |

---

## 12. Quick Reference — Color Palette (Hex Only)

For easy copy-paste into design tools:

**Brand Primary:**
- `#8b5cf6` — Violet 500 (primary)
- `#7c3aed` — Violet 600
- `#a78bfa` — Violet 400
- `#6366f1` — Indigo 500
- `#4f46e5` — Indigo 600
- `#818cf8` — Indigo 400

**VARK Chart:**
- `#af52de` — Visual (purple)
- `#0071e3` — Auditory (blue)
- `#34c759` — Read/Write (green)
- `#ff9f0a` — Kinesthetic (amber)

**Backgrounds (Light):**
- `#f0e7ff` — Gradient start (lavender)
- `#e0f2fe` — Gradient 25% (sky)
- `#d1fae5` — Gradient 50% (mint)
- `#fef3c7` — Gradient 75% (cream)
- `#fce7f3` — Gradient end (pink)

**Backgrounds (Dark):**
- `#1e1b4b` — Gradient start (deep indigo)
- `#312e81` — Gradient 25% (dark violet)
- `#1e3a5f` — Gradient 50% (midnight blue)
- `#134e4a` — Gradient 75% (dark teal)
- `#451a03` — Gradient end (deep brown)

**Neutrals:**
- `#ffffff` — White (card BG, button BG)
- `#f3f4f6` — Gray 100
- `#e5e7eb` — Gray 200
- `#d1d5db` — Gray 300
- `#9ca3af` — Gray 400
- `#6b7280` — Gray 500
- `#4b5563` — Gray 600
- `#374151` — Gray 700
- `#1f2937` — Gray 800
- `#111827` — Gray 900

**Feedback:**
- `#10b981` — Emerald 500 (success accent)
- `#f59e0b` — Amber 500 (warning accent)
