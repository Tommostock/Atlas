"use client";

// ItineraryTab — the main view of the app: pick a day, see its plan.
//
// From top to bottom: the day selector pills, a "hero" introducing the
// day (label pill, big date heading, one-line vibe), an optional gold
// alert box for warnings, and then the timeline of stops.

import { TriangleAlert } from "lucide-react";
import type { Day, Stop } from "@/lib/types";
import DaySelector from "@/components/trip/DaySelector";
import Timeline from "@/components/trip/Timeline";

interface ItineraryTabProps {
  days: Day[];
  activeDayIndex: number;
  onSelectDay: (index: number) => void;
  /** The stops belonging to the active day only. */
  stops: Stop[];
  /** Lets a tapped stop jump to the map tab. */
  onStopTap?: (stop: Stop) => void;
}

// Turns "2026-08-14" into a friendly heading like "Friday 14 August".
function formatDayHeading(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function ItineraryTab({
  days,
  activeDayIndex,
  onSelectDay,
  stops,
  onStopTap,
}: ItineraryTabProps) {
  const day = days[activeDayIndex];

  return (
    <div>
      {/* Day switcher pills. */}
      <DaySelector
        days={days}
        activeDayIndex={activeDayIndex}
        onSelect={onSelectDay}
      />

      {/* The day hero — introduces the selected day. */}
      <div className="mt-5">
        {/* Amber pill with the day's short label. */}
        <span className="inline-block rounded-full bg-accent-tint px-3 py-1 text-[11px] font-semibold tracking-wide text-accent uppercase">
          Day {day.day_number} — {day.label}
        </span>

        {/* Big Fraunces date heading. */}
        <h2 className="mt-2.5 font-display text-[26px] leading-tight font-semibold text-ink">
          {formatDayHeading(day.date)}
        </h2>

        {/* The day's one-line vibe. */}
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
          {day.vibe}
        </p>
      </div>

      {/* Optional warning box — only some days have one. */}
      {day.alert && (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-gold/40 bg-gold-tint p-3.5">
          <TriangleAlert
            size={16}
            className="mt-0.5 shrink-0 text-gold"
            aria-hidden
          />
          <p className="text-[13px] leading-relaxed text-ink-soft italic">
            {day.alert}
          </p>
        </div>
      )}

      {/* The day's stops, one card at a time. */}
      <div className="mt-6">
        <Timeline stops={stops} onStopTap={onStopTap} />
      </div>
    </div>
  );
}
