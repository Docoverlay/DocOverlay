import { Patient, PatientSearchResult, PatientSearchFilters } from '../types';
import { patientDB } from '../data/patientDatabase';

// Fonction de recherche de patients avec Web Worker (si disponible)
export const searchPatients = async (
  query: string, 
  filters: PatientSearchFilters = {}
): Promise<PatientSearchResult[]> => {
  // Vérifier si les Web Workers sont disponibles
  if (typeof Worker !== 'undefined') {
    try {
      return await searchPatientsWithWorker(query, filters);
    } catch (error) {
      console.warn('Web Worker non disponible, utilisation de la recherche synchrone:', error);
      return searchPatientsSync(query, filters);
    }
  } else {
    return searchPatientsSync(query, filters);
  }
};

// Recherche avec Web Worker
const searchPatientsWithWorker = async (
  query: string, 
  filters: PatientSearchFilters
): Promise<PatientSearchResult[]> => {
  return new Promise((resolve, reject) => {
    const worker = new Worker('/src/workers/patientSearchWorker.js');
    const messageId = `search_${Date.now()}`;
    
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('Timeout de recherche'));
    }, 5000);
    
    worker.onmessage = (event) => {
      const { type, payload, id, error } = event.data;
      
      if (id === messageId) {
        clearTimeout(timeout);
        worker.terminate();
        
        if (error) {
          reject(new Error(error));
        } else if (type === 'SEARCH_RESULTS') {
          resolve(payload);
        }
      }
    };
    
    worker.onerror = (error) => {
      clearTimeout(timeout);
      worker.terminate();
      reject(error);
    };
    
    worker.postMessage({
      type: 'SEARCH_PATIENTS',
      payload: { query, filters },
      id: messageId
    });
  });
};

// Recherche synchrone (fallback)
const searchPatientsSync = (
  query: string, 
  filters: PatientSearchFilters
): PatientSearchResult[] => {
  const patients = patientDB.getSimplePatients();
  const searchTerm = query.toLowerCase().trim();
  const results: PatientSearchResult[] = [];

  patients.forEach(patient => {
    // Appliquer les filtres
    if (filters.site && patient.site !== filters.site) return;
    if (filters.floor && patient.floor !== filters.floor) return;
    if (filters.name && !patient.name.toLowerCase().includes(filters.name.toLowerCase())) return;
    if (filters.firstName && !patient.firstName.toLowerCase().includes(filters.firstName.toLowerCase())) return;
    if (filters.room && patient.room !== filters.room) return;

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
};

// Cache pour optimiser les recherches répétées
const searchCache = new Map<string, { results: PatientSearchResult[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedSearch = (query: string, filters: PatientSearchFilters): PatientSearchResult[] | null => {
  const cacheKey = `${query}_${JSON.stringify(filters)}`;
  const cached = searchCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.results;
  }
  
  return null;
};

export const setCachedSearch = (query: string, filters: PatientSearchFilters, results: PatientSearchResult[]): void => {
  const cacheKey = `${query}_${JSON.stringify(filters)}`;
  searchCache.set(cacheKey, {
    results,
    timestamp: Date.now()
  });
  
  // Nettoyer le cache si trop d'entrées
  if (searchCache.size > 100) {
    const oldestKey = searchCache.keys().next().value;
    searchCache.delete(oldestKey);
  }
};