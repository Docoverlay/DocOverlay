import React from 'react';
import { Zone } from '../types';

interface ZoneComponentProps {
  zone: Zone;
  scale: number;
  zoomLevel?: number;
  onMouseDown: (e: React.MouseEvent, zone: Zone) => void;
  onContextMenu: (e: React.MouseEvent, zone: Zone) => void;
  onResizeStart: (e: React.MouseEvent, zone: Zone, direction: string) => void;
}

export default function ZoneComponent({
  zone,
  scale,
  zoomLevel = 1,
  onMouseDown,
  onContextMenu,
  onResizeStart
}: ZoneComponentProps) {
  const getZoneColor = (z: Zone) => {
    if (z.locked && z.code) return 'bg-green-300 border-green-500';
    if (z.locked) return 'bg-orange-300 border-orange-500';
    if (z.code) return 'bg-blue-300 border-blue-500';
    return 'bg-red-300 border-red-500';
  };

  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();
    onResizeStart(e, zone, direction);
  };

  const handleDragStart = (e: React.DragEvent) => {
    // Empêche le drag HTML5 (ghost image) qui peut ajouter de la latence
    e.preventDefault();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zone.locked) return;
    onMouseDown(e, zone);
  };

  const px = (v: number) => `${v * scale}px`;
  const handleSize = Math.max(6, 8 * scale * zoomLevel);
  const handleSizeThinH = Math.max(4, 6 * scale * zoomLevel);
  const offset = 2 * scale * zoomLevel;

  return (
    <div
      data-zone-id={zone.id} // IMPORTANT pour l'update par transform côté onDragStart
      className={`absolute select-none ${getZoneColor(zone)} border-2 ${zone.locked ? 'cursor-default' : 'cursor-move hover:shadow-md'}`}
      style={{
        top: px(zone.top),
        left: px(zone.left),
        width: px(zone.width),
        height: px(zone.height),
        // Optimisations perf (drag ultra fluide via transform appliqué par DocumentEditor)
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
        // Pas de transition: évite le "retard" visuel
        transition: 'none' as const,
        // Évite les sélections intempestives
        userSelect: 'none' as const
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => onContextMenu(e, zone)}
      onDragStart={handleDragStart}
      draggable={false}
    >
      {/* Code affiché au centre */}
      {zone.code && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className="font-medium text-gray-700 bg-white/80 px-1 rounded"
            style={{ fontSize: `${Math.max(8, 10 * scale * zoomLevel)}px` }}
          >
            {zone.code}
          </span>
        </div>
      )}

      {/* Poignées de resize */}
      {!zone.locked && (
        <>
          {/* Coins */}
          <div
            className="absolute bg-black cursor-nw-resize opacity-40 hover:opacity-80 rounded-full"
            style={{ top: `-${offset}px`, left: `-${offset}px`, width: `${handleSize}px`, height: `${handleSize}px` }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
          />
          <div
            className="absolute bg-black cursor-ne-resize opacity-40 hover:opacity-80 rounded-full"
            style={{ top: `-${offset}px`, right: `-${offset}px`, width: `${handleSize}px`, height: `${handleSize}px` }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
          />
          <div
            className="absolute bg-black cursor-sw-resize opacity-40 hover:opacity-80 rounded-full"
            style={{ bottom: `-${offset}px`, left: `-${offset}px`, width: `${handleSize}px`, height: `${handleSize}px` }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
          />
          <div
            className="absolute bg-black cursor-se-resize opacity-40 hover:opacity-80 rounded-full"
            style={{ bottom: `-${offset}px`, right: `-${offset}px`, width: `${handleSize}px`, height: `${handleSize}px` }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
          />

          {/* Bords */}
          <div
            className="absolute bg-black cursor-n-resize opacity-40 hover:opacity-80 rounded"
            style={{
              top: `-${offset}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              width: `${handleSize}px`,
              height: `${handleSizeThinH}px`
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
          />
          <div
            className="absolute bg-black cursor-s-resize opacity-40 hover:opacity-80 rounded"
            style={{
              bottom: `-${offset}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              width: `${handleSize}px`,
              height: `${handleSizeThinH}px`
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, 's')}
          />
          <div
            className="absolute bg-black cursor-w-resize opacity-40 hover:opacity-80 rounded"
            style={{
              left: `-${offset}px`,
              top: '50%',
              transform: 'translateY(-50%)',
              width: `${handleSizeThinH}px`,
              height: `${handleSize}px`
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
          />
          <div
            className="absolute bg-black cursor-e-resize opacity-40 hover:opacity-80 rounded"
            style={{
              right: `-${offset}px`,
              top: '50%',
              transform: 'translateY(-50%)',
              width: `${handleSizeThinH}px`,
              height: `${handleSize}px`
            }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
          />
        </>
      )}
    </div>
  );
}
