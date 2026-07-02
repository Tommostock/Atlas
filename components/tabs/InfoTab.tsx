"use client";

// InfoTab — the trip's reference section, organised into five collapsible
// panels that all start open: Hotel, Book in advance, Getting around,
// Things to know, and the Packing list.
//
// In Phase 1 the packing list checkboxes are remembered only while the
// app is open (plain React state). Phase 2 will save them to the
// database so they survive closing the app.

import { useState } from "react";
import {
  ChevronDown,
  Phone,
  MapPin,
  Clock,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import type { Trip, Stop, PackingItem } from "@/lib/types";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface InfoTabProps {
  trip: Trip;
  /** ALL stops across the trip — used to find the "book ahead" ones. */
  stops: Stop[];
  packingItems: PackingItem[];
  /** Paragraphs for the "Getting around" section (hardcoded in Phase 1). */
  gettingAround: string[];
  /** Paragraphs for the "Things to know" section (hardcoded in Phase 1). */
  thingsToKnow: string[];
  /** Hotel check-in time shown in the Hotel panel (Phase 1: hardcoded). */
  checkInTime: string;
}

// A reusable collapsible panel with the section title in Fraunces and a
// chevron that flips when the panel is closed.
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Collapsible
      defaultOpen
      className="rounded-2xl border border-border bg-surface"
    >
      <CollapsibleTrigger className="group flex min-h-12 w-full items-center justify-between px-4 py-3">
        <span className="font-display text-[15px] font-semibold text-ink">
          {title}
        </span>
        <ChevronDown
          size={16}
          className="text-ink-faint transition-transform group-data-[state=closed]:-rotate-90"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">{children}</CollapsibleContent>
    </Collapsible>
  );
}

export default function InfoTab({
  trip,
  stops,
  packingItems,
  gettingAround,
  thingsToKnow,
  checkInTime,
}: InfoTabProps) {
  // Which packing items are ticked, keyed by item id.
  // (Phase 1: lives in memory. Phase 2: saved to Supabase.)
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // The stops that need advance booking, in trip order.
  const bookAhead = stops.filter((stop) => stop.ticket_url);

  // Group packing items by category, keeping the original order.
  const packingCategories: { category: string; items: PackingItem[] }[] = [];
  for (const item of packingItems) {
    const existing = packingCategories.find(
      (group) => group.category === item.category
    );
    if (existing) {
      existing.items.push(item);
    } else {
      packingCategories.push({ category: item.category, items: [item] });
    }
  }

  // A ready-made Google Maps link to the hotel.
  const hotelMapUrl = `https://www.google.com/maps/search/?api=1&query=${trip.hotel_lat},${trip.hotel_lng}`;

  return (
    <div className="flex flex-col gap-3">
      {/* ------------------------------------------------------------------
          1. HOTEL
      ------------------------------------------------------------------ */}
      <Section title="Hotel">
        <p className="text-[15px] font-medium text-ink">{trip.hotel_name}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
          {trip.hotel_address}
        </p>

        <div className="mt-3 flex flex-col gap-2 text-[13px]">
          {/* Phone — a tel: link, so tapping it starts a call. */}
          <a
            href={`tel:${trip.hotel_phone.replace(/\s/g, "")}`}
            className="flex min-h-11 items-center gap-2.5 text-ink"
          >
            <Phone size={15} className="text-ink-faint" aria-hidden />
            {trip.hotel_phone}
          </a>

          {/* Check-in time. */}
          <span className="flex items-center gap-2.5 text-ink-soft">
            <Clock size={15} className="text-ink-faint" aria-hidden />
            Check-in from {checkInTime}
          </span>

          {/* Map link. */}
          <a
            href={hotelMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center gap-2.5 font-medium text-accent"
          >
            <MapPin size={15} aria-hidden />
            Open in Google Maps
          </a>
        </div>
      </Section>

      {/* ------------------------------------------------------------------
          2. BOOK IN ADVANCE
      ------------------------------------------------------------------ */}
      <Section title="Book in advance">
        <div className="flex flex-col gap-2">
          {bookAhead.map((stop) => (
            <a
              key={stop.id}
              href={stop.ticket_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-surface-2 px-3.5 py-3 active:scale-[0.98]"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-[13.5px] font-medium text-ink">
                  {stop.name}
                </span>
                <ExternalLink
                  size={14}
                  className="shrink-0 text-accent"
                  aria-hidden
                />
              </span>
              {/* Booking notes, when the stop has them. */}
              {stop.notes && (
                <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
                  {stop.notes}
                </span>
              )}
            </a>
          ))}
          {bookAhead.length === 0 && (
            <p className="text-[13px] text-ink-faint">
              Nothing needs booking ahead on this trip.
            </p>
          )}
        </div>
      </Section>

      {/* ------------------------------------------------------------------
          3. GETTING AROUND
      ------------------------------------------------------------------ */}
      <Section title="Getting around">
        <ul className="flex flex-col gap-2.5">
          {gettingAround.map((tip, i) => (
            <li
              key={i}
              className="text-[13px] leading-relaxed text-ink-soft"
            >
              {tip}
            </li>
          ))}
        </ul>
      </Section>

      {/* ------------------------------------------------------------------
          4. THINGS TO KNOW
      ------------------------------------------------------------------ */}
      <Section title="Things to know">
        <ul className="flex flex-col gap-2.5">
          {thingsToKnow.map((tip, i) => (
            <li
              key={i}
              className="text-[13px] leading-relaxed text-ink-soft"
            >
              {tip}
            </li>
          ))}
        </ul>
      </Section>

      {/* ------------------------------------------------------------------
          5. PACKING LIST
      ------------------------------------------------------------------ */}
      <Section title="Packing list">
        {packingCategories.map((group) => (
          <div key={group.category} className="mb-4 last:mb-0">
            {/* Category heading, e.g. "Documents". */}
            <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
              {group.category}
            </p>
            {group.items.map((item) => (
              // The whole row is a <label>, so tapping anywhere on it
              // (not just the little box) toggles the checkbox — a much
              // friendlier tap target on a phone.
              <label
                key={item.id}
                className="flex min-h-11 cursor-pointer items-center gap-3 py-1"
              >
                <Checkbox
                  checked={checked[item.id] ?? false}
                  onCheckedChange={() => toggleItem(item.id)}
                />
                <span
                  className={cn(
                    "text-[13.5px] leading-snug",
                    checked[item.id]
                      ? "text-ink-faint line-through"
                      : "text-ink"
                  )}
                >
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        ))}

        {/* AI suggestions arrive in Phase 3 — for now the button is
            visible but switched off, with a tooltip explaining why. */}
        <button
          type="button"
          disabled
          title="Available once AI is connected"
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border text-[13px] font-semibold text-ink-faint opacity-60"
        >
          <Sparkles size={15} aria-hidden />
          Suggest items (AI)
        </button>
      </Section>
    </div>
  );
}
