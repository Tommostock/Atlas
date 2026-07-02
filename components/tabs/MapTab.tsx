"use client";

// MapTab — the day's stops on a real, interactive map.
//
//   - Day pills at the top switch the map between days.
//   - The map pans, pinch-zooms and rotates like Google Maps (two-finger
//     gestures, so one finger still scrolls the page).
//   - Tapping a pin (or a row in the list) SELECTS that stop: its pin
//     lights up and a card appears with the stop's details and a
//     "Walking directions" button.
//   - The little arrow button on each list row is a shortcut straight to
//     Google Maps directions.

import dynamic from "next/dynamic";
import { Navigation, Clock } from "lucide-react";
import type { Day, Stop } from "@/lib/types";
import DaySelector from "@/components/trip/DaySelector";
import {
  uniqueMapPlaces,
  openWalkingDirections,
  HOTEL_KEY,
} from "@/lib/map";
import { cn } from "@/lib/utils";

// The map engine only works in the browser (it draws with WebGL), so we
// load it "dynamically" — meaning: skipped on the server, fetched in the
// browser — with a grey placeholder while it arrives.
const RealMap = dynamic(() => import("@/components/trip/RealMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full animate-pulse rounded-2xl border border-border bg-surface" />
  ),
});

interface MapTabProps {
  days: Day[];
  activeDayIndex: number;
  onSelectDay: (index: number) => void;
  /** The stops for the active day. */
  stops: Stop[];
  hotel: { name: string; lat: number; lng: number };
  /** The currently selected place (highlighted pin), or null. */
  selectedPlaceKey: string | null;
  /** Called when the user taps a pin or list row. */
  onSelectPlace: (placeKey: string) => void;
}

export default function MapTab({
  days,
  activeDayIndex,
  onSelectDay,
  stops,
  hotel,
  selectedPlaceKey,
  onSelectPlace,
}: MapTabProps) {
  // The unique places for this day — pins and list share this, so their
  // numbering always matches.
  const places = uniqueMapPlaces(stops, hotel);

  // The stop belonging to the selected pin (first visit wins when a place
  // appears twice in a day). Null when nothing — or the hotel — is selected.
  const selectedStop =
    selectedPlaceKey && selectedPlaceKey !== HOTEL_KEY
      ? (stops.find(
          (s) => (s.place_key ?? `${s.lat},${s.lng}`) === selectedPlaceKey
        ) ?? null)
      : null;

  const hotelSelected = selectedPlaceKey === HOTEL_KEY;

  return (
    <div>
      {/* Day switcher — the map always shows one day at a time. */}
      <DaySelector
        days={days}
        activeDayIndex={activeDayIndex}
        onSelect={onSelectDay}
      />

      {/* Intro line above the map. */}
      <p className="mt-4 mb-3 text-[13px] text-ink-soft">
        Day {days[activeDayIndex]?.day_number} — tap a pin to see the stop
      </p>

      {/* The interactive map. */}
      <RealMap
        hotel={hotel}
        places={places}
        selectedPlaceKey={selectedPlaceKey}
        onSelectPlace={onSelectPlace}
      />

      {/* Detail card for whichever pin is selected. */}
      {selectedStop && (
        <div className="mt-3 rounded-2xl border border-accent/40 bg-surface p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-[15px] font-semibold text-ink">
              {selectedStop.name}
            </h3>
            {selectedStop.time_label && (
              <span className="flex shrink-0 items-center gap-1 text-xs text-accent tabular-nums">
                <Clock size={12} aria-hidden />
                {selectedStop.time_label}
              </span>
            )}
          </div>
          {selectedStop.description && (
            <p className="mt-1 text-[13px] leading-[1.5] text-ink-soft">
              {selectedStop.description}
            </p>
          )}
          <button
            type="button"
            onClick={() =>
              openWalkingDirections(selectedStop.lat!, selectedStop.lng!)
            }
            className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-accent text-[13px] font-semibold text-bg active:scale-[0.98]"
          >
            <Navigation size={15} aria-hidden />
            Walking directions
          </button>
        </div>
      )}

      {/* Detail card when the hotel pin is selected. */}
      {hotelSelected && (
        <div className="mt-3 rounded-2xl border border-accent/40 bg-surface p-4">
          <h3 className="font-display text-[15px] font-semibold text-ink">
            {hotel.name}
          </h3>
          <p className="mt-1 text-[13px] leading-[1.5] text-ink-soft">
            Your hotel — every day starts and ends here.
          </p>
          <button
            type="button"
            onClick={() => openWalkingDirections(hotel.lat, hotel.lng)}
            className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-accent text-[13px] font-semibold text-bg active:scale-[0.98]"
          >
            <Navigation size={15} aria-hidden />
            Walking directions
          </button>
        </div>
      )}

      {/* The list of places, numbered to match the pins. Tapping a row
          selects it on the map; the arrow button jumps straight to
          Google Maps. */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
        {places.map((place, index) => {
          const isSelected = selectedPlaceKey === place.placeKey;
          return (
            <div
              key={place.placeKey}
              className={cn(
                "flex items-center",
                index > 0 && "border-t border-border",
                isSelected && "bg-surface-2"
              )}
            >
              <button
                type="button"
                onClick={() => onSelectPlace(place.placeKey)}
                className="flex h-12 min-w-0 flex-1 items-center gap-3 px-4 text-left"
              >
                {/* Amber numbered badge matching the map pin. */}
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-bg tabular-nums">
                  {place.number}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[13.5px] text-ink",
                    isSelected && "font-semibold"
                  )}
                >
                  {place.name}
                </span>
              </button>

              {/* Shortcut straight to walking directions. */}
              <button
                type="button"
                aria-label={`Walking directions to ${place.name}`}
                onClick={() => openWalkingDirections(place.lat, place.lng)}
                className="flex h-12 w-12 shrink-0 items-center justify-center text-ink-faint active:text-accent"
              >
                <Navigation size={16} aria-hidden />
              </button>
            </div>
          );
        })}

        {/* Friendly empty state if the day has no mappable stops. */}
        {places.length === 0 && (
          <p className="px-4 py-6 text-center text-[13px] text-ink-faint">
            No mapped stops for this day — add stops with locations on the
            itinerary and they appear here.
          </p>
        )}
      </div>

      {/* A small how-to so the map explains itself. */}
      <p className="mt-3 text-center text-[11px] text-ink-faint">
        Two fingers to move, pinch to zoom, twist to rotate · tap the compass
        to face north again
      </p>
    </div>
  );
}
