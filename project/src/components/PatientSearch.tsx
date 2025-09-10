import React, { useState, useEffect, useRef } from 'react';
import { Search, User, MapPin, Calendar, Hash, X, Filter } from 'lucide-react';
import { Patient, PatientSearchResult, PatientSearchFilters } from '../types';
import { searchPatients } from '../utils/patientSearch';
import { getAllSites, getServicesBySite, getServiceName } from '../data/referenceData';

interface PatientSearchProps {
  onSelectPatient: (patient: Patient) => void;
  onSelectMultiple?: (patients: Patient[]) => void;
  allowMultiSelect?: boolean;
  selectedPatients?: Patient[];
  className?: string;
}

export default function PatientSearch({ 
  onSelectPatient, 
  onSelectMultiple, 
  allowMultiSelect = false,
  selectedPatients = [],
  className = "" 
}: PatientSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<PatientSearchFilters>({});
  const [selectedSite, setSelectedSite] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const sites = getAllSites();
  const availableServices = selectedSite ? getServicesBySite(selectedSite) : [];

  useEffect(() => {
    const searchPatients = async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        try {
          // Simuler un délai de recherche
          await new Promise(resolve => setTimeout(resolve, 200));
          const searchResults = await performPatientSearch(query, filters);
          setResults(searchResults.slice(0, 10)); // Limiter à 10 résultats
          setIsOpen(true);
          setSelectedIndex(-1);
        } catch (error) {
          console.error('Erreur de recherche:', error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    };

    const debounceTimer = setTimeout(searchPatients, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, filters]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelectPatient(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelectPatient = (patient: PatientSearchResult) => {
    if (allowMultiSelect) {
      const isSelected = selectedPatients.some(p => p.id === patient.id);
      let newSelection: Patient[];
      
      if (isSelected) {
        newSelection = selectedPatients.filter(p => p.id !== patient.id);
      } else {
        newSelection = [...selectedPatients, patient];
      }
      
      onSelectMultiple?.(newSelection);
    } else {
      onSelectPatient(patient);
      setQuery('');
      setIsOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const highlightMatch = (text: string, matchedFields: string[], fieldName: string) => {
    if (!matchedFields.includes(fieldName) || !query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const isPatientSelected = (patient: Patient) => {
    return selectedPatients.some(p => p.id === patient.id);
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        placeholder="Rechercher un patient (nom, prénom, chambre, NISS...)" 
        aria-label="Rechercher un patient"
        className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {isLoading && (
            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            type="button"
            aria-label="Filtres de recherche"
            className={`p-2 rounded transition-colors focus-visible ${showFilters ? 'text-blue-600 bg-blue-100' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Filter className="w-4 h-4" />
          </button>
          {query && (
            <button
              onClick={clearSearch}
              type="button"
              aria-label="Effacer la recherche"
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors focus-visible"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-40 p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Filtres de recherche</h4>
          <div className="space-y-3">
            {/* Sélection du site */}
            <select
              value={selectedSite}
              onChange={(e) => {
                const site = e.target.value;
                setSelectedSite(site);
                setFilters(prev => ({ 
                  ...prev, 
                  site: site || undefined,
                  floor: undefined // Reset service when site changes
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les sites</option>
              {sites.map(site => (
                <option key={site.id} value={site.name}>
                  {site.name} ({site.id})
                </option>
              ))}
            </select>
            
            {/* Sélection du service (seulement si un site est sélectionné) */}
            {selectedSite && (
              <select
                value={filters.floor || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, floor: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les services</option>
                {availableServices.map(wardId => (
                  <option key={wardId} value={getServiceName(wardId)}>
                    {getServiceName(wardId)} ({wardId})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex justify-end mt-3">
            <button
              onClick={() => {
                setFilters({});
                setSelectedSite('');
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Effacer filtres
            </button>
          </div>
        </div>
      )}

      {/* Filtres avancés - ancienne version à supprimer */}
      {false && showFilters && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-40 p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Filtres de recherche</h4>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={filters.floor || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, floor: e.target.value || undefined }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les étages</option>
            </select>
          </div>
          <div className="flex justify-end mt-3">
            <button
              onClick={() => {
                setFilters({});
                setSelectedSite('');
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Effacer filtres
            </button>
          </div>
        </div>
      )}

      {/* Résultats de recherche */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-auto">
          {results.map((patient, index) => (
            <button
              key={patient.id}
              onClick={() => handleSelectPatient(patient)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
              } ${allowMultiSelect && isPatientSelected(patient) ? 'bg-green-50 border-green-200' : ''}`}
            >
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {highlightMatch(`${patient.firstName} ${patient.name}`, patient.matchedFields, 'name')}
                    </span>
                    {allowMultiSelect && isPatientSelected(patient) && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Sélectionné
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {highlightMatch(`${patient.site} - ${patient.floor}`, patient.matchedFields, 'location')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      Chambre {highlightMatch(patient.room, patient.matchedFields, 'room')} - Lit {patient.bed}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {highlightMatch(new Date(patient.birthDate).toLocaleDateString(), patient.matchedFields, 'birthDate')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      NISS: {highlightMatch(patient.socialSecurityNumber, patient.matchedFields, 'niss')}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-blue-600 font-medium">
                      Score: {Math.round(patient.relevanceScore)}%
                    </span>
                    <span className="text-xs text-gray-500">
                      Correspondances: {patient.matchedFields.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Aucun résultat */}
      {isOpen && query.trim().length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-4 text-center text-gray-500">
          <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Aucun patient trouvé pour "{query}"</p>
          <p className="text-xs text-gray-400 mt-1">
            Essayez avec le nom, prénom, chambre ou NISS
          </p>
        </div>
      )}

      {/* Indicateur multi-sélection */}
      {allowMultiSelect && selectedPatients.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-green-50 border border-green-200 rounded-md p-3 z-30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-800">
              {selectedPatients.length} patient(s) sélectionné(s)
            </span>
            <button
              onClick={() => onSelectMultiple?.([])}
              className="text-xs text-green-600 hover:text-green-800 transition-colors"
            >
              Tout désélectionner
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Fonction de recherche de patients (simulée)
async function performPatientSearch(query: string, filters: PatientSearchFilters): Promise<PatientSearchResult[]> {
  // Utiliser la vraie base de données de patients
  const { patientDB } = await import('../data/patientDatabase');
  const patients = patientDB.getSimplePatients();

  const searchTerm = query.toLowerCase().trim();
  const results: PatientSearchResult[] = [];

  patients.forEach(patient => {
    // Appliquer les filtres
    if (filters.site && patient.site !== filters.site) return;
    if (filters.floor && patient.floor !== filters.floor) return;

    const matchedFields: string[] = [];
    let score = 0;

    // Recherche dans le nom
    if (patient.name.toLowerCase().includes(searchTerm)) {
      matchedFields.push('name');
      score += patient.name.toLowerCase().startsWith(searchTerm) ? 100 : 80;
    }

    // Recherche dans le prénom
    if (patient.firstName.toLowerCase().includes(searchTerm)) {
      matchedFields.push('firstName');
      score += patient.firstName.toLowerCase().startsWith(searchTerm) ? 100 : 80;
    }

    // Recherche dans la chambre
    if (patient.room.includes(searchTerm)) {
      matchedFields.push('room');
      score += 90;
    }

    // Recherche dans le NISS
    if (patient.socialSecurityNumber.includes(searchTerm)) {
      matchedFields.push('niss');
      score += 95;
    }

    // Recherche dans la date de naissance
    if (patient.birthDate.includes(searchTerm) || 
        new Date(patient.birthDate).toLocaleDateString().includes(searchTerm)) {
      matchedFields.push('birthDate');
      score += 70;
    }

    // Recherche dans la localisation
    if (patient.site.toLowerCase().includes(searchTerm) || 
        patient.floor.toLowerCase().includes(searchTerm)) {
      matchedFields.push('location');
      score += 60;
    }

    if (score > 0) {
      results.push({
        ...patient,
        relevanceScore: score,
        matchedFields
      });
    }
  });

  // Trier par score de pertinence
  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}