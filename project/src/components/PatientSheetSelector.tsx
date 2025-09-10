import { useState } from 'react';
import { FileText, User, ArrowRight, Star, Settings } from 'lucide-react';
import { Patient, SavedDocument } from '../types';
import { getDocuments, getFavoriteDocuments } from '../utils/database';
import { getUserTemplates, getUserSheetCustomizations } from '../utils/userPreferences';

interface PatientSheetSelectorProps {
  patient: Patient;
  onSelectSheet: (patient: Patient, document: SavedDocument) => void;
  onBack: () => void;
  userId: string;
}

export default function PatientSheetSelector({ 
  patient, 
  onSelectSheet, 
  onBack, 
  userId 
}: PatientSheetSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  const allDocuments = getDocuments();
  const favoriteDocuments = getFavoriteDocuments(userId);
  const userTemplates = getUserTemplates(userId);
  const userCustomizations = getUserSheetCustomizations(userId);
  
  const filteredDocuments = allDocuments.filter(doc => {
    if (showFavoritesOnly && !favoriteDocuments.some(fav => fav.id === doc.id)) {
      return false;
    }
    if (selectedCategory && doc.categoryId !== selectedCategory) {
      return false;
    }
    return true;
  });

  // Trier par favoris d'abord
  const sortedDocuments = filteredDocuments.sort((a, b) => {
    const aIsFavorite = favoriteDocuments.some(fav => fav.id === a.id);
    const bIsFavorite = favoriteDocuments.some(fav => fav.id === b.id);
    
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleSheetSelect = (document: SavedDocument) => {
    onSelectSheet(patient, document);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Sélection de feuille pour {patient.firstName} {patient.name}
              </h2>
              <p className="text-sm text-gray-600">
                {patient.site} - {patient.floor} - Chambre {patient.room} - Lit {patient.bed}
              </p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            ← Retour
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showFavoritesOnly}
                onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Favoris uniquement</span>
            </label>
          </div>
        </div>

        {/* Templates personnalisés */}
        {userTemplates.length > 0 && (
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Mes templates personnalisés
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userTemplates.map((template) => {
                const baseDocument = allDocuments.find(doc => doc.id === template.documentId);
                if (!baseDocument) return null;
                
                return (
                  <button
                    key={template.id}
                    onClick={() => handleSheetSelect(baseDocument)}
                    className="p-4 border-2 border-purple-200 bg-purple-50 rounded-lg hover:border-purple-500 hover:bg-purple-100 transition-all text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-purple-900">{template.name}</h4>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-200 text-purple-800">
                        Template
                      </span>
                    </div>
                    <p className="text-sm text-purple-700 mb-2">
                      Basé sur: {baseDocument.name}
                    </p>
                    <p className="text-xs text-purple-600">
                      {Object.keys(template.prefilledZones).length} zone(s) pré-remplie(s)
                      {template.preCheckedZones && ` • ${Object.keys(template.preCheckedZones).length} zone(s) pré-cochée(s)`}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Feuilles personnalisées */}
        {userCustomizations.length > 0 && (
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Mes feuilles personnalisées
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userCustomizations.map((customization) => {
                const baseDocument = allDocuments.find(doc => doc.id === customization.documentId);
                if (!baseDocument) return null;
                
                const checkedCount = Object.values(customization.preCheckedZones).filter(Boolean).length;
                const prefilledCount = Object.values(customization.prefilledZones).filter(code => code.trim() !== '').length;
                
                return (
                  <button
                    key={customization.id}
                    onClick={() => handleSheetSelect(baseDocument)}
                    className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg hover:border-blue-500 hover:bg-blue-100 transition-all text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-blue-900">{customization.name}</h4>
                      <div className="flex items-center gap-1">
                        {customization.isDefault && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-200 text-blue-800">
                          Personnalisé
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-blue-700 mb-2">
                      Basé sur: {baseDocument.name}
                    </p>
                    <p className="text-xs text-blue-600">
                      {checkedCount} zone(s) pré-cochée(s) • {prefilledCount} code(s) pré-rempli(s)
                      {customization.defaultProvider && ` • Prestataire: ${customization.defaultProvider}`}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Documents disponibles */}
        <div className="p-6 overflow-auto max-h-[50vh]">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Feuilles disponibles ({sortedDocuments.length})
          </h3>
          
          {sortedDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Aucune feuille disponible</p>
              {showFavoritesOnly && (
                <button
                  onClick={() => setShowFavoritesOnly(false)}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Afficher toutes les feuilles
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedDocuments.map((doc) => {
                const isFavorite = favoriteDocuments.some(fav => fav.id === doc.id);
                
                return (
                  <button
                    key={doc.id}
                    onClick={() => handleSheetSelect(doc)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-900">
                        {doc.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        {isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        doc.docType === 'divers' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {doc.docType === 'divers' ? 'Frais divers' : 'Prestations'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600">
                      {doc.zones.length} zone(s) • Créé le {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Patient: <strong>{patient.firstName} {patient.name}</strong> • 
              NISS: <strong>{patient.socialSecurityNumber}</strong>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}