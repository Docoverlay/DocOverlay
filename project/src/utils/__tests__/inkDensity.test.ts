import { describe, it, expect } from 'vitest';
import { pickThreshold, computeInkDensityFromImageData } from '../inkDensity';

describe('inkDensity utilities', () => {
  it('pickThreshold increases with area', () => {
    expect(pickThreshold(100)).toBeLessThan(pickThreshold(1000));
    expect(pickThreshold(1500)).toBeLessThan(pickThreshold(3500));
  });

  it('computeInkDensityFromImageData returns higher value for darker pixels set', () => {
    const mk = (v: number) => {
      const a = new Uint8ClampedArray(4 * 10);
      for (let i = 0; i < a.length; i += 4) { a[i] = v; a[i+1] = v; a[i+2] = v; a[i+3] = 255; }
      return a;
    };
    const denseDark = computeInkDensityFromImageData(mk(10));
    const denseLight = computeInkDensityFromImageData(mk(240));
    expect(denseDark).toBeGreaterThan(denseLight);
  });
});
