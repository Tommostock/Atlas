// This file defines the "shape" of every piece of data in Atlas.
//
// TypeScript uses these definitions to catch mistakes before the app even
// runs — for example, if we accidentally tried to read a stop's "price"
// when the field is actually called "cost_amount", the editor would
// underline it in red immediately.
//
// These shapes exactly mirror the database tables described in SPEC.md,
// so when we connect Supabase in Phase 2 the same types keep working.

/*
  A stop's category decides how it is displayed:
    "free"      — no ticket needed (green badge)
    "paid"      — needs a ticket, often booked ahead (amber badge)
    "food"      — a meal, café or gelato break (warm neutral badge)
    "transport" — trains, buses, taxis (blue-grey badge)
*/
export type StopCategory = "free" | "paid" | "food" | "transport";

// One whole trip, e.g. "Rome · August 2026".
export interface Trip {
  id: string;
  user_id: string;
  /** Display name, e.g. "Rome · August 2026" */
  name: string;
  /** Where the trip goes, e.g. "Rome, Italy" */
  destination: string;
  /** A single emoji shown on the trip card, chosen by the user */
  cover_emoji: string;
  /** First day of the trip, as "YYYY-MM-DD" */
  start_date: string;
  /** Last day of the trip, as "YYYY-MM-DD" */
  end_date: string;
  hotel_name: string;
  hotel_address: string;
  hotel_phone: string;
  /** Hotel position on the map (latitude = north/south) */
  hotel_lat: number;
  /** Hotel position on the map (longitude = east/west) */
  hotel_lng: number;
  /** Currency code, e.g. "EUR" */
  currency: string;
  /** Currency symbol shown next to amounts, e.g. "€" */
  currency_symbol: string;
  /** Overall trip budget for the whole party (optional) */
  budget_total: number | null;
  /** Free-text notes about the trip */
  notes: string;
  created_at: string;
}

// One day within a trip, e.g. "Day 2 — Ancient Rome".
export interface Day {
  id: string;
  trip_id: string;
  /** 1 for the first day, 2 for the second, and so on */
  day_number: number;
  /** The calendar date, as "YYYY-MM-DD" */
  date: string;
  /** Short title, e.g. "Arrive & explore" */
  label: string;
  /** One sentence describing the day's feel */
  vibe: string;
  /** Optional warning shown in a gold box at the top of the day */
  alert: string | null;
}

// One stop within a day — a sight, a meal, or a journey.
export interface Stop {
  id: string;
  day_id: string;
  /** Position within the day: 1 = first stop of the day */
  sort_order: number;
  /** Time shown on the timeline, e.g. "9:25" or "9:25–10:30" */
  time_label: string;
  name: string;
  description: string;
  category: StopCategory;
  /** Human-readable cost, e.g. "€18pp" (pp = per person) */
  cost_label: string | null;
  /** The cost as a plain number per person, used for budget totals */
  cost_amount: number | null;
  /** Rough time to spend here, in minutes */
  duration_mins: number | null;
  /** Map position (latitude). Null if the stop has no fixed place. */
  lat: number | null;
  /** Map position (longitude). Null if the stop has no fixed place. */
  lng: number | null;
  /** Simple lowercase id for the place, used to match map pins,
      e.g. "colosseum". Stops at the same place share the same key. */
  place_key: string | null;
  /** Official booking website, if tickets are needed */
  ticket_url: string | null;
  /** Ready-made Google Maps walking directions link */
  directions_url: string | null;
  notes: string | null;
}

// One item on the packing list, e.g. "Passports" under "Documents".
export interface PackingItem {
  id: string;
  trip_id: string;
  /** Group heading, e.g. "Documents", "Clothing", "Tech" */
  category: string;
  /** The item itself, e.g. "Passports" */
  label: string;
  /** Whether the user has ticked it off */
  checked: boolean;
}
