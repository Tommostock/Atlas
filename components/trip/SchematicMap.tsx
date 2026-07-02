"use client";

// SchematicMap — an inline SVG "tube map" style view of one day's stops.
//
// Instead of loading Google Maps (which needs a paid API key), we draw our
// own minimal map: a dark canvas, a river, a few abstract city blocks,
// faint route lines, and a numbered amber pin for every place we visit.
// Positions are geographically ACCURATE relative to each other, because
// every latitude/longitude is run through the same Web Mercator projection
// that real map apps use.
//
// Tapping any pin opens Google Maps walking directions to that place.

import type { Stop } from "@/lib/types";
import { toMercator } from "@/lib/utils";

// The fixed drawing area. The SVG scales to any screen width, but all our
// coordinate maths happens inside this 820 x 680 space.
const VIEW_W = 820;
const VIEW_H = 680;

// Generous padding so pins never touch the edges (SPEC: minimum 80px).
const PAD = 90;

interface SchematicMapProps {
  /** The stops for the active day (stops without lat/lng are skipped). */
  stops: Stop[];
  /** The hotel, always shown as the "H" pin. */
  hotel: { name: string; lat: number; lng: number };
  /** Optional list of points tracing a river through the city (e.g. the
      Tiber). Drawn as a wide curved band behind everything else. */
  river?: { lat: number; lng: number }[];
  /** Optional place_key of a stop to highlight (used when the user taps a
      stop on the itinerary and jumps to the map). */
  focusedPlaceKey?: string | null;
}

// One pin on the map, after deduplication and projection.
interface Pin {
  number: number;
  name: string;
  placeKey: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
}

// Opens Google Maps walking directions in a new tab. On a phone this
// hands over to the Google Maps app if it is installed.
function openWalkingDirections(lat: number, lng: number) {
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`,
    "_blank",
    "noopener,noreferrer"
  );
}

export default function SchematicMap({
  stops,
  hotel,
  river,
  focusedPlaceKey,
}: SchematicMapProps) {
  /*
    -------------------------------------------------------------------------
    STEP 1 — collect the unique places to pin.
    -------------------------------------------------------------------------
    Some stops have no location (e.g. "flight lands"), and some places are
    visited twice in a day (e.g. the basilica and then its dome climb).
    We keep one pin per unique place, numbered in the order it is first
    visited. Stops AT the hotel are skipped, because the hotel already has
    its own dedicated "H" pin.
  */
  const seen = new Set<string>();
  const uniquePlaces: Omit<Pin, "x" | "y" | "number">[] = [];

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

    uniquePlaces.push({
      name: stop.name,
      placeKey: key,
      lat: stop.lat,
      lng: stop.lng,
    });
  }

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
    number: i + 1,
    ...toSvg(projected[i]),
  }));

  const hotelPos = toSvg(hotelProj);

  /*
    -------------------------------------------------------------------------
    STEP 3 — decorative geography.
    -------------------------------------------------------------------------
    The river is drawn as a smooth curve through its projected waypoints.
    The "city blocks" are abstract rounded rectangles placed at the
    midpoints between consecutive pins — plausible spots for buildings,
    since real city blocks sit between destinations.
  */
  let riverPath = "";
  if (river && river.length >= 2) {
    const riverPts = river.map((p) => toSvg(toMercator(p.lat, p.lng)));
    // Build a smooth curve: start at the first point, then draw quadratic
    // curves that bend through the midpoint of each pair of waypoints.
    riverPath = `M ${riverPts[0].x} ${riverPts[0].y}`;
    for (let i = 1; i < riverPts.length - 1; i++) {
      const midX = (riverPts[i].x + riverPts[i + 1].x) / 2;
      const midY = (riverPts[i].y + riverPts[i + 1].y) / 2;
      riverPath += ` Q ${riverPts[i].x} ${riverPts[i].y} ${midX} ${midY}`;
    }
    const last = riverPts[riverPts.length - 1];
    riverPath += ` L ${last.x} ${last.y}`;
  }

  // City blocks between the first few pairs of pins.
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
      // Centre the block on the midpoint between the two pins, nudged
      // sideways so it does not sit directly under the route line.
      x: (a.x + b.x) / 2 - size.w / 2 + (i % 2 === 0 ? 46 : -46),
      y: (a.y + b.y) / 2 - size.h / 2 + (i % 2 === 0 ? -34 : 34),
      ...size,
    });
  }

  // The walking route: hotel → pin 1 → pin 2 → ... in visiting order.
  const routePoints = [hotelPos, ...pins]
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

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

      {/* Layer 3 — the river, a wide muted blue-grey band. */}
      {riverPath && (
        <path
          d={riverPath}
          fill="none"
          stroke="#1D242B"
          strokeWidth="30"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Layer 4 — faint road line tracing the day's route in order. */}
      {pins.length > 0 && (
        <polyline
          points={routePoints}
          fill="none"
          stroke="#2E2E2E"
          strokeWidth="3"
          strokeDasharray="1 10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Layer 5 — the hotel pin: a dark circle with a warm-white "H". */}
      <g
        onClick={() => openWalkingDirections(hotel.lat, hotel.lng)}
        style={{ cursor: "pointer" }}
      >
        <title>{`${hotel.name} — tap for walking directions`}</title>
        {/* Invisible larger circle so the tap target is comfortably big. */}
        <circle cx={hotelPos.x} cy={hotelPos.y} r="26" fill="transparent" />
        <circle
          cx={hotelPos.x}
          cy={hotelPos.y}
          r="15"
          fill="#0F0F0F"
          stroke="#F0EDE6"
          strokeWidth="1.5"
        />
        <text
          x={hotelPos.x}
          y={hotelPos.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="13"
          fontWeight="700"
          fill="#F0EDE6"
        >
          H
        </text>
        <text
          x={hotelPos.x}
          y={hotelPos.y + 32}
          textAnchor="middle"
          fontSize="11"
          fill="#9A9690"
          paintOrder="stroke"
          stroke="#1A1A1A"
          strokeWidth="4"
        >
          {hotel.name}
        </text>
      </g>

      {/* Layer 6 — one numbered amber pin per unique place. */}
      {pins.map((pin) => {
        const isFocused = focusedPlaceKey === pin.placeKey;
        // Put the label on whichever side has more room, so text is less
        // likely to run off the edge of the map.
        const labelOnLeft = pin.x > VIEW_W * 0.62;
        return (
          <g
            key={pin.placeKey}
            onClick={() => openWalkingDirections(pin.lat, pin.lng)}
            style={{ cursor: "pointer" }}
          >
            <title>{`${pin.name} — tap for walking directions`}</title>
            {/* Invisible larger circle = comfortable tap target. */}
            <circle cx={pin.x} cy={pin.y} r="26" fill="transparent" />
            {/* A soft ring appears around the focused pin. */}
            {isFocused && (
              <circle
                cx={pin.x}
                cy={pin.y}
                r="22"
                fill="none"
                stroke="#C87941"
                strokeWidth="2"
                opacity="0.5"
              />
            )}
            <circle
              cx={pin.x}
              cy={pin.y}
              r={isFocused ? 15 : 13}
              fill="#C87941"
            />
            <text
              x={pin.x}
              y={pin.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="12"
              fontWeight="700"
              fill="#0F0F0F"
            >
              {pin.number}
            </text>
            {/* Place-name label with a dark outline (paint-order stroke)
                so it stays readable even when it crosses a road line. */}
            <text
              x={labelOnLeft ? pin.x - 20 : pin.x + 20}
              y={pin.y + 4}
              textAnchor={labelOnLeft ? "end" : "start"}
              fontSize="11"
              fill={isFocused ? "#F0EDE6" : "#9A9690"}
              fontWeight={isFocused ? 600 : 400}
              paintOrder="stroke"
              stroke="#1A1A1A"
              strokeWidth="4"
            >
              {pin.name}
            </text>
          </g>
        );
      })}

      {/* Friendly fallback if the day has no locatable stops at all. */}
      {pins.length === 0 && (
        <text
          x={VIEW_W / 2}
          y={VIEW_H / 2 - 40}
          textAnchor="middle"
          fontSize="14"
          fill="#5A5754"
        >
          No mapped stops for this day yet
        </text>
      )}
    </svg>
  );
}
