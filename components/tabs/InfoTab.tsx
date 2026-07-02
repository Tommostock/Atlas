"use client";

// InfoTab — the trip's reference section, now fully editable:
//   - Hotel details (edited via the trip's pencil in the header)
//   - Book in advance (built automatically from stops with ticket links)
//   - Getting around & Things to know (tap the pencil, edit, save)
//   - Packing list: tick, add, delete — plus AI suggestions via the free
//     Google Gemini model.
//
// Ticked packing items are saved on the device, so they survive closing
// the app.

import { useState } from "react";
import {
  ChevronDown,
  Phone,
  MapPin,
  Clock,
  ExternalLink,
  Sparkles,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import type { Trip, Stop, PackingItem } from "@/lib/types";
import {
  updateTrip,
  addPackingItem,
  togglePackingItem,
  deletePackingItem,
} from "@/lib/store";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SuggestPackingSheet from "@/components/sheets/SuggestPackingSheet";
import { cn } from "@/lib/utils";

interface InfoTabProps {
  trip: Trip;
  /** ALL stops across the trip — used to find the "book ahead" ones. */
  stops: Stop[];
  /** This trip's packing items, from the store. */
  packing: PackingItem[];
  /** How many days the trip has (used in the AI packing prompt). */
  dayCount: number;
}

// A reusable collapsible panel with the section title in Fraunces, an
// optional pencil action, and a chevron that flips when closed.
function Section({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Collapsible
      defaultOpen
      className="rounded-2xl border border-border bg-surface"
    >
      <div className="flex items-center">
        <CollapsibleTrigger className="group flex min-h-12 min-w-0 flex-1 items-center justify-between px-4 py-3">
          <span className="font-display text-[15px] font-semibold text-ink">
            {title}
          </span>
          <ChevronDown
            size={16}
            className="text-ink-faint transition-transform group-data-[state=closed]:-rotate-90"
            aria-hidden
          />
        </CollapsibleTrigger>
        {onEdit && (
          <button
            type="button"
            aria-label={`Edit ${title}`}
            onClick={onEdit}
            className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-faint active:bg-surface-2 active:text-ink"
          >
            <Pencil size={13} aria-hidden />
          </button>
        )}
      </div>
      <CollapsibleContent className="px-4 pb-4">{children}</CollapsibleContent>
    </Collapsible>
  );
}

// One of the two editable text sections. Shows the tips as a list; in
// edit mode it becomes a textarea (one tip per line) with Save/Cancel.
function EditableTips({
  text,
  editing,
  draft,
  onDraftChange,
  onSave,
  onCancel,
  emptyHint,
}: {
  text: string;
  editing: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  emptyHint: string;
}) {
  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        <Textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="One tip per line"
          className="min-h-[140px] bg-surface-2 text-[13px]"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSave}
            className="flex h-10 flex-1 items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-bg"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 flex-1 items-center justify-center rounded-full border border-border text-[13px] font-semibold text-ink"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const tips = text.split("\n").filter((t) => t.trim());
  if (tips.length === 0) {
    return <p className="text-[13px] text-ink-faint">{emptyHint}</p>;
  }
  return (
    <ul className="flex flex-col gap-2.5">
      {tips.map((tip, i) => (
        <li key={i} className="text-[13px] leading-relaxed text-ink-soft">
          {tip}
        </li>
      ))}
    </ul>
  );
}

export default function InfoTab({ trip, stops, packing, dayCount }: InfoTabProps) {
  // Which text section is being edited, and its in-progress text.
  const [editingSection, setEditingSection] = useState<
    "getting_around" | "things_to_know" | null
  >(null);
  const [draft, setDraft] = useState("");

  // The "add item" input state: which category it is open for, and the text.
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [newItemLabel, setNewItemLabel] = useState("");

  // The "new category" inputs at the bottom of the packing list.
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryItem, setNewCategoryItem] = useState("");

  // The AI packing suggestions sheet.
  const [suggestOpen, setSuggestOpen] = useState(false);

  // The stops that need advance booking, in trip order.
  const bookAhead = stops.filter((stop) => stop.ticket_url);

  // Group packing items by category, keeping first-seen order.
  const packingCategories: { category: string; items: PackingItem[] }[] = [];
  for (const item of packing) {
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

  function startEditing(section: "getting_around" | "things_to_know") {
    setEditingSection(section);
    setDraft(trip[section]);
  }

  function saveSection() {
    if (!editingSection) return;
    updateTrip(trip.id, { [editingSection]: draft.trim() });
    setEditingSection(null);
  }

  // Adds an item to an existing category from the inline input.
  function handleAddItem(category: string) {
    if (!newItemLabel.trim()) return;
    addPackingItem(trip.id, category, newItemLabel);
    setNewItemLabel("");
    // The input stays open so several items can be added in a row.
  }

  // Adds the first item of a brand-new category.
  function handleAddCategory() {
    if (!newCategoryName.trim() || !newCategoryItem.trim()) return;
    addPackingItem(trip.id, newCategoryName, newCategoryItem);
    setNewCategoryName("");
    setNewCategoryItem("");
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ------------------------------------------------------------------
          1. HOTEL
      ------------------------------------------------------------------ */}
      <Section title="Hotel">
        {trip.hotel_name ? (
          <>
            <p className="text-[15px] font-medium text-ink">
              {trip.hotel_name}
            </p>
            {trip.hotel_address && (
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                {trip.hotel_address}
              </p>
            )}

            <div className="mt-3 flex flex-col gap-2 text-[13px]">
              {trip.hotel_phone && (
                <a
                  href={`tel:${trip.hotel_phone.replace(/\s/g, "")}`}
                  className="flex min-h-11 items-center gap-2.5 text-ink"
                >
                  <Phone size={15} className="text-ink-faint" aria-hidden />
                  {trip.hotel_phone}
                </a>
              )}

              {trip.hotel_checkin && (
                <span className="flex items-center gap-2.5 text-ink-soft">
                  <Clock size={15} className="text-ink-faint" aria-hidden />
                  Check-in from {trip.hotel_checkin}
                </span>
              )}

              {trip.hotel_lat !== 0 && trip.hotel_lng !== 0 && (
                <a
                  href={hotelMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center gap-2.5 font-medium text-accent"
                >
                  <MapPin size={15} aria-hidden />
                  Open in Google Maps
                </a>
              )}
            </div>
          </>
        ) : (
          <p className="text-[13px] text-ink-faint">
            No hotel yet — add it with the pencil at the top of the screen.
          </p>
        )}
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
              {stop.notes && (
                <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
                  {stop.notes}
                </span>
              )}
            </a>
          ))}
          {bookAhead.length === 0 && (
            <p className="text-[13px] text-ink-faint">
              Stops with a ticket website appear here automatically.
            </p>
          )}
        </div>
      </Section>

      {/* ------------------------------------------------------------------
          3. GETTING AROUND (editable)
      ------------------------------------------------------------------ */}
      <Section
        title="Getting around"
        onEdit={() => startEditing("getting_around")}
      >
        <EditableTips
          text={trip.getting_around}
          editing={editingSection === "getting_around"}
          draft={draft}
          onDraftChange={setDraft}
          onSave={saveSection}
          onCancel={() => setEditingSection(null)}
          emptyHint="Tap the pencil to add transport notes — metro tips, taxi prices, airport runs."
        />
      </Section>

      {/* ------------------------------------------------------------------
          4. THINGS TO KNOW (editable)
      ------------------------------------------------------------------ */}
      <Section
        title="Things to know"
        onEdit={() => startEditing("things_to_know")}
      >
        <EditableTips
          text={trip.things_to_know}
          editing={editingSection === "things_to_know"}
          draft={draft}
          onDraftChange={setDraft}
          onSave={saveSection}
          onCancel={() => setEditingSection(null)}
          emptyHint="Tap the pencil to add local tips — dress codes, tipping, opening hours."
        />
      </Section>

      {/* ------------------------------------------------------------------
          5. PACKING LIST (tick, add, delete, AI suggestions)
      ------------------------------------------------------------------ */}
      <Section title="Packing list">
        {packingCategories.map((group) => (
          <div key={group.category} className="mb-4 last:mb-0">
            {/* Category heading with its own little "add item" button. */}
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
                {group.category}
              </p>
              <button
                type="button"
                aria-label={`Add item to ${group.category}`}
                onClick={() => {
                  setAddingCategory(
                    addingCategory === group.category ? null : group.category
                  );
                  setNewItemLabel("");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint active:bg-surface-2 active:text-accent"
              >
                <Plus size={14} aria-hidden />
              </button>
            </div>

            {group.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                {/* The tickable part of the row. */}
                <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 py-1">
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() => togglePackingItem(item.id)}
                  />
                  <span
                    className={cn(
                      "text-[13.5px] leading-snug",
                      item.checked
                        ? "text-ink-faint line-through"
                        : "text-ink"
                    )}
                  >
                    {item.label}
                  </span>
                </label>
                {/* Remove the item entirely. */}
                <button
                  type="button"
                  aria-label={`Remove ${item.label}`}
                  onClick={() => deletePackingItem(item.id)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-faint active:bg-surface-2 active:text-red"
                >
                  <X size={14} aria-hidden />
                </button>
              </div>
            ))}

            {/* The inline "add an item" input for this category. */}
            {addingCategory === group.category && (
              <div className="mt-1 flex gap-2">
                <Input
                  autoFocus
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddItem(group.category);
                  }}
                  placeholder="New item…"
                  className="h-10 bg-surface-2"
                />
                <button
                  type="button"
                  onClick={() => handleAddItem(group.category)}
                  className="flex h-10 shrink-0 items-center justify-center rounded-full bg-accent px-4 text-[13px] font-semibold text-bg"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Start a brand-new category. */}
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
            New category
          </p>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category (e.g. Beach)"
                className="h-10 bg-surface-2"
              />
              <Input
                value={newCategoryItem}
                onChange={(e) => setNewCategoryItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCategory();
                }}
                placeholder="First item"
                className="h-10 bg-surface-2"
              />
            </div>
            <button
              type="button"
              onClick={handleAddCategory}
              className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-border text-[13px] font-semibold text-ink active:scale-[0.98]"
            >
              <Plus size={14} aria-hidden />
              Add category
            </button>
          </div>
        </div>

        {/* AI packing suggestions — now live (free Google Gemini). */}
        <button
          type="button"
          onClick={() => setSuggestOpen(true)}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-accent/40 text-[13px] font-semibold text-accent active:scale-[0.98]"
        >
          <Sparkles size={15} aria-hidden />
          Suggest items (AI)
        </button>
      </Section>

      <SuggestPackingSheet
        open={suggestOpen}
        onOpenChange={setSuggestOpen}
        trip={trip}
        dayCount={dayCount}
        existingItems={packing}
      />
    </div>
  );
}
