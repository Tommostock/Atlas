"use client";

// The trip page — the heart of Atlas. It holds the two pieces of state
// that everything shares (which TAB is open, which DAY is selected) and
// wires the four tab views together with the bottom tab bar.
//
// Phase 1 note: the [id] in the address is ignored and we always show the
// hardcoded Rome trip. In Phase 2 this page will load the real trip with
// that id from Supabase.

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Stop } from "@/lib/types";
import BottomTabBar, { type TabId } from "@/components/trip/BottomTabBar";
import ItineraryTab from "@/components/tabs/ItineraryTab";
import MapTab from "@/components/tabs/MapTab";
import CostsTab from "@/components/tabs/CostsTab";
import InfoTab from "@/components/tabs/InfoTab";
import {
  romeTrip,
  romeDays,
  romeStops,
  romePackingList,
  romeRiver,
  romeGettingAround,
  romeThingsToKnow,
} from "@/lib/rome-sample-data";

export default function TripPage() {
  // Which of the four tabs is showing.
  const [activeTab, setActiveTab] = useState<TabId>("itinerary");
  // Which day is selected (0 = the first day).
  const [activeDay, setActiveDay] = useState(0);
  // Which map pin is selected — set by tapping a pin on the map or a stop
  // on the itinerary, cleared when the day changes.
  const [selectedPlaceKey, setSelectedPlaceKey] = useState<string | null>(
    null
  );

  const day = romeDays[activeDay];

  // Just the stops belonging to the selected day.
  const dayStops = romeStops.filter((stop) => stop.day_id === day.id);

  // The hotel in the shape the map component expects.
  const hotel = {
    name: romeTrip.hotel_name,
    lat: romeTrip.hotel_lat,
    lng: romeTrip.hotel_lng,
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
  // mounted the whole time (just hidden with CSS), so things like ticked
  // packing-list items are not lost when switching tabs.
  const viewClass = (tab: TabId) =>
    activeTab === tab ? "block" : "hidden";

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
          {/* The back arrow — always returns to the trips list. The -ml-2
              nudge keeps the arrow visually aligned with the content while
              the button itself stays a full 44px tap target. */}
          <Link
            href="/dashboard"
            aria-label="Back to trips"
            className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-soft active:bg-surface-2"
          >
            <ArrowLeft size={20} aria-hidden />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl leading-tight font-semibold text-ink">
              {romeTrip.name}
            </h1>
            <p className="text-xs text-ink-soft">{romeTrip.destination}</p>
          </div>
        </div>
      </header>

      {/* The tab views. Bottom padding leaves room for the tab bar plus
          the iPhone safe area, so the last card is never hidden under it. */}
      <main className="px-4 pt-4 pb-32">
        <div className={viewClass("itinerary")}>
          <ItineraryTab
            days={romeDays}
            activeDayIndex={activeDay}
            onSelectDay={handleSelectDay}
            stops={dayStops}
            onStopTap={handleStopTap}
          />
        </div>

        <div className={viewClass("map")}>
          <MapTab
            days={romeDays}
            activeDayIndex={activeDay}
            onSelectDay={handleSelectDay}
            stops={dayStops}
            hotel={hotel}
            river={romeRiver}
            selectedPlaceKey={selectedPlaceKey}
            onSelectPlace={handleSelectPlace}
          />
        </div>

        <div className={viewClass("costs")}>
          <CostsTab trip={romeTrip} days={romeDays} stops={romeStops} />
        </div>

        <div className={viewClass("info")}>
          <InfoTab
            trip={romeTrip}
            stops={romeStops}
            packingItems={romePackingList}
            gettingAround={romeGettingAround}
            thingsToKnow={romeThingsToKnow}
            checkInTime="15:00"
          />
        </div>
      </main>

      {/* The fixed bottom navigation. */}
      <BottomTabBar activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}
