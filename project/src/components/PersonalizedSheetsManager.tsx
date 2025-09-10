import React, { useState, useEffect, useCallback } from 'react';
import { X, Edit, Trash2, Settings, Star, Eye, Play } from 'lucide-react';
import { SavedDocument, UserSheetCustomization, Patient } from '../types';
import { 
  getUserSheetCustomizations,
  deleteUserSheetCustomization
} from '../utils/userPreferences';
import { getDocuments } from '../utils/database';
import SheetCustomizationModal from './SheetCustomizationModal';
import DocumentPreview from './DocumentPreview';
import PatientSearch from './PatientSearch';

interface PersonalizedSheetsManagerProps {
  userId: string;
  onClose: () => void;
  onCustomizationUpdated: () => void;
  onStartEncoding?: (document: SavedDocument) => void;
  onStartEncodingWithPatient?: (document: SavedDocument, patient: Patient) => void;
}

export default function PersonalizedSheetsManager({ 
  userId, 
  onClose, 
  onCustomizationUpdated,
  onStartEncoding,
  onStartEncodingWithPatient
}: PersonalizedSheetsManagerProps) {
  const [customizations, setCustomizations] = useState<UserSheetCustomization[]>([]);
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [showCustomization, setShowCustomization] = useState(false);
  const [editingCustomization, setEditingCustomization] = useState<UserSheetCustomization | null>(null);
  const [editingDocument, setEditingDocument] = useState<SavedDocument | null>(null);
  const [previewDocument, setPreviewDocument] = useState<SavedDocument | null>(null);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [selectedCustomizationForEncoding, setSelectedCustomizationForEncoding] = useState<UserSheetCustomization | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadData = () => {
    const userCustomizations = getUserSheetCustomizations(userId);
    const allDocuments = getDocuments();
    setCustomizations(userCustomizations);
    setDocuments(allDocuments);
  };

  // Helper: normalise string/number pour éviter les find() qui échouent
  const findDocById = useCallback(
    (documentId: string | number) => documents.find(d => String(d.id) === String(documentId)) || null,
    [documents]
  );

  const alertDocMissing = (context: string, docId: string | number) => {
    console.warn(`[${context}] Document introuvable:`, docId);
    alert("Le document source est introuvable ou a été supprimé.");
  };

  const handleStartEncoding = (customization: UserSheetCustomization) => {
    const document = findDocById(customization.documentId);
    if (!document) return alertDocMissing('Encoder', customization.documentId);

    // Si on a un flux avec patient, ouvrir la recherche; sinon, fallback direct
    if (onStartEncodingWithPatient) {
      setSelectedCustomizationForEncoding(customization);
      setShowPatientSearch(true);
    } else if (onStartEncoding) {
      onStartEncoding(document);
      onClose();
    } else {
      alert("Aucun gestionnaire d'encodage n'est configuré.");
    }
  };

  const handleEditCustomization = (customization: UserSheetCustomization) => {
    const document = findDocById(customization.documentId);
    if (!document) return alertDocMissing('Modifier', customization.documentId);

    setEditingCustomization(customization);
    setEditingDocument(document);
    setShowCustomization(true);
  };

  const handleDeleteCustomization = (customization: UserSheetCustomization) => {
    if (confirm(`Supprimer la personnalisation "${customization.name}" ?`)) {
      deleteUserSheetCustomization(customization.id);
      loadData();
      onCustomizationUpdated();
    }
  };

  const handlePreviewDocument = (customization: UserSheetCustomization) => {
    const document = findDocById(customization.documentId);
    if (!document) return alertDocMissing('Aperçu', customization.documentId);
    setPreviewDocument(document);
  };

  const handleCustomizationSaved = () => {
    setShowCustomization(false);
    setEditingCustomization(null);
    setEditingDocument(null);
    loadData();
    onCustomizationUpdated();
  };

  const getDocumentName = (documentId: string | number) => {
    const doc = findDocById(documentId);
    return doc?.name || 'Document supprimé';
  };

  const getDocumentType = (documentId: string | number) => {
    const doc = findDocById(documentId);
    return (doc?.docType as string) || 'unknown';
  };

  const getCheckedCount = (customization: UserSheetCustomization) => {
    const zones = customization.preCheckedZones || {};
    return Object.values(zones).filter(Boolean).length;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[50] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Mes feuilles personnalisées</h2>
              <p className="text-sm text-gray-600">
                Gérez vos personnalisations de feuilles ({customizations.length} feuille(s))
              </p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            onClick={onClose}
          >
            Retour
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[70vh]">
          {customizations.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune feuille personnalisée
              </h3>
              <p className="text-gray-600 mb-6">
                Vous n'avez pas encore personnalisé de feuilles. Commencez par personnaliser une feuille depuis le tableau de bord.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Retour au tableau de bord
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {customizations.map((customization) => {
                const docExists = !!findDocById(customization.documentId);
                const disabledCls = docExists ? '' : 'opacity-50 pointer-events-none';
                return (
                  <div key={customization.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 truncate">{customization.name}</h3>
                          {customization.isDefault && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          Basé sur: {getDocumentName(customization.documentId)}
                        </p>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            getDocumentType(customization.documentId) === 'divers' 
                              ? 'bg-orange-100 text-orange-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {getDocumentType(customization.documentId) === 'divers' ? 'Frais divers' : 'Prestations'}
                          </span>
                          
                          {customization.isDefault && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Par défaut
                            </span>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>{getCheckedCount(customization)} zone(s) pré-cochée(s)</div>
                          {customization.defaultProvider && (
                            <div>Prestataire: {customization.defaultProvider}</div>
                          )}
                          <div>Créé le {new Date(customization.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePreviewDocument(customization)}
                        disabled={!docExists}
                        className={`flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm flex-1 ${disabledCls}`}
                      >
                        <Eye className="w-4 h-4" />
                        Aperçu
                      </button>
                      
                      <button
                        onClick={() => handleStartEncoding(customization)}
                        disabled={!docExists}
                        className={`flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm ${disabledCls}`}
                      >
                        <Play className="w-4 h-4" />
                        Encoder
                      </button>
                      
                      <button
                        onClick={() => handleEditCustomization(customization)}
                        disabled={!docExists}
                        className={`flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm ${disabledCls}`}
                      >
                        <Edit className="w-4 h-4" />
                        Modifier
                      </button>
                      
                      <button
                        onClick={() => handleDeleteCustomization(customization)}
                        className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {customizations.length} personnalisation(s) • {customizations.filter(c => c.isDefault).length} par défaut
            </div>
          </div>
        </div>
      </div>

      {/* Modal de personnalisation */}
      {showCustomization && editingDocument && (
        <SheetCustomizationModal
          document={editingDocument}
          userId={userId}
          onClose={() => {
            setShowCustomization(false);
            setEditingCustomization(null);
            setEditingDocument(null);
          }}
          onSaved={handleCustomizationSaved}
          existingCustomization={editingCustomization}
        />
      )}

      {/* Modal de recherche de patient */}
      {showPatientSearch && selectedCustomizationForEncoding && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Play className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Encoder avec: {selectedCustomizationForEncoding.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Recherchez et sélectionnez un patient pour commencer l'encodage
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPatientSearch(false);
                  setSelectedCustomizationForEncoding(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-900 mb-2">Rechercher un patient</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Tapez le nom, prénom, chambre ou NISS du patient
                </p>
              </div>
              
              <PatientSearch
                onSelectPatient={(patient) => {
                  const docId = selectedCustomizationForEncoding.documentId;
                  const document = findDocById(docId);
                  if (!document) {
                    alertDocMissing('Encoding/SelectPatient', docId);
                  } else if (onStartEncodingWithPatient) {
                    onStartEncodingWithPatient(document, patient);
                  } else if (onStartEncoding) {
                    onStartEncoding(document);
                  } else {
                    alert("Aucun gestionnaire d'encodage n'est configuré.");
                  }
                  setShowPatientSearch(false);
                  setSelectedCustomizationForEncoding(null);
                  onClose();
                }}
                className="mb-6"
              />
            </div>
            {/* Footer */}
            <div className="p-6 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Personnalisation: <strong>{selectedCustomizationForEncoding.name}</strong>
                </div>
                <button
                  onClick={() => {
                    setShowPatientSearch(false);
                    setSelectedCustomizationForEncoding(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale d'aperçu unique */}
      {previewDocument && (
        <DocumentPreview
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
          userRole="user"
        />
      )}
    </div>
  );
}
