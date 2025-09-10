// Extracted simple ink density & threshold helpers for testability.
export const INNER_MARGIN_PCT = 0.18;

export function pickThreshold(areaPx: number): number {
  if (areaPx < 800) return 0.04;
  if (areaPx < 2000) return 0.06;
  if (areaPx < 4000) return 0.08;
  if (areaPx < 8000) return 0.10;
  return 0.12;
}

// Simplified grayscale density computation for a Uint8ClampedArray representing RGBA pixels
export function computeInkDensityFromImageData(data: Uint8ClampedArray): number {
  const len = (data.length / 4) | 0;
  if (!len) return 0;
  let sum = 0, sum2 = 0;
  for (let i = 0; i < data.length; i += 4) {
    const ylin = 0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!;
    sum += ylin; sum2 += ylin * ylin;
  }
  const mean = sum / len;
  const variance = Math.max(0, sum2 / len - mean * mean);
  const std = Math.sqrt(variance);
  const thr = mean - 0.8 * std;
  let dark = 0;
  for (let i = 0; i < data.length; i += 4) {
    const ylin = 0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!;
    if (ylin < thr) dark++;
  }
  return dark / len;
}
