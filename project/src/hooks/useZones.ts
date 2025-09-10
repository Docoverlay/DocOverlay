import { useCallback, useRef, useState } from 'react';
import { Zone } from '../types';
import { zonesOverlap } from '../utils/zones';

export interface UseZonesOptions {
  initialZones?: Zone[];
}

export interface UseZonesResult {
  zones: Zone[];
  setZones: React.Dispatch<React.SetStateAction<Zone[]>>;
  zonesRef: React.MutableRefObject<Zone[]>;
  lastSize: { w: number; h: number };
  setLastSize: React.Dispatch<React.SetStateAction<{ w: number; h: number }>>;
  commitHistory: (snapshot?: Zone[]) => void;
  undo: () => void;
  deleteZone: (id: number) => void;
  updateZone: (id: number, props: Partial<Zone>, onCollision?: () => void) => void;
}

export function useZones({ initialZones = [] }: UseZonesOptions): UseZonesResult {
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [history, setHistory] = useState<Zone[][]>([initialZones]);
  const [lastSize, setLastSize] = useState({ w: 80, h: 30 });

  const zonesRef = useRef<Zone[]>(zones);
  zonesRef.current = zones;

  const commitHistory = useCallback((snapshot?: Zone[]) => {
    const snap = (snapshot ?? zonesRef.current).map((z: Zone) => ({ ...z }));
    setHistory((h: Zone[][]) => [...h, snap]);
  }, []);

  const undo = useCallback(() => {
    setHistory((hist: Zone[][]) => {
      if (hist.length > 1) {
        const newHist = hist.slice(0, hist.length - 1);
        setZones(newHist[newHist.length - 1]);
        return newHist;
      }
      return hist;
    });
  }, []);

  const deleteZone = useCallback((id: number) => {
    setZones((prev: Zone[]) => {
      const nz = prev.filter((z: Zone) => z.id !== id);
      commitHistory(nz);
      return nz;
    });
  }, [commitHistory]);

  const updateZone = useCallback((id: number, props: Partial<Zone>, onCollision?: () => void) => {
    setZones((prev: Zone[]) => prev.map((z: Zone) => {
      if (z.id === id) {
        const simulated: Zone = { ...z, ...props } as Zone;
        const collision = prev.some((other: Zone) => other.id !== id && zonesOverlap(simulated, other));
        if (collision) {
          onCollision?.();
          return z;
        }
        if (props.width !== undefined || props.height !== undefined) {
          setLastSize((ls) => ({
            w: props.width !== undefined ? (props.width as number) : ls.w,
            h: props.height !== undefined ? (props.height as number) : ls.h,
          }));
        }
        return simulated;
      }
      return z;
    }));
  }, []);

  return { zones, setZones, zonesRef, lastSize, setLastSize, commitHistory, undo, deleteZone, updateZone };
}

export default useZones;
