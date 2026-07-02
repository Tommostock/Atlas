"use client";

// StopSheet — the slide-up form for adding a stop to a day or editing an
// existing one.
//
// The "Get AI suggestions" button asks Google Gemini (free tier) to fill
// in the details from just the stop's name: a description, category,
// typical cost, visit length, and — for well-known places — approximate
// map coordinates. Everything it fills in can be edited before saving.

import { useEffect, useState } from "react";
import { Trash2, Sparkles, LoaderCircle } from "lucide-react";
import type { Trip, Stop, StopCategory } from "@/lib/types";
import { createStop, updateStop, deleteStop, type StopFields } from "@/lib/store";
import { suggestStopDetails, hasGeminiKey, NO_KEY_MESSAGE } from "@/lib/gemini";
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

// The four categories as a tappable segmented control.
const CATEGORIES: { value: StopCategory; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
  { value: "food", label: "Food" },
  { value: "transport", label: "Transport" },
];

interface StopSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The day this stop belongs to. */
  dayId: string;
  /** The trip — used for currency and the AI prompt. */
  trip: Trip;
  /** When set, the sheet edits this stop; otherwise it creates a new one. */
  stop?: Stop;
}

export default function StopSheet({
  open,
  onOpenChange,
  dayId,
  trip,
  stop,
}: StopSheetProps) {
  const editing = Boolean(stop);

  const [timeLabel, setTimeLabel] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<StopCategory>("free");
  const [costLabel, setCostLabel] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [coords, setCoords] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Load the stop being edited (or a fresh form) each time the sheet opens.
  useEffect(() => {
    if (!open) return;
    setError("");
    setConfirmDelete(false);
    setAiBusy(false);
    if (stop) {
      setTimeLabel(stop.time_label);
      setName(stop.name);
      setDescription(stop.description);
      setCategory(stop.category);
      setCostLabel(stop.cost_label ?? "");
      setCostAmount(stop.cost_amount?.toString() ?? "");
      setDuration(stop.duration_mins?.toString() ?? "");
      setCoords(
        stop.lat !== null && stop.lng !== null ? `${stop.lat}, ${stop.lng}` : ""
      );
      setTicketUrl(stop.ticket_url ?? "");
      setNotes(stop.notes ?? "");
    } else {
      setTimeLabel("");
      setName("");
      setDescription("");
      setCategory("free");
      setCostLabel("");
      setCostAmount("");
      setDuration("");
      setCoords("");
      setTicketUrl("");
      setNotes("");
    }
  }, [open, stop]);

  // Reads "41.89, 12.49" into numbers, or null when empty/invalid.
  function parseCoords(): { lat: number | null; lng: number | null } {
    const parts = coords.split(",").map((p) => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
    return { lat: null, lng: null };
  }

  // Ask Gemini to fill in the details from the stop's name.
  async function handleAiFill() {
    if (!name.trim()) {
      setError("Type the stop's name first, then let the AI fill the rest.");
      return;
    }
    if (!hasGeminiKey()) {
      setError(NO_KEY_MESSAGE);
      return;
    }
    setError("");
    setAiBusy(true);
    try {
      const details = await suggestStopDetails(name.trim(), trip);
      setDescription(details.description ?? "");
      if (details.category) setCategory(details.category);
      setCostLabel(details.cost_label ?? "");
      setCostAmount(details.cost_amount?.toString() ?? "");
      setDuration(details.duration_mins?.toString() ?? "");
      if (details.lat !== null && details.lng !== null) {
        setCoords(`${details.lat}, ${details.lng}`);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "The AI couldn't answer just now."
      );
    } finally {
      setAiBusy(false);
    }
  }

  function handleSave() {
    if (!name.trim()) {
      setError("The stop needs a name.");
      return;
    }
    const position = parseCoords();
    const amount = parseFloat(costAmount);
    const mins = parseInt(duration, 10);

    const fields: StopFields = {
      time_label: timeLabel.trim(),
      name: name.trim(),
      description: description.trim(),
      category,
      cost_label: costLabel.trim() ? costLabel.trim() : null,
      cost_amount: isNaN(amount) ? null : amount,
      duration_mins: isNaN(mins) ? null : mins,
      lat: position.lat,
      lng: position.lng,
      ticket_url: ticketUrl.trim() ? ticketUrl.trim() : null,
      notes: notes.trim() ? notes.trim() : null,
    };

    if (stop) {
      updateStop(stop.id, fields);
    } else {
      createStop(dayId, fields);
    }
    onOpenChange(false);
  }

  function handleDelete() {
    if (!stop) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onOpenChange(false);
    deleteStop(stop.id);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto rounded-t-2xl border-border bg-surface"
      >
        <SheetHeader className="pb-0">
          <SheetTitle className="font-display text-xl text-ink">
            {editing ? "Edit stop" : "Add a stop"}
          </SheetTitle>
          <SheetDescription className="text-[13px] text-ink-soft">
            Only the name is essential — the AI button can fill in the rest.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4">
          <Field label="Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Colosseum"
              className="h-11 bg-surface-2"
            />
          </Field>

          {/* The AI pre-fill button, right under the name it works from. */}
          <button
            type="button"
            onClick={handleAiFill}
            disabled={aiBusy}
            className="flex h-11 items-center justify-center gap-2 rounded-full border border-accent/40 text-[13px] font-semibold text-accent active:scale-[0.98] disabled:opacity-60"
          >
            {aiBusy ? (
              <LoaderCircle size={15} className="animate-spin" aria-hidden />
            ) : (
              <Sparkles size={15} aria-hidden />
            )}
            {aiBusy ? "Asking Gemini…" : "Get AI suggestions"}
          </button>

          <Field label="Time" hint="e.g. 9:25 or 9:25–10:30 (optional)">
            <Input
              value={timeLabel}
              onChange={(e) => setTimeLabel(e.target.value)}
              placeholder="9:30"
              className="h-11 bg-surface-2"
            />
          </Field>

          <Field label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this stop, and why is it worth it?"
              className="min-h-[72px] bg-surface-2"
            />
          </Field>

          <Field label="Category">
            <div className="grid grid-cols-4 gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  aria-pressed={category === c.value}
                  className={cn(
                    "flex h-10 items-center justify-center rounded-xl border text-[12px] font-semibold",
                    category === c.value
                      ? "border-accent bg-accent-tint text-accent"
                      : "border-border text-ink-soft"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cost label" hint="Shown on the card">
              <Input
                value={costLabel}
                onChange={(e) => setCostLabel(e.target.value)}
                placeholder={`${trip.currency_symbol}18pp`}
                className="h-11 bg-surface-2"
              />
            </Field>
            <Field label="Cost per person" hint="Number, for totals">
              <Input
                type="number"
                inputMode="decimal"
                value={costAmount}
                onChange={(e) => setCostAmount(e.target.value)}
                placeholder="18"
                className="h-11 bg-surface-2"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Duration (minutes)">
              <Input
                type="number"
                inputMode="numeric"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="120"
                className="h-11 bg-surface-2"
              />
            </Field>
            <Field label="Map position" hint="Paste from Google Maps">
              <Input
                value={coords}
                onChange={(e) => setCoords(e.target.value)}
                placeholder="41.8902, 12.4922"
                className="h-11 bg-surface-2"
              />
            </Field>
          </div>

          <Field label="Ticket website (optional)">
            <Input
              type="url"
              value={ticketUrl}
              onChange={(e) => setTicketUrl(e.target.value)}
              placeholder="https://…"
              className="h-11 bg-surface-2"
            />
          </Field>

          <Field label="Notes (optional)" hint="Shows under 'Book in advance'">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tickets release 30 days ahead."
              className="min-h-[56px] bg-surface-2"
            />
          </Field>

          {error && <p className="text-[13px] leading-snug text-red">{error}</p>}

          <button
            type="button"
            onClick={handleSave}
            className="flex h-12 items-center justify-center rounded-full bg-accent text-[15px] font-semibold text-bg active:scale-[0.98]"
          >
            {editing ? "Save changes" : "Add stop"}
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
              {confirmDelete ? "Tap again to delete this stop" : "Delete stop"}
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
