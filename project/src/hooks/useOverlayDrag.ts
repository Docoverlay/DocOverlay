import { useCallback, useRef } from 'react';
import { clamp, mapDisplayDeltaToModel } from '../utils/geometry';

export type RectPct = { x: number; y: number; w: number; h: number };
export type DragMode = 'move'|'n'|'s'|'e'|'w'|'ne'|'nw'|'se'|'sw';

interface UseOverlayDragParams {
  overlayRect: RectPct | null;
  overlayLocked: boolean;
  rotation: number;
  wrapWidthPx?: number;
  wrapHeightPx?: number;
  setOverlayRect: (r: RectPct) => void;
}

export function useOverlayDrag({ overlayRect, overlayLocked, rotation, wrapWidthPx, wrapHeightPx, setOverlayRect }: UseOverlayDragParams) {
  const draggingRef = useRef<{ mode: DragMode; startX: number; startY: number; startRect: RectPct } | null>(null);

  const beginDrag = useCallback((mode: DragMode, e: React.MouseEvent) => {
    if (!overlayRect || overlayLocked) return; e.preventDefault(); e.stopPropagation();
    draggingRef.current = { mode, startX: e.clientX, startY: e.clientY, startRect: { ...overlayRect } };

    const onMouseMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return;
      const { mode, startX, startY, startRect } = draggingRef.current;
      const wRef = (wrapWidthPx || 1); const hRef = (wrapHeightPx || 1);
      const dxDisp = ((ev.clientX - startX) / wRef) * 100;
      const dyDisp = ((ev.clientY - startY) / hRef) * 100;
      const { dx, dy } = mapDisplayDeltaToModel(dxDisp, dyDisp, rotation);
      let r = { ...startRect };
      if (mode === 'move') { r.x = clamp(startRect.x + dx, 0, 100 - startRect.w); r.y = clamp(startRect.y + dy, 0, 100 - startRect.h); }
      else if (mode === 'n') { const ny = clamp(startRect.y + dy, 0, startRect.y + startRect.h - 1); r.y = ny; r.h = startRect.h + (startRect.y - ny); }
      else if (mode === 's') { r.h = clamp(startRect.h + dy, 1, 100 - startRect.y); }
      else if (mode === 'w') { const nx = clamp(startRect.x + dx, 0, startRect.x + startRect.w - 1); r.x = nx; r.w = startRect.w + (startRect.x - nx); }
      else if (mode === 'e') { r.w = clamp(startRect.w + dx, 1, 100 - startRect.x); }
      else if (mode === 'nw') { const nx = clamp(startRect.x + dx, 0, startRect.x + startRect.w - 1); const ny = clamp(startRect.y + dy, 0, startRect.y + startRect.h - 1); r.x = nx; r.y = ny; r.w = startRect.w + (startRect.x - nx); r.h = startRect.h + (startRect.y - ny); }
      else if (mode === 'ne') { const ny = clamp(startRect.y + dy, 0, startRect.y + startRect.h - 1); r.y = ny; r.w = clamp(startRect.w + dx, 1, 100 - startRect.x); r.h = startRect.h + (startRect.y - ny); }
      else if (mode === 'sw') { const nx = clamp(startRect.x + dx, 0, startRect.x + startRect.w - 1); r.x = nx; r.w = startRect.w + (startRect.x - nx); r.h = clamp(startRect.h + dy, 1, 100 - startRect.y); }
      else if (mode === 'se') { r.w = clamp(startRect.w + dx, 1, 100 - startRect.x); r.h = clamp(startRect.h + dy, 1, 100 - startRect.y); }
      setOverlayRect(r);
    };
    const onMouseUp = () => { draggingRef.current = null; document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [overlayRect, overlayLocked, rotation, wrapWidthPx, wrapHeightPx, setOverlayRect]);

  return { beginDrag };
}
