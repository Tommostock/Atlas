"use client";

// Timeline — the vertical list of stops for one day.
//
// Each row reads left to right: the time (right-aligned in a narrow fixed
// column), then a small dot, then the stop card. A thin vertical line runs
// down through the dots to connect the day into one continuous journey —
// except below the final stop, where the line stops.

import type { Stop } from "@/lib/types";
import StopCard from "./StopCard";

interface TimelineProps {
  /** The stops for the active day. */
  stops: Stop[];
  /** Passed through to each StopCard so tapping a stop can jump to the map. */
  onStopTap?: (stop: Stop) => void;
}

export default function Timeline({ stops, onStopTap }: TimelineProps) {
  // Always display stops in their intended order, first to last.
  const ordered = [...stops].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      {ordered.map((stop) => (
        // Each row draws its own piece of the connecting line using a
        // "before:" pseudo-element — a 1px-wide bar that starts just below
        // the dot and runs to the bottom of the row. "last:before:hidden"
        // switches that bar off on the final stop.
        <div
          key={stop.id}
          className="relative flex gap-3 pb-5 last:pb-0 before:absolute before:top-7 before:bottom-0 before:left-[71.5px] before:w-px before:bg-border last:before:hidden"
        >
          {/* Column 1 — the time, right-aligned in a fixed 52px column so
              every time lines up regardless of length. Terracotta colour,
              tabular digits. */}
          <div className="w-[52px] shrink-0 pt-[17px] text-right text-[12px] font-medium text-accent tabular-nums">
            {stop.time_label}
          </div>

          {/* Column 2 — the timeline dot, sitting on top of the line. */}
          <div className="flex w-4 shrink-0 justify-center pt-[21px]">
            <span className="z-[1] h-2 w-2 rounded-full bg-ink-faint" />
          </div>

          {/* Column 3 — the stop card itself. */}
          <div className="min-w-0 flex-1">
            <StopCard stop={stop} onTap={onStopTap} />
          </div>
        </div>
      ))}
    </div>
  );
}
