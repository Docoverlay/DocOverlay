import React, { useCallback, useState } from 'react';

export interface AutoCheckParams {
  overlayRect: { x: number; y: number; w: number; h: number } | null;
  imgNat: { w: number; h: number } | null;
  selectedSheet: any; // refine externally
  pageUrls: string[];
  currentPage: number;
  normalizedZones: any[];
  detectionVersionRef: React.MutableRefObject<number>;
  unmountedRef: React.MutableRefObject<boolean>;
  loadImage: (url: string) => Promise<HTMLImageElement>;
  zonePctToPagePx: (zone: { x: number; y: number; w: number; h: number }, overlay: { x: number; y: number; w: number; h: number }, W: number, H: number) => { x: number; y: number; w: number; h: number };
  shrinkRect: (r: { x: number; y: number; w: number; h: number }, marginPct: number) => { x: number; y: number; w: number; h: number };
  INNER_MARGIN_PCT: number;
  computeInkDensity: (ctx: CanvasRenderingContext2D, rect: { x: number; y: number; w: number; h: number }) => number;
  pickThreshold: (areaPx: number) => number;
  lockedByPatient: Record<number, boolean>;
  patientIndex: number;
  setError: (msg: string) => void;
  setZonesCheckedByPage: React.Dispatch<React.SetStateAction<Record<number, Record<string | number, boolean>>>>;
}

export function useAutoCheck(params: AutoCheckParams) {
  const [isAutoChecking, setIsAutoChecking] = useState(false);

  const autoCheckFromScanCurrentPage = useCallback(async () => {
    const { overlayRect, imgNat, selectedSheet, pageUrls, currentPage, detectionVersionRef, unmountedRef, loadImage, normalizedZones, zonePctToPagePx, shrinkRect, INNER_MARGIN_PCT, computeInkDensity, pickThreshold, lockedByPatient, patientIndex, setError, setZonesCheckedByPage } = params;
    if (!overlayRect || !imgNat || !selectedSheet) { setError("Overlay non prêt ou feuille non sélectionnée."); return; }
    if (!pageUrls[currentPage]) { setError("Aucune page à analyser."); return; }
    if (lockedByPatient[patientIndex]) return;

    setIsAutoChecking(true);
    try {
      const localVersion = detectionVersionRef.current;
      const img = await loadImage(pageUrls[currentPage]!);
      const W = img.naturalWidth || img.width || imgNat.w;
      const H = img.naturalHeight || img.height || imgNat.h;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D indisponible.');
      ctx.drawImage(img, 0, 0, W, H);

      const results: Record<string | number, boolean> = {};
      for (const z of normalizedZones) {
        if (localVersion !== detectionVersionRef.current || unmountedRef.current) break;
        const zPx = zonePctToPagePx({ x: z.x, y: z.y, w: z.width, h: z.height }, overlayRect, W, H);
        const inner = shrinkRect(zPx, INNER_MARGIN_PCT);
        const density = computeInkDensity(ctx, inner);
        const areaPx = inner.w * inner.h;
        const thr = pickThreshold(areaPx);
        const checked = density >= thr;
        results[z.id] = checked;
      }

      setZonesCheckedByPage((prev: Record<number, Record<string | number, boolean>>) => ({
        ...prev,
        [currentPage]: { ...(prev[currentPage] || {}), ...results }
      }));
    } catch (e: any) {
      setError(e?.message || 'Auto-cochage impossible sur cette page.');
    } finally {
      setIsAutoChecking(false);
    }
  }, [params]);

  return { isAutoChecking, autoCheckFromScanCurrentPage };
}
