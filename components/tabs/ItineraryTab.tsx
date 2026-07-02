"use client";

// ItineraryTab — the main view of the app: pick a day, see and EDIT its
// plan.
//
// From top to bottom: the day selector pills (with a "+" to add a day),
// the day hero (with a pencil to edit the day), an optional gold alert
// box, the timeline of stops (each with its own edit pencil), and then
// the "Add stop" / "Suggest stops (AI)" buttons.

import { useState } from "react";
import { TriangleAlert, Pencil, Plus, Sparkles } from "lucide-react";
import type { Trip, Day, Stop } from "@/lib/types";
import DaySelector from "@/components/trip/DaySelector";
import Timeline from "@/components/trip/Timeline";
import DaySheet from "@/components/sheets/DaySheet";
import StopSheet from "@/components/sheets/StopSheet";
import SuggestStopsSheet from "@/components/sheets/SuggestStopsSheet";

interface ItineraryTabProps {
  trip: Trip;
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

// Adds one calendar day to a date string: "2026-08-14" → "2026-08-15".
// Used to pre-fill the date when adding the next day.
function nextDate(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function ItineraryTab({
  trip,
  days,
  activeDayIndex,
  onSelectDay,
  stops,
  onStopTap,
}: ItineraryTabProps) {
  const day: Day | undefined = days[activeDayIndex];

  // Which sheets are open, and what they are editing.
  const [daySheetOpen, setDaySheetOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<Day | undefined>(undefined);
  const [stopSheetOpen, setStopSheetOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<Stop | undefined>(undefined);
  const [suggestOpen, setSuggestOpen] = useState(false);

  // A sensible date for a new day: the day after the last planned day,
  // or the trip's first day if nothing is planned yet.
  const lastDay = days[days.length - 1];
  const defaultNewDate = lastDay ? nextDate(lastDay.date) : trip.start_date;

  const openAddDay = () => {
    setEditingDay(undefined);
    setDaySheetOpen(true);
  };
  const openEditDay = () => {
    setEditingDay(day);
    setDaySheetOpen(true);
  };
  const openAddStop = () => {
    setEditingStop(undefined);
    setStopSheetOpen(true);
  };
  const openEditStop = (stop: Stop) => {
    setEditingStop(stop);
    setStopSheetOpen(true);
  };

  return (
    <div>
      {/* Day switcher pills, with "+" for adding a day. */}
      <DaySelector
        days={days}
        activeDayIndex={activeDayIndex}
        onSelect={onSelectDay}
        onAddDay={openAddDay}
      />

      {/* A trip with no days yet: friendly prompt to add the first one. */}
      {!day && (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="font-display text-lg font-semibold text-ink">
            No days planned yet
          </p>
          <p className="text-[13px] leading-relaxed text-ink-soft">
            Add your first day and start building the itinerary.
          </p>
          <button
            type="button"
            onClick={openAddDay}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-6 text-[13px] font-semibold text-bg active:scale-[0.98]"
          >
            <Plus size={15} aria-hidden />
            Add your first day
          </button>
        </div>
      )}

      {day && (
        <>
          {/* The day hero — introduces the selected day. */}
          <div className="mt-5">
            <div className="flex items-center justify-between gap-2">
              {/* Amber pill with the day's short label. */}
              <span className="inline-block rounded-full bg-accent-tint px-3 py-1 text-[11px] font-semibold tracking-wide text-accent uppercase">
                Day {day.day_number} — {day.label}
              </span>
              {/* Edit this day (label, vibe, alert, date — or delete it). */}
              <button
                type="button"
                aria-label="Edit this day"
                onClick={openEditDay}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-faint active:bg-surface-2 active:text-ink"
              >
                <Pencil size={14} aria-hidden />
              </button>
            </div>

            {/* Big Fraunces date heading. */}
            <h2 className="mt-2.5 font-display text-[26px] leading-tight font-semibold text-ink">
              {formatDayHeading(day.date)}
            </h2>

            {/* The day's one-line vibe. */}
            {day.vibe && (
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                {day.vibe}
              </p>
            )}
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
            <Timeline
              stops={stops}
              onStopTap={onStopTap}
              onStopEdit={openEditStop}
            />
            {stops.length === 0 && (
              <p className="py-6 text-center text-[13px] text-ink-faint">
                Nothing planned for this day yet.
              </p>
            )}
          </div>

          {/* Add stops by hand, or let the AI suggest some. */}
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={openAddStop}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-accent text-[14px] font-semibold text-bg active:scale-[0.98]"
            >
              <Plus size={16} aria-hidden />
              Add stop
            </button>
            <button
              type="button"
              onClick={() => setSuggestOpen(true)}
              className="flex h-11 items-center justify-center gap-2 rounded-full border border-accent/40 text-[13px] font-semibold text-accent active:scale-[0.98]"
            >
              <Sparkles size={15} aria-hidden />
              Suggest stops (AI)
            </button>
          </div>
        </>
      )}

      {/* The slide-up forms. */}
      <DaySheet
        open={daySheetOpen}
        onOpenChange={setDaySheetOpen}
        tripId={trip.id}
        day={editingDay}
        defaultDate={defaultNewDate}
      />
      {day && (
        <StopSheet
          open={stopSheetOpen}
          onOpenChange={setStopSheetOpen}
          dayId={day.id}
          trip={trip}
          stop={editingStop}
        />
      )}
      {day && (
        <SuggestStopsSheet
          open={suggestOpen}
          onOpenChange={setSuggestOpen}
          trip={trip}
          day={day}
          existingStops={stops}
        />
      )}
    </div>
  );
}
