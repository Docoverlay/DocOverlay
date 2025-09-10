// High quality content rectangle detection extracted from Scan2OverlayModule
// Provides loadImage + detectContentRectFromUrl
import { clamp } from './geometry';

export type RectPct = { x: number; y: number; w: number; h: number };

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = url;
  });
}

export async function detectContentRectFromUrl(
  url: string,
  opts?: { maxDim?: number; marginPct?: number }
): Promise<RectPct> {
  const COARSE_MAX = 900;
  const FINE_MAX   = opts?.maxDim ?? 1800;
  const MARGIN_PCT = opts?.marginPct ?? 0.012;
  const SMOOTH_FR  = 0.010;
  const SEARCH_FR  = 0.050;
  const BAND_FR    = 0.006;

  const img = await loadImage(url);

  function renderAndSums(maxDim: number) {
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const W = Math.max(2, Math.round(img.width * scale));
    const H = Math.max(2, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, W, H);
    const { data } = ctx.getImageData(0, 0, W, H);
    const rowSum = new Float64Array(H);
    const colSum = new Float64Array(W);
    const idx = (x: number, y: number) => (y * W + x) * 4;
    const lum = (o: number) => 0.299 * (data[o] ?? 0) + 0.587 * (data[o + 1] ?? 0) + 0.114 * (data[o + 2] ?? 0);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = idx(x, y);
        const g = lum(i);
        const rx = x < W - 1 ? idx(x + 1, y) : i;
        const ry = y < H - 1 ? idx(x, y + 1) : i;
        const gx = lum(rx);
        const gy = lum(ry);
        const mag = Math.abs(g - gx) + Math.abs(g - gy);
        rowSum[y] = (rowSum[y] ?? 0) + mag;
        colSum[x] = (colSum[x] ?? 0) + mag;
      }
    }

    const smooth1D = (src: Float64Array, winFrac: number) => {
      const n = src.length; const w = Math.max(1, Math.floor(n * winFrac));
      const out = new Float64Array(n); let acc = 0;
      for (let i = 0; i < n; i++) {
        const val = src[i] ?? 0; acc += val; if (i >= w) acc -= (src[i - w] ?? 0);
        out[i] = acc / Math.min(i + 1, w);
      }
      for (let i = n - 2; i >= 0; i--) out[i] = ((out[i] ?? 0) + (out[i + 1] ?? 0)) * 0.5;
      return out;
    };

    return { W, H, rowSum: smooth1D(rowSum, SMOOTH_FR), colSum: smooth1D(colSum, SMOOTH_FR) };
  }

  function initialCuts(sum: Float64Array, marginPct: number) {
    const total = sum.reduce((a, b) => a + (b ?? 0), 0);
    const cut = total * marginPct; let lo = 0, hi = sum.length - 1, acc = 0;
    for (let i = 0; i < sum.length; i++) { acc += (sum[i] ?? 0); if (acc >= cut) { lo = i; break; } }
    acc = 0;
    for (let i = sum.length - 1; i >= 0; i--) { acc += (sum[i] ?? 0); if (acc >= cut) { hi = i; break; } }
    return { lo, hi };
  }

  function refineEdge(sum: Float64Array, guess: number, searchRadius: number, band: number) {
    const n = sum.length; const a0 = Math.max(0, Math.floor(guess - searchRadius)); const a1 = Math.min(n - 1, Math.ceil(guess + searchRadius));
    let best = guess, bestScore = -Infinity;
    for (let i = a0; i <= a1; i++) {
      const b0 = Math.max(0, i - band); const b1 = Math.min(n - 1, i + band);
      let s = 0; for (let k = b0; k <= b1; k++) s += (sum[k] ?? 0);
      if (s > bestScore) { bestScore = s; best = i; }
    }
    return best;
  }

  const c = renderAndSums(COARSE_MAX);
  const cutYc = initialCuts(c.rowSum, MARGIN_PCT);
  const cutXc = initialCuts(c.colSum, MARGIN_PCT);

  const searchYc = Math.max(6, Math.floor(c.H * SEARCH_FR));
  const searchXc = Math.max(6, Math.floor(c.W * SEARCH_FR));
  const bandYc   = Math.max(2, Math.floor(c.H * BAND_FR));
  const bandXc   = Math.max(2, Math.floor(c.W * BAND_FR));

  let top_c    = refineEdge(c.rowSum, cutYc.lo, searchYc, bandYc);
  let bottom_c = refineEdge(c.rowSum, cutYc.hi, searchYc, bandYc);
  let left_c   = refineEdge(c.colSum, cutXc.lo, searchXc, bandXc);
  let right_c  = refineEdge(c.colSum, cutXc.hi, searchXc, bandXc);

  top_c    = clamp(top_c, 0, c.H - 2);
  bottom_c = clamp(bottom_c, top_c + 1, c.H - 1);
  left_c   = clamp(left_c, 0, c.W - 2);
  right_c  = clamp(right_c, left_c + 1, c.W - 1);

  const f = renderAndSums(FINE_MAX);
  const scaleY = f.H / c.H; const scaleX = f.W / c.W;
  const top0    = Math.round(top_c * scaleY);
  const bottom0 = Math.round(bottom_c * scaleY);
  const left0   = Math.round(left_c * scaleX);
  const right0  = Math.round(right_c * scaleX);

  const searchYf = Math.max(8, Math.floor(f.H * SEARCH_FR));
  const searchXf = Math.max(8, Math.floor(f.W * SEARCH_FR));
  const bandYf   = Math.max(3, Math.floor(f.H * BAND_FR));
  const bandXf   = Math.max(3, Math.floor(f.W * BAND_FR));

  let top_f    = refineEdge(f.rowSum, top0,    searchYf, bandYf);
  let bottom_f = refineEdge(f.rowSum, bottom0, searchYf, bandYf);
  let left_f   = refineEdge(f.colSum, left0,   searchXf, bandXf);
  let right_f  = refineEdge(f.colSum, right0,  searchXf, bandXf);

  const padH = Math.max(1, Math.floor((bottom_f - top_f + 1) * 0.003));
  const padW = Math.max(1, Math.floor((right_f  - left_f + 1) * 0.003));
  top_f    = clamp(top_f - padH, 0, f.H - 2);
  bottom_f = clamp(bottom_f + padH, top_f + 1, f.H - 1);
  left_f   = clamp(left_f - padW, 0, f.W - 2);
  right_f  = clamp(right_f + padW, left_f + 1, f.W - 1);

  return { x: (left_f / f.W) * 100, y: (top_f / f.H) * 100, w: ((right_f - left_f + 1) / f.W) * 100, h: ((bottom_f - top_f + 1) / f.H) * 100 };
}
