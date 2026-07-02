"use client";

// MapTab — the day's stops drawn on the schematic map, with a matching
// numbered list underneath. Tapping a pin OR a list row opens Google Maps
// walking directions to that place.

import { Navigation } from "lucide-react";
import type { Stop } from "@/lib/types";
import SchematicMap, {
  uniqueMapPlaces,
  openWalkingDirections,
} from "@/components/trip/SchematicMap";
import { cn } from "@/lib/utils";

interface MapTabProps {
  /** Which day is showing (1, 2, 3...) — used in the intro line. */
  dayNumber: number;
  /** The stops for the active day. */
  stops: Stop[];
  hotel: { name: string; lat: number; lng: number };
  /** Optional river waypoints for the destination (Rome has the Tiber). */
  river?: { lat: number; lng: number }[];
  /** Optional place to highlight — set when the user taps a stop on the
      itinerary and jumps here. */
  focusedPlaceKey?: string | null;
}

export default function MapTab({
  dayNumber,
  stops,
  hotel,
  river,
  focusedPlaceKey,
}: MapTabProps) {
  // The same deduplication the map itself uses, so the list numbers below
  // are guaranteed to match the pin numbers above.
  const places = uniqueMapPlaces(stops, hotel);

  return (
    <div>
      {/* Intro line above the map. */}
      <p className="mb-3 text-[13px] text-ink-soft">
        Day {dayNumber} — tap any pin for walking directions
      </p>

      {/* The schematic map itself. */}
      <SchematicMap
        stops={stops}
        hotel={hotel}
        river={river}
        focusedPlaceKey={focusedPlaceKey}
      />

      {/* The list of places, numbered to match the pins. */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
        {places.map((place, index) => (
          <button
            key={place.placeKey}
            type="button"
            onClick={() => openWalkingDirections(place.lat, place.lng)}
            className={cn(
              // Each row is a comfortable 48px tall tap target.
              "flex h-12 w-full items-center gap-3 px-4 text-left active:bg-surface-2",
              // A thin divider between rows (but not above the first).
              index > 0 && "border-t border-border"
            )}
          >
            {/* Amber numbered badge matching the map pin. */}
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-bg tabular-nums">
              {place.number}
            </span>

            {/* The place name. */}
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-[13.5px]",
                focusedPlaceKey === place.placeKey
                  ? "font-semibold text-ink"
                  : "text-ink"
              )}
            >
              {place.name}
            </span>

            {/* A little navigation arrow hinting "this takes you there". */}
            <Navigation size={15} className="shrink-0 text-ink-faint" aria-hidden />
          </button>
        ))}

        {/* Friendly empty state if the day has no mappable stops. */}
        {places.length === 0 && (
          <p className="px-4 py-6 text-center text-[13px] text-ink-faint">
            No mapped stops for this day.
          </p>
        )}
      </div>
    </div>
  );
}
