import { UserPreference, UserTemplate, SearchResult } from '../types';
import { UserSheetCustomization, SheetCustomizationSettings } from '../types';

// Gestion des préférences utilisateur
export const getUserPreferences = (userId: string, type?: string): UserPreference[] => {
  try {
    const prefs = localStorage.getItem('userPreferences');
    const allPrefs: UserPreference[] = prefs ? JSON.parse(prefs) : [];
    return allPrefs.filter(pref => 
      pref.userId === userId && (!type || pref.type === type)
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des préférences:', error);
    return [];
  }
};

export const saveUserPreference = (preference: Omit<UserPreference, 'id' | 'createdAt'>): UserPreference => {
  const newPref: UserPreference = {
    ...preference,
    id: `pref_${Date.now()}`,
    createdAt: new Date()
  };
  
  const allPrefs = JSON.parse(localStorage.getItem('userPreferences') || '[]');
  
  // Supprimer l'ancienne préférence du même type si elle existe
  const filteredPrefs = allPrefs.filter((p: UserPreference) => 
    !(p.userId === preference.userId && p.type === preference.type && p.itemId === preference.itemId)
  );
  
  filteredPrefs.push(newPref);
  localStorage.setItem('userPreferences', JSON.stringify(filteredPrefs));
  
  return newPref;
};

export const removeUserPreference = (userId: string, type: string, itemId: string): boolean => {
  const allPrefs = JSON.parse(localStorage.getItem('userPreferences') || '[]');
  const filteredPrefs = allPrefs.filter((p: UserPreference) => 
    !(p.userId === userId && p.type === type && p.itemId === itemId)
  );
  
  if (filteredPrefs.length === allPrefs.length) return false;
  
  localStorage.setItem('userPreferences', JSON.stringify(filteredPrefs));
  return true;
};

// Gestion des favoris spécifiques
export const getFavoriteDocuments = (userId: string): string[] => {
  return getUserPreferences(userId, 'favorite_document').map(pref => pref.itemId);
};

export const getFavoriteSites = (userId: string): string[] => {
  return getUserPreferences(userId, 'favorite_site').map(pref => pref.itemId);
};

export const getFavoriteFloors = (userId: string): string[] => {
  return getUserPreferences(userId, 'favorite_floor').map(pref => pref.itemId);
};

export const getDefaultProviderCode = (userId: string): string => {
  const pref = getUserPreferences(userId, 'default_provider').find(p => p.type === 'default_provider');
  return pref?.value || '';
};

export const setDefaultProviderCode = (userId: string, code: string): void => {
  saveUserPreference({
    userId,
    type: 'default_provider',
    itemId: 'default',
    value: code
  });
};

// Gestion des templates utilisateur
export const getUserTemplates = (userId: string): UserTemplate[] => {
  try {
    const templates = localStorage.getItem('userTemplates');
    const allTemplates: UserTemplate[] = templates ? JSON.parse(templates) : [];
    return allTemplates.filter(template => 
      template.userId === userId || template.isPublic
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des templates:', error);
    return [];
  }
};

export const saveUserTemplate = (template: Omit<UserTemplate, 'id' | 'createdAt'>): UserTemplate => {
  const newTemplate: UserTemplate = {
    ...template,
    id: `template_${Date.now()}`,
    createdAt: new Date()
  };
  
  const allTemplates = JSON.parse(localStorage.getItem('userTemplates') || '[]');
  allTemplates.push(newTemplate);
  localStorage.setItem('userTemplates', JSON.stringify(allTemplates));
  
  return newTemplate;
};

// Templates d'urgence prédéfinis
export const getEmergencyTemplates = (): UserTemplate[] => {
  return [
    {
      id: 'emergency_trauma_head',
      userId: 'system',
      name: 'Trauma crânien',
      type: 'emergency',
      documentId: 'emergency_doc',
      prefilledZones: {
        1: '460001', // Scanner cérébral
        2: '460002', // IRM cérébrale
        3: '460003'  // Consultation neurologique
      },
      pathologyType: 'trauma_head',
      isPublic: true,
      createdAt: new Date()
    },
    {
      id: 'emergency_trauma_leg',
      userId: 'system',
      name: 'Trauma membre inférieur',
      type: 'emergency',
      documentId: 'emergency_doc',
      prefilledZones: {
        1: '460010', // Radio membre inférieur
        2: '460011', // Scanner membre
        3: '460012'  // Consultation orthopédique
      },
      pathologyType: 'trauma_leg',
      isPublic: true,
      createdAt: new Date()
    },
    {
      id: 'emergency_cardiac',
      userId: 'system',
      name: 'Urgence cardiaque',
      type: 'emergency',
      documentId: 'emergency_doc',
      prefilledZones: {
        1: '460020', // ECG
        2: '460021', // Échocardiographie
        3: '460022'  // Consultation cardiologique
      },
      pathologyType: 'cardiac',
      isPublic: true,
      createdAt: new Date()
    }
  ];
};

// Recherche globale multi-critères
export const performGlobalSearch = (query: string, type?: 'document' | 'patient' | 'template'): SearchResult[] => {
  const results: SearchResult[] = [];
  const searchTerm = query.toLowerCase().trim();
  
  if (!searchTerm) return results;
  
  // Recherche dans les documents
  if (!type || type === 'document') {
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    documents.forEach((doc: any) => {
      const score = calculateRelevanceScore(searchTerm, [doc.name, doc.docType]);
      if (score > 0) {
        results.push({
          id: doc.id,
          type: 'document',
          title: doc.name,
          subtitle: `${doc.docType === 'divers' ? 'Frais divers' : 'Prestations'} • ${doc.zones.length} zone(s)`,
          metadata: doc,
          relevanceScore: score
        });
      }
    });
  }
  
  // Recherche dans les templates
  if (!type || type === 'template') {
    const templates = JSON.parse(localStorage.getItem('userTemplates') || '[]');
    templates.forEach((template: UserTemplate) => {
      const score = calculateRelevanceScore(searchTerm, [template.name, template.type]);
      if (score > 0) {
        results.push({
          id: template.id,
          type: 'template',
          title: template.name,
          subtitle: `Template ${template.type} • ${Object.keys(template.prefilledZones).length} zone(s) pré-remplies`,
          metadata: template,
          relevanceScore: score
        });
      }
    });
  }
  
  // Trier par pertinence
  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
};

// Calcul de score de pertinence simple
const calculateRelevanceScore = (searchTerm: string, fields: string[]): number => {
  let score = 0;
  
  fields.forEach(field => {
    if (!field) return;
    
    const fieldLower = field.toLowerCase();
    
    // Correspondance exacte
    if (fieldLower === searchTerm) {
      score += 100;
    }
    // Commence par le terme
    else if (fieldLower.startsWith(searchTerm)) {
      score += 80;
    }
    // Contient le terme
    else if (fieldLower.includes(searchTerm)) {
      score += 60;
    }
    // Correspondance partielle (mots)
    else {
      const words = searchTerm.split(' ');
      words.forEach(word => {
        if (word.length > 2 && fieldLower.includes(word)) {
          score += 20;
        }
      });
    }
  });
  
  return score;
};

// Gestion des personnalisations de feuilles par utilisateur
export const getUserSheetCustomizations = (userId: string, documentId?: string): UserSheetCustomization[] => {
  try {
    const customizations = localStorage.getItem('userSheetCustomizations');
    const allCustomizations: UserSheetCustomization[] = customizations ? JSON.parse(customizations) : [];
    return allCustomizations.filter(custom => 
      custom.userId === userId && (!documentId || custom.documentId === documentId)
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des personnalisations:', error);
    return [];
  }
};

export const saveUserSheetCustomization = (customization: Omit<UserSheetCustomization, 'id' | 'createdAt' | 'updatedAt'>): UserSheetCustomization => {
  const newCustomization: UserSheetCustomization = {
    ...customization,
    id: `custom_${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const allCustomizations = JSON.parse(localStorage.getItem('userSheetCustomizations') || '[]');
  
  // Si c'est marqué comme défaut, retirer le flag des autres personnalisations de cette feuille
  if (customization.isDefault) {
    allCustomizations.forEach((custom: UserSheetCustomization) => {
      if (custom.userId === customization.userId && custom.documentId === customization.documentId) {
        custom.isDefault = false;
      }
    });
  }
  
  allCustomizations.push(newCustomization);
  localStorage.setItem('userSheetCustomizations', JSON.stringify(allCustomizations));
  
  return newCustomization;
};

export const updateUserSheetCustomization = (customizationId: string, updates: Partial<UserSheetCustomization>): UserSheetCustomization | null => {
  const allCustomizations = JSON.parse(localStorage.getItem('userSheetCustomizations') || '[]');
  const index = allCustomizations.findIndex((custom: UserSheetCustomization) => custom.id === customizationId);
  
  if (index === -1) return null;
  
  allCustomizations[index] = {
    ...allCustomizations[index],
    ...updates,
    updatedAt: new Date()
  };
  
  localStorage.setItem('userSheetCustomizations', JSON.stringify(allCustomizations));
  return allCustomizations[index];
};

export const deleteUserSheetCustomization = (customizationId: string): boolean => {
  const allCustomizations = JSON.parse(localStorage.getItem('userSheetCustomizations') || '[]');
  const filteredCustomizations = allCustomizations.filter((custom: UserSheetCustomization) => custom.id !== customizationId);
  
  if (filteredCustomizations.length === allCustomizations.length) return false;
  
  localStorage.setItem('userSheetCustomizations', JSON.stringify(filteredCustomizations));
  return true;
};

export const getDefaultCustomizationForSheet = (userId: string, documentId: string): UserSheetCustomization | null => {
  const customizations = getUserSheetCustomizations(userId, documentId);
  return customizations.find(custom => custom.isDefault) || null;
};

export const applyCustomizationToZones = (zones: any[], customization: UserSheetCustomization) => {
  return zones.map(zone => ({
    ...zone,
    checked: customization.preCheckedZones[zone.id] === true,
    code: customization.prefilledZones[zone.id] || zone.code || ''
  }));
};

// Paramètres de personnalisation
export const getCustomizationSettings = (userId: string): SheetCustomizationSettings => {
  try {
    const settings = localStorage.getItem(`customizationSettings_${userId}`);
    return settings ? JSON.parse(settings) : {
      autoApplyDefaults: true,
      showCustomizationHints: true,
      saveOnFirstUse: true
    };
  } catch (error) {
    return {
      autoApplyDefaults: true,
      showCustomizationHints: true,
      saveOnFirstUse: true
    };
  }
};

export const saveCustomizationSettings = (userId: string, settings: SheetCustomizationSettings): void => {
  localStorage.setItem(`customizationSettings_${userId}`, JSON.stringify(settings));
};
// Gestion intelligente des dates
export const calculateSmartDate = (patientStay?: PatientStay): Date => {
  const today = new Date();
  
  if (!patientStay) {
    return today;
  }
  
  const entryDate = new Date(patientStay.entryDate);
  const exitDate = patientStay.exitDate ? new Date(patientStay.exitDate) : null;
  
  // Si entrée = sortie (séjour d'un jour)
  if (exitDate && entryDate.toDateString() === exitDate.toDateString()) {
    return entryDate;
  }
  
  // Si aujourd'hui est dans la période de séjour
  if (today >= entryDate && (!exitDate || today <= exitDate)) {
    return today;
  }
  
  // Sinon, utiliser la date d'entrée
  return entryDate;
};

export const validateDateInStay = (date: Date, patientStay?: PatientStay): boolean => {
  if (!patientStay) return true;
  
  const entryDate = new Date(patientStay.entryDate);
  const exitDate = patientStay.exitDate ? new Date(patientStay.exitDate) : new Date();
  
  return date >= entryDate && date <= exitDate;
};