"use client";

// SchematicMap — an inline SVG "tube map" style view of one day's stops.
//
// Instead of loading Google Maps (which needs a paid API key), we draw our
// own minimal map: a dark canvas, a river, faint city blocks, a route line
// tracing the day in order, and a numbered amber pin for every place.
// Positions are geographically ACCURATE relative to each other, because
// every latitude/longitude goes through the same Web Mercator projection
// that real map apps use.
//
// Interaction: tapping a pin SELECTS it (the parent shows that stop's
// details with a "Walking directions" button). This is friendlier than
// the old behaviour of instantly launching Google Maps by surprise.
//
// Readability: pins that would overlap are nudged a few pixels apart, and
// the name chips push each other out of the way — with a thin "leader
// line" pointing back to the pin when a chip has to move far. These are
// the same de-cluttering tricks real map apps use.

import type { Stop } from "@/lib/types";
import { toMercator } from "@/lib/utils";

// The fixed drawing area. The SVG scales to any screen width, but all our
// coordinate maths happens inside this 820 x 680 space.
const VIEW_W = 820;
const VIEW_H = 680;

// Generous padding so pins never touch the edges (SPEC: minimum 80px).
const PAD = 90;

// The special key used when the hotel pin is selected (the hotel is not a
// "stop", so it needs its own identifier).
export const HOTEL_KEY = "__hotel__";

// One unique place a day visits, before it is positioned on the canvas.
// The map tab's list ALSO uses this, so list numbers always match pins.
export interface MapPlace {
  number: number;
  name: string;
  placeKey: string;
  lat: number;
  lng: number;
}

// One pin on the map: a unique place plus its final canvas position.
interface Pin extends MapPlace {
  x: number;
  y: number;
}

/*
  Works out which unique places a day's stops visit.

  Some stops have no location (e.g. "flight lands"), and some places are
  visited twice in a day (e.g. the basilica and then its dome climb).
  We keep one entry per unique place, numbered in the order it is first
  visited. Stops AT the hotel are skipped, because the hotel always has
  its own dedicated "H" pin.
*/
export function uniqueMapPlaces(
  stops: Stop[],
  hotel: { lat: number; lng: number }
): MapPlace[] {
  const seen = new Set<string>();
  const places: MapPlace[] = [];

  for (const stop of [...stops].sort((a, b) => a.sort_order - b.sort_order)) {
    if (stop.lat === null || stop.lng === null) continue;

    // Is this stop simply "at the hotel"? Compare positions — anything
    // within ~10 metres counts as the same place.
    const isHotel =
      Math.abs(stop.lat - hotel.lat) < 0.0001 &&
      Math.abs(stop.lng - hotel.lng) < 0.0001;
    if (isHotel) continue;

    // Deduplicate: prefer the human-given place_key, fall back to coords.
    const key = stop.place_key ?? `${stop.lat},${stop.lng}`;
    if (seen.has(key)) continue;
    seen.add(key);

    places.push({
      number: places.length + 1,
      name: stop.name,
      placeKey: key,
      lat: stop.lat,
      lng: stop.lng,
    });
  }

  return places;
}

// Opens Google Maps walking directions in a new tab. On a phone this
// hands over to the Google Maps app if it is installed.
export function openWalkingDirections(lat: number, lng: number) {
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`,
    "_blank",
    "noopener,noreferrer"
  );
}

// Shortens long place names so their label chips stay a sensible size.
// The full name is always visible in the list under the map.
function shortLabel(name: string): string {
  return name.length > 22 ? `${name.slice(0, 21)}…` : name;
}

// Rough width of a label chip: 13px Inter averages ~6.9px per character,
// plus breathing room either side. (SVG cannot measure text before
// drawing it, so a good estimate is the standard trick.)
function chipWidth(label: string): number {
  return Math.round(label.length * 6.9) + 18;
}

/*
  Nudges apart any points that sit almost on top of each other.

  When two stops are only a street apart, their pins would overlap and
  become impossible to tap. This routine gently pushes near-neighbours
  away from each other a few pixels at a time, over several rounds, until
  everything has breathing room. The shifts are tiny (a pin ends up at
  most a few metres "wrong"), which is a good trade for a map you can
  actually use — real map apps do exactly the same.
*/
function declutterPoints(
  points: { x: number; y: number }[],
  minDistance: number
) {
  for (let round = 0; round < 5; round++) {
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[j].x - points[i].x;
        const dy = points[j].y - points[i].y;
        const distance = Math.hypot(dx, dy);
        if (distance >= minDistance) continue;

        // If two points are in EXACTLY the same spot, separate them
        // vertically; otherwise push each away along the line between
        // them, half the shortfall each.
        const shortfall = (minDistance - Math.max(distance, 0.01)) / 2;
        const ux = distance === 0 ? 0 : dx / distance;
        const uy = distance === 0 ? 1 : dy / distance;
        points[i].x -= ux * shortfall;
        points[i].y -= uy * shortfall;
        points[j].x += ux * shortfall;
        points[j].y += uy * shortfall;
      }
    }
  }
}

// One label chip, with everything needed to draw it and to detect when
// two chips overlap.
interface Chip {
  x: number; // left edge
  y: number; // vertical centre
  w: number;
  label: string;
  pinX: number;
  pinY: number;
}

const CHIP_H = 24;

/*
  Keeps label chips from covering each other — or any pin.

  Each chip starts beside its pin. Then, working top-to-bottom, any chip
  that overlaps an earlier chip (or sits on top of one of the pins) is
  pushed down until it is clear. A few rounds of this untangles even
  tight clusters. Chips are also kept inside the canvas so no label is
  ever cut off at the edge.
*/
function relaxChips(chips: Chip[], pinPoints: { x: number; y: number }[]) {
  // Every pin becomes a small square "obstacle" that chips must avoid.
  const PIN_SIZE = 46;

  for (let round = 0; round < 4; round++) {
    const ordered = [...chips].sort((a, b) => a.y - b.y);

    // 1. Chips push each other downwards.
    for (let i = 0; i < ordered.length; i++) {
      for (let j = i + 1; j < ordered.length; j++) {
        const a = ordered[i];
        const b = ordered[j];
        const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const overlapY =
          Math.min(a.y + CHIP_H / 2, b.y + CHIP_H / 2) -
          Math.max(a.y - CHIP_H / 2, b.y - CHIP_H / 2);
        if (overlapX > 0 && overlapY > 0) {
          // Push the lower chip further down, plus a little gap.
          b.y += overlapY + 4;
        }
      }
    }

    // 2. Chips move off any pin they are covering (a chip never needs to
    //    cover its OWN pin — it starts beside it — so all pins count).
    for (const chip of ordered) {
      for (const pin of pinPoints) {
        const overlapX =
          Math.min(chip.x + chip.w, pin.x + PIN_SIZE / 2) -
          Math.max(chip.x, pin.x - PIN_SIZE / 2);
        const overlapY =
          Math.min(chip.y + CHIP_H / 2, pin.y + PIN_SIZE / 2) -
          Math.max(chip.y - CHIP_H / 2, pin.y - PIN_SIZE / 2);
        if (overlapX > 0 && overlapY > 0) {
          // Move the chip below the pin it was covering.
          chip.y = pin.y + PIN_SIZE / 2 + CHIP_H / 2 + 2;
        }
      }
    }
  }

  // Finally, clamp every chip inside the drawing area.
  for (const chip of chips) {
    chip.x = Math.min(Math.max(chip.x, 8), VIEW_W - chip.w - 8);
    chip.y = Math.min(Math.max(chip.y, 20), VIEW_H - 20);
  }
}

interface SchematicMapProps {
  /** The stops for the active day (stops without lat/lng are skipped). */
  stops: Stop[];
  /** The hotel, always shown as the "H" pin. */
  hotel: { name: string; lat: number; lng: number };
  /** Optional list of points tracing a river through the city (e.g. the
      Tiber). Drawn as a wide curved band behind everything else. */
  river?: { lat: number; lng: number }[];
  /** The place currently selected (its pin is highlighted), or null. */
  selectedPlaceKey?: string | null;
  /** Called with a place's key when the user taps its pin. */
  onSelectPlace?: (placeKey: string) => void;
}

export default function SchematicMap({
  stops,
  hotel,
  river,
  selectedPlaceKey,
  onSelectPlace,
}: SchematicMapProps) {
  /*
    -------------------------------------------------------------------------
    STEP 1 — collect the unique places to pin (shared helper above).
    -------------------------------------------------------------------------
  */
  const uniquePlaces = uniqueMapPlaces(stops, hotel);

  /*
    -------------------------------------------------------------------------
    STEP 2 — project every point onto the flat map.
    -------------------------------------------------------------------------
    We project the hotel and all pins with Web Mercator, find the rectangle
    that contains them all (the "bounding box"), and then scale that
    rectangle to fit our 820x680 canvas with 90px of breathing room.
    Crucially we use the SAME scale factor horizontally and vertically, so
    distances stay true and the layout never looks squashed.
  */
  const projected = uniquePlaces.map((p) => toMercator(p.lat, p.lng));
  const hotelProj = toMercator(hotel.lat, hotel.lng);
  const allPoints = [hotelProj, ...projected];

  const minX = Math.min(...allPoints.map((p) => p.x));
  const maxX = Math.max(...allPoints.map((p) => p.x));
  const minY = Math.min(...allPoints.map((p) => p.y));
  const maxY = Math.max(...allPoints.map((p) => p.y));

  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const innerW = VIEW_W - PAD * 2;
  const innerH = VIEW_H - PAD * 2;

  // If every point is in the same spot (span of zero), fall back to a
  // scale of 1 so we never divide by zero.
  const scale =
    spanX === 0 && spanY === 0
      ? 1
      : Math.min(
          spanX === 0 ? Infinity : innerW / spanX,
          spanY === 0 ? Infinity : innerH / spanY
        );

  // Convert a projected point to its final position on the SVG canvas.
  // Note: on a map, north (bigger y in Mercator) is UP, but in SVG the
  // y-axis grows DOWNWARD — so we flip it (maxY - y).
  const toSvg = (p: { x: number; y: number }) => ({
    x: PAD + (p.x - minX) * scale + (innerW - spanX * scale) / 2,
    y: PAD + (maxY - p.y) * scale + (innerH - spanY * scale) / 2,
  });

  const pins: Pin[] = uniquePlaces.map((place, i) => ({
    ...place,
    ...toSvg(projected[i]),
  }));

  const hotelPos = toSvg(hotelProj);

  // Give the pins breathing room: any that would overlap are nudged a few
  // pixels apart (the hotel pin included).
  declutterPoints([hotelPos, ...pins], 56);

  /*
    -------------------------------------------------------------------------
    STEP 3 — lay out the name chips.
    -------------------------------------------------------------------------
    Every pin gets a solid label chip beside it. Chips then push each
    other apart so none of them overlap, even in tight clusters.
  */
  const chips: Chip[] = pins.map((pin, index) => {
    const label = shortLabel(pin.name);
    const w = chipWidth(label);
    // Put the chip on whichever side of the pin has more room, and
    // stagger alternate chips up/down as a head start for the relaxing.
    const chipOnLeft = pin.x > VIEW_W * 0.6;
    return {
      x: chipOnLeft ? pin.x - 26 - w : pin.x + 26,
      y: index % 2 === 0 ? pin.y - 10 : pin.y + 14,
      w,
      label,
      pinX: pin.x,
      pinY: pin.y,
    };
  });

  const hotelLabel = shortLabel(hotel.name);
  const hotelChip: Chip = {
    x: hotelPos.x - chipWidth(hotelLabel) / 2,
    y: hotelPos.y + 40,
    w: chipWidth(hotelLabel),
    label: hotelLabel,
    pinX: hotelPos.x,
    pinY: hotelPos.y,
  };

  const allChips = [...chips, hotelChip];
  relaxChips(allChips, [hotelPos, ...pins]);

  /*
    -------------------------------------------------------------------------
    STEP 4 — decorative geography.
    -------------------------------------------------------------------------
    The river is a smooth curve through its projected waypoints. The faint
    "city blocks" sit at the midpoints between consecutive pins — plausible
    spots for buildings, since real blocks sit between destinations.
  */
  let riverPath = "";
  if (river && river.length >= 2) {
    const riverPts = river.map((p) => toSvg(toMercator(p.lat, p.lng)));
    riverPath = `M ${riverPts[0].x} ${riverPts[0].y}`;
    for (let i = 1; i < riverPts.length - 1; i++) {
      const midX = (riverPts[i].x + riverPts[i + 1].x) / 2;
      const midY = (riverPts[i].y + riverPts[i + 1].y) / 2;
      riverPath += ` Q ${riverPts[i].x} ${riverPts[i].y} ${midX} ${midY}`;
    }
    const last = riverPts[riverPts.length - 1];
    riverPath += ` L ${last.x} ${last.y}`;
  }

  const blocks: { x: number; y: number; w: number; h: number }[] = [];
  const blockSizes = [
    { w: 110, h: 74 },
    { w: 84, h: 96 },
    { w: 96, h: 64 },
  ];
  for (let i = 0; i < Math.min(3, pins.length - 1); i++) {
    const a = pins[i];
    const b = pins[i + 1];
    const size = blockSizes[i];
    blocks.push({
      x: (a.x + b.x) / 2 - size.w / 2 + (i % 2 === 0 ? 46 : -46),
      y: (a.y + b.y) / 2 - size.h / 2 + (i % 2 === 0 ? -34 : 34),
      ...size,
    });
  }

  // The walking route through the numbered stops, in visiting order.
  const routePoints = pins.map((p) => `${p.x},${p.y}`).join(" ");

  // Renders one label chip (plus its leader line when the chip had to
  // move away from its pin during de-cluttering).
  const renderChip = (chip: Chip, isSelected: boolean, key: string) => {
    const centreX = chip.x + chip.w / 2;
    const distanceFromPin = Math.hypot(
      centreX - chip.pinX,
      chip.y - chip.pinY
    );
    return (
      <g
        key={key}
        onClick={() => onSelectPlace?.(key === "chip-hotel" ? HOTEL_KEY : key)}
        style={{ cursor: "pointer" }}
      >
        {/* Thin leader line back to the pin, only when the chip has been
            pushed noticeably away from it. The chip's solid body covers
            the line's end, so it looks like it stops at the edge. */}
        {distanceFromPin > 56 && (
          <line
            x1={chip.pinX}
            y1={chip.pinY}
            x2={centreX}
            y2={chip.y}
            stroke="#3A3A3A"
            strokeWidth="1.5"
          />
        )}
        <rect
          x={chip.x}
          y={chip.y - CHIP_H / 2}
          width={chip.w}
          height={CHIP_H}
          rx={CHIP_H / 2}
          fill={isSelected ? "#F0EDE6" : "#0F0F0F"}
          stroke={isSelected ? "#F0EDE6" : "#2E2E2E"}
        />
        <text
          x={centreX}
          y={chip.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="13"
          fontWeight={isSelected ? 600 : 400}
          fill={isSelected ? "#0F0F0F" : "#C9C4BB"}
        >
          {chip.label}
        </text>
      </g>
    );
  };

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      role="img"
      aria-label={`Schematic map of ${pins.length} stops around ${hotel.name}`}
      className="block rounded-2xl border border-border"
    >
      {/* Layer 1 — the dark canvas behind everything. */}
      <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="#1A1A1A" />

      {/* Layer 2 — abstract city blocks (very subtle, slightly lighter). */}
      {blocks.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          rx="10"
          fill="#1F1F1F"
        />
      ))}

      {/* Layer 3 — the river, a wide muted blue-grey band with a thinner
          highlight line down its middle so it clearly reads as water. */}
      {riverPath && (
        <>
          <path
            d={riverPath}
            fill="none"
            stroke="#1D242B"
            strokeWidth="34"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={riverPath}
            fill="none"
            stroke="#232D36"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}

      {/* Layer 4 — the day's route. A dotted lead-in from the hotel to the
          first stop, then a solid line through the stops in order. */}
      {pins.length > 0 && (
        <line
          x1={hotelPos.x}
          y1={hotelPos.y}
          x2={pins[0].x}
          y2={pins[0].y}
          stroke="#2E2E2E"
          strokeWidth="3"
          strokeDasharray="2 9"
          strokeLinecap="round"
        />
      )}
      {pins.length > 1 && (
        <polyline
          points={routePoints}
          fill="none"
          stroke="#3A342C"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Layer 5 — a small compass so "up is north" is obvious. */}
      <g aria-hidden>
        <circle
          cx={VIEW_W - 52}
          cy={52}
          r="24"
          fill="#1F1F1F"
          stroke="#2E2E2E"
        />
        <path
          d={`M ${VIEW_W - 52} 38 l 7 14 l -7 -4 l -7 4 Z`}
          fill="#C87941"
        />
        <text
          x={VIEW_W - 52}
          y={62}
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill="#9A9690"
        >
          N
        </text>
      </g>

      {/* Layer 6 — the hotel pin: a dark circle with a warm-white "H".
          Tapping selects it like any other pin. */}
      {(() => {
        const isSelected = selectedPlaceKey === HOTEL_KEY;
        return (
          <g
            onClick={() => onSelectPlace?.(HOTEL_KEY)}
            style={{ cursor: "pointer" }}
          >
            <title>{hotel.name}</title>
            {/* Invisible larger circle = comfortable tap target. */}
            <circle
              cx={hotelPos.x}
              cy={hotelPos.y}
              r="30"
              fill="transparent"
            />
            {isSelected && (
              <circle
                cx={hotelPos.x}
                cy={hotelPos.y}
                r="25"
                fill="none"
                stroke="#F0EDE6"
                strokeWidth="2"
                opacity="0.5"
              />
            )}
            <circle
              cx={hotelPos.x}
              cy={hotelPos.y}
              r={isSelected ? 20 : 17}
              fill="#0F0F0F"
              stroke="#F0EDE6"
              strokeWidth="1.5"
            />
            <text
              x={hotelPos.x}
              y={hotelPos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="15"
              fontWeight="700"
              fill="#F0EDE6"
            >
              H
            </text>
          </g>
        );
      })()}

      {/* Layer 7 — one numbered amber pin per unique place. */}
      {pins.map((pin) => {
        const isSelected = selectedPlaceKey === pin.placeKey;
        return (
          <g
            key={pin.placeKey}
            onClick={() => onSelectPlace?.(pin.placeKey)}
            style={{ cursor: "pointer" }}
          >
            <title>{pin.name}</title>
            {/* Invisible larger circle = comfortable tap target. */}
            <circle cx={pin.x} cy={pin.y} r="30" fill="transparent" />
            {/* A soft ring appears around the selected pin. */}
            {isSelected && (
              <circle
                cx={pin.x}
                cy={pin.y}
                r="25"
                fill="none"
                stroke="#C87941"
                strokeWidth="2.5"
                opacity="0.6"
              />
            )}
            <circle
              cx={pin.x}
              cy={pin.y}
              r={isSelected ? 20 : 16}
              fill="#C87941"
            />
            <text
              x={pin.x}
              y={pin.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="15"
              fontWeight="700"
              fill="#0F0F0F"
            >
              {pin.number}
            </text>
          </g>
        );
      })}

      {/* Layer 8 — the name chips, drawn on top of everything so they are
          never hidden behind a pin. Tapping a chip selects its stop, just
          like tapping the pin itself. */}
      {chips.map((chip, i) =>
        renderChip(chip, selectedPlaceKey === pins[i].placeKey, pins[i].placeKey)
      )}
      {renderChip(hotelChip, selectedPlaceKey === HOTEL_KEY, "chip-hotel")}

      {/* Friendly fallback if the day has no locatable stops at all. */}
      {pins.length === 0 && (
        <text
          x={VIEW_W / 2}
          y={VIEW_H / 2 - 40}
          textAnchor="middle"
          fontSize="16"
          fill="#5A5754"
        >
          No mapped stops for this day yet
        </text>
      )}
    </svg>
  );
}
