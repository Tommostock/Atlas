# CLAUDE.md — Atlas

You are building **Atlas**, a mobile-first trip planning PWA for Tom. Read `SPEC.md` fully before starting any work. It is the single source of truth for every design and technical decision.

---

## About Tom

- Self-taught hobby developer. Does not know how to code. Explain what you're doing in plain English as you go.
- Hardware: Windows PC, testing on iPhone.
- Deploys via GitHub + Vercel (both free tier).
- Has built multiple PWAs with this stack before — he knows the workflow but not the syntax.

---

## Stack

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS + shadcn/ui (new-york style, neutral base)
- Supabase (free tier) — Postgres, Auth, RLS
- Google Gemini API (free tier) — `gemini-2.0-flash`
- Vercel (free tier hosting)
- Lucide React icons
- next-pwa for service worker

---

## Hard rules — never break these

- **Dark theme only.** Background `#0F0F0F`, surface `#1A1A1A`. No light mode, no light-mode classes.
- **No gradients.** Flat colours and borders only.
- **No emojis in UI.** The only exception is the user-chosen cover emoji on trip cards, which is user content, not UI.
- **No drop shadows.** Use `border border-[#2E2E2E]` instead of shadow on dark backgrounds.
- **Mobile-first.** Every component is designed at 390px width first. Nothing breaks below 390px.
- **Accent colour is `#C87941` (warm amber).** Use it for primary buttons, active states, and the single accent moment on each screen. Do not overuse it.
- **Fraunces** (serif, Google Fonts) for display text — trip names, day headings, large cost totals.
- **Inter** (sans-serif, Google Fonts) for all body text and UI labels.
- **Tabular nums** on any number that could change width (costs, times, counts): `font-variant-numeric: tabular-nums`.
- **Touch targets minimum 44px.** Every tappable element meets this.
- **Free tier only.** Never suggest a paid service, a paid API, or a configuration that would cost money.
- **Well-commented code.** Write comments as if explaining each step to a beginner who has never seen code before. Use full English sentences, not one-word labels.
- **Build strictly in phases** as defined in SPEC.md. Do Phase 1 completely before touching Phase 2.
- **Commit after every working feature** with a clear present-tense message (e.g. `add stop card component`, not `added stop card`).
- **Stop at the end of each phase** and tell Tom exactly what to test before you continue.

---

## Before writing any feature code

1. Set up **shadcn/ui** fully (init, add all needed components listed in SPEC.md)
2. Set up **Sentry** for error monitoring (free tier, `@sentry/nextjs`)
3. Confirm both are working before touching any feature

---

## Environment variables

Create `.env.local` (gitignored). Tom will fill in real values:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GEMINI_API_KEY=
NEXT_PUBLIC_SENTRY_DSN=
```

Phase 1 does not use any of these. The app must run without them in Phase 1.

---

## Git workflow

```bash
# After project init:
git remote add origin https://github.com/YOUR_USERNAME/atlas.git
git branch -M main
git push -u origin main
```

Tom will create the GitHub repo called `atlas` before starting. If the repo already has a README, run `git pull origin main --allow-unrelated-histories` first.

Commit frequently. One feature per commit. No bundled mega-commits.

---

## Key things to get right

### The SVG schematic map
This is the most technically important component. It must:
- Accept an array of stops with `lat` and `lng` values
- Use Web Mercator projection to convert lat/lng to accurate relative SVG positions
- Add generous padding (min 80px all sides) so pins never sit at the edge
- Render hotel as a dark "H" pin, numbered stops as amber pins
- Scale correctly at any `width` — use `viewBox` with `preserveAspectRatio="xMidYMid meet"`
- Not depend on any external tile server or map API
- Each pin must be tappable and open Google Maps walking directions

The projection formula:
```typescript
function toMercator(lat: number, lng: number) {
  const x = lng * 20037508.34 / 180
  const y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180) * 20037508.34 / 180
  return { x, y }
}
```

Compute bounds from all stops + hotel, then map to SVG space with padding.

### The bottom tab bar
- Fixed to bottom of screen
- Respects `env(safe-area-inset-bottom)` for iPhone notch
- Four tabs: Itinerary, Map, Costs, Info
- Active tab uses accent colour (`#C87941`)
- Uses `backdrop-filter: blur(10px)` with semi-transparent background

### Stop card categories
Four categories, each with a distinct subtle colour treatment:
- `free` — green badge (`#5C8A52`)
- `paid` — amber badge (`#C87941`) with "Book ahead" label
- `food` — warm neutral badge
- `transport` — muted blue-grey badge

### Cost calculations
All costs stored as `cost_amount` (numeric, per person). The Costs tab:
- Shows total per person and total for party (configurable party size, default 2)
- Breaks down by day
- Breaks down by category
- Highlights stops with `ticket_url` that haven't been booked

---

## Hardcoded data for Phase 1

Use Rome trip data for Phase 1 so the UI is immediately meaningful and testable, not blank. This data represents a typical 3-day city trip and exercises every component.

```typescript
// lib/rome-sample-data.ts
// Full Rome itinerary — used only in Phase 1 to test all UI components
// Replaced by real Supabase data in Phase 2
```

Include all three days, a hotel, a mix of stop categories, ticket URLs, lat/lng values for the map, and a packing list.
