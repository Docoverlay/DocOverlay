import React, { useState, useEffect } from 'react';
import { X, Save, Settings, Star, Eye, EyeOff, Zap, CheckCircle } from 'lucide-react';
import { SavedDocument, Zone, UserSheetCustomization } from '../types';
import { 
  saveUserSheetCustomization, 
  updateUserSheetCustomization
} from '../utils/userPreferences';

interface SheetCustomizationModalProps {
  document: SavedDocument;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
  existingCustomization?: UserSheetCustomization | null;
}

export default function SheetCustomizationModal({ 
  document, 
  userId, 
  onClose, 
  onSaved,
  existingCustomization 
}: SheetCustomizationModalProps) {
  const [customizationName, setCustomizationName] = useState(
    existingCustomization?.name || `${document.name} - Personnalisé`
  );
  const [prefilledZones, setPrefilledZones] = useState<{ [zoneId: number]: string }>(
    existingCustomization?.prefilledZones || {}
  );
  const [preCheckedZones, setPreCheckedZones] = useState<{ [zoneId: number]: boolean }>(
    existingCustomization?.preCheckedZones || {}
  );
  const [defaultProvider, setDefaultProvider] = useState(
    existingCustomization?.defaultProvider || ''
  );
  const [isDefault, setIsDefault] = useState(
    existingCustomization?.isDefault || false
  );
  const [showPreview, setShowPreview] = useState(true);


  const handleZoneCheckChange = (zoneId: number, checked: boolean) => {
    setPreCheckedZones(prev => ({
      ...prev,
      [zoneId]: checked
    }));
  };

  const handleSave = () => {
    const customizationData = {
      userId,
      documentId: document.id,
      name: customizationName,
      prefilledZones: {}, // Les codes ne sont plus modifiables
      preCheckedZones,
      defaultProvider: defaultProvider || undefined,
      isDefault
    };

    if (existingCustomization) {
      updateUserSheetCustomization(existingCustomization.id, customizationData);
    } else {
      saveUserSheetCustomization(customizationData);
    }

    onSaved();
  };

  const getZonePreview = (zone: Zone) => {
    const isChecked = preCheckedZones[zone.id] || false;
    const code = prefilledZones[zone.id] || zone.code || '';
    
    return {
      ...zone,
      checked: isChecked,
      code: code
    };
  };

  const getZoneColor = (zone: Zone) => {
    const preview = getZonePreview(zone);
    if (preview.checked && preview.code) return 'bg-green-200 border-green-500';
    if (preview.checked) return 'bg-blue-200 border-blue-500';
    if (preview.code) return 'bg-gray-200 border-gray-400';
    return 'bg-red-200 border-red-400';
  };

  const checkedCount = Object.values(preCheckedZones).filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {existingCustomization ? 'Modifier' : 'Personnaliser'} - {document.name}
              </h2>
              <p className="text-sm text-gray-600">
                Configurez vos valeurs par défaut pour cette feuille
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                showPreview 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Masquer aperçu' : 'Aperçu'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[70vh]">
          {/* Configuration Panel */}
          <div className="w-1/2 p-6 overflow-auto border-r">
            <div className="space-y-6">
              {/* Nom de la personnalisation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la personnalisation
                </label>
                <input
                  type="text"
                  value={customizationName}
                  onChange={(e) => setCustomizationName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Prestataire par défaut */}
              {document.docType === 'prestations' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prestataire par défaut
                  </label>
                  <input
                    type="text"
                    value={defaultProvider}
                    onChange={(e) => setDefaultProvider(e.target.value)}
                    placeholder="Ex: Dr. Martin, 123456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Option par défaut */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
                  Utiliser comme personnalisation par défaut pour cette feuille
                </label>
              </div>

              {/* Statistiques */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Résumé de la personnalisation
                </h4>
                <div className="text-sm">
                  <div>
                    <span className="font-medium text-blue-800">Zones pré-cochées:</span>
                    <div className="text-blue-700">{checkedCount} zone(s)</div>
                  </div>
                </div>
              </div>

              {/* Configuration des zones */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Configuration des zones</h4>
                <div className="space-y-4">
                  {document.zones.map((zone) => (
                    <div key={zone.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">Zone #{zone.id}</h5>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preCheckedZones[zone.id] || false}
                            onChange={(e) => handleZoneCheckChange(zone.id, e.target.checked)}
                            className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <span className="text-sm font-medium text-gray-700">Pré-cocher</span>
                        </label>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Code de prestation (lecture seule)
                        </label>
                        <input
                          type="text"
                          value={zone.code || 'Aucun code défini'}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Les codes sont définis par l'administrateur et ne peuvent pas être modifiés
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="w-1/2 p-6 overflow-auto bg-gray-50">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Aperçu de la feuille personnalisée
              </h4>
              
              <div className="relative bg-white rounded-lg shadow-sm border">
                {document.backgroundImage ? (
                  <div className="relative">
                    <img 
                      src={document.backgroundImage} 
                      alt="Document background" 
                      className="w-full h-auto"
                    />
                    
                    {/* Zones overlay */}
                    {document.zones.map((zone) => {
                      const preview = getZonePreview(zone);
                      return (
                        <div
                          key={zone.id}
                          className={`absolute border-2 opacity-80 flex items-center justify-center ${getZoneColor(zone)}`}
                          style={{
                            top: `${(zone.top / (document.backgroundImage ? 1000 : 500)) * 100}%`,
                            left: `${(zone.left / (document.backgroundImage ? 800 : 400)) * 100}%`,
                            width: `${(zone.width / (document.backgroundImage ? 800 : 400)) * 100}%`,
                            height: `${(zone.height / (document.backgroundImage ? 1000 : 500)) * 100}%`,
                          }}
                        >
                          {preview.checked && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                          {preview.code && (
                            <span className="text-xs font-medium bg-white/90 px-1 rounded">
                              {preview.code}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p>Aucune image de fond disponible</p>
                    <p className="text-sm mt-2">La personnalisation sera appliquée aux zones</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {checkedCount} zone(s) pré-cochée(s)
              {isDefault && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Star className="w-3 h-3 mr-1" />
                  Par défaut
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={!customizationName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {existingCustomization ? 'Mettre à jour' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}