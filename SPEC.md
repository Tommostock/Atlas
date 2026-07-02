# SPEC.md — Atlas

**Atlas** is a mobile-first trip planning PWA. You describe a trip, and Atlas helps you build a day-by-day itinerary with stops, costs, tickets, maps, and packing — all saved to your account so every holiday lives in one place.

---

## The problem it solves

Planning a holiday involves juggling Google Docs, browser tabs, notes apps, and screenshot folders. Atlas replaces all of that with a single structured app that persists every trip, works on any phone, and costs nothing to run.

---

## Stack (all free tier)

| Layer | Tool |
|---|---|
| Framework | Next.js 15, App Router, TypeScript |
| Styling | Tailwind CSS + shadcn/ui (new-york, neutral base) |
| Database & Auth | Supabase (free tier — Postgres + Row Level Security) |
| AI features | Google Gemini API (free tier, `gemini-2.0-flash`) |
| Hosting | Vercel (free tier, deploy from GitHub) |
| Icons | Lucide React |
| Maps | Inline SVG schematic (no tile API needed — zero cost, zero CORS issues) |

No paid APIs. No environment variables that cost money. The only keys needed are Supabase (free) and Gemini (free).

---

## Data model

### `trips` table
```
id            uuid PK
user_id       uuid FK → auth.users
name          text           -- e.g. "Rome · August 2026"
destination   text           -- e.g. "Rome, Italy"
cover_emoji   text           -- e.g. "🏛️"
start_date    date
end_date      date
hotel_name    text
hotel_address text
hotel_phone   text
hotel_lat     float8
hotel_lng     float8
currency      text           -- e.g. "EUR"
currency_symbol text         -- e.g. "€"
budget_total  numeric        -- overall trip budget
notes         text           -- free-text trip notes
created_at    timestamptz
```

### `days` table
```
id            uuid PK
trip_id       uuid FK → trips
day_number    int
date          date
label         text           -- e.g. "Arrive & explore"
vibe          text           -- e.g. "Land, settle in, wander freely"
alert         text           -- optional warning/note shown at top of day
```

### `stops` table
```
id            uuid PK
day_id        uuid FK → days
sort_order    int
time_label    text           -- e.g. "9:25" or "9:25–10:30"
name          text
description   text
category      text           -- "free" | "paid" | "food" | "transport"
cost_label    text           -- e.g. "€18pp"
cost_amount   numeric        -- numeric for budget totalling
duration_mins int
lat           float8
lng           float8
place_key     text           -- slugified place name for SVG pin lookup
ticket_url    text           -- official booking URL if applicable
directions_url text          -- pre-built Google Maps walking link
notes         text
```

### `packing_items` table
```
id            uuid PK
trip_id       uuid FK → trips
category      text           -- e.g. "Documents", "Clothing", "Tech"
label         text
checked       bool
```

### `trip_costs` view (computed)
Summed from stops.cost_amount per trip — used in the Costs tab.

---

## App structure

### Auth
- Email + password via Supabase Auth
- Magic link option
- Protected routes — unauthenticated users see landing page only
- User has many trips; all data scoped by RLS to `auth.uid()`

### Landing page (`/`)
- Shows when logged out
- App name, one-line pitch, "Sign in" and "Create account" buttons
- Dark, minimal — consistent with the app's design language

### Dashboard (`/dashboard`)
- Grid of trip cards — each shows destination emoji, name, dates, and days until departure (or "Ongoing" / "Past")
- "New trip" button → opens create trip sheet
- Empty state: friendly prompt to create first trip

### Trip view (`/trip/[id]`)
This is the core screen. Bottom tab bar with four tabs:

#### Tab 1 — Itinerary
- Day selector at top (pill buttons: Fri 14, Sat 15, Sun 16 etc.)
- Day hero: pill label + date heading + vibe subtitle
- Optional alert box (gold, warning triangle icon)
- Vertical timeline of stops
- Each stop card shows: time, name, description, cost, duration, category tag, "Buy tickets" button (if ticket_url), "Walking directions" button (if lat/lng)
- Tap any stop → highlights it; map tab shows that location

#### Tab 2 — Map
- Inline SVG schematic map (geographically projected from lat/lng of all stops for the active day)
- Hotel always shown as "H" pin in dark ink
- Numbered pins for each unique location in day order
- River/terrain shapes if destination has notable geography
- Tap a pin → opens Google Maps walking directions in browser
- Below map: scrollable list of all stops with numbered badges, "Walking directions" link on each

#### Tab 3 — Costs
- Summary card: budgeted total vs estimated spend
- Breakdown by day
- Breakdown by category (food, transport, tickets, accommodation)
- Per-person toggle (shows /2 for couples, configurable)
- "Still to book" section — stops with ticket_url that haven't been marked booked

#### Tab 4 — Info
- Collapsible sections:
  - **Hotel** — name, address, phone, check-in, map link
  - **Book in advance** — any stop with a ticket_url, shown as tappable rows
  - **Getting around** — user-filled transport notes (taxi prices, metro info)
  - **Things to know** — freeform notes per trip
  - **Packing list** — checkable items by category; items persist checked state
- Packing list has "Suggest items" button → calls Gemini to suggest items based on destination, dates, and trip type

### Create/edit trip sheet
Slides up from bottom. Fields:
- Destination (text)
- Trip name (auto-suggested: "{Destination} · {Month Year}")
- Cover emoji picker (small grid of relevant options)
- Dates (start + end, date pickers)
- Hotel name, address, phone
- Currency + symbol
- Budget (optional)

After creating trip: "Add your first day" prompt.

### Add/edit day sheet
- Date (auto-filled from day number)
- Day label (short, e.g. "Arrive & explore")
- Vibe (one sentence describing the day's feel)
- Alert (optional warning text)

### Add/edit stop sheet
Full-screen slide-up. Fields:
- Time label (text, e.g. "9:25" or "9:25–10:30")
- Stop name
- Description
- Category (segmented control: Free / Paid / Food / Transport)
- Cost (label text + optional numeric amount)
- Duration (minutes, optional)
- Latitude + Longitude (optional; filled via "Pick on map" or pasted from Google Maps)
- Ticket URL (optional)
- Notes (optional)
- "Get AI suggestions" → calls Gemini with stop name + destination to pre-fill description and suggest cost/duration

### AI integration (Gemini free tier)
Three AI features, all optional and non-blocking:

1. **Stop suggestions** — given stop name + destination, returns suggested description, typical cost, duration. Called from add/edit stop sheet.
2. **Packing suggestions** — given destination, dates, and number of days, returns a categorised packing list. Called from Info tab.
3. **Day planner** (stretch) — given destination + dates, suggests a full day's stops. User reviews before accepting.

All Gemini calls use `gemini-2.0-flash` via the free REST API. API key stored in `NEXT_PUBLIC_GEMINI_API_KEY` (fine for client-side use on a personal app; note in README this should be a server route for production).

---

## Design system

### Palette
```
--bg:           #0F0F0F    (near-black background)
--surface:      #1A1A1A    (cards, sheets)
--surface-2:    #242424    (hover states, nested cards)
--border:       #2E2E2E    (dividers, card borders)
--ink:          #F0EDE6    (primary text — warm white, not pure white)
--ink-soft:     #9A9690    (secondary text)
--ink-faint:    #5A5754    (placeholder, disabled)
--accent:       #C87941    (warm amber — the signature colour)
--accent-tint:  #2A1E12    (accent background tint)
--green:        #5C8A52    (free/success)
--green-tint:   #0F1C0E
--gold:         #9A7A3A    (warnings, alerts)
--gold-tint:    #1E1A0A
--red:          #C04040    (errors, destructive)
```

### Typography
- **Display:** `Fraunces` (Google Fonts, serif, variable optical size) — used for trip names, day headings, large numbers
- **Body:** `Inter` (Google Fonts, sans-serif) — everything else
- **Numbers/data:** `font-variant-numeric: tabular-nums` on Inter — costs, times, counts

### Rules (non-negotiable)
- Dark theme only — no light mode
- No emojis in UI (cover emoji on trip cards is the only exception — it's user-chosen content)
- No gradients
- No drop shadows on dark backgrounds (use border instead)
- Mobile-first — design at 390px, test every component at this width
- Bottom tab bar on trip view — native app feel
- Rounded corners: `rounded-2xl` for cards, `rounded-full` for pills and badges
- Touch targets minimum 44px height

### shadcn/ui components to use
Sheet, Button, Badge, Separator, Collapsible, Progress, Skeleton, Tabs (custom bottom bar, not shadcn Tabs), Input, Textarea, Select, Dialog, Checkbox, ScrollArea

---

## Phase plan

### Phase 1 — Core trip view (static data, no auth)
**Goal:** The full trip UI works with hardcoded data. You can see itinerary, map, costs, info.

Steps:
1. Init Next.js 15 project with TypeScript and Tailwind
2. Install and configure shadcn/ui (new-york, neutral)
3. Set up Google Fonts (Fraunces + Inter) in layout
4. Build the bottom tab bar component
5. Build the day selector component
6. Build the stop card component (all variants: free, paid, food, transport)
7. Build the timeline (vertical line, dots, cards)
8. Build the SVG schematic map component (takes array of stops with lat/lng, renders projected pins)
9. Build the Costs tab with hardcoded example data
10. Build the Info tab with all collapsible sections + hardcoded packing list
11. Wire all tabs together with hardcoded Rome trip data
12. Make it PWA-installable (manifest.json + service worker via next-pwa)
13. Deploy to Vercel

### Phase 2 — Auth + Supabase
**Goal:** Real accounts, real data. All trips saved per user.

Steps:
1. Create Supabase project, run schema SQL
2. Set up Supabase client in Next.js
3. Build auth pages (sign in, sign up, magic link)
4. Protect `/dashboard` and `/trip/[id]` routes
5. Build dashboard with real trip data
6. Build create/edit trip sheet
7. Build add/edit day sheet
8. Build add/edit stop sheet
9. Wire all CRUD to Supabase
10. Add RLS policies
11. Test end-to-end: create trip → add day → add stop → view itinerary

### Phase 3 — AI features
**Goal:** Gemini integration for stop suggestions and packing list.

Steps:
1. Add Gemini API key to env
2. Build stop suggestion call + UI in add/edit stop sheet
3. Build packing suggestion call + UI in Info tab
4. Handle loading/error states gracefully
5. Add "Suggest a day" feature on day view (stretch)

### Phase 4 — Polish
- Animations (Framer Motion: tab transitions, sheet slide-up, stop card tap)
- Empty states (all screens)
- Error boundaries
- Offline support (next-pwa caching)
- Share trip (read-only public link per trip)
- Sentry error monitoring
- Performance audit (Lighthouse mobile ≥ 90)

---

## File structure target
```
/app
  /layout.tsx              (fonts, metadata, providers)
  /page.tsx                (landing — shown when logged out)
  /dashboard/page.tsx
  /trip/[id]/page.tsx
  /auth/page.tsx
/components
  /trip/
    BottomTabBar.tsx
    DaySelector.tsx
    StopCard.tsx
    Timeline.tsx
    SchematicMap.tsx
  /tabs/
    ItineraryTab.tsx
    MapTab.tsx
    CostsTab.tsx
    InfoTab.tsx
  /sheets/
    CreateTripSheet.tsx
    AddDaySheet.tsx
    AddStopSheet.tsx
  /ui/                     (shadcn components)
/lib
  /supabase.ts
  /gemini.ts
  /types.ts                (TypeScript interfaces matching DB schema)
  /utils.ts                (projection math for SVG map, cost formatting, etc.)
/hooks
  useTrip.ts
  useDay.ts
  useStops.ts
```
