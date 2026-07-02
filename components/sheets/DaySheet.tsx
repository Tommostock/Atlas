"use client";

// DaySheet — the slide-up form for adding a day to a trip or editing an
// existing one. Deleting a day also removes its stops (tap-twice confirm).

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import type { Day } from "@/lib/types";
import { createDay, updateDay, deleteDay } from "@/lib/store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Field from "./Field";
import { cn } from "@/lib/utils";

interface DaySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  /** When set, the sheet edits this day; otherwise it creates a new one. */
  day?: Day;
  /** Sensible starting date for a NEW day (the day after the last one). */
  defaultDate?: string;
}

export default function DaySheet({
  open,
  onOpenChange,
  tripId,
  day,
  defaultDate,
}: DaySheetProps) {
  const editing = Boolean(day);

  const [date, setDate] = useState("");
  const [label, setLabel] = useState("");
  const [vibe, setVibe] = useState("");
  const [alert, setAlert] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Load the day being edited (or a fresh form) each time the sheet opens.
  useEffect(() => {
    if (!open) return;
    setError("");
    setConfirmDelete(false);
    if (day) {
      setDate(day.date);
      setLabel(day.label);
      setVibe(day.vibe);
      setAlert(day.alert ?? "");
    } else {
      setDate(defaultDate ?? "");
      setLabel("");
      setVibe("");
      setAlert("");
    }
  }, [open, day, defaultDate]);

  function handleSave() {
    if (!date || !label.trim()) {
      setError("A date and a short label are needed.");
      return;
    }
    const fields = {
      date,
      label: label.trim(),
      vibe: vibe.trim(),
      alert: alert.trim() ? alert.trim() : null,
    };
    if (day) {
      updateDay(day.id, fields);
    } else {
      createDay(tripId, fields);
    }
    onOpenChange(false);
  }

  function handleDelete() {
    if (!day) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onOpenChange(false);
    deleteDay(day.id);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto rounded-t-2xl border-border bg-surface"
      >
        <SheetHeader className="pb-0">
          <SheetTitle className="font-display text-xl text-ink">
            {editing ? "Edit day" : "Add a day"}
          </SheetTitle>
          <SheetDescription className="text-[13px] text-ink-soft">
            A short label and a one-line feel for the day.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4">
          <Field label="Date">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 bg-surface-2"
            />
          </Field>

          <Field label="Label" hint="Short, e.g. 'Arrive & explore'">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ancient Rome"
              className="h-11 bg-surface-2"
            />
          </Field>

          <Field label="Vibe" hint="One sentence describing the day's feel">
            <Input
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              placeholder="Colosseum, Forum and the classics."
              className="h-11 bg-surface-2"
            />
          </Field>

          <Field
            label="Alert (optional)"
            hint="Shows in a gold warning box at the top of the day"
          >
            <Textarea
              value={alert}
              onChange={(e) => setAlert(e.target.value)}
              placeholder="Public holiday — book tickets well ahead."
              className="min-h-[64px] bg-surface-2"
            />
          </Field>

          {error && <p className="text-[13px] text-red">{error}</p>}

          <button
            type="button"
            onClick={handleSave}
            className="flex h-12 items-center justify-center rounded-full bg-accent text-[15px] font-semibold text-bg active:scale-[0.98]"
          >
            {editing ? "Save changes" : "Add day"}
          </button>

          {editing && (
            <button
              type="button"
              onClick={handleDelete}
              className={cn(
                "flex h-11 items-center justify-center gap-2 rounded-full border text-[13px] font-semibold active:scale-[0.98]",
                confirmDelete
                  ? "border-red bg-red text-ink"
                  : "border-red/40 text-red"
              )}
            >
              <Trash2 size={15} aria-hidden />
              {confirmDelete
                ? "Tap again — this deletes the day and its stops"
                : "Delete day"}
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
