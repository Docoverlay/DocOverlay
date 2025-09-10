import { useState, useCallback } from 'react';
import { Zone } from '../types';
import { detectBoxAtPoint } from '../utils/autoDetection';

interface Params {
  autoDetectionMode: boolean;
  imgRef: React.RefObject<HTMLImageElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  bgSrc: string | null;
  zones: Zone[];
  setZones: React.Dispatch<React.SetStateAction<Zone[]>>;
  commitHistory: (snapshot?: Zone[]) => void;
  showError: (msg: string) => void;
  showSuccess: (msg: string) => void;
}

export function useAutoDetection({
  autoDetectionMode,
  imgRef,
  containerRef,
  bgSrc,
  zones,
  setZones,
  commitHistory,
  showError,
  showSuccess,
}: Params) {
  const [previewBox, setPreviewBox] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  const handleMouseMove = useCallback(async (e: React.MouseEvent) => {
    if (!autoDetectionMode) { setPreviewBox(null); return; }
    const container = containerRef.current;
    const imageElement = container?.querySelector('img') as HTMLImageElement | null;
    if (!container || !imageElement || !bgSrc) { setPreviewBox(null); return; }
    const rect = imageElement.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) { setPreviewBox(null); return; }
    const x = ((e.clientX - rect.left) / rect.width) * imageElement.naturalWidth;
    const y = ((e.clientY - rect.top) / rect.height) * imageElement.naturalHeight;
    const detectedBox = await detectBoxAtPoint(x, y, imageElement, zones);
    setPreviewBox(detectedBox);
  }, [autoDetectionMode, containerRef, bgSrc, zones]);

  const handleClick = useCallback(() => {
    if (!autoDetectionMode) return;
    if (!previewBox) {
      showError('Impossible de détecter une case à cet endroit. Essayez de cliquer au centre d\'une case bien délimitée.');
      return;
    }
    const img = imgRef.current;
    if (!img) return;
    const newZone: Zone = {
      id: Date.now(),
      top: (previewBox.top / 100) * (img.naturalHeight || 1),
      left: (previewBox.left / 100) * (img.naturalWidth || 1),
      width: (previewBox.width / 100) * (img.naturalWidth || 1),
      height: (previewBox.height / 100) * (img.naturalHeight || 1),
      code: '', locked: false, checked: false,
    };
    setZones((prev: Zone[]) => {
      const nz = [...prev, newZone];
      commitHistory(nz);
      return nz;
    });
    setPreviewBox(null);
    showSuccess('Case détectée automatiquement !');
  }, [autoDetectionMode, previewBox, imgRef, setZones, commitHistory, showError, showSuccess]);

  return { previewBox, setPreviewBox, handleMouseMove, handleClick };
}

export default useAutoDetection;
