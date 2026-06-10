# 🌍 EcoTrace — Carbon Footprint Awareness Platform

> Built for **PromptWars: Virtual — Challenge 3**
> *"Design a solution that helps individuals understand, track, and reduce their carbon footprint through simple actions and personalised insights."*

EcoTrace turns an abstract number — your annual CO₂ — into something you can
**understand, feel, and act on**. Enter how you live, and it shows your footprint
broken down by category, compares it to climate targets, translates it into
real-world equivalents, and gives you AI-personalised ways to cut it.

## ✨ Features

| | Feature | Problem statement |
| - | --- | --- |
| 📊 | **Footprint calculator** — transport, home energy, diet & shopping, with India-specific emission factors | *Understand & track* |
| 🍩 | **Visual breakdown** — accessible, dependency-free SVG donut + comparison bars | *Understand* |
| 🧭 | **Awareness layer** — compares you to the 1.5°C target, India average & global average | *Understand* |
| 🌳 | **Real-world equivalencies** — "= X trees / Y km driven / Z flights" | *Understand* |
| ✨ | **Gemini-powered insights** — personalised, educational guidance via Google Gemini | *Personalised insights* |
| 🎯 | **Action tracker** — pick simple actions, watch your projected footprint drop, saved on-device | *Reduce through simple actions* |
| 📈 | **Progress tracking** — save monthly snapshots, see a trend sparkline and your change vs. last time | *Track over time* |

## 🧱 Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Google Gemini** (`@google/genai`) for personalised insights — *the Google AI service*
- **Vitest** for unit tests
- **localStorage** for persistence (no backend, no account, no PII)

## 🚀 Getting started

```bash
npm install
cp .env.example .env.local   # add your Gemini API key (optional)
npm run dev                  # http://localhost:3000
```

Get a free Gemini API key at <https://aistudio.google.com/apikey>.
**Without a key the app still works** — it falls back to built-in, rule-based
guidance, so the deployed demo is never broken.

## 🧪 Testing

```bash
npm test        # run the emissions-engine unit tests
npm run lint    # eslint
```

The pure calculation engine (`src/lib/emissions.ts`, `src/lib/actions.ts`) is
covered by unit tests (`src/lib/emissions.test.ts`).

## 🔐 Security & privacy

- The **Gemini API key is read server-side only** (`/api/insights`) and never
  shipped to the browser.
- The insights route performs **strict input validation** (types + enums) and is
  **rate-limited** (429 after 10 requests/min per client) to guard the AI endpoint.
- All user data stays **on the user's device** (`localStorage`) — no database,
  no accounts, no tracking.

## 📁 Project structure

```
src/
  app/
    layout.tsx            # metadata, fonts
    page.tsx              # client orchestrator (state + persistence)
    globals.css           # theme tokens (light + dark)
    api/insights/route.ts # server-side Gemini call + fallback
  components/
    Calculator.tsx        # accessible input form
    Results.tsx           # donut, comparisons, equivalencies (+ a11y table)
    DonutChart.tsx        # zero-dependency SVG chart
    Insights.tsx          # AI insights panel
    ActionTracker.tsx     # reduction actions + projected savings
  components/
    History.tsx           # progress tracking: sparkline + trend
  lib/
    emissions.ts          # pure calculation engine
    actions.ts            # reduction-action catalogue
    insights.ts           # AI prompt, validation, fallback, rate limit
    history.ts            # snapshot history + trend logic
    format.ts             # category metadata & formatters
    types.ts              # shared domain types
    *.test.ts             # 40 unit tests
```

## ♿ Accessibility

Semantic landmarks and headings, labelled form controls, a screen-reader data
table mirroring the chart, `aria-live` insight updates, visible focus rings,
and `prefers-reduced-motion` support.

## 📐 A note on the numbers

Emission factors are well-documented, rounded estimates suitable for an
**awareness tool**, not a certified carbon audit. See inline source notes in
`src/lib/emissions.ts`.

---

🤖 Built with Google Gemini · `#BuildwithAI #PromptWarsVirtual #Challenge3`
