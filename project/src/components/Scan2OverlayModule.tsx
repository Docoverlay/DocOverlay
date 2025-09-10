import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload, ChevronLeft, ChevronRight, Save, FileText, AlertCircle, Calendar,
  ZoomIn, ZoomOut, RotateCw, RotateCcw, Lock, Unlock,
} from 'lucide-react';

import Button from './ui/Button';
import { User, SavedDocument, Patient } from '../types';
import { convertDocumentToImages } from '../utils/documentConverter';
import { getDocuments } from '../utils/database';
import { clamp, rotateRectPct, computeTightRectPct, normalizeZonesAgainstRect, normAngle } from '../utils/geometry';
import { useBarcodeReader } from '../hooks/useBarcodeReader';
import { useAutoCheck } from '../hooks/useAutoCheck';
import { InlineCalendar } from './InlineCalendar';
import { ProgressBar } from './ProgressBar';
import { useOverlayDrag } from '../hooks/useOverlayDrag';
// With moduleResolution 'bundler', include explicit extension for local TS util
import { detectContentRectFromUrl, loadImage } from '../utils/detectContentRect';

/* =========================
   Types
   ========================= */

type OverlayZone = {
  id: string | number;
  x: number; y: number; width: number; height: number; // en %
  page?: number;
  code?: string; label?: string;
  isBarcode?: boolean; // zone spéciale pour lecture code-barres (séjour)
};

type SheetTemplate = {
  id: string;
  name: string;
  pagesPerPatient: number;
  zones: OverlayZone[];
  docType: 'divers' | 'prestations';
  refWidth?: number; refHeight?: number;
  backgroundImage?: string | null; // <<< utilisé pour auto-calage
};

type PatientEntry = {
  patientIndex: number;
  pages: string[];
  sheetId: string; sheetName: string;
  doctorId: string; stayNumber: string;
  dates: string[];
  zonesChecked: Record<number, Record<string | number, boolean>>;
  createdAt: string;
};

type RectPct = { x: number; y: number; w: number; h: number };

/* =========================
   Constantes / Helpers
   ========================= */

// clamp now imported from geometry util

const S2O_ACCENT_TEXT = 'text-pink-600';
const S2O_ACCENT_BG = 'bg-pink-50';
const S2O_ACCENT_RING = 'focus:ring-pink-500';
const S2O_BADGE_BG = 'bg-pink-100';
const S2O_BADGE_TEXT = 'text-pink-800';

const pad = (n: number) => String(n).padStart(2, '0');
const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYMD = (ymd: string) => { const [ys, ms, ds] = ymd.split('-'); const y = Number(ys) || new Date().getFullYear(); const m = Number(ms) || 1; const d = Number(ds) || 1; return new Date(y, m - 1, d); };
const daysBetweenInclusive = (a: string, b: string): string[] => {
  let d1 = parseYMD(a), d2 = parseYMD(b); if (d1 > d2) [d1, d2] = [d2, d1];
  const out: string[] = []; const cur = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
  while (cur <= d2) { out.push(toYMD(cur)); cur.setDate(cur.getDate() + 1); }
  return out;
};

// geometry helpers now imported (rotateRectPct, mapDisplayDeltaToModel, computeTightRectPct, normalizeZonesAgainstRect, normAngle)

/* =========================
  Auto-calage HQ (implémentation extraite vers utils/detectContentRect.ts)
  ========================= */

/* =========================
   Feuilles → templates
   ========================= */

function loadAvailableSheetsForUser(): SheetTemplate[] {
  const documents = getDocuments() || [];
  return documents.map((doc: any) => {
    const refWidth = Number(doc.pageWidth) || Number(doc.canvasWidth) || 2100;
    const refHeight = Number(doc.pageHeight) || Number(doc.canvasHeight) || 2970;
    const coordUnit: 'px' | 'pct' = (doc.coordUnit === 'px' || doc.coordUnit === 'pct') ? doc.coordUnit : 'px';
    const zones: OverlayZone[] = (doc.zones ?? []).map((z: any, index: number) => {
      const pageRaw = z.page ?? z.pageIndex ?? 0;
      const page0 = typeof pageRaw === 'number' && pageRaw > 0 ? pageRaw - 1 : Number(pageRaw) || 0;
      const id = z.id ?? (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `zone_${index}_${Date.now()}`);
      const rawLeft = Number(z.left ?? z.x ?? 0);
      const rawTop = Number(z.top ?? z.y ?? 0);
      const rawW = Number(z.width ?? z.w ?? 10);
      const rawH = Number(z.height ?? z.h ?? 5);
      let x: number, y: number, width: number, height: number;
      if (coordUnit === 'px') {
        const rw = refWidth > 0 ? refWidth : 2100;
        const rh = refHeight > 0 ? refHeight : 2970;
        x = clamp((rawLeft / rw) * 100, 0, 100);
        y = clamp((rawTop / rh) * 100, 0, 100);
        width = clamp((rawW / rw) * 100, 0.5, 100);
        height = clamp((rawH / rh) * 100, 0.5, 100);
      } else {
        x = clamp(rawLeft, 0, 100);
        y = clamp(rawTop, 0, 100);
        width = clamp(rawW, 0.5, 100);
        height = clamp(rawH, 0.5, 100);
      }
      return { id, x, y, width, height, page: page0, code: z.code, label: z.code || `Zone ${id}`, isBarcode: !!z.isBarcode };
    });
    return { id: String(doc.id), name: String(doc.name ?? 'Feuille'), pagesPerPatient: Number(doc.pagesPerPatient ?? 1), docType: (doc.docType ?? 'prestations'), zones, refWidth, refHeight, backgroundImage: doc.backgroundImage || null } as SheetTemplate;
  });
}

/* =========================
   Converters (avec progress)
   ========================= */
async function convertFileToImages(file: File, onProgress?: (pct: number, label?: string) => void): Promise<string[]> {
  onProgress?.(1, 'Préparation…');

  if (file.type.startsWith('image/')) {
    onProgress?.(90, "Chargement de l'image…");
    const url = URL.createObjectURL(file); onProgress?.(100, 'Terminé'); return [url];
  }

  if (file.type === 'application/pdf') {
    const w = (window as unknown as { pdfjsLib?: any });
    if (!w.pdfjsLib) throw new Error("PDF.js n'est pas disponible. Rechargez la page.");
    onProgress?.(5, 'Lecture du fichier…');
    const buf = await file.arrayBuffer();
    const pdf = await w.pdfjsLib.getDocument({ data: buf }).promise;

    const pages: string[] = [];
    const total = pdf.numPages;
    for (let n = 1; n <= total; n++) {
      onProgress?.(5 + ((n - 1) / total) * 90, `Rendu page ${n}/${total}…`);
      const page = await pdf.getPage(n);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Impossible de créer un canvas');
      canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
      pages.push(canvas.toDataURL('image/png'));
      onProgress?.(5 + (n / total) * 90, `Page ${n}/${total} ok`);
    }
    onProgress?.(100, 'Terminé');
    return pages;
  }

  const name = file.name.toLowerCase();
  if (name.endsWith('.docx') || name.endsWith('.doc')) {
    onProgress?.(10, 'Conversion du document…');
    const converted = await convertDocumentToImages(file);
    onProgress?.(100, 'Terminé');
    return converted.pages;
  }

  throw new Error(`Type non supporté: ${file.type}`);
}

/* =========================
Auto-cochage — MÉTHODE 1 (soustraction du modèle)
========================= */

/** Paramètres par défaut (tu pourras les exposer en sliders plus tard) */
const ROI_BASE_W = 160;          // largeur de rendu des ROI (préserve l'aspect)
const TGRAY = 18;                // seuil (0..255) sur l'image delta
const TAU = 0.010;               // seuil de ratio d'encre (1 %)
const MIN_BLOB_AREA = 12;        // suppression des “petits pâtés”
const IGNORE_LEFT_BAND_PCT = 0;  // ex. 0.40 si tu veux ignorer la bande des numéros à gauche

type RectPx = { x: number; y: number; w: number; h: number };

/** Utilitaires géométrie (pixels/%) */
function rectPctToPx(r: RectPct, W: number, H: number): RectPx {
  return { x: (r.x / 100) * W, y: (r.y / 100) * H, w: (r.w / 100) * W, h: (r.h / 100) * H };
}
function zonePctToPagePx(zone: RectPct, overlay: RectPct, pageW: number, pageH: number): RectPx {
  const ov = rectPctToPx(overlay, pageW, pageH);
  return {
    x: ov.x + (zone.x / 100) * ov.w,
    y: ov.y + (zone.y / 100) * ov.h,
    w: (zone.w / 100) * ov.w,
    h: (zone.h / 100) * ov.h,
  };
}
function zonePctToRefPx(zone: RectPct, ref: RectPct, modelW: number, modelH: number): RectPx {
  const rr = rectPctToPx(ref, modelW, modelH);
  return {
    x: rr.x + (zone.x / 100) * rr.w,
    y: rr.y + (zone.y / 100) * rr.h,
    w: (zone.w / 100) * rr.w,
    h: (zone.h / 100) * rr.h,
  };
}
function shrinkRect(r: RectPx, marginPct: number): RectPx {
  const mx = r.w * marginPct, my = r.h * marginPct;
  return { x: r.x + mx, y: r.y + my, w: Math.max(1, r.w - 2 * mx), h: Math.max(1, r.h - 2 * my) };
}

/** Rendu d'un ROI en niveaux de gris vers une taille cible (préserve l'aspect du ROI scan) */
function extractGrayROI(
  img: HTMLImageElement,
  r: RectPx,
  targetW: number,
  targetH: number,
): Uint8ClampedArray {
  const c = document.createElement('canvas'); c.width = targetW; c.height = targetH;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, Math.max(0, r.x), Math.max(0, r.y), Math.max(1, r.w), Math.max(1, r.h), 0, 0, targetW, targetH);
  const { data } = ctx.getImageData(0, 0, targetW, targetH);
  const out = new Uint8ClampedArray(targetW * targetH);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    out[j] = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
  }
  return out;
}

/** Lissage boîte 3×3 (très léger) */
function boxBlur3(src: Uint8ClampedArray, W: number, H: number): Uint8ClampedArray {
  const dst = new Uint8ClampedArray(src.length);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let s = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy; if (yy < 0 || yy >= H) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx; if (xx < 0 || xx >= W) continue;
          s += src[yy * W + xx]!; n++;
        }
      }
      dst[y * W + x] = s / n;
    }
  }
  return dst;
}

/** Seuil binaire */
function thresh(src: Uint8ClampedArray, t: number): Uint8Array {
  const out = new Uint8Array(src.length);
  for (let i = 0; i < src.length; i++) out[i] = src[i] > t ? 1 : 0;
  return out;
}

/** Érosion et dilatation 3×3 */
function erode3x3(mask: Uint8Array, W: number, H: number): Uint8Array {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let ok = 1;
      for (let dy = -1; dy <= 1 && ok; dy++) {
        const yy = y + dy; if (yy < 0 || yy >= H) { ok = 0; break; }
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx; if (xx < 0 || xx >= W) { ok = 0; break; }
          if (!mask[yy * W + xx]) { ok = 0; break; }
        }
      }
      out[y * W + x] = ok;
    }
  }
  return out;
}
function dilate3x3(mask: Uint8Array, W: number, H: number): Uint8Array {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let any = 0;
      for (let dy = -1; dy <= 1 && !any; dy++) {
        const yy = y + dy; if (yy < 0 || yy >= H) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx; if (xx < 0 || xx >= W) continue;
          if (mask[yy * W + xx]) { any = 1; break; }
        }
      }
      out[y * W + x] = any;
    }
  }
  return out;
}
function open3x3(mask: Uint8Array, W: number, H: number): Uint8Array {
  return dilate3x3(erode3x3(mask, W, H), W, H);
}

/** Supprime les petites composantes connexes (< area) */
function removeSmall(mask: Uint8Array, W: number, H: number, minArea: number): Uint8Array {
  const out = mask.slice();
  const seen = new Uint8Array(mask.length);
  const qx: number[] = [], qy: number[] = [];
  const push = (x: number, y: number) => { qx.push(x); qy.push(y); };
  while (true) {
    let seed = -1;
    for (let i = 0; i < out.length; i++) { if (out[i] && !seen[i]) { seed = i; break; } }
    if (seed < 0) break;
    let sx = seed % W, sy = (seed / W) | 0;
    let count = 0;
    const pts: number[] = [];
    push(sx, sy); seen[sy * W + sx] = 1;
    while (qx.length) {
      const x = qx.pop()!, y = qy.pop()!;
      const idx = y * W + x; pts.push(idx); count++;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]] as const) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
        const ni = ny * W + nx;
        if (out[ni] && !seen[ni]) { seen[ni] = 1; push(nx, ny); }
      }
    }
    if (count < minArea) for (const i of pts) out[i] = 0;
  }
  return out;
}

/** Calcule le ratio d’encre avec option d'ignorer une bande à gauche */
function inkRatio(mask: Uint8Array, W: number, H: number, ignoreLeftPct = 0): number {
  let startX = Math.floor(W * ignoreLeftPct);
  startX = Math.max(0, Math.min(W - 1, startX));
  let on = 0, tot = 0;
  for (let y = 0; y < H; y++) {
    for (let x = startX; x < W; x++) {
      const i = y * W + x;
      on += mask[i] ? 1 : 0; tot++;
    }
  }
  return tot ? on / tot : 0;
}

/** Score par soustraction modèle→scan (retourne ratio et booléen) */
function scoreZoneInk_ModelSub(
  scanImg: HTMLImageElement,
  modelImg: HTMLImageElement,
  zoneNorm: RectPct,           // zone normalisée (par refRect)
  overlayRect: RectPct,        // repère scan
  refRect: RectPct,            // repère modèle
): { ratio: number; checked: boolean } {
  // 1) Rects en pixels
  const scanRect = zonePctToPagePx(zoneNorm, overlayRect, scanImg.naturalWidth || scanImg.width, scanImg.naturalHeight || scanImg.height);
  const modelRect = zonePctToRefPx(zoneNorm, refRect, modelImg.naturalWidth || modelImg.width, modelImg.naturalHeight || modelImg.height);

  // Optionnel : on réduit un peu pour ignorer les bordures imprimées de la case
  const innerScan  = shrinkRect(scanRect, 0.18);
  const innerModel = shrinkRect(modelRect, 0.18);

  // 2) Taille commune (préserve l'aspect du ROI de scan)
  const aspect = Math.max(0.05, innerScan.h / innerScan.w);
  const TW = ROI_BASE_W;
  const TH = Math.max(16, Math.round(TW * aspect));

  // 3) Extraire gris
  const gScan  = extractGrayROI(scanImg,  innerScan,  TW, TH);
  const gModel = extractGrayROI(modelImg, innerModel, TW, TH);

  // 4) Soustraction dirigée + petit lissage
  const N = gScan.length;
  const delta = new Uint8ClampedArray(N);
  for (let i = 0; i < N; i++) {
    const d = gModel[i]! - gScan[i]!;     // plus sombre sur le scan que sur le modèle
    delta[i] = d > 0 ? d : 0;
  }
  const deltaS = boxBlur3(delta, TW, TH);

  // 5) Seuil → ouverture → suppression petits blobs
  const m0 = thresh(deltaS, TGRAY);
  const m1 = open3x3(m0, TW, TH);
  const m2 = removeSmall(m1, TW, TH, MIN_BLOB_AREA);

  // 6) Ratio d'encre ignorante bande gauche (optionnel)
  const ratio = inkRatio(m2, TW, TH, IGNORE_LEFT_BAND_PCT);
  return { ratio, checked: ratio > TAU };
}

/* ---- Fallback / compat : densité d’encre simple (sans modèle) ----
   Conserve ceci car la fonction autoCheckFromScanCurrentPage le prévoit en secours
   si aucune backgroundImage n’est disponible. Gardé volontairement hors de la
   section “helpers spécifiques” d’origine comme tu l’as demandé. */

// utilisé par le texte UI existant
const INNER_MARGIN_PCT = 0.18;

/** Version simple “densité d’encre” (fallback) */
function computeInkDensity(ctx: CanvasRenderingContext2D, rect: RectPx): number {
  const x = Math.max(0, Math.floor(rect.x));
  const y = Math.max(0, Math.floor(rect.y));
  const w = Math.max(1, Math.floor(rect.w));
  const h = Math.max(1, Math.floor(rect.h));

  const { data } = ctx.getImageData(x, y, w, h);
  const len = (data.length / 4) | 0;
  if (!len) return 0;

  // moyenne & écart-type (luminosité)
  let sum = 0, sum2 = 0;
  for (let i = 0; i < data.length; i += 4) {
    const ylin = 0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!;
    sum += ylin; sum2 += ylin * ylin;
  }
  const mean = sum / len;
  const variance = Math.max(0, sum2 / len - mean * mean);
  const std = Math.sqrt(variance);
  const thr = mean - 0.8 * std; // seuil dynamique

  let dark = 0;
  for (let i = 0; i < data.length; i += 4) {
    const ylin = 0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!;
    if (ylin < thr) dark++;
  }
  return dark / len;
}

/* =========================
   Auto-cochage seuil adaptatif (extraction depuis analyse manquante)
   ========================= */
function pickThreshold(areaPx: number): number {
  // Heuristique simple : plus la zone est grande, plus le seuil exigé augmente légèrement.
  if (areaPx < 800) return 0.04;
  if (areaPx < 2000) return 0.06;
  if (areaPx < 4000) return 0.08;
  if (areaPx < 8000) return 0.10;
  return 0.12;
}


/* =========================
   Composant principal
   ========================= */

interface Scan2OverlayModuleProps {
  user: User;
  onClose: () => void;
  onDocumentProcessed?: (document: SavedDocument, patient: Patient) => void;
  embedded?: boolean; className?: string;
}

const Scan2OverlayModule: React.FC<Scan2OverlayModuleProps> = ({ user: _user, onClose, embedded = false, className = '' }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageUrls, setPageUrls] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  const [imgNat, setImgNat] = useState<{ w: number; h: number } | null>(null);

  const [sheets, setSheets] = useState<SheetTemplate[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const selectedSheet = useMemo<SheetTemplate | null>(() => sheets.find((s: SheetTemplate) => s.id === selectedSheetId) || null, [sheets, selectedSheetId]);
  // Initial load of available sheets
  useEffect(() => {
    const loaded = loadAvailableSheetsForUser();
    setSheets(loaded);
  if (!selectedSheetId && loaded.length > 0) setSelectedSheetId(loaded[0]!.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Encodage
  const [doctorId, setDoctorId] = useState('');
  const [useDoctorForAll, setUseDoctorForAll] = useState(false);
  const [stayNumber, setStayNumber] = useState('');
  // Barcode decoding states
  // (barcode states migrated to useBarcodeReader hook)
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isMultiDate, setIsMultiDate] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dateValidated, setDateValidated] = useState(false);

  // UI / états
  const [error, setError] = useState<string>('');
  const [zonesCheckedByPage, setZonesCheckedByPage] = useState<Record<number, Record<string | number, boolean>>>({});
  const [lockedByPatient, setLockedByPatient] = useState<Record<number, boolean>>({});
  const [patientFields, setPatientFields] = useState<Record<number, { doctorId: string; stayNumber: string; isMultiDate: boolean; dates: string[]; dateValidated: boolean }>>({});

  // Rects de référence (modèle) et overlay (scan)
  const [refRect, setRefRect] = useState<RectPct | null>(null);
  const [overlayRect, setOverlayRect] = useState<RectPct | null>(null);
  const [overlayLocked, setOverlayLocked] = useState(false);

  // Auto-calage par page (possibilité d'ignorer)
  const [autoRectByPage, setAutoRectByPage] = useState<Record<number, RectPct>>({});
  const [ignoreAutoByPage, setIgnoreAutoByPage] = useState<Record<number, boolean>>({});

  // Import progress
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importLabel, setImportLabel] = useState<string>('Préparation…');

  // Rotation & zoom
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});
  const [applyRotationToAll, setApplyRotationToAll] = useState(false);
  const rotation = pageRotations[currentPage] ?? 0;
  const [fitScale, setFitScale] = useState(1);
  const [zoomFactor, setZoomFactor] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pageWrapRef = useRef<HTMLDivElement>(null);

  // Patient pagination logic
  const pagesPerPatient = selectedSheet?.pagesPerPatient ?? 1;
  const patientIndex = useMemo(() => Math.floor(currentPage / pagesPerPatient), [currentPage, pagesPerPatient]);
  const totalPatients = useMemo(() => (pageUrls.length ? Math.ceil(pageUrls.length / pagesPerPatient) : 0), [pageUrls.length, pagesPerPatient]);
  const pageRelativeIndex = useMemo(() => currentPage % pagesPerPatient, [currentPage, pagesPerPatient]);
  const currentPatientPages = useMemo(() => {
    const start = patientIndex * pagesPerPatient;
    return pageUrls.slice(start, start + pagesPerPatient);
  }, [pageUrls, patientIndex, pagesPerPatient]);
  const zonesForCurrentRelativePage = useMemo(() => selectedSheet ? selectedSheet.zones.filter((z: OverlayZone) => (z.page ?? 0) === pageRelativeIndex) : [], [selectedSheet, pageRelativeIndex]);
  const normalizedZones = useMemo(() => {
    if (!selectedSheet || !refRect) return [] as any[];
    return normalizeZonesAgainstRect(selectedSheet.zones, pageRelativeIndex, refRect);
  }, [selectedSheet, pageRelativeIndex, refRect]);

  const { decodeBarcode, isDecodingBarcode, barcodeError, autoBarcodeEnabled, setAutoBarcodeEnabled, hasBarcodeZone } = useBarcodeReader({
    normalizedZones, overlayRect, rotation, pageUrls, currentPage, stayNumber, setStayNumber, autoEnabledDefault: true,
  });

  // Refs (restored)
  const objectUrlsRef = useRef<string[]>([]);
  const detectionVersionRef = useRef(0);
  const unmountedRef = useRef(false);
  // Drag logic now in hook
  // (drag hook will be initialized after dimensions are known)

  useEffect(() => {
    return () => {
      unmountedRef.current = true;
  objectUrlsRef.current.forEach((u: string) => { try { URL.revokeObjectURL(u); } catch { /* ignore */ } });
    };
  }, []);

  // Image load handler (fit to viewport once)
  const onImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const imgEl = e.currentTarget;
    setImgNat({ w: imgEl.naturalWidth || imgEl.width, h: imgEl.naturalHeight || imgEl.height });
    if (viewportRef.current && imgEl) {
      const vw = viewportRef.current.clientWidth;
      const vh = viewportRef.current.clientHeight;
      if (imgEl.naturalWidth && imgEl.naturalHeight) {
        const scale = Math.min(vw / imgEl.naturalWidth, vh / imgEl.naturalHeight, 1);
        setFitScale(scale > 0 ? scale : 1);
      }
    }
  }, []);

  /* ====== Wheel Zoom ====== */
  const onWheel = (e: React.WheelEvent) => { if (!imgNat) return; const dir = e.deltaY > 0 ? -1 : 1; setZoomFactor((zf: number) => clamp(zf + dir * 0.08, 0.2, 5)); };

  /* ====== Handlers ====== */
  function canSave() { return !!selectedSheet && !!doctorId && !!stayNumber && !!dateValidated && !lockedByPatient[patientIndex]; }

  function toggleZone(zoneId: string | number) {
    if (lockedByPatient[patientIndex]) return;
  setZonesCheckedByPage((prev: Record<number, Record<string | number, boolean>>) => { const current = { ...(prev[currentPage] || {}) }; current[zoneId] = !current[zoneId]; return { ...prev, [currentPage]: current }; });
  }

  function handleSelectSheet(e: React.ChangeEvent<HTMLSelectElement>) {
    const newId = e.target.value;
    setSelectedSheetId(newId);
    setOverlayRect(null);
    setZonesCheckedByPage({});
    setDateValidated(false); setSelectedDates([]);
    setAutoRectByPage({}); setIgnoreAutoByPage({});
  }

  function goPrevPage() { setCurrentPage((p: number) => Math.max(0, p - 1)); }
  function goNextPage() { setCurrentPage((p: number) => Math.min(pageUrls.length - 1, p + 1)); }
  function goPrevPatient() { if (patientIndex <= 0) return; setCurrentPage((patientIndex - 1) * pagesPerPatient); }
  function goNextPatient() { if (patientIndex >= totalPatients - 1) return; setCurrentPage((patientIndex + 1) * pagesPerPatient); }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    // cleanup previous object URLs
  objectUrlsRef.current.forEach((u: string) => { try { URL.revokeObjectURL(u); } catch {} });
    objectUrlsRef.current = [];
    setError(''); setIsImporting(true); setImportProgress(0); setImportLabel('Préparation…');
    try {
      const localVersion = ++detectionVersionRef.current;
      // 1) Conversion en images (avec sa propre progression)
      const pages = await convertFileToImages(f, (pct, label) => {
        if (typeof pct === 'number') setImportProgress(pct);
        if (label) setImportLabel(label);
      });
      pages.forEach(p => { if (p.startsWith('blob:')) objectUrlsRef.current.push(p); });

      // 2) Init état UI
      setFile(f); setPageUrls(pages); setCurrentPage(0); setImgNat(null);
      setZonesCheckedByPage({}); setLockedByPatient({}); setPatientFields({});
      setPageRotations({}); setAutoRectByPage({}); setIgnoreAutoByPage({});

      // 3) Pré-analyse HQ de toutes les pages (prolonge l'import, overlay toujours affiché)
      const total = pages.length;
      const newRects: Record<number, RectPct> = {};
      // On “reprend” la barre entre 90 → 100 pour l'analyse
      setImportLabel(`Analyse fine du contenu 0/${total}…`);
      setImportProgress(90);
      for (let i = 0; i < total; i++) {
        if (localVersion !== detectionVersionRef.current || unmountedRef.current) break; // annulé
        setImportLabel(`Analyse fine du contenu ${i + 1}/${total}…`);
        setImportProgress(90 + Math.round(((i + 1) / total) * 10));
  const pageUrl = pages[i]!; // i < pages.length so defined
  const r = await detectContentRectFromUrl(pageUrl, { maxDim: 1800, marginPct: 0.012 });
        newRects[i] = r;
        if (i === 0) setOverlayRect(ignoreAutoByPage[0] ? (refRect || r) : r);
      }
      setAutoRectByPage(newRects);
      setImportProgress(100);
      setImportLabel('Terminé');
    } catch (err: any) {
      setError(err?.message || 'Erreur de chargement.');
    } finally {
      setIsImporting(false);
    }
  }

  function saveCurrentPatient() {
    if (!canSave()) return;

    const dates = isMultiDate ? selectedDates.slice() : [currentDate];
    const start = patientIndex * pagesPerPatient;
    const rel: Record<number, Record<string | number, boolean>> = {};
    for (let i = 0; i < pagesPerPatient; i++) rel[i] = zonesCheckedByPage[start + i] || {};

    const entry: PatientEntry = {
      patientIndex, pages: currentPatientPages, sheetId: selectedSheet!.id, sheetName: selectedSheet!.name,
      doctorId, stayNumber, dates, zonesChecked: rel, createdAt: new Date().toISOString(),
    };

    const key = 'scan2OverlaySessions';
    try {
      const raw = localStorage.getItem(key); const arr = raw ? JSON.parse(raw) : [];
      arr.push(entry);
      const MAX_SESSIONS = 20;
      if (arr.length > MAX_SESSIONS) { arr.sort((a: PatientEntry, b: PatientEntry) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); arr.splice(MAX_SESSIONS); }
      localStorage.setItem(key, JSON.stringify(arr));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        try {
          const raw = localStorage.getItem(key); const arr = raw ? JSON.parse(raw) : [];
          arr.sort((a: PatientEntry, b: PatientEntry) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          const reducedArr = arr.slice(0, 10); reducedArr.push(entry);
          localStorage.setItem(key, JSON.stringify(reducedArr));
        } catch { localStorage.setItem(key, JSON.stringify([entry])); }
      } else { console.error('Error saving patient data:', error); alert('Erreur lors de la sauvegarde. Veuillez réessayer.'); return; }
    }

  setLockedByPatient((prev: Record<number, boolean>) => ({ ...prev, [patientIndex]: true }));
  setPatientFields((prev: typeof patientFields) => ({ ...prev, [patientIndex]: { doctorId, stayNumber, isMultiDate, dates, dateValidated: true } }));

    if (!useDoctorForAll) setDoctorId('');
    setStayNumber(''); setDateValidated(false); setSelectedDates([]);

    if (patientIndex < totalPatients - 1) setCurrentPage((patientIndex + 1) * pagesPerPatient);
    else alert('Tous les patients ont été traités.');
  }

  function unlockPatient() {
  setLockedByPatient((prev: Record<number, boolean>) => { const copy = { ...prev }; delete copy[patientIndex]; return copy; });
    const f = patientFields[patientIndex];
    if (f) { setDoctorId(f.doctorId); setStayNumber(f.stayNumber); setIsMultiDate(f.isMultiDate); if (f.isMultiDate) setSelectedDates(f.dates); else setCurrentDate(f.dates[0] || new Date().toISOString().split('T')[0]); setDateValidated(f.dateValidated); }
  }

  function autoCalage() {
    if (!selectedSheet) return;
    const tight = computeTightRectPct(selectedSheet.zones, pageRelativeIndex);
    if (tight) { setRefRect(tight); const autoR = autoRectByPage[currentPage]; setOverlayRect(ignoreAutoByPage[currentPage] ? tight : (autoR || tight)); }
  }
  function resetOverlayRect() { if (refRect) setOverlayRect(refRect); }

  /* ====== Auto-cochage (hook) ====== */
  const { isAutoChecking, autoCheckFromScanCurrentPage } = useAutoCheck({
    overlayRect,
    imgNat,
    selectedSheet,
    pageUrls,
    currentPage,
    normalizedZones,
    detectionVersionRef,
    unmountedRef,
    loadImage,
    zonePctToPagePx,
    shrinkRect,
    INNER_MARGIN_PCT,
    computeInkDensity,
    pickThreshold,
    lockedByPatient,
    patientIndex,
    setError,
    setZonesCheckedByPage,
  });

  /* ====== Zoom / dimensions page ====== */
  const pageScale = fitScale * zoomFactor;
  const pageWidthPx = imgNat ? imgNat.w * pageScale : undefined;
  const pageHeightPx = imgNat ? imgNat.h * pageScale : undefined;
  const zoomPct = Math.round(zoomFactor * 100);

  const wrapWidthPx  = rotation % 180 === 0 ? pageWidthPx  : pageHeightPx;
  const wrapHeightPx = rotation % 180 === 0 ? pageHeightPx : pageWidthPx;

  const { beginDrag } = useOverlayDrag({
    overlayRect,
    overlayLocked,
    rotation,
    wrapWidthPx: wrapWidthPx || 0,
    wrapHeightPx: wrapHeightPx || 0,
    setOverlayRect,
  });

  const checkedCountThisPage = useMemo(() => Object.values(zonesCheckedByPage[currentPage] || {}).filter(Boolean).length, [zonesCheckedByPage, currentPage]);

  /* ====== Multi-sélection dates ====== */
  const lastClickedRef = useRef<string | null>(null);
  const [isShiftDown, setIsShiftDown] = useState(false);
  useEffect(() => {
    const kd = (e: KeyboardEvent) => e.key === 'Shift' && setIsShiftDown(true);
    const ku = (e: KeyboardEvent) => e.key === 'Shift' && setIsShiftDown(false);
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);
  const handleCalendarDayClick = (ymd: string, opts: { shift: boolean }) => {
    if (lockedByPatient[patientIndex]) return;
    const useShift = Boolean(opts?.shift) || isShiftDown;
  setSelectedDates((old: string[]) => {
      if (useShift && lastClickedRef.current) {
        const range = daysBetweenInclusive(lastClickedRef.current!, ymd);
        const s = new Set(old); for (const d of range) s.add(d);
        return Array.from(s).sort();
  } else return old.includes(ymd) ? old.filter((d: string) => d !== ymd) : [...old, ymd].sort();
    });
    setDateValidated(false);
    lastClickedRef.current = ymd;
  };

  /* ====== Rotation handlers ====== */
  function rotatePages(deltaCW: number) {
  setPageRotations((prev: Record<number, number>) => {
      const next: Record<number, number> = { ...prev };
      if (applyRotationToAll) for (let i = 0; i < pageUrls.length; i++) next[i] = normAngle((next[i] ?? 0) + deltaCW);
      else next[currentPage] = normAngle((next[currentPage] ?? 0) + deltaCW);
      return next;
    });
  }

  /* ====== Drag overlay ====== */

  /* =========================
     Rendu
     ========================= */

  const rootClass = embedded ? `relative ${className} bg-white z-0 h-[80vh] rounded-2xl shadow-card border border-gray-200 overflow-hidden` : `fixed inset-0 ${className} bg-white z-50`;
  const overlayRectDisplay = overlayRect ? rotateRectPct(overlayRect, rotation) : null;
  const zonesDisplay = useMemo(() => {
    if (!normalizedZones) return [];
    const a = rotation;
  return normalizedZones.map((z: any) => {
      const r = rotateRectPct({ x: z.x, y: z.y, w: z.width, h: z.height }, a);
      return { ...z, x: r.x, y: r.y, width: r.w, height: r.h };
    });
  }, [normalizedZones, rotation]);


  return (
    <div className={rootClass}>
      {/* Overlay import */}
      {isImporting && (
        <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
          <div className="w-[360px] bg-white border border-gray-200 rounded-xl shadow p-4">
            <div className="flex items-center gap-2 mb-3">
              <Upload className={`w-5 h-5 ${S2O_ACCENT_TEXT}`} />
              <div className="font-medium text-gray-900">Import en cours…</div>
            </div>
            <ProgressBar value={importProgress} label={importLabel} />
            <div className="text-[11px] text-gray-500 mt-2">Merci de patienter, cela peut prendre quelques secondes selon la taille du fichier.</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-white/95">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${S2O_ACCENT_BG}`}>
            <FileText className={`w-5 h-5 ${S2O_ACCENT_TEXT}`} />
          </div>
          <div className="text-sm">
            <div className="font-semibold text-gray-900">Scan2Overlay</div>
            <div className="text-gray-500">Calage automatique par contenu (sans ancres)</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" leadingIcon={<ChevronLeft className="w-4 h-4" />} onClick={goPrevPage} disabled={currentPage === 0 || !pageUrls.length || isImporting}>Page</Button>
          <Button size="sm" variant="secondary" trailingIcon={<ChevronRight className="w-4 h-4" />} onClick={goNextPage} disabled={currentPage >= pageUrls.length - 1 || !pageUrls.length || isImporting}>Page</Button>

          <Button size="sm" variant="primary" leadingIcon={<Save className="w-4 h-4" />} onClick={saveCurrentPatient} disabled={!canSave() || isImporting} className="ml-2" title="CTRL/CMD+S">Enregistrer ce patient</Button>
          <Button size="sm" variant="secondary" onClick={onClose} disabled={isImporting}>Retour</Button>
        </div>
      </div>

      {/* Corps */}
      <div className="h-[calc(100%-3.5rem)] flex">
        {/* Colonne gauche */}
        <aside className="w-[320px] border-r overflow-auto p-4">
          {!file && (
            <div className={`border-2 border-dashed rounded-xl p-6 text-center ${S2O_ACCENT_BG} border-pink-200`}>
              <Upload className={`mx-auto mb-3 ${S2O_ACCENT_TEXT}`} size={40} />
              <div className="font-medium mb-1 text-gray-900">Importez votre document scanné</div>
              <div className="text-sm text-gray-600 mb-4">PDF, DOCX/DOC, ou image (JPG, PNG, …)</div>
              <div className={`relative inline-flex ${isImporting ? 'opacity-60 pointer-events-none' : ''}`}>
                <button type="button" className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
                  Choisir un fichier
                  <input type="file" aria-label="Choisir un fichier" accept="application/pdf,image/*,.docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword" onChange={handleFileUpload} disabled={isImporting} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </button>
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="mt-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {file && (
            <div className="mt-4">
              <label htmlFor="sheetSelect" className="block text-xs text-gray-600 mb-1">Type de feuille d'encodage</label>
              <select id="sheetSelect" className={`w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 ${S2O_ACCENT_RING}`} value={selectedSheetId} onChange={handleSelectSheet} disabled={isImporting}>
                <option value="">— Sélectionnez —</option>
                {sheets.map(s => <option key={s.id} value={s.id}>{s.name} ({s.pagesPerPatient} page(s)/patient)</option>)}
              </select>
            </div>
          )}

          {file && selectedSheet && (
            <>
              <div className="mt-5">
                <div className="text-sm font-semibold mb-2">Informations d'encodage — Patient {patientIndex + 1}</div>

                {lockedByPatient[patientIndex] && (
                  <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                    Cette page est enregistrée et verrouillée.
                    <button type="button" onClick={unlockPatient} className="ml-2 underline hover:no-underline" disabled={isImporting}>Apporter une modification</button>
                  </div>
                )}

                <label htmlFor="stayNumber" className="block text-xs text-gray-600 mb-1">Numéro de séjour *</label>
                <div className="flex gap-2 mb-1">
                  <input id="stayNumber" type="text" value={stayNumber} onChange={(e) => setStayNumber(e.target.value)} disabled={lockedByPatient[patientIndex] || isImporting} className={`flex-1 border rounded-md p-2 text-sm disabled:bg-gray-100 focus:outline-none focus:ring-2 ${S2O_ACCENT_RING}`} placeholder="Ex: 20250118001" />
                  <Button variant="tertiary" size="sm" onClick={decodeBarcode} disabled={isDecodingBarcode || !overlayRect || !hasBarcodeZone || lockedByPatient[patientIndex] || isImporting} title="Lire le code-barres dans la zone dédiée (Code 39)">
                    {isDecodingBarcode ? 'Lecture…' : 'Lire code-barres'}
                  </Button>
                </div>
                {!hasBarcodeZone && (
                  <div className="text-[10px] text-gray-500 mb-2">Aucune zone de code-barres marquée sur cette page.</div>
                )}
                {barcodeError && (
                  <div className="text-[11px] text-red-600 mb-2">{barcodeError}</div>
                )}
                <label className="mt-1 mb-2 flex items-center gap-2 text-[11px] text-gray-600 select-none">
                  <input type="checkbox" className="w-4 h-4" checked={autoBarcodeEnabled} onChange={(e) => setAutoBarcodeEnabled(e.target.checked)} disabled={lockedByPatient[patientIndex] || isImporting} />
                  Lecture automatique du code-barres
                  {isDecodingBarcode && <span className="ml-1 animate-pulse text-pink-600">●</span>}
                </label>

                <label htmlFor="doctorId" className="block text-xs text-gray-600 mb-1">Numéro de médecin *</label>
                <input id="doctorId" type="text" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} disabled={lockedByPatient[patientIndex] || isImporting} className={`w-full border rounded-md p-2 text-sm disabled:bg-gray-100 focus:outline-none focus:ring-2 ${S2O_ACCENT_RING}`} placeholder="Ex: 123456" />

                <label className="mt-2 flex items-center gap-2 text-xs text-gray-700">
                  <input type="checkbox" className="w-4 h-4" checked={useDoctorForAll} onChange={(e) => setUseDoctorForAll(e.target.checked)} disabled={lockedByPatient[patientIndex] || isImporting} />
                  Utiliser ce médecin pour toutes les feuilles de cette session
                </label>

                <div className="mt-4">
                  <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${S2O_ACCENT_TEXT}`} />
                    Date(s) de prestation
                  </div>

                  <div className="flex items-center gap-4 text-sm mb-2">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="dateMode" checked={!isMultiDate} disabled={lockedByPatient[patientIndex] || isImporting} onChange={() => { setIsMultiDate(false); setSelectedDates([]); setDateValidated(false); }} />
                      Date unique
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="dateMode" checked={isMultiDate} disabled={lockedByPatient[patientIndex] || isImporting} onChange={() => { setIsMultiDate(true); setSelectedDates([currentDate]); setDateValidated(false); }} />
                      Dates multiples
                    </label>
                  </div>

                  {!isMultiDate && (
                    <div className="flex items-end gap-2">
                      <input type="date" value={currentDate} onChange={(e) => { setCurrentDate(e.target.value); setDateValidated(false); }} disabled={lockedByPatient[patientIndex] || isImporting} className={`border rounded-md p-2 text-sm disabled:bg-gray-100 focus:outline-none focus:ring-2 ${S2O_ACCENT_RING}`} />
                      <Button variant="secondary" size="sm" onClick={() => setDateValidated(true)} disabled={lockedByPatient[patientIndex] || dateValidated || isImporting}>
                        {dateValidated ? '✓ Validée' : 'Valider'}
                      </Button>
                    </div>
                  )}

                  {isMultiDate && (
                    <div className="text-xs text-gray-600">
                      <div className="mb-1">Cliquez les jours (Shift+clic pour une plage), puis « Valider »</div>
                      <InlineCalendar selected={selectedDates} onDayClick={handleCalendarDayClick} disabled={!!lockedByPatient[patientIndex] || isImporting} className="mb-2" />
                      <div className="flex gap-2 mb-2">
                        <Button variant="secondary" size="sm" onClick={() => setDateValidated(true)} disabled={lockedByPatient[patientIndex] || dateValidated || selectedDates.length === 0 || isImporting}>{dateValidated ? '✓ Validées' : 'Valider'}</Button>
                        <Button variant="tertiary" size="sm" onClick={() => { setSelectedDates([]); setDateValidated(false); }} disabled={lockedByPatient[patientIndex] || selectedDates.length === 0 || isImporting}>Effacer</Button>
                      </div>
                      {selectedDates.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selectedDates.slice().sort().map(d => <span key={d} className={`px-2 py-1 rounded-full text-xs ${S2O_BADGE_BG} ${S2O_BADGE_TEXT}`}>{new Date(d).toLocaleDateString('fr-FR')}</span>)}
                        </div>
                      )}
                    </div>
                  )}

                  {!dateValidated && (
                    <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded text-xs">
                      La validation {isMultiDate ? 'des dates' : 'de la date'} est obligatoire pour activer la sauvegarde.
                    </div>
                  )}
                </div>

                <div className="mt-4 text-xs text-gray-600">
                  <strong>{checkedCountThisPage}</strong> zone(s) cochée(s) sur cette page
                </div>
              </div>

              {/* Outils overlay */}
              <div className="mt-6 p-3 border rounded-md bg-gray-50">
                <div className="text-xs font-semibold text-gray-700 mb-2">Placement de l'overlay (groupe de zones)</div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Button variant="tertiary" size="sm" onClick={autoCalage} title="Recalcule le cadre de référence depuis les zones" disabled={isImporting}>
                    <RotateCw className="w-4 h-4 mr-1" /> Auto-calage
                  </Button>
                  <Button variant="tertiary" size="sm" onClick={resetOverlayRect} disabled={!refRect || isImporting} title="Revenir au cadre de référence">
                    Réinitialiser
                  </Button>
                  <Button variant={overlayLocked ? 'secondary' : 'tertiary'} size="sm" onClick={() => setOverlayLocked(v => !v)} title="Verrouiller/Déverrouiller le cadre" disabled={isImporting}>
                    {overlayLocked ? <Lock className="w-4 h-4 mr-1" /> : <Unlock className="w-4 h-4 mr-1" />}
                    {overlayLocked ? 'Overlay verrouillé' : 'Verrouiller overlay'}
                  </Button>

                  {/* Toggle d’auto-calage pour la page */}
                  <label className="ml-1 inline-flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={!ignoreAutoByPage[currentPage]}
                      onChange={(e) => {
                        const v = !e.target.checked;
                        setIgnoreAutoByPage(prev => ({ ...prev, [currentPage]: v }));
                        const autoR = autoRectByPage[currentPage];
                        setOverlayRect(v ? (refRect || autoR) : (autoR || refRect || null));
                      }}
                      disabled={isImporting}
                    />
                    Auto-calage (détection contenu) pour cette page
                  </label>
                </div>

                {!overlayRect && <div className="mt-2 text-xs text-gray-600">Astuce : choisissez un type de feuille, puis chargez votre document. Le cadre se cale automatiquement sur le contenu scanné.</div>}

                {/* --- Auto-cochage depuis le scan --- */}
                <hr className="my-3" />
                <div className="text-xs font-semibold text-gray-700 mb-2">Auto-cochage depuis le scan</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={autoCheckFromScanCurrentPage}
                    disabled={isImporting || isAutoChecking || !overlayRect || normalizedZones.length === 0}
                    title="Analyse l'encre sous chaque zone et coche/décoche automatiquement"
                  >
                    {isAutoChecking ? 'Analyse…' : 'Détecter et cocher cette page'}
                  </Button>
                  <div className="text-[11px] text-gray-600">
                    Ignore les bordures (−{Math.round(INNER_MARGIN_PCT * 100)}%) et ajuste le seuil selon la taille.
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button className="w-full justify-center" variant="primary" onClick={saveCurrentPatient} disabled={!canSave() || isImporting} title="CTRL/CMD+S">
                  <Save className="w-4 h-4 mr-1" /> Enregistrer ce patient
                </Button>
              </div>
            </>
          )}
        </aside>

        {/* Droite : Page + Overlay + Zoom */}
        <main className="flex-1 relative">
          {/* Zoom bar */}
          <div className="absolute left-1/2 -translate-x-1/2 top-2 z-10 flex items-center gap-2 bg-white/90 rounded-md px-3 py-1 shadow">
            <ZoomOut className="w-4 h-4 cursor-pointer" onClick={() => setZoomFactor(z => clamp(z - 0.1, 0.2, 5))} />
            <input aria-label="Zoom" type="range" min={0.2} max={5} step={0.01} value={zoomFactor} onChange={(e) => setZoomFactor(Number(e.target.value))} disabled={isImporting} />
            <ZoomIn className="w-4 h-4 cursor-pointer" onClick={() => setZoomFactor(z => clamp(z + 0.1, 0.2, 5))} />
            <span className="text-xs w-10 text-right">{zoomPct}%</span>
          </div>

          <div ref={viewportRef} className="absolute inset-0 overflow-auto bg-gray-50" onWheel={onWheel}>
            {selectedSheet && pageUrls.length > 0 ? (
              <div className="mx-auto my-6 relative border border-gray-200 bg-white shadow-sm" ref={pageWrapRef} style={{ width: wrapWidthPx ? `${wrapWidthPx}px` : undefined, height: wrapHeightPx ? `${wrapHeightPx}px` : undefined }}>
                {/* Image tournée (centrée) */}
                <div className="absolute left-1/2 top-1/2" style={{ width: pageWidthPx ? `${pageWidthPx}px` : undefined, height: pageHeightPx ? `${pageHeightPx}px` : undefined, transform: `translate(-50%, -50%) rotate(${rotation}deg)`, transformOrigin: 'center center' }}>
                  <img src={pageUrls[currentPage]} onLoad={onImgLoad} alt={`Page ${currentPage + 1}`} draggable={false} className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none" />
                </div>

                {/* OVERLAY */}
                {overlayRectDisplay && zonesDisplay.length > 0 && (
                  <div className="absolute inset-0" style={{ pointerEvents: 'auto', zIndex: 5 }}>
                    <div className="absolute" style={{ left: `${overlayRectDisplay.x}%`, top: `${overlayRectDisplay.y}%`, width: `${overlayRectDisplay.w}%`, height: `${overlayRectDisplay.h}%` }}>
                      {!overlayLocked && (
                        <div onMouseDown={(e) => beginDrag('move', e)} className="absolute left-0 top-0 h-6 w-full cursor-move" style={{ background: 'rgba(0,0,0,0.05)' }} title="Glisser pour déplacer l'overlay" />
                      )}

                      {zonesDisplay.map(zone => {
                        const checked = (zonesCheckedByPage[currentPage] || {})[zone.id] ?? false;
                        const isLockedPage = !!lockedByPatient[patientIndex];
                        return (
                          <button
                            key={zone.id}
                            type="button"
                            onClick={() => toggleZone(zone.id)}
                            className={`absolute rounded border-2 transition-colors ${checked ? 'border-green-500 bg-green-400/70' : 'border-blue-500 bg-blue-400/45 hover:bg-blue-500/60'} ${isLockedPage ? 'pointer-events-none' : 'pointer-events-auto'}`}
                            style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }}
                            title={`${zone.label || zone.id}${zone.code ? ` (${zone.code})` : ''}`}
                          />
                        );
                      })}

                      {!overlayLocked && (
                        <>
                          <div onMouseDown={(e) => beginDrag('nw', e)} className="absolute -left-1 -top-1 w-3 h-3 bg-white border border-gray-500 rounded cursor-nwse-resize" title="Redimensionner" />
                          <div onMouseDown={(e) => beginDrag('ne', e)} className="absolute -right-1 -top-1 w-3 h-3 bg-white border border-gray-500 rounded cursor-nesw-resize" title="Redimensionner" />
                          <div onMouseDown={(e) => beginDrag('sw', e)} className="absolute -left-1 -bottom-1 w-3 h-3 bg-white border border-gray-500 rounded cursor-nesw-resize" title="Redimensionner" />
                          <div onMouseDown={(e) => beginDrag('se', e)} className="absolute -right-1 -bottom-1 w-3 h-3 bg-white border border-gray-500 rounded cursor-nwse-resize" title="Redimensionner" />
                          <div onMouseDown={(e) => beginDrag('n', e)} className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1 h-3 w-6 bg-white border border-gray-500 rounded cursor-n-resize" title="Redimensionner" />
                          <div onMouseDown={(e) => beginDrag('s', e)} className="absolute bottom-0 left-1/2 -translate-x-1/2 -mb-1 h-3 w-6 bg-white border border-gray-500 rounded cursor-s-resize" title="Redimensionner" />
                          <div onMouseDown={(e) => beginDrag('w', e)} className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1 w-3 h-6 bg-white border border-gray-500 rounded cursor-w-resize" title="Redimensionner" />
                          <div onMouseDown={(e) => beginDrag('e', e)} className="absolute right-0 top-1/2 -translate-y-1/2 -mr-1 w-3 h-6 bg-white border border-gray-500 rounded cursor-e-resize" title="Redimensionner" />
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Message si pas de zones */}
                {selectedSheet && zonesForCurrentRelativePage.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded">
                      Aucune zone définie pour cette page (relative : {pageRelativeIndex})
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                {file ? "Choisissez un type de feuille pour afficher l'overlay." : 'Importez un document pour commencer.'}
              </div>
            )}

            {/* Bas / navigation patients + Rotation */}
            <div className="sticky bottom-0 left-0 right-0 bg-white/90 border-t px-4 py-2 flex items-center justify-between gap-2">
              <div className="text-xs text-gray-500">
                {pageUrls.length > 0 &&
                  `Page ${currentPage + 1} / ${pageUrls.length} • Patient ${patientIndex + 1} / ${totalPatients} • Feuille : ${selectedSheet?.name || '-'}`}
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                <div className="flex items-center gap-1 mr-2">
                  <Button size="sm" variant="tertiary" onClick={() => rotatePages(-90)} disabled={!pageUrls.length || isImporting} title="Tourner à gauche (−90°)">
                    <RotateCcw className="w-4 h-4 mr-1" /> Tourner à gauche
                  </Button>
                  <Button size="sm" variant="tertiary" onClick={() => rotatePages(+90)} disabled={!pageUrls.length || isImporting} title="Tourner à droite (+90°)">
                    <RotateCw className="w-4 h-4 mr-1" /> Tourner à droite
                  </Button>
                  <label className="ml-2 inline-flex items-center gap-2 text-xs text-gray-700">
                    <input type="checkbox" className="w-4 h-4" checked={applyRotationToAll} onChange={(e) => setApplyRotationToAll(e.target.checked)} disabled={!pageUrls.length || isImporting} />
                    Appliquer à toutes les pages
                  </label>
                </div>

                <Button size="sm" variant="secondary" leadingIcon={<ChevronLeft className="w-4 h-4" />} onClick={goPrevPatient} disabled={patientIndex === 0 || !pageUrls.length || isImporting}>Patient</Button>
                <Button size="sm" variant="secondary" trailingIcon={<ChevronRight className="w-4 h-4" />} onClick={goNextPatient} disabled={patientIndex >= totalPatients - 1 || !pageUrls.length || isImporting}>Patient</Button>

                <Button size="sm" variant="primary" onClick={saveCurrentPatient} disabled={!canSave() || isImporting} title="CTRL/CMD+S" className="ml-2">
                  <Save className="w-4 h-4 mr-1" /> Enregistrer ce patient
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Scan2OverlayModule;
