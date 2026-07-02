// Full Rome itinerary — used only in Phase 1 to test all UI components.
// Replaced by real Supabase data in Phase 2.
//
// Everything here is realistic: the coordinates are the actual places in
// Rome, the ticket links are the real official booking sites, and the
// costs are sensible 2026 estimates. This means every screen of the app
// can be tested with meaningful content instead of placeholder text.

import type { Trip, Day, Stop, PackingItem } from "./types";

// Small helper that builds a ready-made Google Maps walking directions
// link for a given position. Tapping one of these on a phone opens the
// Google Maps app (or website) already set to "walk here".
function walk(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}

/*
  ---------------------------------------------------------------------------
  THE TRIP
  ---------------------------------------------------------------------------
  Hotel Ponte Sisto is a real hotel just south of Campo de' Fiori, right
  by the Ponte Sisto footbridge over the Tiber. "budget_total" is the
  budget for the WHOLE party (two people by default) across the whole trip.
*/
export const romeTrip: Trip = {
  id: "rome",
  user_id: "sample-user",
  name: "Rome · August 2026",
  destination: "Rome, Italy",
  cover_emoji: "🏛️",
  start_date: "2026-08-14",
  end_date: "2026-08-16",
  hotel_name: "Hotel Ponte Sisto",
  hotel_address: "Via dei Pettinari 64, 00186 Roma, Italy",
  hotel_phone: "+39 06 686310",
  hotel_lat: 41.8918,
  hotel_lng: 12.4714,
  currency: "EUR",
  currency_symbol: "€",
  budget_total: 450,
  notes:
    "Check-in from 15:00 — they will store luggage if we arrive earlier. Rooftop terrace bar for a first-evening drink.",
  created_at: "2026-07-01T00:00:00Z",
};

/*
  ---------------------------------------------------------------------------
  THE THREE DAYS
  ---------------------------------------------------------------------------
  Each day has a short label, a one-line "vibe", and (optionally) an alert
  that appears in a gold warning box at the top of that day's itinerary.
*/
export const romeDays: Day[] = [
  {
    id: "day-1",
    trip_id: "rome",
    day_number: 1,
    date: "2026-08-14",
    label: "Arrive & explore",
    vibe: "Land, settle in, and wander Trastevere as the light goes gold.",
    alert: null,
  },
  {
    id: "day-2",
    trip_id: "rome",
    day_number: 2,
    date: "2026-08-15",
    label: "Ancient Rome",
    vibe: "Colosseum, Forum and the classics — the big-ticket day.",
    alert:
      "15 August is Ferragosto, Italy's national summer holiday. The big sights stay open but get very busy, and many small shops close — book timed Colosseum entry well ahead.",
  },
  {
    id: "day-3",
    trip_id: "rome",
    day_number: 3,
    date: "2026-08-16",
    label: "Vatican & farewell",
    vibe: "Cross the river for St Peter's, then one last wander before home.",
    alert:
      "St Peter's Basilica has a strict dress code — shoulders and knees must be covered, for men and women.",
  },
];

/*
  ---------------------------------------------------------------------------
  THE STOPS
  ---------------------------------------------------------------------------
  Every stop belongs to a day (via "day_id") and appears on the timeline in
  "sort_order". Costs are per person. Stops with lat/lng appear as pins on
  the schematic map; stops without (like "flight lands") are journeys and
  are skipped by the map.
*/
export const romeStops: Stop[] = [
  /* ------------------------- DAY 1 — Friday 14th ------------------------ */
  {
    id: "stop-1-1",
    day_id: "day-1",
    sort_order: 1,
    time_label: "9:25",
    name: "Land at Fiumicino (FCO)",
    description:
      "Passport control and baggage reclaim — allow about 45 minutes before you are out of the terminal.",
    category: "transport",
    cost_label: null,
    cost_amount: null,
    duration_mins: 45,
    lat: null,
    lng: null,
    place_key: null,
    ticket_url: null,
    directions_url: null,
    notes: null,
  },
  {
    id: "stop-1-2",
    day_id: "day-1",
    sort_order: 2,
    time_label: "10:30–11:05",
    name: "Leonardo Express to Termini",
    description:
      "Direct train from the airport to Roma Termini, every 15 minutes. Buy at the machine or on the Trenitalia app — validate paper tickets before boarding.",
    category: "transport",
    cost_label: "€14pp",
    cost_amount: 14,
    duration_mins: 35,
    lat: 41.9014,
    lng: 12.5015,
    place_key: "roma-termini",
    ticket_url: null,
    directions_url: null,
    notes: null,
  },
  {
    id: "stop-1-3",
    day_id: "day-1",
    sort_order: 3,
    time_label: "11:45",
    name: "Check in at Hotel Ponte Sisto",
    description:
      "Rooms are ready from 15:00 but reception will happily store the bags — drop them and head straight out.",
    category: "free",
    cost_label: null,
    cost_amount: null,
    duration_mins: 20,
    lat: 41.8918,
    lng: 12.4714,
    place_key: "hotel-ponte-sisto",
    ticket_url: null,
    directions_url: walk(41.8918, 12.4714),
    notes: null,
  },
  {
    id: "stop-1-4",
    day_id: "day-1",
    sort_order: 4,
    time_label: "12:30",
    name: "Lunch in Campo de' Fiori",
    description:
      "The morning market square, two minutes from the hotel. Grab pizza bianca from Forno Campo de' Fiori and eat it on the square.",
    category: "food",
    cost_label: "€15pp",
    cost_amount: 15,
    duration_mins: 60,
    lat: 41.8956,
    lng: 12.4722,
    place_key: "campo-de-fiori",
    ticket_url: null,
    directions_url: walk(41.8956, 12.4722),
    notes: null,
  },
  {
    id: "stop-1-5",
    day_id: "day-1",
    sort_order: 5,
    time_label: "14:00",
    name: "Wander Trastevere",
    description:
      "Cross the Ponte Sisto footbridge and get lost in the lanes — ivy-covered facades, tiny piazzas, and Rome's best people-watching.",
    category: "free",
    cost_label: null,
    cost_amount: null,
    duration_mins: 90,
    lat: 41.8892,
    lng: 12.4666,
    place_key: "trastevere",
    ticket_url: null,
    directions_url: walk(41.8892, 12.4666),
    notes: null,
  },
  {
    id: "stop-1-6",
    day_id: "day-1",
    sort_order: 6,
    time_label: "15:45",
    name: "Basilica di Santa Maria in Trastevere",
    description:
      "One of Rome's oldest churches, with glittering 12th-century gold mosaics. Free to enter — just keep shoulders covered.",
    category: "free",
    cost_label: null,
    cost_amount: null,
    duration_mins: 30,
    lat: 41.8894,
    lng: 12.4694,
    place_key: "santa-maria-in-trastevere",
    ticket_url: null,
    directions_url: walk(41.8894, 12.4694),
    notes: null,
  },
  {
    id: "stop-1-7",
    day_id: "day-1",
    sort_order: 7,
    time_label: "17:00",
    name: "Gianicolo Hill viewpoint",
    description:
      "A 20-minute climb from Trastevere to the best free panorama in Rome — the whole city laid out below, church domes to the horizon.",
    category: "free",
    cost_label: null,
    cost_amount: null,
    duration_mins: 45,
    lat: 41.8912,
    lng: 12.4614,
    place_key: "gianicolo",
    ticket_url: null,
    directions_url: walk(41.8912, 12.4614),
    notes: null,
  },
  {
    id: "stop-1-8",
    day_id: "day-1",
    sort_order: 8,
    time_label: "19:30",
    name: "Dinner at Da Enzo al 29",
    description:
      "Tiny, much-loved Roman trattoria — carbonara, cacio e pepe, fried artichokes. No bookings for small tables; join the queue just before opening.",
    category: "food",
    cost_label: "€30pp",
    cost_amount: 30,
    duration_mins: 90,
    lat: 41.8879,
    lng: 12.4776,
    place_key: "da-enzo-al-29",
    ticket_url: null,
    directions_url: walk(41.8879, 12.4776),
    notes: null,
  },

  /* ------------------------ DAY 2 — Saturday 15th ----------------------- */
  {
    id: "stop-2-1",
    day_id: "day-2",
    sort_order: 1,
    time_label: "8:00",
    name: "Caffè breakfast on Via dei Giubbonari",
    description:
      "Cornetto and cappuccino standing at the bar, like a local — it is cheaper than sitting down.",
    category: "food",
    cost_label: "€8pp",
    cost_amount: 8,
    duration_mins: 30,
    lat: 41.8938,
    lng: 12.4727,
    place_key: "via-dei-giubbonari",
    ticket_url: null,
    directions_url: walk(41.8938, 12.4727),
    notes: null,
  },
  {
    id: "stop-2-2",
    day_id: "day-2",
    sort_order: 2,
    time_label: "8:45",
    name: "Bus 87 towards the Colosseum",
    description:
      "From Largo di Torre Argentina, about 15 minutes. Tap a contactless card on board — no paper ticket needed.",
    category: "transport",
    cost_label: "€1.50pp",
    cost_amount: 1.5,
    duration_mins: 20,
    lat: null,
    lng: null,
    place_key: null,
    ticket_url: null,
    directions_url: null,
    notes: null,
  },
  {
    id: "stop-2-3",
    day_id: "day-2",
    sort_order: 3,
    time_label: "9:30–11:30",
    name: "Colosseum",
    description:
      "Timed entry — arrive 15 minutes before your slot with ID. The combo ticket also covers the Forum and Palatine Hill within 24 hours.",
    category: "paid",
    cost_label: "€18pp",
    cost_amount: 18,
    duration_mins: 120,
    lat: 41.8902,
    lng: 12.4922,
    place_key: "colosseum",
    ticket_url: "https://ticketing.colosseo.it/en/",
    directions_url: walk(41.8902, 12.4922),
    notes: "Tickets release about 30 days ahead and sell out fast in August.",
  },
  {
    id: "stop-2-4",
    day_id: "day-2",
    sort_order: 4,
    time_label: "11:45",
    name: "Roman Forum & Palatine Hill",
    description:
      "Included in the Colosseum combo ticket. The heart of the ancient city — arches, temples and umbrella pines. Very little shade, so bring water.",
    category: "free",
    cost_label: "Included",
    cost_amount: null,
    duration_mins: 90,
    lat: 41.8925,
    lng: 12.4853,
    place_key: "roman-forum",
    ticket_url: null,
    directions_url: walk(41.8925, 12.4853),
    notes: null,
  },
  {
    id: "stop-2-5",
    day_id: "day-2",
    sort_order: 5,
    time_label: "13:45",
    name: "Pizza al taglio near Largo Argentina",
    description:
      "Pizza by the slice, priced by weight — point at what you want and eat it overlooking the cat sanctuary ruins.",
    category: "food",
    cost_label: "€10pp",
    cost_amount: 10,
    duration_mins: 45,
    lat: 41.8955,
    lng: 12.4767,
    place_key: "largo-argentina",
    ticket_url: null,
    directions_url: walk(41.8955, 12.4767),
    notes: null,
  },
  {
    id: "stop-2-6",
    day_id: "day-2",
    sort_order: 6,
    time_label: "15:00",
    name: "Pantheon",
    description:
      "Two thousand years old and still the world's largest unreinforced concrete dome. Book the €5 timed slot online to skip the ticket queue.",
    category: "paid",
    cost_label: "€5pp",
    cost_amount: 5,
    duration_mins: 45,
    lat: 41.8986,
    lng: 12.4769,
    place_key: "pantheon",
    ticket_url: "https://portale.museiitaliani.it",
    directions_url: walk(41.8986, 12.4769),
    notes: null,
  },
  {
    id: "stop-2-7",
    day_id: "day-2",
    sort_order: 7,
    time_label: "16:15",
    name: "Trevi Fountain",
    description:
      "Toss a coin over your left shoulder to guarantee a return to Rome. Go now rather than after dinner — evenings are shoulder-to-shoulder.",
    category: "free",
    cost_label: null,
    cost_amount: null,
    duration_mins: 30,
    lat: 41.9009,
    lng: 12.4833,
    place_key: "trevi-fountain",
    ticket_url: null,
    directions_url: walk(41.9009, 12.4833),
    notes: null,
  },
  {
    id: "stop-2-8",
    day_id: "day-2",
    sort_order: 8,
    time_label: "17:00",
    name: "Gelato at Giolitti",
    description:
      "Rome's most famous gelateria, open since 1900. Pay at the till first, then take the receipt to the counter.",
    category: "food",
    cost_label: "€4pp",
    cost_amount: 4,
    duration_mins: 30,
    lat: 41.9005,
    lng: 12.4776,
    place_key: "giolitti",
    ticket_url: null,
    directions_url: walk(41.9005, 12.4776),
    notes: null,
  },
  {
    id: "stop-2-9",
    day_id: "day-2",
    sort_order: 9,
    time_label: "19:30",
    name: "Dinner near Piazza Navona",
    description:
      "Baroque Rome at golden hour — street artists, Bernini's Fountain of the Four Rivers, and dinner in a side street off the square (avoid menus with photos).",
    category: "food",
    cost_label: "€28pp",
    cost_amount: 28,
    duration_mins: 90,
    lat: 41.8992,
    lng: 12.4731,
    place_key: "piazza-navona",
    ticket_url: null,
    directions_url: walk(41.8992, 12.4731),
    notes: null,
  },

  /* ------------------------- DAY 3 — Sunday 16th ------------------------ */
  {
    id: "stop-3-1",
    day_id: "day-3",
    sort_order: 1,
    time_label: "8:00",
    name: "Walk along the Tiber to the Vatican",
    description:
      "A flat, pretty 35-minute riverside walk from the hotel — quiet on a Sunday morning, with the dome of St Peter's growing ahead of you.",
    category: "transport",
    cost_label: null,
    cost_amount: null,
    duration_mins: 35,
    lat: null,
    lng: null,
    place_key: null,
    ticket_url: null,
    directions_url: null,
    notes: null,
  },
  {
    id: "stop-3-2",
    day_id: "day-3",
    sort_order: 2,
    time_label: "8:45",
    name: "St Peter's Basilica",
    description:
      "Free to enter, but the security queue builds quickly — arriving before 9:00 usually means walking straight in. Michelangelo's Pietà is just inside on the right.",
    category: "free",
    cost_label: null,
    cost_amount: null,
    duration_mins: 90,
    lat: 41.9022,
    lng: 12.4539,
    place_key: "st-peters-basilica",
    ticket_url: null,
    directions_url: walk(41.9022, 12.4539),
    notes: null,
  },
  {
    id: "stop-3-3",
    day_id: "day-3",
    sort_order: 3,
    time_label: "10:30",
    name: "Climb St Peter's Dome",
    description:
      "Lift to the terrace, then 320 spiral steps to the very top — the best view in Rome, straight down Via della Conciliazione. Buy on the day at the entrance.",
    category: "paid",
    cost_label: "€10pp",
    cost_amount: 10,
    duration_mins: 75,
    lat: 41.9022,
    lng: 12.4539,
    place_key: "st-peters-basilica",
    ticket_url: null,
    directions_url: walk(41.9022, 12.4539),
    notes: "Not one for a hot afternoon — go while it is still cool.",
  },
  {
    id: "stop-3-4",
    day_id: "day-3",
    sort_order: 4,
    time_label: "12:15",
    name: "Lunch in Borgo Pio",
    description:
      "The old village street behind the Vatican walls — trattorias with tables outside and far better value than the tourist row facing the square.",
    category: "food",
    cost_label: "€18pp",
    cost_amount: 18,
    duration_mins: 60,
    lat: 41.904,
    lng: 12.46,
    place_key: "borgo-pio",
    ticket_url: null,
    directions_url: walk(41.904, 12.46),
    notes: null,
  },
  {
    id: "stop-3-5",
    day_id: "day-3",
    sort_order: 5,
    time_label: "13:45",
    name: "Castel Sant'Angelo & Bridge of Angels",
    description:
      "Hadrian's mausoleum turned papal fortress. We are not going inside — the photo stop is the bridge, lined with Bernini's windswept angels.",
    category: "free",
    cost_label: null,
    cost_amount: null,
    duration_mins: 45,
    lat: 41.9031,
    lng: 12.4663,
    place_key: "castel-sant-angelo",
    ticket_url: null,
    directions_url: walk(41.9031, 12.4663),
    notes: null,
  },
  {
    id: "stop-3-6",
    day_id: "day-3",
    sort_order: 6,
    time_label: "14:45",
    name: "Collect bags at the hotel",
    description:
      "One last coffee on the rooftop terrace if there is time, then grab the luggage from reception.",
    category: "free",
    cost_label: null,
    cost_amount: null,
    duration_mins: 30,
    lat: 41.8918,
    lng: 12.4714,
    place_key: "hotel-ponte-sisto",
    ticket_url: null,
    directions_url: walk(41.8918, 12.4714),
    notes: null,
  },
  {
    id: "stop-3-7",
    day_id: "day-3",
    sort_order: 7,
    time_label: "15:30",
    name: "Taxi to Fiumicino",
    description:
      "Official white taxis charge a fixed fare from anywhere inside the old city walls to the airport. Ask reception to call one 15 minutes ahead.",
    category: "transport",
    cost_label: "€50 per taxi (≈€25pp)",
    cost_amount: 25,
    duration_mins: 45,
    lat: null,
    lng: null,
    place_key: null,
    ticket_url: null,
    directions_url: null,
    notes: null,
  },
  {
    id: "stop-3-8",
    day_id: "day-3",
    sort_order: 8,
    time_label: "18:30",
    name: "Flight home",
    description: "Airborne by 18:30 — gelato count: not telling.",
    category: "transport",
    cost_label: null,
    cost_amount: null,
    duration_mins: null,
    lat: null,
    lng: null,
    place_key: null,
    ticket_url: null,
    directions_url: null,
    notes: null,
  },
];

/*
  ---------------------------------------------------------------------------
  THE PACKING LIST
  ---------------------------------------------------------------------------
  Grouped by category. "checked" starts false; in Phase 1 ticking an item
  is remembered only while the app is open (it will persist to the
  database in Phase 2).
*/
export const romePackingList: PackingItem[] = [
  /* Documents */
  { id: "pack-1", trip_id: "rome", category: "Documents", label: "Passports", checked: false },
  { id: "pack-2", trip_id: "rome", category: "Documents", label: "Boarding passes (saved offline)", checked: false },
  { id: "pack-3", trip_id: "rome", category: "Documents", label: "Colosseum tickets PDF", checked: false },
  { id: "pack-4", trip_id: "rome", category: "Documents", label: "Travel insurance details", checked: false },
  { id: "pack-5", trip_id: "rome", category: "Documents", label: "GHIC / EHIC health cards", checked: false },
  { id: "pack-6", trip_id: "rome", category: "Documents", label: "Hotel booking confirmation", checked: false },

  /* Clothing */
  { id: "pack-7", trip_id: "rome", category: "Clothing", label: "Comfortable walking shoes (broken in!)", checked: false },
  { id: "pack-8", trip_id: "rome", category: "Clothing", label: "Something covering shoulders & knees for churches", checked: false },
  { id: "pack-9", trip_id: "rome", category: "Clothing", label: "Sun hat", checked: false },
  { id: "pack-10", trip_id: "rome", category: "Clothing", label: "Light layers — August evenings stay warm", checked: false },
  { id: "pack-11", trip_id: "rome", category: "Clothing", label: "One nicer outfit for dinner", checked: false },

  /* Tech */
  { id: "pack-12", trip_id: "rome", category: "Tech", label: "Phone chargers", checked: false },
  { id: "pack-13", trip_id: "rome", category: "Tech", label: "EU plug adapters (type C/F)", checked: false },
  { id: "pack-14", trip_id: "rome", category: "Tech", label: "Power bank — long days out", checked: false },
  { id: "pack-15", trip_id: "rome", category: "Tech", label: "Headphones", checked: false },
  { id: "pack-16", trip_id: "rome", category: "Tech", label: "Offline maps of Rome downloaded", checked: false },

  /* Toiletries */
  { id: "pack-17", trip_id: "rome", category: "Toiletries", label: "High-factor suncream", checked: false },
  { id: "pack-18", trip_id: "rome", category: "Toiletries", label: "After-sun", checked: false },
  { id: "pack-19", trip_id: "rome", category: "Toiletries", label: "Toothbrush & toothpaste", checked: false },
  { id: "pack-20", trip_id: "rome", category: "Toiletries", label: "Any regular medication", checked: false },
  { id: "pack-21", trip_id: "rome", category: "Toiletries", label: "Plasters — cobblestones are brutal", checked: false },

  /* Extras */
  { id: "pack-22", trip_id: "rome", category: "Extras", label: "Refillable water bottles (free fountains everywhere)", checked: false },
  { id: "pack-23", trip_id: "rome", category: "Extras", label: "Small day bag", checked: false },
  { id: "pack-24", trip_id: "rome", category: "Extras", label: "Sunglasses", checked: false },
  { id: "pack-25", trip_id: "rome", category: "Extras", label: "Coins for the Trevi Fountain", checked: false },
  { id: "pack-26", trip_id: "rome", category: "Extras", label: "Empty space in the suitcase for treats home", checked: false },
];

/*
  ---------------------------------------------------------------------------
  STATIC INFO TAB TEXT (Phase 1 only — editable per trip in Phase 2)
  ---------------------------------------------------------------------------
*/
export const romeGettingAround = [
  "The old centre is compact — almost everything on this itinerary is walkable from the hotel.",
  "Buses and trams take contactless cards: just tap on board (€1.50, capped daily). No paper ticket needed.",
  "The metro is mostly useful for Termini and the Vatican (line A) — it skirts the old centre rather than crossing it.",
  "Official taxis are white with a meter and a licence number on the door. The airport run is a fixed €50 from inside the old walls.",
  "Avoid anyone offering 'taxi?' on foot at stations — always use the rank or ask the hotel to call one.",
];

export const romeThingsToKnow = [
  "Tap water is excellent — refill at the 'nasoni' drinking fountains all over the city.",
  "Coffee at the bar is around €1.20; the same coffee seated at a table can be triple that.",
  "Most churches (including St Peter's) enforce covered shoulders and knees.",
  "Restaurants add a small 'coperto' cover charge per person — it is normal, not a scam.",
  "Pickpockets work the crowded spots: Trevi, buses, and the metro. Front pockets and zipped bags.",
  "August is hot (32°C+). Do the big outdoor sights early, then follow the locals into the shade after lunch.",
];
