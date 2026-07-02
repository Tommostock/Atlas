// Shared map helpers used by the Map tab and the interactive map.

import type { Stop } from "./types";

// The special key used when the hotel pin is selected (the hotel is not a
// "stop", so it needs its own identifier).
export const HOTEL_KEY = "__hotel__";

// One unique place a day visits. The map's pins and the list under the
// map both come from this, so their numbering always matches.
export interface MapPlace {
  number: number;
  name: string;
  placeKey: string;
  lat: number;
  lng: number;
}

/*
  Works out which unique places a day's stops visit.

  Some stops have no location (e.g. "flight lands"), and some places are
  visited twice in a day (e.g. a basilica and then its dome climb).
  We keep one entry per unique place, numbered in the order it is first
  visited. Stops AT the hotel are skipped, because the hotel always has
  its own dedicated "H" pin.
*/
export function uniqueMapPlaces(
  stops: Stop[],
  hotel: { lat: number; lng: number }
): MapPlace[] {
  const seen = new Set<string>();
  const places: MapPlace[] = [];

  for (const stop of [...stops].sort((a, b) => a.sort_order - b.sort_order)) {
    if (stop.lat === null || stop.lng === null) continue;

    // Is this stop simply "at the hotel"? Anything within ~10 metres
    // counts as the same place.
    const isHotel =
      Math.abs(stop.lat - hotel.lat) < 0.0001 &&
      Math.abs(stop.lng - hotel.lng) < 0.0001;
    if (isHotel) continue;

    // Deduplicate: prefer the human-given place_key, fall back to coords.
    const key = stop.place_key ?? `${stop.lat},${stop.lng}`;
    if (seen.has(key)) continue;
    seen.add(key);

    places.push({
      number: places.length + 1,
      name: stop.name,
      placeKey: key,
      lat: stop.lat,
      lng: stop.lng,
    });
  }

  return places;
}

// Opens Google Maps walking directions in a new tab. On a phone this
// hands over to the Google Maps app if it is installed.
export function openWalkingDirections(lat: number, lng: number) {
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`,
    "_blank",
    "noopener,noreferrer"
  );
}
