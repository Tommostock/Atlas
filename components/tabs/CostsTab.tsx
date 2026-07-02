"use client";

// CostsTab — everything the trip costs, sliced three ways:
//   1. A headline total (with a 1 person / 2 people toggle)
//   2. A breakdown by day
//   3. A breakdown by category (tickets, food & drink, transport)
// ...plus a "Still to book" list of stops that need tickets bought.
//
// All stop costs are stored PER PERSON, so the party-size toggle simply
// multiplies every figure. The trip budget is for the whole party, so it
// stays fixed while the spend changes.

import { useState } from "react";
import { Ticket } from "lucide-react";
import type { Trip, Day, Stop, StopCategory } from "@/lib/types";
import { cn, formatMoney } from "@/lib/utils";

interface CostsTabProps {
  trip: Trip;
  days: Day[];
  /** ALL stops across the whole trip (not just the active day). */
  stops: Stop[];
}

// Friendly display names for each category in the breakdown.
const CATEGORY_LABELS: Record<StopCategory, string> = {
  paid: "Tickets & entry",
  food: "Food & drink",
  transport: "Transport",
  free: "Free stops",
};

// Adds up the per-person cost of a list of stops. Stops with no cost
// simply count as zero.
function sumCosts(stops: Stop[]): number {
  return stops.reduce((total, stop) => total + (stop.cost_amount ?? 0), 0);
}

export default function CostsTab({ trip, days, stops }: CostsTabProps) {
  // How many people are travelling. Defaults to 2 (a couple).
  const [partySize, setPartySize] = useState(2);

  // The headline figure: everything, for everyone.
  const perPersonTotal = sumCosts(stops);
  const partyTotal = perPersonTotal * partySize;

  // Budget comparison (the budget covers the whole party).
  const budget = trip.budget_total;
  const budgetUsed = budget ? Math.min((partyTotal / budget) * 100, 100) : 0;
  const overBudget = budget !== null && partyTotal > budget;

  // Stops that still need tickets buying.
  const stillToBook = stops.filter((stop) => stop.ticket_url);

  return (
    <div className="flex flex-col gap-4">
      {/* ------------------------------------------------------------------
          Summary card — the big number and the party-size toggle.
      ------------------------------------------------------------------ */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-ink-soft uppercase">
              Estimated spend
            </p>
            <p className="mt-1 font-display text-[34px] leading-none font-semibold text-ink tabular-nums">
              {formatMoney(partyTotal, trip.currency_symbol)}
            </p>
            <p className="mt-1.5 text-xs text-ink-faint tabular-nums">
              {formatMoney(perPersonTotal, trip.currency_symbol)} per person
            </p>
          </div>

          {/* The 1 / 2 people toggle. */}
          <div className="flex rounded-full border border-border p-0.5">
            {[1, 2].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setPartySize(size)}
                aria-pressed={partySize === size}
                className={cn(
                  "h-9 rounded-full px-3.5 text-xs font-semibold transition-colors",
                  partySize === size
                    ? "bg-ink text-bg"
                    : "text-ink-soft"
                )}
              >
                {size === 1 ? "1 person" : "2 people"}
              </button>
            ))}
          </div>
        </div>

        {/* Spend vs budget bar — only when the trip has a budget set. */}
        {budget !== null && (
          <div className="mt-5">
            <div className="flex justify-between text-xs">
              <span className={overBudget ? "text-red" : "text-ink-soft"}>
                {overBudget ? "Over budget" : "Within budget"}
              </span>
              <span className="text-ink-soft tabular-nums">
                {formatMoney(partyTotal, trip.currency_symbol)} of{" "}
                {formatMoney(budget, trip.currency_symbol)}
              </span>
            </div>
            {/* The bar itself: a dark track with a flat coloured fill. */}
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className={cn(
                  "h-full rounded-full",
                  overBudget ? "bg-red" : "bg-accent"
                )}
                style={{ width: `${budgetUsed}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------
          Breakdown by day.
      ------------------------------------------------------------------ */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="font-display text-[15px] font-semibold text-ink">
          By day
        </h3>
        <div className="mt-3 flex flex-col gap-2.5">
          {days.map((day) => {
            const dayStops = stops.filter((s) => s.day_id === day.id);
            const dayTotal = sumCosts(dayStops) * partySize;
            return (
              <div
                key={day.id}
                className="flex items-baseline justify-between gap-3"
              >
                <span className="text-[13px] text-ink-soft">
                  Day {day.day_number} · {day.label}
                </span>
                <span className="text-[13px] font-medium text-ink tabular-nums">
                  {formatMoney(dayTotal, trip.currency_symbol)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------
          Breakdown by category.
      ------------------------------------------------------------------ */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="font-display text-[15px] font-semibold text-ink">
          By category
        </h3>
        <div className="mt-3 flex flex-col gap-2.5">
          {(Object.keys(CATEGORY_LABELS) as StopCategory[]).map((category) => {
            const categoryStops = stops.filter(
              (s) => s.category === category
            );
            const categoryTotal = sumCosts(categoryStops) * partySize;
            return (
              <div
                key={category}
                className="flex items-baseline justify-between gap-3"
              >
                <span className="text-[13px] text-ink-soft">
                  {CATEGORY_LABELS[category]}
                  <span className="ml-1.5 text-ink-faint tabular-nums">
                    ({categoryStops.length})
                  </span>
                </span>
                <span className="text-[13px] font-medium text-ink tabular-nums">
                  {formatMoney(categoryTotal, trip.currency_symbol)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------
          Still to book — anything with a ticket link.
      ------------------------------------------------------------------ */}
      {stillToBook.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="font-display text-[15px] font-semibold text-ink">
            Still to book
          </h3>
          <p className="mt-1 text-xs text-ink-faint">
            These need tickets bought in advance.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {stillToBook.map((stop) => (
              <a
                key={stop.id}
                href={stop.ticket_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-surface-2 px-3.5 py-2.5 active:scale-[0.98]"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Ticket size={15} className="shrink-0 text-accent" aria-hidden />
                  <span className="truncate text-[13px] text-ink">
                    {stop.name}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-accent">
                  Buy tickets
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
