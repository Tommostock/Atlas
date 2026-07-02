"use client";

// StopCard — one stop on the itinerary (a sight, a meal, or a journey).
//
// This is the most-repeated element in the whole app, so it works hard:
// it shows the name, description, cost, duration, a colour-coded category
// badge, and (when relevant) "Buy tickets" and "Walking directions"
// buttons. Tapping the card itself jumps to the map tab focused on this
// stop's location.

import { Euro, Clock, Ticket, Navigation, Pencil } from "lucide-react";
import type { Stop, StopCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

// How each category looks. Each one gets a distinct but subtle colour
// treatment (SPEC: free = green, paid = amber "Book ahead",
// food = warm neutral, transport = muted blue-grey).
const CATEGORY_META: Record<
  StopCategory,
  { label: string; badgeClasses: string }
> = {
  free: { label: "Free", badgeClasses: "bg-green-tint text-green" },
  paid: { label: "Book ahead", badgeClasses: "bg-accent-tint text-accent" },
  food: { label: "Food", badgeClasses: "bg-[#241E14] text-[#BCA987]" },
  transport: {
    label: "Transport",
    badgeClasses: "bg-[#161D24] text-[#8FA3B5]",
  },
};

interface StopCardProps {
  stop: Stop;
  /** Called when the user taps the card body (not the buttons). The trip
      page uses this to jump to the map tab focused on this stop. */
  onTap?: (stop: Stop) => void;
  /** Called when the user taps the pencil — opens the edit form. */
  onEdit?: (stop: Stop) => void;
}

export default function StopCard({ stop, onTap, onEdit }: StopCardProps) {
  const meta = CATEGORY_META[stop.category];

  // The card only reacts to taps if the stop has a mappable location.
  const tappable = Boolean(onTap && stop.lat !== null && stop.lng !== null);

  return (
    <div
      onClick={tappable ? () => onTap?.(stop) : undefined}
      className={cn(
        // The card: a dark surface with a subtle border (never a shadow),
        // and a gentle "press down" animation when tapped.
        "relative rounded-2xl border border-border bg-surface p-4",
        "transition-transform duration-100 active:scale-[0.98]",
        tappable && "cursor-pointer"
      )}
    >
      {/* The small dot on the card's left edge: green means free entry,
          amber means it costs money (or is food/transport). */}
      <span
        aria-hidden
        className={cn(
          "absolute top-6 left-0 h-2 w-2 -translate-x-1/2 rounded-full",
          stop.category === "free" ? "bg-green" : "bg-accent"
        )}
      />

      {/* Top row: the stop name on the left; edit pencil and category
          badge on the right. */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-[15px] leading-snug font-semibold text-ink">
          {stop.name}
        </h3>
        <span className="flex shrink-0 items-center gap-1.5">
          {onEdit && (
            <button
              type="button"
              aria-label={`Edit ${stop.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(stop);
              }}
              // Small icon, but padded out to a comfortable tap size.
              className="-my-1.5 flex h-9 w-9 items-center justify-center rounded-full text-ink-faint active:bg-surface-2 active:text-ink"
            >
              <Pencil size={13} aria-hidden />
            </button>
          )}
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[10.5px] font-semibold tracking-wide uppercase",
              meta.badgeClasses
            )}
          >
            {meta.label}
          </span>
        </span>
      </div>

      {/* The description underneath. */}
      {stop.description && (
        <p className="mt-1.5 text-[13px] leading-[1.5] text-ink-soft">
          {stop.description}
        </p>
      )}

      {/* Cost and duration, each with a little icon. "tabular-nums" keeps
          the digits evenly spaced so columns of numbers line up. */}
      {(stop.cost_label || stop.duration_mins) && (
        <div className="mt-3 flex items-center gap-4 text-xs text-ink-soft">
          {stop.cost_label && (
            <span className="flex items-center gap-1 tabular-nums">
              <Euro size={13} className="text-ink-faint" aria-hidden />
              {stop.cost_label}
            </span>
          )}
          {stop.duration_mins && (
            <span className="flex items-center gap-1 tabular-nums">
              <Clock size={13} className="text-ink-faint" aria-hidden />
              {stop.duration_mins} min
            </span>
          )}
        </div>
      )}

      {/* Action buttons. Both are real links that open in a new tab.
          e.stopPropagation() stops a button tap from ALSO counting as a
          tap on the card underneath it. */}
      {(stop.ticket_url || stop.directions_url) && (
        <div className="mt-3.5 flex gap-2">
          {stop.ticket_url && (
            <a
              href={stop.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-accent text-[13px] font-semibold text-bg"
            >
              <Ticket size={15} aria-hidden />
              Buy tickets
            </a>
          )}
          {stop.directions_url && (
            <a
              href={stop.directions_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-border text-[13px] font-semibold text-ink"
            >
              <Navigation size={15} aria-hidden />
              Walking directions
            </a>
          )}
        </div>
      )}
    </div>
  );
}
