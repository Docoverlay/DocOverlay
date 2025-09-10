import { useEffect, useState } from 'react';

export const useKeyboardZoom = (initialZoom: number = 1, min: number = 0.25, max: number = 3) => {
  const [zoom, setZoom] = useState(initialZoom);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoom(prev => Math.min(max, prev + 0.1));
        } else if (e.key === '-') {
          e.preventDefault();
          setZoom(prev => Math.max(min, prev - 0.1));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoom(1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [min, max]);

  return { zoom, setZoom };
};