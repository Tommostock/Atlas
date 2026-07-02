"use client";

// DaySelector — the row of pill buttons for switching between days
// ("Fri 14", "Sat 15", "Sun 16"...). The row scrolls sideways if a trip
// has more days than fit on screen, with the scrollbar hidden so it
// feels like a native app control.

import type { Day } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DaySelectorProps {
  days: Day[];
  /** Which day is currently showing (0 = first day). */
  activeDayIndex: number;
  /** Called with the new index when the user taps a different day. */
  onSelect: (index: number) => void;
}

// Turns "2026-08-14" into "Fri". The "T12:00:00" suffix pins the date to
// midday so time zones can never shift it to the wrong day.
function shortDayName(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
  });
}

// Turns "2026-08-14" into 14 — the big number on the pill.
function dayOfMonth(date: string): number {
  return new Date(`${date}T12:00:00`).getDate();
}

export default function DaySelector({
  days,
  activeDayIndex,
  onSelect,
}: DaySelectorProps) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto">
      {days.map((day, index) => {
        const isActive = index === activeDayIndex;
        return (
          <button
            key={day.id}
            type="button"
            onClick={() => onSelect(index)}
            aria-pressed={isActive}
            className={cn(
              // Every pill is at least 44px tall and wide enough to tap
              // comfortably.
              "flex min-w-[64px] shrink-0 flex-col items-center rounded-2xl border px-4 py-2 transition-colors",
              isActive
                ? // Active day: inverted — warm-white pill, dark text.
                  "border-ink bg-ink text-bg"
                : // Inactive: transparent with a subtle border on hover.
                  "border-transparent text-ink-soft hover:border-border"
            )}
          >
            {/* Small-caps weekday on top... */}
            <span className="text-[10px] font-semibold tracking-[0.08em] uppercase">
              {shortDayName(day.date)}
            </span>
            {/* ...and the date number in Fraunces below. */}
            <span className="font-display text-lg leading-tight font-semibold tabular-nums">
              {dayOfMonth(day.date)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
