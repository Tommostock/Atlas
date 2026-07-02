"use client";

// The dashboard — the "all my trips" home screen.
//
// Trips come from the on-device store: the Rome starter trip on first
// run, plus every trip you create. The "New trip" button opens the
// create-trip form — no demo mode, this is the real thing.

import { useState } from "react";
import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";
import { useAtlas } from "@/lib/store";
import TripSheet from "@/components/sheets/TripSheet";

// Formats the trip dates as one friendly range, e.g. "14–16 August 2026".
function formatDateRange(start: string, end: string): string {
  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);

  const sameMonth =
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear();

  const endPart = endDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (sameMonth) {
    return `${startDate.getDate()}–${endPart}`;
  }
  const startPart = startDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });
  return `${startPart} – ${endPart}`;
}

// Works out the trip's status relative to today: how many days until it
// starts, "Ongoing" while you are away, or "Past" once it is over.
function tripCountdown(start: string, end: string): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T23:59:59`);

  if (today > endDate) return "Past";
  if (today >= startDate) return "Ongoing";

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysToGo = Math.ceil(
    (startDate.getTime() - today.getTime()) / msPerDay
  );
  return daysToGo === 1 ? "1 day to go" : `${daysToGo} days to go`;
}

export default function DashboardPage() {
  const data = useAtlas();
  const [createOpen, setCreateOpen] = useState(false);

  // Soonest trip first; past trips sink to the bottom.
  const trips = [...data.trips].sort((a, b) =>
    a.start_date.localeCompare(b.start_date)
  );

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[480px] px-4 pt-8 pb-12">
      {/* Page heading. */}
      <h1 className="font-display text-3xl font-semibold text-ink">Trips</h1>
      <p className="mt-1 text-[13px] text-ink-soft">
        Everywhere you are going, in one place.
      </p>

      {/* Quiet placeholder during the store's first read. */}
      {!data.ready && (
        <div className="mt-6 h-28 animate-pulse rounded-2xl bg-surface" />
      )}

      {/* One card per trip. */}
      {data.ready &&
        trips.map((trip) => {
          const dayCount = data.days.filter(
            (d) => d.trip_id === trip.id
          ).length;
          return (
            <Link
              key={trip.id}
              href={`/trip/${trip.id}`}
              className="mt-4 block rounded-2xl border border-border bg-surface p-5 transition-transform first-of-type:mt-6 active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                {/* The user-chosen cover emoji (user content, not UI). */}
                <span className="text-4xl" aria-hidden>
                  {trip.cover_emoji}
                </span>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-lg font-semibold text-ink">
                    {trip.name}
                  </h2>
                  <p className="mt-0.5 text-[13px] text-ink-soft tabular-nums">
                    {formatDateRange(trip.start_date, trip.end_date)}
                  </p>
                  <p className="mt-1.5 text-xs text-ink-faint tabular-nums">
                    {dayCount} {dayCount === 1 ? "day" : "days"} planned ·{" "}
                    <span className="font-semibold text-accent">
                      {tripCountdown(trip.start_date, trip.end_date)}
                    </span>
                  </p>
                </div>

                <ChevronRight
                  size={18}
                  className="shrink-0 text-ink-faint"
                  aria-hidden
                />
              </div>
            </Link>
          );
        })}

      {/* Friendly prompt when every trip has been deleted. */}
      {data.ready && trips.length === 0 && (
        <div className="mt-10 rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="font-display text-lg font-semibold text-ink">
            No trips yet
          </p>
          <p className="mt-1 text-[13px] text-ink-soft">
            Somewhere calling? Start planning it.
          </p>
        </div>
      )}

      {/* Create a new trip — fully working, saves to this device. */}
      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent text-[14px] font-semibold text-bg active:scale-[0.98]"
      >
        <Plus size={16} aria-hidden />
        New trip
      </button>

      {/* A gentle heads-up about where the data lives. */}
      <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-faint">
        Trips are saved on this device.
      </p>

      <TripSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
