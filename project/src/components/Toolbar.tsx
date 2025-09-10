import React from 'react';
import { Plus, Upload, Save, Trash2, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Zone, DocType, ConvertedDocument } from '../types';

interface ToolbarProps {
  documentName: string;
  setDocumentName: (v: string) => void;

  docType: DocType;
  setDocType: (v: DocType) => void;

  providerCode?: string | null;
  setProviderCode: (v: string) => void;

  zones: Zone[];

  onAddZone: () => void;
  onSaveDocument: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;

  autoDetectionMode: boolean;
  setAutoDetectionMode: (v: boolean) => void;

  isProcessing: boolean;

  bgSrc: string | null;
  convertedDocument: ConvertedDocument | null;
  isConverting: boolean;
  conversionProgress: any;

  onPageNavigation: (dir: 'prev' | 'next') => void;
  onPageSelect: (pageIndex: number) => void;

  onClearDocument: () => void;
}

export default function Toolbar(props: ToolbarProps) {
  const {
    documentName, setDocumentName,
    docType, setDocType,
    providerCode, setProviderCode,
    zones,
    onAddZone, onSaveDocument, onUpload,
    autoDetectionMode, setAutoDetectionMode,
    isProcessing,
    bgSrc, convertedDocument, isConverting, conversionProgress,
    onPageNavigation, onPageSelect,
    onClearDocument
  } = props;

  const totalPages = convertedDocument?.totalPages ?? 0;
  const currentPage = convertedDocument?.currentPage ?? 0;

  return (
    <div className="w-full">
      {/* Nom du document */}
      <label className="block text-sm font-medium text-slate-700 mb-1">Nom du document</label>
      <input
        type="text"
        value={documentName}
        onChange={(e) => setDocumentName(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
        placeholder="Ex. Feuille de diététique"
      />

      {/* Type de document */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-slate-700 mb-1">Type de document</label>
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="doctype"
              checked={docType === 'divers'}
              onChange={() => setDocType('divers' as DocType)}
            />
            Divers
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="doctype"
              checked={docType === 'prestations' || docType === 'Prestations'}
              onChange={() => setDocType('prestations' as DocType)}
            />
            Prestations
          </label>
        </div>
      </div>

      {/* Code prestataire si divers */}
      {docType === 'divers' && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-slate-700 mb-1">Code prestataire (divers)</label>
          <input
            type="text"
            value={providerCode ?? ''}
            onChange={(e) => setProviderCode(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="Ex. 84561"
          />
        </div>
      )}

      {/* Actions en 2 colonnes */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Charger document */}
        <label className="col-span-1">
          <span className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
            <Upload className="w-4 h-4" />
            Charger
          </span>
          <input
            type="file"
            accept=".pdf,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
            onChange={onUpload}
            className="hidden"
          />
        </label>

        {/* Ajouter case */}
        <button
          type="button"
          onClick={onAddZone}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Ajouter case
        </button>

        {/* Détection auto (toggle) */}
        <button
          type="button"
          onClick={() => setAutoDetectionMode(!autoDetectionMode)}
          className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm
            ${autoDetectionMode ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
          disabled={isProcessing}
        >
          <Zap className="w-4 h-4" />
          Détection auto
        </button>

        {/* Sauvegarder */}
        <button
          type="button"
          onClick={onSaveDocument}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 text-white px-3 py-2 text-sm hover:bg-emerald-700"
        >
          <Save className="w-4 h-4" />
          Sauvegarder
        </button>

        {/* Effacer document */}
        <button
          type="button"
          onClick={onClearDocument}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 text-white px-3 py-2 text-sm hover:bg-red-700 col-span-2"
        >
          <Trash2 className="w-4 h-4" />
          Effacer le document
        </button>
      </div>

      {/* Navigation pages (compact) */}
      {convertedDocument && (
        <div className="flex items-center justify-between rounded-md border border-slate-200 px-2 py-2">
          <button
            type="button"
            onClick={() => onPageNavigation('prev')}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Préc.
          </button>

          <div className="text-xs text-slate-600">
            Page <span className="font-medium">{currentPage + 1}</span> / {totalPages}
          </div>

          <button
            type="button"
            onClick={() => onPageNavigation('next')}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            Suiv. <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
