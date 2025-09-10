// Utility functions for zone geometry and serialization
// Extracted from DocumentEditor to reduce component size and improve reuse.
import { Zone } from '../types';

// Detect if two zones overlap (touching edges is allowed and considered non-overlapping)
export function zonesOverlap(a: Zone, b: Zone): boolean {
  return !(
    a.left + a.width <= b.left ||
    a.left >= b.left + b.width ||
    a.top + a.height <= b.top ||
    a.top >= b.top + b.height
  );
}

// Convert zones expressed in absolute pixels to percentage relative to a base width/height
export function zonesToPercent(zs: Zone[], baseW: number, baseH: number) {
  if (!baseW || !baseH) return [] as Array<{
    id: number; leftPct: number; topPct: number; widthPct: number; heightPct: number; code: string; locked: boolean; checked: boolean;
  }>;
  return zs.map(z => ({
    id: z.id,
    leftPct: (z.left / baseW) * 100,
    topPct: (z.top / baseH) * 100,
    widthPct: (z.width / baseW) * 100,
    heightPct: (z.height / baseH) * 100,
    code: z.code ?? '',
    locked: !!z.locked,
    checked: !!z.checked,
  }));
}
