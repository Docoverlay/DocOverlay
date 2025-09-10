import React, { useState, useEffect } from 'react';
import { X, Star, Settings, Save, Building2, Layers, FileText, User as UserIcon, Search } from 'lucide-react';
import { User } from '../types';
import { getAllSites, getServiceName, WARD_ADM_IDS } from '../data/referenceData';
import { 
  getFavoriteDocuments, 
  getFavoriteSites, 
  getFavoriteFloors,
  getDefaultProviderCode,
  setDefaultProviderCode,
  saveUserPreference,
  removeUserPreference
} from '../utils/userPreferences';
import { getDocuments } from '../utils/database';

interface UserPreferencesModalProps {
  user: User;
  onClose: () => void;
  onPreferencesUpdated: () => void;
}

export default function UserPreferencesModal({ user, onClose, onPreferencesUpdated }: UserPreferencesModalProps) {
  const [favoriteDocuments, setFavoriteDocuments] = useState<string[]>([]);
  const [favoriteSites, setFavoriteSites] = useState<string[]>([]);
  const [favoriteFloors, setFavoriteFloors] = useState<string[]>([]);
  const [defaultProvider, setDefaultProvider] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');

  const documents = getDocuments();
  const sites = getAllSites();
  const allServices = Array.from(new Set(
    WARD_ADM_IDS.map(wardId => ({
      id: wardId,
      name: getServiceName(wardId)
    })).filter(service => service.name)
  )).sort((a, b) => a.name.localeCompare(b.name));

  // Filtrer les services selon le terme de recherche
  const filteredServices = allServices.filter(service =>
    service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
    service.id.toLowerCase().includes(serviceSearchTerm.toLowerCase())
  );

  useEffect(() => {
    setFavoriteDocuments(getFavoriteDocuments(user.id));
    setFavoriteSites(getFavoriteSites(user.id));
    setFavoriteFloors(getFavoriteFloors(user.id));
    setDefaultProvider(getDefaultProviderCode(user.id));
  }, [user.id]);

  const toggleFavoriteDocument = (documentId: string) => {
    const newFavorites = favoriteDocuments.includes(documentId)
      ? favoriteDocuments.filter(id => id !== documentId)
      : [...favoriteDocuments, documentId];
    
    setFavoriteDocuments(newFavorites);
    setHasChanges(true);
  };

  const toggleFavoriteSite = (site: string) => {
    const newFavorites = favoriteSites.includes(site)
      ? favoriteSites.filter(s => s !== site)
      : [...favoriteSites, site];
    
    setFavoriteSites(newFavorites);
    setHasChanges(true);
  };

  const toggleFavoriteFloor = (floor: string) => {
    const newFavorites = favoriteFloors.includes(floor)
      ? favoriteFloors.filter(f => f !== floor)
      : [...favoriteFloors, floor];
    
    setFavoriteFloors(newFavorites);
    setHasChanges(true);
  };

  const handleProviderChange = (value: string) => {
    setDefaultProvider(value);
    setHasChanges(true);
  };

  const savePreferences = () => {
    // Sauvegarder les documents favoris
    const currentFavDocs = getFavoriteDocuments(user.id);
    
    // Supprimer les anciens favoris
    currentFavDocs.forEach(docId => {
      if (!favoriteDocuments.includes(docId)) {
        removeUserPreference(user.id, 'favorite_document', docId);
      }
    });
    
    // Ajouter les nouveaux favoris
    favoriteDocuments.forEach(docId => {
      if (!currentFavDocs.includes(docId)) {
        saveUserPreference({
          userId: user.id,
          type: 'favorite_document',
          itemId: docId
        });
      }
    });

    // Sauvegarder les sites favoris
    const currentFavSites = getFavoriteSites(user.id);
    currentFavSites.forEach(site => {
      if (!favoriteSites.includes(site)) {
        removeUserPreference(user.id, 'favorite_site', site);
      }
    });
    favoriteSites.forEach(site => {
      if (!currentFavSites.includes(site)) {
        saveUserPreference({
          userId: user.id,
          type: 'favorite_site',
          itemId: site
        });
      }
    });

    // Sauvegarder les étages favoris
    const currentFavFloors = getFavoriteFloors(user.id);
    currentFavFloors.forEach(floor => {
      if (!favoriteFloors.includes(floor)) {
        removeUserPreference(user.id, 'favorite_floor', floor);
      }
    });
    favoriteFloors.forEach(floor => {
      if (!currentFavFloors.includes(floor)) {
        saveUserPreference({
          userId: user.id,
          type: 'favorite_floor',
          itemId: floor
        });
      }
    });

    // Sauvegarder le prestataire par défaut
    setDefaultProviderCode(user.id, defaultProvider);

    setHasChanges(false);
    onPreferencesUpdated();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Préférences utilisateur</h2>
              <p className="text-sm text-gray-600">Personnalisez votre expérience d'encodage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-auto max-h-[70vh]">
          {/* Code prestataire par défaut */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Code prestataire par défaut
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code prestataire (sera pré-rempli automatiquement)
              </label>
              <input
                type="text"
                value={defaultProvider}
                onChange={(e) => handleProviderChange(e.target.value)}
                placeholder="Ex: 123456"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-600 mt-2">
                Ce code sera automatiquement utilisé lors de l'encodage des prestations (modifiable à tout moment)
              </p>
            </div>
          </div>

          {/* Sites favoris */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Sites favoris
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {sites.map((site) => (
                <label key={site.id} className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={favoriteSites.includes(site.name)}
                    onChange={() => toggleFavoriteSite(site.name)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <Star className={`w-4 h-4 ${favoriteSites.includes(site.name) ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                    <div>
                      <span className="text-sm font-medium text-gray-700">{site.name}</span>
                      <div className="text-xs text-gray-500">({site.id})</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Les sites favoris apparaîtront en premier lors de la sélection
            </p>
          </div>

          {/* Services favoris */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Services favoris ({filteredServices.length}/{allServices.length})
            </h3>
            
            {/* Barre de recherche pour les services */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un service... (ex: consultation, radiologie, H-CONS)"
                  value={serviceSearchTerm}
                  onChange={(e) => setServiceSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {serviceSearchTerm && (
                  <button
                    onClick={() => setServiceSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-auto">
              {filteredServices.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <Layers className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Aucun service trouvé pour "{serviceSearchTerm}"</p>
                </div>
              ) : (
                filteredServices.map((service) => (
                <label key={service.id} className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={favoriteFloors.includes(service.name)}
                    onChange={() => toggleFavoriteFloor(service.name)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <Star className={`w-4 h-4 ${favoriteFloors.includes(service.name) ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                    <div>
                      <span className="text-sm font-medium text-gray-700">{service.name}</span>
                      <div className="text-xs text-gray-500">({service.id})</div>
                    </div>
                  </div>
                </label>
                ))
              )}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Les services favoris apparaîtront en premier lors de la sélection
            </p>
          </div>

          {/* Feuilles favorites */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Feuilles favorites
            </h3>
            {documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Aucune feuille disponible</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documents.map((doc) => (
                  <label key={doc.id} className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={favoriteDocuments.includes(doc.id)}
                      onChange={() => toggleFavoriteDocument(doc.id)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Star className={`w-4 h-4 ${favoriteDocuments.includes(doc.id) ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                        <span className="text-sm font-medium text-gray-700 truncate">{doc.name}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {doc.docType === 'divers' ? 'Frais divers' : 'Prestations'} • {doc.zones.length} zone(s)
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-600 mt-2">
              Les feuilles favorites apparaîtront en premier et seront accessibles rapidement
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {hasChanges && (
                <span className="text-orange-600">• Modifications non sauvegardées</span>
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
                onClick={savePreferences}
                disabled={!hasChanges}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}