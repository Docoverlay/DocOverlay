import { Zone } from '../types';
import { zonesOverlap } from './zones';

// Parameters to tweak detection behavior
interface DetectionConfig {
  darknessThreshold?: number; // pixel brightness threshold (0-255) below which pixel is considered dark (part of a border)
  minLineContinuity?: number; // required continuous dark pixels in both directions to qualify as a border line
  maxSearchDivisor?: number;  // divisor relative to min(imageWidth, imageHeight) to limit search distance
  minBoxWidthRatio?: number;  // min width as ratio of canvas width
  minBoxHeightRatio?: number; // min height as ratio of canvas height
  maxBoxWidthRatio?: number;  // max width as ratio of canvas width
  maxBoxHeightRatio?: number; // max height as ratio of canvas height
}

const defaultConfig: Required<DetectionConfig> = {
  darknessThreshold: 150,
  minLineContinuity: 8,
  maxSearchDivisor: 15,
  minBoxWidthRatio: 0.008,
  minBoxHeightRatio: 0.004,
  maxBoxWidthRatio: 0.6,
  maxBoxHeightRatio: 0.4,
};

export interface DetectedBoxPct { top: number; left: number; width: number; height: number; }

// Core detection algorithm (returns box in percentage relative to image dimensions)
export async function detectBoxAtPoint(
  x: number,
  y: number,
  imageElement: HTMLImageElement,
  zones: Zone[],
  config: DetectionConfig = {}
): Promise<DetectedBoxPct | null> {
  const cfg = { ...defaultConfig, ...config };
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) { resolve(null); return; }
    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    ctx.drawImage(imageElement, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const getBrightness = (px: number, py: number): number => {
      if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) return 255;
      const i = (py * canvas.width + px) * 4;
      return (data[i] + data[i + 1] + data[i + 2]) / 3;
    };

    function isInsideAnyZone(px: number, py: number): boolean {
      return zones.some(z => (
        px >= z.left && px <= z.left + z.width &&
        py >= z.top && py <= z.top + z.height
      ));
    }

    const isLinePixel = (px: number, py: number, dx: number, dy: number): boolean => {
      if (px < 0 || px >= canvas.width || py < 0 || py >= canvas.height) return false;
      if (getBrightness(px, py) > cfg.darknessThreshold) return false;
      let continuity = 0;
      for (let i = 1; i <= cfg.minLineContinuity; i++) {
        const nx = px + dx * i, ny = py + dy * i;
        if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height && getBrightness(nx, ny) < cfg.darknessThreshold) continuity++;
        else break;
      }
      for (let i = 1; i <= cfg.minLineContinuity; i++) {
        const nx = px - dx * i, ny = py - dy * i;
        if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height && getBrightness(nx, ny) < cfg.darknessThreshold) continuity++;
        else break;
      }
      return continuity >= cfg.minLineContinuity;
    };

    const findNearestBorder = (startX: number, startY: number, direction: 'left' | 'right' | 'up' | 'down'): number => {
      const stepX = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
      const stepY = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
      let currentX = startX, currentY = startY;
      const maxSearch = Math.min(canvas.width, canvas.height) / cfg.maxSearchDivisor;
      let distance = 0;
      while (distance < maxSearch) {
        currentX += stepX; currentY += stepY; distance++;
        if (currentX < 0 || currentX >= canvas.width || currentY < 0 || currentY >= canvas.height) break;
        if (isLinePixel(currentX, currentY, stepX === 0 ? 1 : 0, stepY === 0 ? 1 : 0)) {
          return direction === 'left' || direction === 'right' ? currentX : currentY;
        }
        if (isInsideAnyZone(currentX, currentY)) {
          return direction === 'left' || direction === 'right' ? currentX : currentY;
        }
      }
      return -1;
    };

    const startX = Math.floor(x);
    const startY = Math.floor(y);
    const leftBorder = findNearestBorder(startX, startY, 'left');
    const rightBorder = findNearestBorder(startX, startY, 'right');
    const topBorder = findNearestBorder(startX, startY, 'up');
    const bottomBorder = findNearestBorder(startX, startY, 'down');

    if (topBorder === -1 || bottomBorder === -1 || leftBorder === -1 || rightBorder === -1) { resolve(null); return; }

    const width = rightBorder - leftBorder;
    const height = bottomBorder - topBorder;

    const minBoxWidth = canvas.width * cfg.minBoxWidthRatio;
    const minBoxHeight = canvas.height * cfg.minBoxHeightRatio;
    const maxBoxWidth = canvas.width * cfg.maxBoxWidthRatio;
    const maxBoxHeight = canvas.height * cfg.maxBoxHeightRatio;

    if (width > minBoxWidth && height > minBoxHeight && width < maxBoxWidth && height < maxBoxHeight) {
      const cand: DetectedBoxPct = {
        top: (topBorder / canvas.height) * 100,
        left: (leftBorder / canvas.width) * 100,
        width: (width / canvas.width) * 100,
        height: (height / canvas.height) * 100,
      };
      // Final overlap verification (convert percent to px for overlap test) - optional, skip heavy checks
      const boxPx: Zone = {
        id: -1,
        top: (cand.top / 100) * canvas.height,
        left: (cand.left / 100) * canvas.width,
        width: (cand.width / 100) * canvas.width,
        height: (cand.height / 100) * canvas.height,
        code: '', locked: false, checked: false,
      };
      const overlap = zones.some(z => zonesOverlap(z, boxPx));
      if (overlap) { resolve(null); return; }
      resolve(cand);
    } else {
      resolve(null);
    }
  });
}
