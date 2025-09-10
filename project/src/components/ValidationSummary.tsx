import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Zone } from '../types';

interface ValidationSummaryProps {
  zones: Zone[];
  isOpen: boolean;
  onClose: () => void;
  onFocusZone: (zoneId: number) => void;
}

export default function ValidationSummary({ zones, isOpen, onClose, onFocusZone }: ValidationSummaryProps) {
  if (!isOpen) return null;

  const incompleteZones = zones.filter(zone => !zone.code.trim());
  const completeZones = zones.filter(zone => zone.code.trim());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            {incompleteZones.length > 0 ? (
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            ) : (
              <CheckCircle className="w-6 h-6 text-green-600" />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {incompleteZones.length > 0 ? 'Validation incomplète' : 'Feuille validée'}
              </h2>
              <p className="text-sm text-gray-600">
                {zones.length} zone(s) au total
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[60vh]">
          {/* Zones incomplètes */}
          {incompleteZones.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Zones incomplètes ({incompleteZones.length})
              </h3>
              <div className="space-y-2">
                {incompleteZones.map((zone, index) => (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                  >
                    <div>
                      <span className="font-medium text-orange-900">Zone #{index + 1}</span>
                      <p className="text-sm text-orange-700">Code manquant</p>
                    </div>
                    <button
                      onClick={() => {
                        onFocusZone(zone.id);
                        onClose();
                      }}
                      className="px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm"
                    >
                      Localiser
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Zones complètes */}
          {completeZones.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Zones complètes ({completeZones.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {completeZones.map((zone, index) => (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div>
                      <span className="font-medium text-green-900">Zone #{index + 1}</span>
                      <p className="text-sm text-green-700">Code: {zone.code}</p>
                    </div>
                    <button
                      onClick={() => {
                        onFocusZone(zone.id);
                        onClose();
                      }}
                      className="px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs"
                    >
                      Voir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {incompleteZones.length > 0 ? (
                <span className="text-orange-600">
                  <strong>{incompleteZones.length}</strong> zone(s) à compléter
                </span>
              ) : (
                <span className="text-green-600">
                  ✅ Toutes les zones sont complètes
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}