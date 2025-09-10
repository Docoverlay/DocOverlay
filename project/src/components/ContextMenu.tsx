import React, { useEffect, useState } from 'react';
import { Lock, Unlock, Trash2, Minus, Plus, Copy, Clipboard, Move, Barcode } from 'lucide-react';
import { Zone } from '../types';

interface ContextMenuProps {
  zone: Zone;
  menuRef: React.RefObject<HTMLDivElement>;
  copiedSize: { width: number; height: number } | null;
  onCopySize: (zone: Zone) => void;
  onPasteSize: (zone: Zone) => void;
  onUpdateZone: (id: number, props: Partial<Zone>) => void;
  onDeleteZone: (id: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  scale: number;
}

export default function ContextMenu({ 
  zone, 
  menuRef, 
  copiedSize, 
  onCopySize, 
  onPasteSize, 
  onUpdateZone, 
  onDeleteZone, 
  containerRef,
  scale 
}: ContextMenuProps) {
  const STEP = 1;
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Positionner le menu à droite de la zone sélectionnée
  useEffect(() => {
    if (!menuRef.current || !containerRef.current) return;

    const menu = menuRef.current;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Calculer la position de la zone dans le viewport
    const zoneLeft = containerRect.left + (zone.left * scale);
    const zoneTop = containerRect.top + (zone.top * scale);
    const zoneWidth = zone.width * scale;
    const zoneHeight = zone.height * scale;
    
    // Dimensions du menu
    const menuWidth = 300;
    const menuHeight = 400;
    const offset = 15;
    
    // Position par défaut : à droite de la zone
    let menuX = zoneLeft + zoneWidth + offset;
    let menuY = zoneTop;
    
    // Ajustements si le menu sort de l'écran
    if (menuX + menuWidth > window.innerWidth) {
      // Positionner à gauche de la zone
      menuX = zoneLeft - menuWidth - offset;
    }
    
    // Si toujours hors écran à gauche, centrer horizontalement
    if (menuX < 10) {
      menuX = Math.max(10, (window.innerWidth - menuWidth) / 2);
    }
    
    // Ajustement vertical
    if (menuY + menuHeight > window.innerHeight) {
      menuY = window.innerHeight - menuHeight - 10;
    }
    
    if (menuY < 10) {
      menuY = 10;
    }
    
    // Appliquer la position
    menu.style.left = `${menuX}px`;
    menu.style.top = `${menuY}px`;
  }, [zone, scale, containerRef, menuRef]);

  const handleStopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if (!menuRef.current) return;
    
    setIsDragging(true);
    const rect = menuRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!menuRef.current) return;
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Contraintes pour garder le menu dans la fenêtre
      const menuWidth = menuRef.current.offsetWidth;
      const menuHeight = menuRef.current.offsetHeight;
      
      const constrainedX = Math.max(10, Math.min(window.innerWidth - menuWidth - 10, newX));
      const constrainedY = Math.max(10, Math.min(window.innerHeight - menuHeight - 10, newY));
      
      menuRef.current.style.left = `${constrainedX}px`;
      menuRef.current.style.top = `${constrainedY}px`;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-xl border border-gray-300"
      style={{ 
        display: 'none',
        width: '300px',
        zIndex: 10001,
        overflow: 'visible'
      }}
      onClick={handleStopPropagation}
    >
      {/* Header avec poignée de déplacement */}
      <div 
        className="flex items-center justify-between p-3 bg-gray-50 rounded-t-lg border-b cursor-move select-none"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Configuration de la zone</span>
        </div>
        <div className="text-xs text-gray-500">
          {Math.round(zone.width)}×{Math.round(zone.height)}px
        </div>
      </div>

      <div className="p-4">
        {/* Code Input */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Code
          </label>
          <input
            type="text"
            value={zone.code}
            onChange={(e) => onUpdateZone(zone.id, { code: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Entrez le code"
          />
        </div>

        {/* Size Controls */}
        <div className="space-y-4 mb-5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Largeur</label>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onUpdateZone(zone.id, { width: Math.max(1, zone.width - STEP) })}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={Math.round(zone.width)}
                onChange={(e) => onUpdateZone(zone.id, { width: Math.max(1, +e.target.value) })}
                className="w-20 text-center border border-gray-300 rounded px-2 py-1"
                min="1"
                step="0.5"
              />
              <span className="text-xs text-gray-500">px</span>
              <button
                onClick={() => onUpdateZone(zone.id, { width: zone.width + STEP })}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Hauteur</label>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onUpdateZone(zone.id, { height: Math.max(1, zone.height - STEP) })}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={Math.round(zone.height)}
                onChange={(e) => onUpdateZone(zone.id, { height: Math.max(1, +e.target.value) })}
                className="w-20 text-center border border-gray-300 rounded px-2 py-1"
                min="1"
                step="0.5"
              />
              <span className="text-xs text-gray-500">px</span>
              <button
                onClick={() => onUpdateZone(zone.id, { height: zone.height + STEP })}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Size Copy/Paste */}
        <div className="space-y-3 mb-5 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700">Copier/Coller la taille</h4>
          <div className="flex gap-2">
            <button
              onClick={() => onCopySize(zone)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium flex-1"
            >
              <Copy className="w-4 h-4" />
              Copier taille
            </button>
            <button
              onClick={() => onPasteSize(zone)}
              disabled={!copiedSize}
              className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm font-medium flex-1 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <Clipboard className="w-4 h-4" />
              Coller taille
            </button>
          </div>
          {copiedSize && (
            <p className="text-xs text-gray-500 text-center">
              Taille copiée: {Math.round(copiedSize.width)}×{Math.round(copiedSize.height)}px
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <button
            onClick={() => onUpdateZone(zone.id, { isBarcode: !zone.isBarcode })}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              zone.isBarcode
                ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
                : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
            }`}
            title="Marquer ou dé-marquer cette zone comme zone de lecture code-barres"
          >
            <Barcode className="w-4 h-4" />
            {zone.isBarcode ? 'Code-barres' : 'Marquer code-barres'}
          </button>
          <button
            onClick={() => onUpdateZone(zone.id, { locked: !zone.locked })}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              zone.locked
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {zone.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            {zone.locked ? 'Déverrouiller' : 'Verrouiller'}
          </button>
          
          <button
            onClick={() => onDeleteZone(zone.id)}
            className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}