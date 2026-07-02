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
