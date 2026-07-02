"use client";

// The trip page — the heart of Atlas. It loads the trip named in the
// address (e.g. /trip/rome) from the on-device store, holds the shared
// state (which TAB is open, which DAY is selected), and wires the four
// tab views together with the bottom tab bar.

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import type { Stop } from "@/lib/types";
import { useAtlas } from "@/lib/store";
import BottomTabBar, { type TabId } from "@/components/trip/BottomTabBar";
import ItineraryTab from "@/components/tabs/ItineraryTab";
import MapTab from "@/components/tabs/MapTab";
import CostsTab from "@/components/tabs/CostsTab";
import InfoTab from "@/components/tabs/InfoTab";
import TripSheet from "@/components/sheets/TripSheet";

export default function TripPage() {
  // The trip id from the address bar.
  const params = useParams<{ id: string }>();

  // Everything the app knows, live from the on-device store.
  const data = useAtlas();

  // Which of the four tabs is showing.
  const [activeTab, setActiveTab] = useState<TabId>("itinerary");
  // Which day is selected (0 = the first day).
  const [activeDay, setActiveDay] = useState(0);
  // Which map pin is selected — set by tapping a pin on the map or a stop
  // on the itinerary, cleared when the day changes.
  const [selectedPlaceKey, setSelectedPlaceKey] = useState<string | null>(
    null
  );
  // The edit-trip form.
  const [tripSheetOpen, setTripSheetOpen] = useState(false);

  // While the store is doing its first read, show a quiet placeholder.
  if (!data.ready) {
    return (
      <div className="mx-auto min-h-dvh w-full max-w-[480px] px-4 pt-8">
        <div className="h-8 w-2/3 animate-pulse rounded-lg bg-surface" />
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-surface" />
      </div>
    );
  }

  const trip = data.trips.find((t) => t.id === params.id);

  // The address points at a trip that doesn't exist (or was deleted).
  if (!trip) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Trip not found
        </h1>
        <p className="mt-2 text-[13px] text-ink-soft">
          It may have been deleted on this device.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 flex h-11 items-center justify-center rounded-full bg-accent px-6 text-[14px] font-semibold text-bg"
        >
          Back to trips
        </Link>
      </div>
    );
  }

  // This trip's days in order, and the selected day's stops.
  const days = data.days
    .filter((d) => d.trip_id === trip.id)
    .sort((a, b) => a.day_number - b.day_number);

  // If days were deleted, make sure the selected index still points at
  // a real day.
  const dayIndex = Math.min(activeDay, Math.max(0, days.length - 1));
  const day = days[dayIndex];

  const dayStops = day
    ? data.stops.filter((stop) => stop.day_id === day.id)
    : [];

  // Every stop in the whole trip (Costs and Info tabs need them all).
  const dayIds = new Set(days.map((d) => d.id));
  const allTripStops = data.stops.filter((s) => dayIds.has(s.day_id));

  // This trip's packing items.
  const tripPacking = data.packing.filter((p) => p.trip_id === trip.id);

  // The hotel in the shape the map component expects.
  const hotel = {
    name: trip.hotel_name || "Hotel",
    lat: trip.hotel_lat,
    lng: trip.hotel_lng,
  };

  // When a stop card is tapped: remember which place it is, jump to the
  // map tab, and scroll back to the top so the map is in view.
  const handleStopTap = (stop: Stop) => {
    if (stop.lat === null || stop.lng === null) return;
    setSelectedPlaceKey(stop.place_key ?? `${stop.lat},${stop.lng}`);
    setActiveTab("map");
    window.scrollTo({ top: 0 });
  };

  // Tapping a pin selects it; tapping the SAME pin again deselects it.
  const handleSelectPlace = (placeKey: string) => {
    setSelectedPlaceKey((current) => (current === placeKey ? null : placeKey));
  };

  // When the day changes, clear any selected pin — it belonged to the
  // previous day.
  const handleSelectDay = (index: number) => {
    setActiveDay(index);
    setSelectedPlaceKey(null);
  };

  // Helper: show a view only when its tab is active. All four views stay
  // mounted the whole time (just hidden with CSS), so nothing resets when
  // switching tabs.
  const viewClass = (tab: TabId) => (activeTab === tab ? "block" : "hidden");

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[480px]">
      {/* Sticky top bar with the trip name — stays put while scrolling. */}
      <header
        className="sticky top-0 z-10 border-b border-border px-4 py-3"
        style={{
          backgroundColor: "rgba(15, 15, 15, 0.92)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <div className="flex items-center gap-2">
          {/* The back arrow — always returns to the trips list. */}
          <Link
            href="/dashboard"
            aria-label="Back to trips"
            className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-soft active:bg-surface-2"
          >
            <ArrowLeft size={20} aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl leading-tight font-semibold text-ink">
              {trip.name}
            </h1>
            <p className="text-xs text-ink-soft">{trip.destination}</p>
          </div>
          {/* Edit the trip itself (dates, hotel, budget — or delete it). */}
          <button
            type="button"
            aria-label="Edit trip"
            onClick={() => setTripSheetOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-soft active:bg-surface-2"
          >
            <Pencil size={17} aria-hidden />
          </button>
        </div>
      </header>

      {/* The tab views. Bottom padding leaves room for the tab bar plus
          the iPhone safe area, so the last card is never hidden under it. */}
      <main className="px-4 pt-4 pb-32">
        <div className={viewClass("itinerary")}>
          <ItineraryTab
            trip={trip}
            days={days}
            activeDayIndex={dayIndex}
            onSelectDay={handleSelectDay}
            stops={dayStops}
            onStopTap={handleStopTap}
          />
        </div>

        <div className={viewClass("map")}>
          {days.length > 0 ? (
            <MapTab
              days={days}
              activeDayIndex={dayIndex}
              onSelectDay={handleSelectDay}
              stops={dayStops}
              hotel={hotel}
              selectedPlaceKey={selectedPlaceKey}
              onSelectPlace={handleSelectPlace}
            />
          ) : (
            <p className="py-10 text-center text-[13px] text-ink-faint">
              Add a day on the itinerary first — the map shows one day at a
              time.
            </p>
          )}
        </div>

        <div className={viewClass("costs")}>
          <CostsTab trip={trip} days={days} stops={allTripStops} />
        </div>

        <div className={viewClass("info")}>
          <InfoTab
            trip={trip}
            stops={allTripStops}
            packing={tripPacking}
            dayCount={days.length}
          />
        </div>
      </main>

      {/* The fixed bottom navigation. */}
      <BottomTabBar activeTab={activeTab} onChange={setActiveTab} />

      {/* The edit-trip form. */}
      <TripSheet
        open={tripSheetOpen}
        onOpenChange={setTripSheetOpen}
        trip={trip}
      />
    </div>
  );
}
