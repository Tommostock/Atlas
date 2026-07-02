"use client";

// SuggestStopsSheet — asks Google Gemini (free tier) for stop ideas that
// fit the selected day, and lets you add the ones you like with one tap.
// Nothing is added without your say-so.

import { useEffect, useState } from "react";
import { Plus, Check, LoaderCircle, Sparkles } from "lucide-react";
import type { Trip, Day, Stop } from "@/lib/types";
import { createStop } from "@/lib/store";
import {
  suggestStops,
  hasGeminiKey,
  NO_KEY_MESSAGE,
  type SuggestedStop,
} from "@/lib/gemini";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface SuggestStopsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: Trip;
  day: Day;
  /** The stops already planned for this day (so the AI avoids repeats). */
  existingStops: Stop[];
}

export default function SuggestStopsSheet({
  open,
  onOpenChange,
  trip,
  day,
  existingStops,
}: SuggestStopsSheetProps) {
  const [suggestions, setSuggestions] = useState<SuggestedStop[]>([]);
  const [added, setAdded] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Ask the AI each time the sheet opens.
  useEffect(() => {
    if (!open) return;
    setSuggestions([]);
    setAdded(new Set());
    setError("");

    if (!hasGeminiKey()) {
      setError(NO_KEY_MESSAGE);
      return;
    }

    setBusy(true);
    suggestStops(trip, day, existingStops)
      .then(setSuggestions)
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : "The AI couldn't answer just now — try again in a minute."
        )
      )
      .finally(() => setBusy(false));
    // Refetch only when the sheet opens, not every keystroke elsewhere.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Add one suggestion to the day as a real stop.
  function handleAdd(suggestion: SuggestedStop, index: number) {
    createStop(day.id, {
      time_label: "",
      name: suggestion.name,
      description: suggestion.description,
      category: suggestion.category ?? "free",
      cost_label: suggestion.cost_label,
      cost_amount: suggestion.cost_amount,
      duration_mins: suggestion.duration_mins,
      lat: suggestion.lat,
      lng: suggestion.lng,
      ticket_url: null,
      notes: null,
    });
    setAdded((prev) => new Set(prev).add(index));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto rounded-t-2xl border-border bg-surface"
      >
        <SheetHeader className="pb-0">
          <SheetTitle className="flex items-center gap-2 font-display text-xl text-ink">
            <Sparkles size={18} className="text-accent" aria-hidden />
            Ideas for day {day.day_number}
          </SheetTitle>
          <SheetDescription className="text-[13px] text-ink-soft">
            Suggested by Google Gemini (free) for {trip.destination}. Add the
            ones you like — you can edit times and details afterwards.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 p-4">
          {/* Thinking… */}
          {busy && (
            <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-ink-soft">
              <LoaderCircle size={16} className="animate-spin" aria-hidden />
              Asking Gemini for ideas…
            </div>
          )}

          {/* Problem (usually: no key set up yet). */}
          {error && (
            <p className="rounded-2xl border border-gold/40 bg-gold-tint p-3.5 text-[13px] leading-relaxed text-ink-soft">
              {error}
            </p>
          )}

          {/* The suggestions. */}
          {suggestions.map((s, index) => {
            const isAdded = added.has(index);
            return (
              <div
                key={index}
                className="rounded-2xl border border-border bg-surface-2 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-[15px] font-semibold text-ink">
                      {s.name}
                    </h3>
                    <p className="mt-1 text-[13px] leading-[1.5] text-ink-soft">
                      {s.description}
                    </p>
                    <p className="mt-1.5 text-xs text-ink-faint tabular-nums">
                      {[
                        s.category,
                        s.cost_label ?? undefined,
                        s.duration_mins ? `${s.duration_mins} min` : undefined,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdd(s, index)}
                    disabled={isAdded}
                    aria-label={isAdded ? "Added" : `Add ${s.name}`}
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                      isAdded
                        ? "bg-green-tint text-green"
                        : "bg-accent text-bg active:scale-[0.95]"
                    )}
                  >
                    {isAdded ? <Check size={18} /> : <Plus size={18} />}
                  </button>
                </div>
              </div>
            );
          })}

          {!busy && !error && suggestions.length === 0 && (
            <p className="py-8 text-center text-[13px] text-ink-faint">
              No suggestions this time — try again.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
