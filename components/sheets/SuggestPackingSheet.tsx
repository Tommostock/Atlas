"use client";

// SuggestPackingSheet — asks Google Gemini (free tier) for packing ideas
// suited to the destination and dates, then adds the ones you keep ticked.

import { useEffect, useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import type { Trip, PackingItem } from "@/lib/types";
import { addPackingItem } from "@/lib/store";
import {
  suggestPackingItems,
  hasGeminiKey,
  NO_KEY_MESSAGE,
  type SuggestedPackingItem,
} from "@/lib/gemini";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";

interface SuggestPackingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: Trip;
  dayCount: number;
  /** Items already on the list, so the AI avoids repeats. */
  existingItems: PackingItem[];
}

export default function SuggestPackingSheet({
  open,
  onOpenChange,
  trip,
  dayCount,
  existingItems,
}: SuggestPackingSheetProps) {
  const [suggestions, setSuggestions] = useState<SuggestedPackingItem[]>([]);
  // Which suggestions are ticked (all of them, to start with).
  const [keep, setKeep] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Ask the AI each time the sheet opens.
  useEffect(() => {
    if (!open) return;
    setSuggestions([]);
    setKeep(new Set());
    setError("");

    if (!hasGeminiKey()) {
      setError(NO_KEY_MESSAGE);
      return;
    }

    setBusy(true);
    suggestPackingItems(
      trip,
      dayCount,
      existingItems.map((i) => i.label)
    )
      .then((items) => {
        setSuggestions(items);
        setKeep(new Set(items.map((_, i) => i)));
      })
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : "The AI couldn't answer just now — try again in a minute."
        )
      )
      .finally(() => setBusy(false));
    // Refetch only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggle(index: number) {
    setKeep((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  // Add every ticked suggestion to the real packing list.
  function handleAddSelected() {
    suggestions.forEach((s, index) => {
      if (keep.has(index)) {
        addPackingItem(trip.id, s.category, s.label);
      }
    });
    onOpenChange(false);
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
            Packing ideas
          </SheetTitle>
          <SheetDescription className="text-[13px] text-ink-soft">
            Suggested by Google Gemini (free) for {trip.destination}. Untick
            anything you don&apos;t want, then add the rest.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-1 p-4">
          {busy && (
            <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-ink-soft">
              <LoaderCircle size={16} className="animate-spin" aria-hidden />
              Asking Gemini for ideas…
            </div>
          )}

          {error && (
            <p className="rounded-2xl border border-gold/40 bg-gold-tint p-3.5 text-[13px] leading-relaxed text-ink-soft">
              {error}
            </p>
          )}

          {suggestions.map((s, index) => (
            <label
              key={index}
              className="flex min-h-11 cursor-pointer items-center gap-3 py-1"
            >
              <Checkbox
                checked={keep.has(index)}
                onCheckedChange={() => toggle(index)}
              />
              <span className="text-[13.5px] text-ink">
                {s.label}
                <span className="ml-1.5 text-[11px] text-ink-faint uppercase">
                  {s.category}
                </span>
              </span>
            </label>
          ))}

          {suggestions.length > 0 && (
            <button
              type="button"
              onClick={handleAddSelected}
              className="mt-3 flex h-12 items-center justify-center rounded-full bg-accent text-[15px] font-semibold text-bg active:scale-[0.98]"
            >
              Add {keep.size} item{keep.size === 1 ? "" : "s"} to the list
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
