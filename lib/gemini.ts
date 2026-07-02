// Atlas's AI helper — powered by Google Gemini.
//
// WHICH AI IS THIS? Google's "gemini-2.0-flash" model, used through
// Google's FREE tier. It costs nothing: you create a free API key at
// https://aistudio.google.com/apikey (a Google account is all you need),
// put it in the NEXT_PUBLIC_GEMINI_API_KEY environment variable, and the
// AI buttons light up. No card details, no charges. Without a key the
// app works fine — the AI buttons simply explain how to get one.
//
// Three things the AI can do:
//   1. Suggest stops for a day (given the destination and what's planned)
//   2. Suggest packing items (given the destination and dates)
//   3. Pre-fill a stop's details from just its name

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Trip, Day, Stop, StopCategory } from "./types";

// The model named in SPEC.md — fast and free-tier friendly.
const MODEL = "gemini-2.0-flash";

// Is a key configured? The UI uses this to decide whether AI buttons are
// live or show the "how to set up" message.
export function hasGeminiKey(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
}

// The error message shown when no key is set.
export const NO_KEY_MESSAGE =
  "AI suggestions need a free Google Gemini key. Create one at aistudio.google.com/apikey, add it to the app's settings as NEXT_PUBLIC_GEMINI_API_KEY, and redeploy.";

// Sends a prompt to Gemini and parses the reply as JSON. The prompt
// always asks for pure JSON, but models sometimes wrap replies in
// ```json fences — we strip those before parsing.
async function askForJson<T>(prompt: string): Promise<T> {
  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) throw new Error(NO_KEY_MESSAGE);

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: MODEL });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Strip any ``` fences and grab the JSON between the outermost brackets.
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = Math.min(
    ...[cleaned.indexOf("["), cleaned.indexOf("{")].filter((i) => i >= 0)
  );
  const end = Math.max(cleaned.lastIndexOf("]"), cleaned.lastIndexOf("}"));
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

// ----- 1. Suggest stops for a day -------------------------------------------

export interface SuggestedStop {
  name: string;
  description: string;
  category: StopCategory;
  cost_label: string | null;
  cost_amount: number | null;
  duration_mins: number | null;
  lat: number | null;
  lng: number | null;
}

export async function suggestStops(
  trip: Trip,
  day: Day,
  existingStops: Stop[]
): Promise<SuggestedStop[]> {
  const existing = existingStops.map((s) => s.name).join(", ") || "nothing yet";

  const suggestions = await askForJson<SuggestedStop[]>(
    `You are a travel planner. Suggest 5 stops for one day of a trip.

Destination: ${trip.destination}
Date: ${day.date}
Day theme: ${day.label} — ${day.vibe}
Already planned that day: ${existing}

Suggest things that fit the theme, are close to each other, and are NOT already planned. Mix famous sights with local gems, and include at least one food suggestion.

Reply with ONLY a JSON array. Each item:
{
  "name": string,
  "description": string (one friendly sentence, max 140 characters),
  "category": "free" | "paid" | "food" | "transport",
  "cost_label": string like "€10pp" or null if free,
  "cost_amount": number (per person, in ${trip.currency}) or null,
  "duration_mins": number or null,
  "lat": number (approximate latitude, only if it is a well-known fixed place, else null),
  "lng": number (approximate longitude, only if it is a well-known fixed place, else null)
}`
  );
  return suggestions.slice(0, 6);
}

// ----- 2. Suggest packing items ---------------------------------------------

export interface SuggestedPackingItem {
  category: string;
  label: string;
}

export async function suggestPackingItems(
  trip: Trip,
  dayCount: number,
  existingLabels: string[]
): Promise<SuggestedPackingItem[]> {
  const existing = existingLabels.join(", ") || "nothing yet";

  const suggestions = await askForJson<SuggestedPackingItem[]>(
    `Suggest packing-list items for a trip.

Destination: ${trip.destination}
Dates: ${trip.start_date} to ${trip.end_date} (${dayCount} days)
Already on the list: ${existing}

Suggest 8-12 genuinely useful items NOT already on the list, considering the destination's weather at that time of year and local customs. Use short, practical labels.

Reply with ONLY a JSON array. Each item:
{ "category": string (e.g. "Documents", "Clothing", "Tech", "Toiletries", "Extras"), "label": string }`
  );
  return suggestions.slice(0, 12);
}

// ----- 3. Pre-fill a stop's details from its name ---------------------------

export interface StopDetails {
  description: string;
  category: StopCategory;
  cost_label: string | null;
  cost_amount: number | null;
  duration_mins: number | null;
  lat: number | null;
  lng: number | null;
}

export async function suggestStopDetails(
  stopName: string,
  trip: Trip
): Promise<StopDetails> {
  return askForJson<StopDetails>(
    `A traveller is adding "${stopName}" to their ${trip.destination} itinerary.

Reply with ONLY a JSON object describing it:
{
  "description": string (one friendly, useful sentence, max 140 characters),
  "category": "free" | "paid" | "food" | "transport",
  "cost_label": string like "€18pp" (typical price per person in ${trip.currency}) or null if free,
  "cost_amount": number (per person) or null,
  "duration_mins": number (typical visit length) or null,
  "lat": number (approximate latitude, only if it is a well-known fixed place, else null),
  "lng": number (approximate longitude, only if it is a well-known fixed place, else null)
}`
  );
}
