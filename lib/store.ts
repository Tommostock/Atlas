// The Atlas data store — the app's memory.
//
// Every trip, day, stop and packing item lives here. The whole lot is
// saved to the browser's "localStorage" (a small private storage area
// every website gets on your device) every time something changes, and
// loaded back the next time the app opens. That means:
//   - no account or sign-in needed
//   - completely free — no server, no database bills
//   - your data stays on YOUR device (each device has its own copy)
//
// The very first time the app runs it plants the Rome trip as a starter,
// so there is something real to look at and edit.
//
// React components read the store with the useAtlas() hook at the bottom.
// Any component using it automatically re-renders when data changes.

import { useSyncExternalStore } from "react";
import type { Trip, Day, Stop, PackingItem } from "./types";
import {
  romeTrip,
  romeDays,
  romeStops,
  romePackingList,
} from "./rome-sample-data";

// Everything the app stores, in one bundle.
export interface AtlasData {
  /** False during the very first moment of loading, true afterwards. */
  ready: boolean;
  trips: Trip[];
  days: Day[];
  stops: Stop[];
  packing: PackingItem[];
}

// The storage slot name. The "v1" lets us change the format safely later.
const STORAGE_KEY = "atlas-data-v1";

// What the server (and the first instant in the browser) sees, before
// localStorage has been read. Must be a single stable object.
const EMPTY: AtlasData = {
  ready: false,
  trips: [],
  days: [],
  stops: [],
  packing: [],
};

// The live in-memory copy of the data, and the components listening to it.
let data: AtlasData = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

// Creates a unique id for new records, e.g. "b2f8c3a0-...".
function newId(): string {
  return crypto.randomUUID();
}

// Turns a name like "St Peter's Basilica" into a simple key like
// "st-peter-s-basilica" — used to match stops to map pins.
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Builds the ready-made Google Maps walking link for a position.
export function walkingUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}

// Reads the saved data from localStorage — or, on the very first run,
// plants the Rome starter trip.
function loadOnce() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      data = {
        ready: true,
        trips: parsed.trips ?? [],
        days: parsed.days ?? [],
        stops: parsed.stops ?? [],
        packing: parsed.packing ?? [],
      };
      return;
    }
  } catch {
    // A corrupted save is abandoned and we start fresh below.
  }

  // First run: start with the Rome sample trip so the app isn't empty.
  data = {
    ready: true,
    trips: [romeTrip],
    days: [...romeDays],
    stops: [...romeStops],
    packing: [...romePackingList],
  };
  save();
}

// Writes the current data to localStorage.
function save() {
  try {
    const toSave = {
      trips: data.trips,
      days: data.days,
      stops: data.stops,
      packing: data.packing,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Storage full or blocked — the app keeps working from memory.
  }
}

// Replaces the data bundle, saves it, and tells every listening
// component to re-render.
function commit(next: Omit<AtlasData, "ready">) {
  data = { ready: true, ...next };
  save();
  listeners.forEach((listener) => listener());
}

/*
  ---------------------------------------------------------------------------
  THE MUTATIONS — every way the data can change.
  ---------------------------------------------------------------------------
  Each function makes a fresh copy of the affected list (never editing the
  old one in place) — that is how React notices something changed.
*/

// ----- Trips ---------------------------------------------------------------

export function createTrip(
  fields: Omit<Trip, "id" | "user_id" | "created_at">
): Trip {
  const trip: Trip = {
    ...fields,
    id: newId(),
    user_id: "local",
    created_at: new Date().toISOString(),
  };
  commit({ ...data, trips: [...data.trips, trip] });
  return trip;
}

export function updateTrip(id: string, patch: Partial<Trip>) {
  commit({
    ...data,
    trips: data.trips.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  });
}

export function deleteTrip(id: string) {
  // Deleting a trip also removes everything that belongs to it.
  const dayIds = new Set(
    data.days.filter((d) => d.trip_id === id).map((d) => d.id)
  );
  commit({
    trips: data.trips.filter((t) => t.id !== id),
    days: data.days.filter((d) => d.trip_id !== id),
    stops: data.stops.filter((s) => !dayIds.has(s.day_id)),
    packing: data.packing.filter((p) => p.trip_id !== id),
  });
}

// ----- Days ----------------------------------------------------------------

export function createDay(
  tripId: string,
  fields: Pick<Day, "date" | "label" | "vibe" | "alert">
): Day {
  const tripDays = data.days.filter((d) => d.trip_id === tripId);
  const day: Day = {
    ...fields,
    id: newId(),
    trip_id: tripId,
    day_number: tripDays.length + 1,
  };
  commit({ ...data, days: [...data.days, day] });
  return day;
}

export function updateDay(id: string, patch: Partial<Day>) {
  commit({
    ...data,
    days: data.days.map((d) => (d.id === id ? { ...d, ...patch } : d)),
  });
}

export function deleteDay(id: string) {
  const day = data.days.find((d) => d.id === id);
  if (!day) return;
  // Remove the day and its stops, then renumber the remaining days of
  // that trip so there is never a gap (day 1, 2, 3...).
  const remaining = data.days
    .filter((d) => d.id !== id)
    .map((d) =>
      d.trip_id === day.trip_id && d.day_number > day.day_number
        ? { ...d, day_number: d.day_number - 1 }
        : d
    );
  commit({
    ...data,
    days: remaining,
    stops: data.stops.filter((s) => s.day_id !== id),
  });
}

// ----- Stops ---------------------------------------------------------------

// The fields the stop form provides; everything else is filled in here.
export type StopFields = Pick<
  Stop,
  | "time_label"
  | "name"
  | "description"
  | "category"
  | "cost_label"
  | "cost_amount"
  | "duration_mins"
  | "lat"
  | "lng"
  | "ticket_url"
  | "notes"
>;

// Fills in the automatic fields: the map key from the name, and the
// walking-directions link from the coordinates.
function finishStop(fields: StopFields): Omit<StopFields, never> & {
  place_key: string | null;
  directions_url: string | null;
} {
  const hasLocation = fields.lat !== null && fields.lng !== null;
  return {
    ...fields,
    place_key: fields.name ? slugify(fields.name) : null,
    directions_url: hasLocation ? walkingUrl(fields.lat!, fields.lng!) : null,
  };
}

export function createStop(dayId: string, fields: StopFields): Stop {
  const dayStops = data.stops.filter((s) => s.day_id === dayId);
  const maxOrder = Math.max(0, ...dayStops.map((s) => s.sort_order));
  const stop: Stop = {
    ...finishStop(fields),
    id: newId(),
    day_id: dayId,
    sort_order: maxOrder + 1,
  };
  commit({ ...data, stops: [...data.stops, stop] });
  return stop;
}

export function updateStop(id: string, fields: StopFields) {
  commit({
    ...data,
    stops: data.stops.map((s) =>
      s.id === id ? { ...s, ...finishStop(fields) } : s
    ),
  });
}

export function deleteStop(id: string) {
  commit({ ...data, stops: data.stops.filter((s) => s.id !== id) });
}

// ----- Packing list --------------------------------------------------------

export function addPackingItem(
  tripId: string,
  category: string,
  label: string
): PackingItem {
  const item: PackingItem = {
    id: newId(),
    trip_id: tripId,
    category: category.trim(),
    label: label.trim(),
    checked: false,
  };
  commit({ ...data, packing: [...data.packing, item] });
  return item;
}

export function togglePackingItem(id: string) {
  commit({
    ...data,
    packing: data.packing.map((p) =>
      p.id === id ? { ...p, checked: !p.checked } : p
    ),
  });
}

export function deletePackingItem(id: string) {
  commit({ ...data, packing: data.packing.filter((p) => p.id !== id) });
}

/*
  ---------------------------------------------------------------------------
  THE HOOK — how components read the store.
  ---------------------------------------------------------------------------
*/

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): AtlasData {
  loadOnce();
  return data;
}

// What the server renders (it has no localStorage): the empty bundle.
function getServerSnapshot(): AtlasData {
  return EMPTY;
}

/**
 * Read the whole data bundle inside a component:
 *   const { trips, days, stops, packing } = useAtlas();
 * The component re-renders automatically whenever anything changes.
 */
export function useAtlas(): AtlasData {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
