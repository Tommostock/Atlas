# PROMPT.md — Atlas Phase 1 Kickoff

> Paste everything below this line into Claude Code to start the build.

---

Read `CLAUDE.md` and `SPEC.md` fully before writing a single line of code. These two files are your complete brief. Every decision — design, data, naming, structure — comes from them.

Then build **Phase 1** of Atlas exactly as specified. Phase 1 means: the full trip UI working with hardcoded Rome sample data. No auth, no Supabase, no Gemini. Just the UI, perfectly built, deployed to Vercel.

Work through these steps in order. Commit after each one. Tell me what you're doing in plain English as you go.

---

## Step 1 — Project setup

Initialise a Next.js 15 project with TypeScript and Tailwind:

```bash
npx create-next-app@latest atlas --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd atlas
```

Then install dependencies:

```bash
npm install @supabase/supabase-js lucide-react next-pwa
npm install @google/generative-ai
npm install -D @types/node
```

Commit: `initial Next.js 15 project setup`

---

## Step 2 — Set up shadcn/ui BEFORE any feature code

```bash
npx shadcn@latest init
```

Choose: new-york style, neutral base colour, yes to CSS variables.

Then add every component Atlas needs:

```bash
npx shadcn@latest add sheet button badge separator collapsible progress skeleton input textarea select dialog checkbox scroll-area
```

Confirm shadcn is working by checking `components/ui/` exists and contains the added components.

Commit: `add and configure shadcn/ui components`

---

## Step 3 — Set up Sentry BEFORE any feature code

```bash
npx @sentry/wizard@latest -i nextjs
```

Follow the prompts (free tier, accept defaults). Add `NEXT_PUBLIC_SENTRY_DSN` to `.env.local`.

The app must not crash if `NEXT_PUBLIC_SENTRY_DSN` is empty — wrap Sentry init in a check.

Commit: `add Sentry error monitoring`

---

## Step 4 — Global styles and fonts

Set up `app/layout.tsx` with:
- Fraunces and Inter loaded via `next/font/google`
- CSS variables for the full design system palette from SPEC.md (all the `--bg`, `--surface`, `--accent` etc. variables)
- `background-color: var(--bg)` on `body`
- `color: var(--ink)` on `body`
- Viewport meta for mobile

Set up `app/globals.css` with Tailwind base and the CSS variable definitions.

Update `tailwind.config.ts` to extend colours with the design system tokens so we can use `bg-surface`, `text-ink`, `border-border`, `text-accent` etc. as Tailwind classes throughout the app.

Commit: `set up global styles, fonts, and design tokens`

---

## Step 5 — TypeScript types

Create `lib/types.ts` with TypeScript interfaces matching the database schema in SPEC.md:

- `Trip`
- `Day`
- `Stop` (include `category: 'free' | 'paid' | 'food' | 'transport'`)
- `PackingItem`

These types will be used everywhere — get them right now.

Commit: `add TypeScript type definitions`

---

## Step 6 — Rome sample data

Create `lib/rome-sample-data.ts` with a complete hardcoded Rome trip matching the SPEC.md data model. Include:

- The trip object (Hotel Ponte Sisto, 14–16 August 2026, EUR currency)
- Three days with labels and vibes
- All stops for all three days — mix of free, paid, food, transport categories
- Lat/lng for every location (use real Rome coordinates)
- Ticket URLs where relevant (Colosseum: `https://ticketing.colosseo.it/en/`, Pantheon: `https://portale.museiitaliani.it`)
- A packing list with at least 4 categories and 5+ items each

This is the data that drives all Phase 1 UI. Make it realistic and complete.

Commit: `add Rome sample data for Phase 1`

---

## Step 7 — SVG schematic map component

Create `components/trip/SchematicMap.tsx`.

This is the most important technical component. It must:

1. Accept `stops: Stop[]` and `hotel: { name: string; lat: number; lng: number }` as props
2. Use Web Mercator projection to convert all lat/lng values to accurate relative positions (formula in CLAUDE.md)
3. Compute the bounding box from ALL points (stops + hotel), then add 90px padding on all sides
4. Map projected coordinates to SVG space within `viewBox="0 0 820 680"`
5. Draw a background rect in `#1A1A1A`
6. Draw 2–3 decorative block shapes (city blocks) and a curved river path if the destination has one — use the actual projected positions of known landmarks to position these plausibly
7. Draw subtle road lines between key locations
8. Render hotel as an "H" pin in `#F0EDE6` (ink colour) with dark background circle
9. Render each unique non-hotel location as a numbered amber pin (`#C87941`), numbered in stop order, deduplicating locations that appear multiple times
10. Add a small label next to each pin (place name, 11px, with white paint-order stroke to stay readable)
11. Every pin must be wrapped in a `<g>` with an `onClick` that opens `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}&travelmode=walking` in a new tab
12. Use `preserveAspectRatio="xMidYMid meet"` and `width="100%"` so it scales correctly on any screen

Verify the map renders correctly with Rome data before continuing.

Commit: `add SVG schematic map component with Web Mercator projection`

---

## Step 8 — Stop card component

Create `components/trip/StopCard.tsx`.

The stop card is the core repeating element of the itinerary. It must:

- Show the stop name (bold, 15px, Fraunces for landmark names)
- Show the description (13px, ink-soft colour, 1.5 line height)
- Show a category badge (top-right): "Free" (green), "Book ahead" (amber), "Food / transport" (warm neutral)
- Show cost with a euro icon if `cost_label` is set
- Show duration with a clock icon if `duration_mins` is set
- Show a solid amber "Buy tickets" button that links to `ticket_url` if set (opens in new tab)
- Show an outlined "Walking directions" button that links to `directions_url` if set (opens in new tab)
- Have a subtle press animation (`scale(0.98)` on active) using Tailwind's `active:` variant
- Have a left border dot that is green for "free" category, amber for everything else

Commit: `add stop card component`

---

## Step 9 — Timeline component

Create `components/trip/Timeline.tsx`.

- Accepts an array of stops for the active day
- Renders a vertical timeline: time label (right-aligned, terracotta, 12px) → dot → StopCard
- Vertical line connecting dots — use `before:` pseudo-element on the stop container
- Last stop has no line below it
- Time labels are right-aligned in a fixed 52px column

Commit: `add timeline component`

---

## Step 10 — Day selector component

Create `components/trip/DaySelector.tsx`.

- Accepts array of days and active day index
- Renders pill buttons in a horizontal scroll row (no scrollbar visible)
- Each pill shows: short day name (e.g. "Fri") in small caps above, date number (e.g. "14") in Fraunces below
- Active pill: `bg-ink text-bg` (inverted)
- Inactive pill: transparent with subtle border on hover

Commit: `add day selector component`

---

## Step 11 — Itinerary tab

Create `components/tabs/ItineraryTab.tsx`.

- DaySelector at top
- Day hero section: amber pill label, Fraunces heading (date), vibe subtitle in ink-soft
- Alert box if day has an alert: gold tint background, warning triangle icon, italic text
- Timeline below
- Receives active day from parent state

Commit: `add itinerary tab`

---

## Step 12 — Map tab

Create `components/tabs/MapTab.tsx`.

- Intro text: "Day X — tap any pin for walking directions"
- SchematicMap component (passes active day's stops + hotel)
- Below map: scrollable list of stop locations as tappable rows
  - Amber numbered badge | stop name | navigation icon
  - Tapping opens Google Maps walking directions

Commit: `add map tab`

---

## Step 13 — Costs tab

Create `components/tabs/CostsTab.tsx`.

- Summary card at top: "Estimated spend" with total, with a party size toggle (1 or 2 people)
- Bar showing spend vs budget (if budget is set on the trip)
- Breakdown by day: each day's total cost
- Breakdown by category: tickets, food & drink, transport, free
- "Still to book" section: list any stops with `ticket_url` — shows name + "Buy tickets" link
- All amounts respect party size multiplier

Commit: `add costs tab`

---

## Step 14 — Info tab

Create `components/tabs/InfoTab.tsx`.

Use shadcn Collapsible for each section. All start open by default.

Sections:
1. **Hotel** — name, address, phone (formatted as tel: link), check-in time, Google Maps link
2. **Book in advance** — each stop with `ticket_url` as a tappable row with external link icon and booking notes
3. **Getting around** — static text area (editable in Phase 2); hardcode Rome transport notes for Phase 1
4. **Things to know** — static notes (editable in Phase 2); hardcode Rome tips for Phase 1
5. **Packing list** — checkable items by category; checked state stored in `useState` for Phase 1 (persisted to Supabase in Phase 2); "Suggest items (AI)" button that is greyed out in Phase 1 with tooltip "Available once AI is connected"

Commit: `add info tab`

---

## Step 15 — Bottom tab bar

Create `components/trip/BottomTabBar.tsx`.

- Fixed to bottom of screen, full width, max-width 480px centred
- Background: `rgba(26, 26, 26, 0.95)` with `backdrop-filter: blur(10px)`
- Top border: `border-t border-[#2E2E2E]`
- Padding bottom: `env(safe-area-inset-bottom)` for iPhone home indicator
- Four tabs: Itinerary (list icon), Map (map-2 icon), Costs (coins icon), Info (info-circle icon)
- Active: icon and label in `#C87941`
- Inactive: `#5A5754`
- Label text: 10.5px, font-weight 600

Commit: `add bottom tab bar`

---

## Step 16 — Trip page

Create `app/trip/[id]/page.tsx`.

For Phase 1, ignore the `id` param and always render the Rome sample data.

- Sticky top bar: trip name (Fraunces, 20px) + destination subtitle
- DaySelector
- Views container (flex-1, overflow hidden)
- One view div per tab (only active one is `display: block`)
- BottomTabBar fixed at bottom
- State: `activeTab`, `activeDay`
- When a stop is tapped in ItineraryTab → switch to Map tab and focus that location

Commit: `add trip page wiring all tabs together`

---

## Step 17 — Landing page

Update `app/page.tsx` to be a simple dark landing page:

- App name "Atlas" in Fraunces, large
- Tagline: "Every holiday, planned properly."
- Subtitle: "Store your trips, build your itinerary, know what to book and what it costs."
- Two buttons: "Sign in" and "Create account" (both link to `/auth` — which we'll build in Phase 2)
- Small print: "Free forever. No ads."

Commit: `add landing page`

---

## Step 18 — Dashboard placeholder

Create `app/dashboard/page.tsx`:

- Shows the Rome trip card (hardcoded in Phase 1)
- Trip card: destination emoji, trip name, dates, number of days, days until trip (calculated from today)
- "New trip" button (disabled in Phase 1 with tooltip "Coming in the next update")
- Clicking the trip card goes to `/trip/rome` (or any static path)

Commit: `add dashboard with sample trip card`

---

## Step 19 — PWA setup

Configure next-pwa in `next.config.ts`:

```typescript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})
```

Create `public/manifest.json`:
```json
{
  "name": "Atlas",
  "short_name": "Atlas",
  "description": "Every holiday, planned properly.",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0F0F0F",
  "theme_color": "#C87941",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Create simple icon files (solid amber `#C87941` square with "F" in Fraunces) at 192×192 and 512×512 — generate these as SVG and convert inline.

Add `<link rel="manifest" href="/manifest.json">` and `<meta name="theme-color" content="#C87941">` to `app/layout.tsx`.

Commit: `add PWA manifest and service worker`

---

## Step 20 — Deploy to Vercel

```bash
npx vercel
```

Follow prompts (link to Vercel account, project name: `atlas`, accept all defaults).

After deploy succeeds, share the live URL.

Commit: `initial Vercel deployment`

---

## When Phase 1 is done

Tell Tom:

1. The Vercel URL to open on his phone
2. Exactly what to test:
   - [ ] Landing page loads and looks right
   - [ ] Dashboard shows the Rome trip card
   - [ ] Tapping the trip card goes to the trip view
   - [ ] All four tabs switch correctly
   - [ ] Day selector switches between Fri / Sat / Sun
   - [ ] All stops show on the itinerary with correct tags and buttons
   - [ ] "Buy tickets" buttons open the right URLs
   - [ ] "Walking directions" buttons open Google Maps
   - [ ] Map tab shows the SVG schematic with pins for each day
   - [ ] Tapping a map pin opens Google Maps
   - [ ] Costs tab shows correct totals and breakdown
   - [ ] Party size toggle updates all numbers
   - [ ] Info tab shows all sections, packing list is checkable
   - [ ] App can be "Added to Home Screen" on iPhone
   - [ ] App loads correctly when opened from home screen

Do not start Phase 2 until Tom has tested Phase 1 and confirmed it all works.
