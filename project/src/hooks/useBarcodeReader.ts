import { useCallback, useEffect, useMemo, useState } from 'react';
import { MultiFormatReader, BarcodeFormat, DecodeHintType, RGBLuminanceSource, BinaryBitmap, HybridBinarizer } from '@zxing/library';
import { rotateRectPct, normAngle } from '../utils/geometry';
import { loadImage } from '../utils/detectContentRect';

export interface NormalizedZone {
  id: string | number;
  x: number; y: number; width: number; height: number;
  isBarcode?: boolean;
}

interface UseBarcodeReaderParams {
  normalizedZones: NormalizedZone[];
  overlayRect: { x: number; y: number; w: number; h: number } | null;
  rotation: number;
  pageUrls: string[];
  currentPage: number;
  stayNumber: string;
  setStayNumber: (v: string) => void;
  autoEnabledDefault?: boolean;
}

export function useBarcodeReader({ normalizedZones, overlayRect, rotation, pageUrls, currentPage, stayNumber, setStayNumber, autoEnabledDefault = true }: UseBarcodeReaderParams) {
  const [isDecoding, setIsDecoding] = useState(false);
  const [error, setError] = useState('');
  const [triedByPage, setTriedByPage] = useState<Record<number, boolean>>({});
  const [autoEnabled, setAutoEnabled] = useState<boolean>(() => {
    try { const raw = localStorage.getItem('scan2overlay.autoBarcode'); if (raw === '0') return false; if (raw === '1') return true; } catch {}
    return autoEnabledDefault;
  });

  const barcodeZones = useMemo(() => normalizedZones.filter(z => z.isBarcode), [normalizedZones]);

  const decode = useCallback(async () => {
    if (isDecoding) return;
    setError('');
    if (!overlayRect || barcodeZones.length === 0) { setError('Aucune zone de code-barres disponible.'); return; }
    if (!pageUrls[currentPage]) { setError('Page introuvable.'); return; }
    setIsDecoding(true);
    try {
      const img = await loadImage(pageUrls[currentPage]);
      const pageCanvas = document.createElement('canvas');
      const ctxPage = pageCanvas.getContext('2d');
      if (!ctxPage) throw new Error('Canvas non supporté.');
      const rot = normAngle(rotation);
      const rad = rot * Math.PI / 180;
      const swap = rot === 90 || rot === 270;
      pageCanvas.width = swap ? img.height : img.width;
      pageCanvas.height = swap ? img.width : img.height;
      ctxPage.save();
      ctxPage.translate(pageCanvas.width / 2, pageCanvas.height / 2);
      ctxPage.rotate(rad);
      ctxPage.drawImage(img, -img.width / 2, -img.height / 2);
      ctxPage.restore();

      const reader = new MultiFormatReader();
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_39]);
      reader.setHints(hints);

      const tryDecodeImageData = (imgData: ImageData): string | null => {
        try {
          const luminance = new RGBLuminanceSource(imgData.data, imgData.width, imgData.height);
            const binBitmap = new BinaryBitmap(new HybridBinarizer(luminance));
            const result = reader.decode(binBitmap);
            const txt = result?.getText()?.trim();
            if (txt) {
              const cleaned = txt.replace(/[^A-Z0-9\-]/gi, '').toUpperCase();
              return cleaned || null;
            }
        } catch {/* ignore */}
        return null;
      };

      for (const z of barcodeZones) {
        const zr = rotateRectPct({ x: z.x, y: z.y, w: z.width, h: z.height }, rotation);
        const oDisp = rotateRectPct(overlayRect, rotation);
        const px = (oDisp.x + (zr.x - oDisp.x)) * pageCanvas.width / 100;
        const py = (oDisp.y + (zr.y - oDisp.y)) * pageCanvas.height / 100;
        const pw = zr.w * pageCanvas.width / 100;
        const ph = zr.h * pageCanvas.height / 100;
        const sx = Math.max(0, Math.min(pageCanvas.width - 1, Math.round(px)));
        const sy = Math.max(0, Math.min(pageCanvas.height - 1, Math.round(py)));
        const sw = Math.max(1, Math.min(pageCanvas.width - sx, Math.round(pw)));
        const sh = Math.max(1, Math.min(pageCanvas.height - sy, Math.round(ph)));
        if (sw < 5 || sh < 5) continue;
        const imgData = ctxPage.getImageData(sx, sy, sw, sh);
        let decoded = tryDecodeImageData(imgData);
        if (!decoded) {
          const scaleTarget = 600;
          const scale = Math.min(4, Math.max(1, scaleTarget / sw));
          if (scale > 1) {
            const c2 = document.createElement('canvas');
            c2.width = Math.round(sw * scale);
            c2.height = Math.round(sh * scale);
            const c2ctx = c2.getContext('2d');
            if (c2ctx) {
              c2ctx.imageSmoothingEnabled = true;
              c2ctx.drawImage(pageCanvas, sx, sy, sw, sh, 0, 0, c2.width, c2.height);
              const scaledData = c2ctx.getImageData(0, 0, c2.width, c2.height);
              decoded = tryDecodeImageData(scaledData);
            }
          }
        }
        if (decoded) {
          setStayNumber(decoded);
          setError('');
          setIsDecoding(false);
          return;
        }
      }
      setError('Aucun code-barres Code 39 lisible trouvé dans les zones.');
    } catch (e: any) {
      setError(e?.message || 'Erreur de décodage.');
    } finally {
      setIsDecoding(false);
    }
  }, [isDecoding, overlayRect, barcodeZones, pageUrls, currentPage, rotation, setStayNumber]);

  // Auto trigger
  useEffect(() => {
    if (!autoEnabled) return;
    if (stayNumber) return;
    if (!overlayRect) return;
    if (barcodeZones.length === 0) return;
    if (!pageUrls[currentPage]) return;
    if (isDecoding) return;
    if (triedByPage[currentPage]) return;
    setTriedByPage(prev => ({ ...prev, [currentPage]: true }));
    const t = setTimeout(() => { decode(); }, 120);
    return () => clearTimeout(t);
  }, [autoEnabled, stayNumber, overlayRect, barcodeZones, pageUrls, currentPage, isDecoding, triedByPage, decode]);

  // Reset trigger when rotation or overlay changes
  useEffect(() => { setTriedByPage(prev => ({ ...prev, [currentPage]: false })); }, [rotation, overlayRect, currentPage]);

  // Persist preference
  useEffect(() => { try { localStorage.setItem('scan2overlay.autoBarcode', autoEnabled ? '1' : '0'); } catch {} }, [autoEnabled]);

  return {
    decodeBarcode: decode,
    isDecodingBarcode: isDecoding,
    barcodeError: error,
    autoBarcodeEnabled: autoEnabled,
    setAutoBarcodeEnabled: setAutoEnabled,
    hasBarcodeZone: barcodeZones.length > 0,
  };
}
