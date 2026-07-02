"use client";

// The dashboard — the "all my trips" screen.
//
// Phase 1 shows exactly one hardcoded trip (Rome). In Phase 2 this page
// will list the user's real trips from Supabase, and the "New trip"
// button will open the create-trip sheet.
//
// This is a client component because the "days to go" countdown depends
// on TODAY's date — it must be worked out fresh on the user's phone, not
// frozen at the moment the site was built.

import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";
import { romeTrip, romeDays } from "@/lib/rome-sample-data";

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
    // "14–16 August 2026"
    return `${startDate.getDate()}–${endPart}`;
  }
  // "30 August – 2 September 2026"
  const startPart = startDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });
  return `${startPart} – ${endPart}`;
}

// Works out the trip's status relative to today: how many days until it
// starts, "Ongoing" while we are away, or "Past" once it is over.
function tripCountdown(start: string, end: string): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T23:59:59`);

  if (today > endDate) return "Past";
  if (today >= startDate) return "Ongoing";

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysToGo = Math.ceil((startDate.getTime() - today.getTime()) / msPerDay);
  return daysToGo === 1 ? "1 day to go" : `${daysToGo} days to go`;
}

export default function DashboardPage() {
  const dayCount = romeDays.length;

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[480px] px-4 pt-8 pb-12">
      {/* Page heading. */}
      <h1 className="font-display text-3xl font-semibold text-ink">Trips</h1>
      <p className="mt-1 text-[13px] text-ink-soft">
        Everywhere you are going, in one place.
      </p>

      {/* The Rome trip card — tapping it opens the full trip view. */}
      <Link
        href="/trip/rome"
        className="mt-6 block rounded-2xl border border-border bg-surface p-5 transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center gap-4">
          {/* The user-chosen cover emoji (user content, not UI). */}
          <span className="text-4xl" aria-hidden>
            {romeTrip.cover_emoji}
          </span>

          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg font-semibold text-ink">
              {romeTrip.name}
            </h2>
            <p className="mt-0.5 text-[13px] text-ink-soft tabular-nums">
              {formatDateRange(romeTrip.start_date, romeTrip.end_date)}
            </p>
            <p className="mt-1.5 text-xs text-ink-faint tabular-nums">
              {dayCount} days ·{" "}
              <span className="font-semibold text-accent">
                {tripCountdown(romeTrip.start_date, romeTrip.end_date)}
              </span>
            </p>
          </div>

          <ChevronRight size={18} className="shrink-0 text-ink-faint" aria-hidden />
        </div>
      </Link>

      {/* "New trip" — switched off until Phase 2 brings real accounts. */}
      <button
        type="button"
        disabled
        title="Coming in the next update"
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border text-[14px] font-semibold text-ink-faint opacity-60"
      >
        <Plus size={16} aria-hidden />
        New trip
      </button>
    </div>
  );
}
