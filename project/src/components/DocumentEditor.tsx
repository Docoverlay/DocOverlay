import React, { useState, useRef, useEffect } from 'react';
import { FileImage, AlertCircle, Zap, Download } from 'lucide-react';
import Toolbar from './Toolbar';
import Legend from './Legend';
import ContextMenu from './ContextMenu';
import ZoneComponent from './ZoneComponent';
import { Zone, DocType, User, SavedDocument, ConvertedDocument } from '../types';
import { zonesOverlap, zonesToPercent } from '../utils/zones';
import AccessDenied from './AccessDenied';
import useAutoDetection from '../hooks/useAutoDetection';
import useZones from '../hooks/useZones';
import { saveDocument, updateDocument } from '../utils/database';
import {
  convertDocumentToImages,
  ConversionProgress,
  isSupportedFileType,
  getFileTypeDescription
} from '../utils/documentConverter';

// util functions moved to ../utils/zones

interface DocumentEditorProps {
  user: User;
  onBack: () => void;
  editingDocument?: SavedDocument | null;
}

export default function DocumentEditor({ user, onBack, editingDocument }: DocumentEditorProps) {
  // Guard rôles (align with existing lower-case roles if needed)
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return <AccessDenied onBack={onBack} />;
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Error/success helpers first
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const showError = (message: string) => { setError(message); setTimeout(() => setError(''), 5000); };
  const showSuccess = (message: string) => { setSuccess(message); setTimeout(() => setSuccess(''), 3000); };

  const { zones, setZones, zonesRef, lastSize, setLastSize, commitHistory, undo, deleteZone: deleteZoneBase, updateZone: updateZoneBase } = useZones({
    initialZones: editingDocument?.zones || [],
  });

  // Removed fillMode/fillOrder/currentFillIndex (unused) to slim component
  const [scale, setScale] = useState(1);
  const [currentZone, setCurrentZone] = useState<Zone | null>(null);
  const [copiedSize, setCopiedSize] = useState<{ width: number; height: number } | null>(null);
  const [documentName, setDocumentName] = useState(editingDocument?.name || '');
  const [docType, setDocType] = useState<DocType>(editingDocument?.docType || '');
  const [providerCode, setProviderCode] = useState(editingDocument?.providerCode || '');
  const [bgSrc, setBgSrc] = useState<string | null>(editingDocument?.backgroundImage || null);
  const [autoDetectionMode, setAutoDetectionMode] = useState(false);
  // auto-detection preview state now handled by hook
  // removed isProcessing (deprecated)
  const [convertedDocument, setConvertedDocument] = useState<ConvertedDocument | null>(
    editingDocument?.convertedDocument || null
  );
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<ConversionProgress | null>(null);
  // removed justResized (no longer required after refactor)

  // ===== Historique "léger" + ref pour lecture instantanée pendant le drag
  // zones + history handled by useZones

  // CTRL+Z / CMD+Z (Undo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  const deleteZone = (id: number) => { deleteZoneBase(id); setCurrentZone(null); if (menuRef.current) menuRef.current.style.display = 'none'; };

  // SUPPR
  useEffect(() => {
    const handleDeleteKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && currentZone) {
        e.preventDefault();
        deleteZone(currentZone.id);
      }
    };
    document.addEventListener('keydown', handleDeleteKeyPress);
    return () => document.removeEventListener('keydown', handleDeleteKeyPress);
  }, [currentZone]);

  // Responsive scale
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const updateScale = () => {
      if (img.naturalWidth > 0) setScale(img.clientWidth / img.naturalWidth);
    };
    if (img.complete && img.naturalWidth > 0) updateScale();
    img.addEventListener('load', updateScale);
    window.addEventListener('resize', updateScale);
    return () => {
      img.removeEventListener('load', updateScale);
      window.removeEventListener('resize', updateScale);
    };
  }, [bgSrc]);

  // Clic hors menu contextuel
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        menuRef.current.style.display = 'none';
        setCurrentZone(null);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // helpers already defined

  // === Navigation multi-page ===
  const handlePageNavigation = (direction: 'prev' | 'next') => {
    if (!convertedDocument) return;
    const newPage = direction === 'prev'
      ? Math.max(0, convertedDocument.currentPage - 1)
      : Math.min(convertedDocument.totalPages - 1, convertedDocument.currentPage + 1);
    const updatedDocument = { ...convertedDocument, currentPage: newPage };
    setConvertedDocument(updatedDocument);
    setBgSrc(updatedDocument.pages[newPage]);
    setZones([]);
    commitHistory([]);
  };

  const handlePageSelect = (pageIndex: number) => {
    if (!convertedDocument || pageIndex < 0 || pageIndex >= convertedDocument.totalPages) return;
    const updatedDocument = { ...convertedDocument, currentPage: pageIndex };
    setConvertedDocument(updatedDocument);
    setBgSrc(updatedDocument.pages[pageIndex]);
    setZones([]);
    commitHistory([]);
  };

  const handleClearDocument = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer le document ? Toutes les zones seront supprimées.')) {
      setBgSrc(null);
      setConvertedDocument(null);
      setZones([]);
      setHistory([[]]);
    }
  };

  const addZone = () => {
    if (!documentName.trim()) { showError('Veuillez saisir un nom pour le document.'); return; }
    if (!docType) { showError('Veuillez sélectionner le type de document.'); return; }
    if (docType === 'divers' && !providerCode.trim()) { showError('Veuillez indiquer le code prestataire pour les frais divers.'); return; }
    const img = imgRef.current;
    if (!img) { showError('Veuillez d\'abord charger une image.'); return; }

    const newZone: Zone = {
      id: Date.now(),
      top: 50,
      left: 50,
      width: lastSize.w,
      height: lastSize.h,
      code: '',
      locked: false,
      checked: false
    };

  setZones((prev: Zone[]) => { const nz = [...prev, newZone]; commitHistory(nz); return nz; });
    showSuccess('Nouvelle zone ajoutée !');
  };

  const addBarcodeZone = () => {
    if (!documentName.trim()) { showError('Veuillez saisir un nom pour le document.'); return; }
    if (!docType) { showError('Veuillez sélectionner le type de document.'); return; }
    if (docType === 'divers' && !providerCode.trim()) { showError('Veuillez indiquer le code prestataire pour les frais divers.'); return; }
    const img = imgRef.current;
    if (!img) { showError('Veuillez d\'abord charger une image.'); return; }

    const newZone: Zone = {
      id: Date.now(),
      top: 80,
      left: 80,
      width: Math.max(160, lastSize.w * 2),
      height: Math.max(50, lastSize.h),
      code: '',
      locked: false,
      checked: false,
      isBarcode: true,
    };
    setZones((prev: Zone[]) => { const nz = [...prev, newZone]; commitHistory(nz); return nz; });
    showSuccess('Zone code-barres ajoutée.');
  };

  // === Détection auto (inchangée) ===
  // detection logic moved to utils/autoDetection

  const { previewBox, setPreviewBox, handleMouseMove: handleAutoDetectionMouseMove, handleClick: handleAutoDetectionClick } = useAutoDetection({
    autoDetectionMode,
    imgRef,
    containerRef,
    bgSrc,
    zones,
    setZones,
    commitHistory,
    showError,
  showSuccess,
  });

  // ---- Ajout manuel via clic droit (inchangé)
  const handleAddZoneWithContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!docType) { showError('Veuillez sélectionner le type de document.'); return; }
    const img = imgRef.current;
    if (!img) return;

    let maxAvailableLeft = 0;
    let maxAvailableRight = img.naturalWidth || img.clientWidth;
    let maxAvailableTop = 0;
    let maxAvailableBottom = img.naturalHeight || img.clientHeight;
    const rect = img.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const scaledLeft = (clickX / rect.width) * (img.naturalWidth || rect.width);
    const scaledTop = (clickY / rect.height) * (img.naturalHeight || rect.height);

    const { w: defaultWidth, h: defaultHeight } = lastSize;
    const imgWidth = img.naturalWidth || rect.width;
    const imgHeight = img.naturalHeight || rect.height;
    const minZoneWidth = imgWidth * 0.008 || 5;
    const minZoneHeight = imgHeight * 0.004 || 5;

    zones.forEach(z => {
      if (z.left >= scaledLeft && scaledTop < z.top + z.height && scaledTop + defaultHeight > z.top) {
        maxAvailableRight = Math.min(maxAvailableRight, z.left);
      }
      if (z.top >= scaledTop && scaledLeft < z.left + z.width && scaledLeft + defaultWidth > z.left) {
        maxAvailableBottom = Math.min(maxAvailableBottom, z.top);
      }
      if (z.left + z.width <= scaledLeft && scaledTop < z.top + z.height && scaledTop + defaultHeight > z.top) {
        maxAvailableLeft = Math.max(maxAvailableLeft, z.left + z.width);
      }
      if (z.top + z.height <= scaledTop && scaledLeft < z.left + z.width && scaledLeft + defaultWidth > z.left) {
        maxAvailableTop = Math.max(maxAvailableTop, z.top + z.height);
      }
    });

    const realAvailableWidth = maxAvailableRight - scaledLeft;
    const realAvailableHeight = maxAvailableBottom - scaledTop;

    const adjustedWidth = Math.max(minZoneWidth, Math.min(defaultWidth, realAvailableWidth));
    const adjustedHeight = Math.max(minZoneHeight, Math.min(defaultHeight, realAvailableHeight));

    const newZone: Zone = {
      id: Date.now(),
      top: scaledTop,
      left: scaledLeft,
      width: adjustedWidth,
      height: adjustedHeight,
      code: '',
      locked: false,
      checked: false
    };

    if (newZone.left + newZone.width > imgWidth) newZone.left = Math.max(0, imgWidth - newZone.width);
    if (newZone.top + newZone.height > imgHeight) newZone.top = Math.max(0, imgHeight - newZone.height);

    const overlap = zones.some(z => zonesOverlap(z, newZone));
    if (overlap) { showError('Impossible de créer une zone de cette taille à cet endroit : elle chevauche une zone existante.'); return; }

  setZones((prev: Zone[]) => { const nz = [...prev, newZone]; commitHistory(nz); return nz; });

    setLastSize({ w: adjustedWidth, h: adjustedHeight });
    showSuccess('Nouvelle zone ajoutée !');
  };

  // ---- UPDATE/MOVE/RESIZE (anti-chevauchement conservé, aucun snap)
  const updateZone = (id: number, props: Partial<Zone>) => {
    updateZoneBase(id, props, () => showError('Superposition interdite : la zone recoupe une autre zone !'));
  if (currentZone?.id === id) setCurrentZone((prev: Zone | null) => prev ? { ...prev, ...props } : null);
  };

  // ===== DRAG ULTRA-FLUIDE (DOM transform + vérif collision uniquement au mouseup)
  const onDragStart = (e: React.MouseEvent, zone: Zone) => {
    if (e.button !== 0 || zone.locked) return;
    e.stopPropagation();
    e.preventDefault();
    if (menuRef.current) { menuRef.current.style.display = 'none'; setCurrentZone(null); }

    const img = imgRef.current;
    if (!img) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const original = { top: zone.top, left: zone.left };

    // Limites pré-calculées
    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;
    const minLeft = 0;
    const maxLeft = imgW - zone.width;
    const minTop = 0;
    const maxTop = imgH - zone.height;

    // Snapshot des autres zones (pas de re-lecture à chaque frame)
    const others = zonesRef.current;

    // Dernière position non-collidante (en pixels image)
    let lastValid = { top: original.top, left: original.left };

    const zoneEl = document.querySelector(`[data-zone-id="${zone.id}"]`) as HTMLElement | null;

    const onMouseMove = (ev: MouseEvent) => {
      // calculs en pixels image, pas de setState ici
      const deltaX = (ev.clientX - startX) / scale;
      const deltaY = (ev.clientY - startY) / scale;

      let candTop = Math.max(minTop, Math.min(maxTop, original.top + deltaY));
      let candLeft = Math.max(minLeft, Math.min(maxLeft, original.left + deltaX));

      // si pas de collision -> on mémorise la dernière position OK
      const candidate: Zone = { ...zone, top: candTop, left: candLeft };
  const collides = others.some((o: Zone) => o.id !== zone.id && zonesOverlap(candidate, o));
      if (!collides) lastValid = { top: candTop, left: candLeft };

      // feedback visuel immédiat
      if (zoneEl) {
        zoneEl.style.transform = `translate(${(candLeft - zone.left) * scale}px, ${(candTop - zone.top) * scale}px)`;
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      // reset transform et commit de la position finale (anti-chevauchement respecté via lastValid)
      if (zoneEl) zoneEl.style.transform = '';

      setZones((prev: Zone[]) => {
        const updated = prev.map((z: Zone) => z.id === zone.id ? { ...z, top: lastValid.top, left: lastValid.left } : z);
        commitHistory(updated);
        return updated;
      });
    };

    document.addEventListener('mousemove', onMouseMove, { passive: false });
    document.addEventListener('mouseup', onMouseUp);
  };

  // Resize (on garde la vérif collision en live, si besoin on pourra aussi l’alléger)
  const onResizeStart = (e: React.MouseEvent, zone: Zone, direction: string) => {
    if (e.button !== 0 || zone.locked) return;
    e.stopPropagation();
    e.preventDefault();
    if (menuRef.current) { menuRef.current.style.display = 'none'; setCurrentZone(null); }

    const startX = e.clientX, startY = e.clientY;
    const original = { top: zone.top, left: zone.left, width: zone.width, height: zone.height };

    const onMouseMove = (ev: MouseEvent) => {
      const img = imgRef.current;
      if (!img) return;

      const deltaX = (ev.clientX - startX) / scale;
      const deltaY = (ev.clientY - startY) / scale;

      let newProps: Partial<Zone> = {};
      switch (direction) {
        case 'n': newProps.top = Math.max(0, original.top + deltaY); newProps.height = Math.max(1, original.height - deltaY); break;
        case 's': newProps.height = Math.max(1, original.height + deltaY); break;
        case 'e': newProps.width = Math.max(1, original.width + deltaX); break;
        case 'w': newProps.left = Math.max(0, original.left + deltaX); newProps.width = Math.max(1, original.width - deltaX); break;
        case 'ne': newProps.top = Math.max(0, original.top + deltaY); newProps.height = Math.max(1, original.height - deltaY); newProps.width = Math.max(1, original.width + deltaX); break;
        case 'nw': newProps.top = Math.max(0, original.top + deltaY); newProps.left = Math.max(0, original.left + deltaX); newProps.height = Math.max(1, original.height - deltaY); newProps.width = Math.max(1, original.width - deltaX); break;
        case 'se': newProps.height = Math.max(1, original.height + deltaY); newProps.width = Math.max(1, original.width + deltaX); break;
        case 'sw': newProps.left = Math.max(0, original.left + deltaX); newProps.height = Math.max(1, original.height + deltaY); newProps.width = Math.max(1, original.width - deltaX); break;
      }

      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;
      const left = newProps.left ?? original.left;
      const top  = newProps.top  ?? original.top;

      if (newProps.width !== undefined)  newProps.width  = Math.min(newProps.width,  Math.max(1, imgW - left));
      if (newProps.height !== undefined) newProps.height = Math.min(newProps.height, Math.max(1, imgH - top));

      updateZone(zone.id, newProps);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
  commitHistory();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleCopySize = (zone: Zone) => {
    setCopiedSize({ width: zone.width, height: zone.height });
    showSuccess(`Taille copiée: ${Math.round(zone.width)}×${Math.round(zone.height)}px`);
  };

  const handlePasteSize = (zone: Zone) => {
    if (copiedSize) {
      updateZone(zone.id, copiedSize);
      commitHistory();
      showSuccess(`Taille appliquée: ${Math.round(copiedSize.width)}×${Math.round(copiedSize.height)}px`);
    }
  };

  const onContextMenu = (e: React.MouseEvent, zone: Zone) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentZone(zone);
    const menu = menuRef.current;
    if (menu) {
      const x = e.clientX, y = e.clientY, menuWidth = 260, menuHeight = 320, offset = 10;
      let menuX = x + offset, menuY = y + offset;
      if (menuX + menuWidth > window.innerWidth) menuX = x - menuWidth - offset;
      if (menuY + menuHeight > window.innerHeight) menuY = window.innerHeight - menuHeight - offset;
      if (menuX < offset) menuX = offset;
      if (menuY < offset) menuY = offset;
      menu.style.display = 'block';
      menu.style.position = 'fixed';
      menu.style.left = menuX + 'px';
      menu.style.top = menuY + 'px';
      menu.style.zIndex = '10001';
    }
  };

  const exportJSON = () => {
    if (zones.length === 0) { showError('Aucune zone à exporter.'); return; }
    const pageWidth = imgRef.current?.naturalWidth || null;
    const pageHeight = imgRef.current?.naturalHeight || null;
    const output = {
      documentName,
      docType,
      providerCode: docType === 'divers' ? providerCode : null,
      zones,
      convertedDocument,
      pageWidth,
      pageHeight,
      coordUnit: 'px' as const,
      backgroundImage: bgSrc
    };
    const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ====== NOUVEAU: Canvas de référence (si besoin d’un HTMLCanvas côté Scan2Overlay) ======
  // getTemplateCanvas removed (unused)

  // ====== NOUVEAU: Export “modèle pour Scan2Overlay” ======
  const exportScanTemplate = async () => {
    const img = imgRef.current;
    if (!img || !bgSrc) { showError('Aucune page active à exporter.'); return; }

    const baseW = img.naturalWidth;
    const baseH = img.naturalHeight;

    const payload = {
      kind: 'ScanTemplate',
      version: 1,
      name: documentName || 'Feuille sans titre',
      pageIndex: convertedDocument?.currentPage ?? 0,
      pageWidth: baseW,
      pageHeight: baseH,
      coordUnit: 'px' as const,
      backgroundImage: bgSrc,         // dataURL de la page courante
      zonesPx: zones,                 // zones telles qu’éditees (px)
      zonesPct: zonesToPercent(zones, baseW, baseH), // mêmes zones en %
    };

    try {
      // Copie presse-papiers (utile pour coller direct dans Scan2Overlay)
      await navigator.clipboard.writeText(JSON.stringify(payload));
      showSuccess('Modèle copié dans le presse-papiers.');

      // Téléchargement JSON
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (documentName || 'modele').replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `${safeName}_page${payload.pageIndex}_scan-template.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showError('Impossible de copier le modèle. Le téléchargement a été lancé.');
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (documentName || 'modele').replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `${safeName}_page${payload.pageIndex}_scan-template.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const saveDocumentHandler = () => {
    if (!documentName.trim()) { showError('Veuillez saisir un nom pour le document.'); return; }
    if (!docType) { showError('Veuillez sélectionner le type de document.'); return; }
    if (docType === 'divers' && !providerCode.trim()) { showError('Veuillez indiquer le code prestataire pour les frais divers.'); return; }

    const baseW = imgRef.current?.naturalWidth || 0;
    const baseH = imgRef.current?.naturalHeight || 0;

    const documentData = {
      name: documentName,
      docType,
      providerCode: docType === 'divers' ? providerCode : null,
      zones, // en pixels
      backgroundImage: bgSrc,
      convertedDocument,
      createdBy: user.id,
      // dimensions de référence + unité
      pageWidth: baseW,
      pageHeight: baseH,
      coordUnit: 'px' as const,
    };

    try {
      if (editingDocument) {
        updateDocument(editingDocument.id, documentData);
        showSuccess('Document mis à jour avec succès !');
      } else {
        saveDocument(documentData);
        showSuccess('Document sauvegardé avec succès !');
      }
    } catch (error) {
      showError('Erreur lors de la sauvegarde du document.');
    }
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isSupportedFileType(file)) {
      showError(`Type de fichier non supporté: ${getFileTypeDescription(file)}. Formats acceptés: PDF, Word (.docx), images (JPG, PNG, GIF, BMP, WebP)`);
      return;
    }
    setIsConverting(true);
    setConversionProgress({ stage: 'reading', progress: 0, message: 'Préparation...' });
    try {
      const converted = await convertDocumentToImages(file, setConversionProgress);
      setConvertedDocument(converted);
      setBgSrc(converted.pages[0]);
      setZones([]);
      commitHistory([]);
      showSuccess(`Document converti avec succès ! ${converted.totalPages} page(s) disponible(s).`);
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      showError(error instanceof Error ? error.message : 'Erreur lors de la conversion du document.');
    } finally {
      setIsConverting(false);
      setConversionProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ===== Render =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-4 flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {editingDocument ? 'Modifier la feuille' : 'Créateur de Feuilles Interactives'}
          </h1>

          {/* Nouveau: Export modèle pour Scan2Overlay */}
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            onClick={exportScanTemplate}
            title="Exporter un modèle JSON prêt pour Scan2Overlay (copié dans le presse-papiers et téléchargé)."
          >
            <Download className="w-4 h-4" />
            Exporter modèle Scan2Overlay
          </button>

          <button
            type="button"
            className="ml-auto inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            onClick={onBack}
          >
            Retour
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Layout */}
        <div className="flex gap-6">
          <aside className="w-80 shrink-0">
            <div className="sticky top-4 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto overflow-x-hidden pr-1">
              <div className="bg-white rounded-lg shadow p-3">
                <Toolbar
                  documentName={documentName}
                  setDocumentName={setDocumentName}
                  docType={docType}
                  setDocType={setDocType}
                  providerCode={providerCode}
                  setProviderCode={setProviderCode}
                  zones={zones}
                  onAddZone={addZone}
                  onSaveDocument={saveDocumentHandler}
                  onUpload={onUpload}
                  autoDetectionMode={autoDetectionMode}
                  setAutoDetectionMode={setAutoDetectionMode}
                  isProcessing={false}
                  bgSrc={bgSrc}
                  convertedDocument={convertedDocument}
                  isConverting={isConverting}
                  conversionProgress={conversionProgress}
                  onPageNavigation={handlePageNavigation}
                  onPageSelect={handlePageSelect}
                  onClearDocument={handleClearDocument}
                  // Bonus: export JSON "éditeur"
                  onExportJSON={exportJSON}
                  onAddBarcodeZone={addBarcodeZone}
                />
              </div>
              <div className="bg-white rounded-lg shadow p-3">
                <Legend />
              </div>
            </div>
          </aside>

          <main className="flex-1">
            {autoDetectionMode && (
              <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5" />
                  <strong>Mode détection automatique activé</strong>
                </div>
                <p className="text-sm">
                  Cliquez au centre d'une case bien délimitée pour créer automatiquement une zone (l'algorithme détecte les bordures, ignore le texte).
                </p>
              </div>
            )}

            {/* Conteneur éditeur */}
            <div className="relative select-none">
              <div
                ref={containerRef}
                className={`editor-container a4-container relative mx-auto bg-white rounded-lg shadow-lg overflow-hidden ${autoDetectionMode ? 'cursor-crosshair' : ''}`}
                style={{
                  minHeight: '500px',
                  maxWidth: '1000px',
                  position: 'relative',
                  display: 'inline-block',
                  padding: 0,
                  margin: 0,
                  lineHeight: 0
                }}
                onMouseLeave={() => setPreviewBox(null)}
                onClick={autoDetectionMode ? handleAutoDetectionClick : undefined}
                onMouseMove={autoDetectionMode ? handleAutoDetectionMouseMove : undefined}
                onContextMenu={handleAddZoneWithContextMenu}
              >
                {bgSrc ? (
                  <>
                    <img
                      ref={imgRef}
                      src={bgSrc}
                      alt="Document background"
                      className="block"
                      draggable={false}
                      style={{
                        display: 'block',
                        verticalAlign: 'top',
                        width: 'auto',
                        maxWidth: '100%',
                        height: 'auto',
                        margin: 0,
                        padding: 0,
                        lineHeight: 0
                      }}
                    />
                    {/* Preview Box */}
                    {autoDetectionMode && previewBox && imgRef.current && (
                      <div
                        className="absolute bg-blue-500 opacity-30 border-2 border-blue-700 pointer-events-none"
                        style={{
                          top: `${(previewBox.top / (imgRef.current.naturalHeight || 1)) * imgRef.current.clientHeight}px`,
                          left: `${(previewBox.left / (imgRef.current.naturalWidth || 1)) * imgRef.current.clientWidth}px`,
                          width: `${(previewBox.width / (imgRef.current.naturalWidth || 1)) * imgRef.current.clientWidth}px`,
                          height: `${(previewBox.height / (imgRef.current.naturalHeight || 1)) * imgRef.current.clientHeight}px`,
                        }}
                      />
                    )}
                    {zones.map(zone => (
                      <ZoneComponent
                        key={zone.id}
                        className="opacity-50"
                        zone={zone}
                        scale={scale}
                        onMouseDown={onDragStart}
                        onContextMenu={onContextMenu}
                        onResizeStart={onResizeStart}
                      />
                    ))}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[500px] text-gray-500">
                    <div className="text-center">
                      <FileImage className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">Aucun document chargé</p>
                      <p className="text-sm">Cliquez sur "Charger document" pour commencer</p>
                      <p className="text-xs text-gray-400 mt-2">
                        Formats supportés: PDF, Word (.docx), Images (JPG, PNG, GIF, BMP, WebP)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Context Menu */}
      {currentZone && (
        <ContextMenu
          zone={currentZone}
          menuRef={menuRef}
          copiedSize={copiedSize}
          onCopySize={handleCopySize}
          onPasteSize={handlePasteSize}
          onUpdateZone={updateZone}
          onDeleteZone={deleteZone}
          containerRef={containerRef}
          scale={scale}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
        onChange={onUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
}
