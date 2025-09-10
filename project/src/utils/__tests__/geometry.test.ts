// Vitest globals imported explicitly for type awareness under strict TS
import { describe, it, expect } from 'vitest';
import { rotateRectPct, mapDisplayDeltaToModel, computeTightRectPct, normalizeZonesAgainstRect } from '../../utils/geometry';

describe('geometry utilities', () => {
  it('rotateRectPct 90°', () => {
    const r = rotateRectPct({ x: 10, y: 20, w: 30, h: 40 }, 90);
    expect(Math.round(r.x)).toBe(100 - (20 + 40)); // 40
    expect(r.y).toBe(10);
    expect(r.w).toBe(40);
    expect(r.h).toBe(30);
  });

  it('mapDisplayDeltaToModel 180°', () => {
    const { dx, dy } = mapDisplayDeltaToModel(10, -5, 180);
    expect(dx).toBe(-10);
    expect(dy).toBe(5);
  });

  it('computeTightRectPct basic', () => {
    const zones = [
      { x: 10, y: 10, width: 10, height: 10 },
      { x: 40, y: 40, width: 10, height: 10 }
    ];
    const r = computeTightRectPct(zones as any, 0, 0); // no padding for deterministic test
    expect(r).toEqual({ x: 10, y: 10, w: 40, h: 40 });
  });

  it('normalizeZonesAgainstRect', () => {
    const rect = { x: 10, y: 10, w: 40, h: 40 };
    const zones = [ { id: 'a', x: 10, y: 10, width: 10, height: 10 } ];
    const res = normalizeZonesAgainstRect(zones as any, 0, rect);
    const first = res[0]!; // non-null assertion; we know one element exists
    expect(first.x).toBe(0);
    expect(first.y).toBe(0);
    expect(Math.round(first.width)).toBe(25); // 10 / 40 * 100
    expect(Math.round(first.height)).toBe(25);
  });
});
