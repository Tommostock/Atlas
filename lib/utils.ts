// This file provides one small helper function called "cn" that every
// shadcn/ui component uses. Its job is to combine CSS class names together.
//
// Why do we need it? When building components we often want to merge a
// component's default Tailwind classes with extra classes passed in by the
// parent. Two libraries do the heavy lifting:
//   - "clsx" joins class names together and skips any that are false/empty
//   - "tailwind-merge" resolves conflicts (e.g. if both "p-2" and "p-4" are
//     present, the later one wins instead of both being applied)

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/*
  ---------------------------------------------------------------------------
  Money formatting
  ---------------------------------------------------------------------------
  Turns a number like 186.5 into a friendly string like "€186.50".
  Whole numbers stay clean ("€45" rather than "€45.00"), while anything
  with pennies always shows exactly two decimal places.
*/
export function formatMoney(amount: number, symbol: string): string {
  const isWholeNumber = Number.isInteger(amount)
  return `${symbol}${amount.toFixed(isWholeNumber ? 0 : 2)}`
}

/*
  ---------------------------------------------------------------------------
  Web Mercator projection
  ---------------------------------------------------------------------------
  Latitude and longitude describe positions on a round globe, but our map
  is a flat rectangle. "Web Mercator" is the same flattening formula that
  Google Maps uses, so places keep their correct positions RELATIVE to each
  other — if the Colosseum is south-east of the Pantheon in real life, it
  will be south-east on our map too.

  The numbers that come out are in metres on the flattened map. We don't
  care about the units — the SchematicMap component only uses the values
  to work out where each pin sits relative to the others.
*/
export function toMercator(lat: number, lng: number) {
  // Longitude (east/west) converts with simple proportion.
  const x = (lng * 20037508.34) / 180

  // Latitude (north/south) needs the Mercator stretch formula, because
  // the globe gets "stretched" more the further you are from the equator.
  const y =
    (Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180)) *
    (20037508.34 / 180)

  return { x, y }
}
