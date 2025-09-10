// Geometry utility functions extracted from Scan2OverlayModule for reuse & unit tests.
// Percent-based rectangle and helpers for rotation & drag mapping.

export type RectPct = { x: number; y: number; w: number; h: number };

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function normAngle(a: number) { return ((a % 360) + 360) % 360; }

export function rotateRectPct(r: RectPct, angleCW: number): RectPct {
  const a = normAngle(angleCW);
  if (a === 0) return { ...r };
  if (a === 90)   return { x: 100 - (r.y + r.h), y: r.x, w: r.h, h: r.w };
  if (a === 180)  return { x: 100 - (r.x + r.w), y: 100 - (r.y + r.h), w: r.w, h: r.h };
  return { x: r.y, y: 100 - (r.x + r.w), w: r.h, h: r.w }; // 270
}

// Map deltas performed in display space (after rotation) back to the model space.
export function mapDisplayDeltaToModel(dxDisp: number, dyDisp: number, angleCW: number) {
  const a = normAngle(angleCW);
  if (a === 0)   return { dx: dxDisp, dy: dyDisp };
  if (a === 90)  return { dx: dyDisp, dy: -dxDisp };
  if (a === 180) return { dx: -dxDisp, dy: -dyDisp };
  return { dx: -dyDisp, dy: dxDisp };
}

// Compute a tight rectangle around zones on a given relative page (with padding percentage)
export function computeTightRectPct<T extends { x: number; y: number; width: number; height: number; page?: number }>(
  zs: T[], pageRel: number, padPct = 1.8
): RectPct | null {
  const arr = zs.filter(z => (z.page ?? 0) === pageRel);
  if (!arr.length) return null;
  const minX = Math.min(...arr.map(z => z.x));
  const minY = Math.min(...arr.map(z => z.y));
  const maxX = Math.max(...arr.map(z => z.x + z.width));
  const maxY = Math.max(...arr.map(z => z.y + z.height));
  const x = clamp(minX - padPct, 0, 100);
  const y = clamp(minY - padPct, 0, 100);
  const w = clamp(maxX - x + padPct, 1, 100 - x);
  const h = clamp(maxY - y + padPct, 1, 100 - y);
  return { x, y, w, h };
}

export function normalizeZonesAgainstRect<T extends { x: number; y: number; width: number; height: number; page?: number; id?: any }>(
  zs: T[], pageRel: number, rect: RectPct
) {
  const list = zs.filter(z => (z.page ?? 0) === pageRel);
  return list.map(z => ({
    ...z,
    x: clamp(((z.x - rect.x) / rect.w) * 100, 0, 100),
    y: clamp(((z.y - rect.y) / rect.h) * 100, 0, 100),
    width: clamp((z.width / rect.w) * 100, 0.5, 100),
    height: clamp((z.height / rect.h) * 100, 0.5, 100),
  }));
}
