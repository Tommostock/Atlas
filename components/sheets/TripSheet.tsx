"use client";

// TripSheet — the slide-up form for creating a new trip or editing an
// existing one. Editing mode also offers deleting the whole trip (with a
// tap-twice confirmation so a stray thumb can't wipe a holiday).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { Trip } from "@/lib/types";
import { createTrip, updateTrip, deleteTrip } from "@/lib/store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import Field from "./Field";
import { cn } from "@/lib/utils";

// The cover emojis offered when creating a trip (user-chosen content).
const EMOJIS = [
  "🏛️", "🏖️", "🗻", "🗼", "🏰", "⛩️",
  "🕌", "🌋", "🏙️", "🌴", "⛷️", "🚢",
  "🎡", "🍜", "🍷", "🎭",
];

// Common currencies with their symbols. Picking one sets both fields.
const CURRENCIES: { code: string; symbol: string }[] = [
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "USD", symbol: "$" },
  { code: "JPY", symbol: "¥" },
  { code: "CHF", symbol: "CHF" },
  { code: "AUD", symbol: "A$" },
  { code: "CAD", symbol: "C$" },
  { code: "SEK", symbol: "kr" },
  { code: "TRY", symbol: "₺" },
  { code: "THB", symbol: "฿" },
  { code: "AED", symbol: "AED" },
];

// Suggests a trip name like "Rome · August 2026" from the destination
// and start date, matching the naming style in SPEC.md.
function suggestName(destination: string, startDate: string): string {
  const city = destination.split(",")[0].trim();
  if (!city) return "";
  if (!startDate) return city;
  const monthYear = new Date(`${startDate}T12:00:00`).toLocaleDateString(
    "en-GB",
    { month: "long", year: "numeric" }
  );
  return `${city} · ${monthYear}`;
}

interface TripSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the sheet edits this trip; otherwise it creates a new one. */
  trip?: Trip;
}

export default function TripSheet({ open, onOpenChange, trip }: TripSheetProps) {
  const router = useRouter();
  const editing = Boolean(trip);

  // One piece of state per form field. Numbers are kept as text while
  // typing and converted when saving.
  const [destination, setDestination] = useState("");
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [hotelAddress, setHotelAddress] = useState("");
  const [hotelPhone, setHotelPhone] = useState("");
  const [hotelCheckin, setHotelCheckin] = useState("15:00");
  const [hotelCoords, setHotelCoords] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Each time the sheet opens, load the trip being edited (or reset for
  // a fresh create form).
  useEffect(() => {
    if (!open) return;
    setError("");
    setConfirmDelete(false);
    if (trip) {
      setDestination(trip.destination);
      setName(trip.name);
      setNameTouched(true);
      setEmoji(trip.cover_emoji);
      setStartDate(trip.start_date);
      setEndDate(trip.end_date);
      setHotelName(trip.hotel_name);
      setHotelAddress(trip.hotel_address);
      setHotelPhone(trip.hotel_phone);
      setHotelCheckin(trip.hotel_checkin || "15:00");
      setHotelCoords(
        trip.hotel_lat && trip.hotel_lng
          ? `${trip.hotel_lat}, ${trip.hotel_lng}`
          : ""
      );
      setCurrency(trip.currency);
      setBudget(trip.budget_total?.toString() ?? "");
    } else {
      setDestination("");
      setName("");
      setNameTouched(false);
      setEmoji(EMOJIS[0]);
      setStartDate("");
      setEndDate("");
      setHotelName("");
      setHotelAddress("");
      setHotelPhone("");
      setHotelCheckin("15:00");
      setHotelCoords("");
      setCurrency("EUR");
      setBudget("");
    }
  }, [open, trip]);

  // Keep the suggested name up to date until the user types their own.
  useEffect(() => {
    if (!nameTouched) setName(suggestName(destination, startDate));
  }, [destination, startDate, nameTouched]);

  // Reads "41.8918, 12.4714" (pasted from Google Maps) into two numbers.
  function parseCoords(): { lat: number; lng: number } {
    const parts = hotelCoords.split(",").map((p) => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] };
    }
    return { lat: 0, lng: 0 };
  }

  function handleSave() {
    // The essentials must be filled in; everything else is optional.
    if (!destination.trim() || !name.trim() || !startDate || !endDate) {
      setError("Destination, name and both dates are needed.");
      return;
    }
    if (endDate < startDate) {
      setError("The end date is before the start date.");
      return;
    }

    const symbol =
      CURRENCIES.find((c) => c.code === currency)?.symbol ?? currency;
    const coords = parseCoords();
    const budgetNumber = parseFloat(budget);

    const fields = {
      name: name.trim(),
      destination: destination.trim(),
      cover_emoji: emoji,
      start_date: startDate,
      end_date: endDate,
      hotel_name: hotelName.trim(),
      hotel_address: hotelAddress.trim(),
      hotel_phone: hotelPhone.trim(),
      hotel_checkin: hotelCheckin.trim(),
      hotel_lat: coords.lat,
      hotel_lng: coords.lng,
      currency,
      currency_symbol: symbol,
      budget_total: isNaN(budgetNumber) ? null : budgetNumber,
    };

    if (trip) {
      updateTrip(trip.id, fields);
      onOpenChange(false);
    } else {
      const created = createTrip({
        ...fields,
        notes: "",
        getting_around: "",
        things_to_know: "",
      });
      // Jump straight into the new trip, ready to add its first day.
      // (Navigate FIRST — closing the sheet at the same time can swallow
      // the navigation.)
      router.push(`/trip/${created.id}`);
      onOpenChange(false);
    }
  }

  function handleDelete() {
    if (!trip) return;
    // First tap arms the button; the second tap actually deletes.
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onOpenChange(false);
    deleteTrip(trip.id);
    router.replace("/dashboard");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto rounded-t-2xl border-border bg-surface"
      >
        <SheetHeader className="pb-0">
          <SheetTitle className="font-display text-xl text-ink">
            {editing ? "Edit trip" : "New trip"}
          </SheetTitle>
          <SheetDescription className="text-[13px] text-ink-soft">
            {editing
              ? "Change anything — it saves to this device."
              : "Just the destination and dates are essential; the rest can wait."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4">
          <Field label="Destination">
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Rome, Italy"
              className="h-11 bg-surface-2"
            />
          </Field>

          <Field label="Trip name">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameTouched(true);
              }}
              placeholder="Rome · August 2026"
              className="h-11 bg-surface-2"
            />
          </Field>

          <Field label="Cover emoji">
            <div className="grid grid-cols-8 gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  aria-pressed={emoji === e}
                  className={cn(
                    "flex h-10 items-center justify-center rounded-xl border text-xl",
                    emoji === e
                      ? "border-accent bg-accent-tint"
                      : "border-transparent bg-surface-2"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="First day">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11 bg-surface-2"
              />
            </Field>
            <Field label="Last day">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11 bg-surface-2"
              />
            </Field>
          </div>

          <Field label="Hotel name">
            <Input
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              placeholder="Hotel Ponte Sisto"
              className="h-11 bg-surface-2"
            />
          </Field>

          <Field label="Hotel address">
            <Input
              value={hotelAddress}
              onChange={(e) => setHotelAddress(e.target.value)}
              placeholder="Via dei Pettinari 64, Roma"
              className="h-11 bg-surface-2"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Hotel phone">
              <Input
                value={hotelPhone}
                onChange={(e) => setHotelPhone(e.target.value)}
                placeholder="+39 06 686310"
                className="h-11 bg-surface-2"
              />
            </Field>
            <Field label="Check-in from">
              <Input
                value={hotelCheckin}
                onChange={(e) => setHotelCheckin(e.target.value)}
                placeholder="15:00"
                className="h-11 bg-surface-2"
              />
            </Field>
          </div>

          <Field
            label="Hotel map position"
            hint="In Google Maps, press and hold the hotel, then copy the two numbers that appear (e.g. 41.8918, 12.4714). This places the H pin."
          >
            <Input
              value={hotelCoords}
              onChange={(e) => setHotelCoords(e.target.value)}
              placeholder="41.8918, 12.4714"
              className="h-11 bg-surface-2"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Currency">
              {/* A native dropdown — phones show their own picker for it. */}
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-11 w-full rounded-md border border-border bg-surface-2 px-3 text-sm text-ink"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Budget (optional)">
              <Input
                type="number"
                inputMode="decimal"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="450"
                className="h-11 bg-surface-2"
              />
            </Field>
          </div>

          {error && <p className="text-[13px] text-red">{error}</p>}

          <button
            type="button"
            onClick={handleSave}
            className="flex h-12 items-center justify-center rounded-full bg-accent text-[15px] font-semibold text-bg active:scale-[0.98]"
          >
            {editing ? "Save changes" : "Create trip"}
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
                ? "Tap again to delete this trip forever"
                : "Delete trip"}
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
