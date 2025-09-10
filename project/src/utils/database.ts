import { Document, SavedDocument } from '../types';
import { EncodingSession, AuditLog, ExportHistory, UserFavorite } from '../types';

// Simulation d'une base de données avec localStorage
// En production, ceci serait remplacé par des appels API vers une vraie DB

export const saveDocument = (document: Omit<SavedDocument, 'id' | 'createdAt' | 'updatedAt'>): SavedDocument => {
  const newDocument: SavedDocument = {
    ...document,
    id: Date.now().toString(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const savedDocuments = getDocuments();
  savedDocuments.push(newDocument);
  localStorage.setItem('documents', JSON.stringify(savedDocuments));
  
  return newDocument;
};

export const getDocuments = (): SavedDocument[] => {
  try {
    const documents = localStorage.getItem('documents');
    return documents ? JSON.parse(documents) : [];
  } catch (error) {
    console.error('Erreur lors de la récupération des documents:', error);
    return [];
  }
};

export const getDocumentById = (id: string): SavedDocument | null => {
  const documents = getDocuments();
  return documents.find(doc => doc.id === id) || null;
};

export const updateDocument = (id: string, updates: Partial<SavedDocument>): SavedDocument | null => {
  const documents = getDocuments();
  const index = documents.findIndex(doc => doc.id === id);
  
  if (index === -1) return null;
  
  documents[index] = {
    ...documents[index],
    ...updates,
    updatedAt: new Date()
  };
  
  localStorage.setItem('documents', JSON.stringify(documents));
  return documents[index];
};

export const deleteDocument = (id: string): boolean => {
  const documents = getDocuments();
  const filteredDocuments = documents.filter(doc => doc.id !== id);
  
  if (filteredDocuments.length === documents.length) return false;
  
  localStorage.setItem('documents', JSON.stringify(filteredDocuments));
  return true;
};

// Fonction pour exporter un document au format MTR
export const exportToMTR = (document: SavedDocument, patientData?: any): string => {
  // TODO: Implémenter la logique d'export MTR
  // Cette fonction devra formater les données selon le format MTR requis
  
  const mtrData = {
    documentName: document.name,
    docType: document.docType,
    providerCode: document.providerCode,
    zones: document.zones,
    patientData,
    exportDate: new Date().toISOString()
  };
  
  return JSON.stringify(mtrData, null, 2);
};

// Gestion des sessions d'encodage
export const getEncodingSessions = (): EncodingSession[] => {
  try {
    const sessions = localStorage.getItem('encodingSessions');
    return sessions ? JSON.parse(sessions) : [];
  } catch (error) {
    console.error('Erreur lors de la récupération des sessions:', error);
    return [];
  }
};

export const saveEncodingSession = (session: EncodingSession): void => {
  const sessions = getEncodingSessions();
  const existingIndex = sessions.findIndex(s => s.id === session.id);
  
  if (existingIndex >= 0) {
    sessions[existingIndex] = session;
  } else {
    sessions.push(session);
  }
  
  localStorage.setItem('encodingSessions', JSON.stringify(sessions));
};

export const getActiveSession = (documentId: string): EncodingSession | null => {
  const sessions = getEncodingSessions();
  return sessions.find(s => s.documentId === documentId && s.status === 'active') || null;
};

export const completeEncodingSession = (sessionId: string): void => {
  const sessions = getEncodingSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (session) {
    session.status = 'completed';
    session.completedAt = new Date();
    localStorage.setItem('encodingSessions', JSON.stringify(sessions));
  }
};

// Gestion du journal d'audit RGPD
export const getAuditLogs = (): AuditLog[] => {
  try {
    const logs = localStorage.getItem('auditLogs');
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    return [];
  }
};

export const addAuditLog = (log: Omit<AuditLog, 'id' | 'timestamp'>): void => {
  const logs = getAuditLogs();
  const newLog: AuditLog = {
    ...log,
    id: Date.now().toString(),
    timestamp: new Date()
  };
  
  logs.push(newLog);
  
  // Garder seulement les 1000 derniers logs
  if (logs.length > 1000) {
    logs.splice(0, logs.length - 1000);
  }
  
  localStorage.setItem('auditLogs', JSON.stringify(logs));
};

// Gestion des planifications d'export
export const getExportSchedules = (): ExportSchedule[] => {
  try {
    const schedules = localStorage.getItem('exportSchedules');
    return schedules ? JSON.parse(schedules) : [];
  } catch (error) {
    console.error('Erreur lors de la récupération des planifications:', error);
    return [];
  }
};

export const saveExportSchedule = (schedule: ExportSchedule): void => {
  const schedules = getExportSchedules();
  const existingIndex = schedules.findIndex(s => s.id === schedule.id);
  
  if (existingIndex >= 0) {
    schedules[existingIndex] = schedule;
  } else {
    schedules.push(schedule);
  }
  
  localStorage.setItem('exportSchedules', JSON.stringify(schedules));
};

export const deleteExportSchedule = (scheduleId: string): void => {
  const schedules = getExportSchedules();
  const filteredSchedules = schedules.filter(s => s.id !== scheduleId);
  localStorage.setItem('exportSchedules', JSON.stringify(filteredSchedules));
};

// Export manuel instantané
export const generateInstantExport = (format: 'CSV' | 'MRT'): string | null => {
  const encodings = JSON.parse(localStorage.getItem('encodings') || '[]');
  const documents = getDocuments();
  const sessions = getEncodingSessions();
  
  // Filtrer seulement les sessions non exportées
  const unexportedSessions = sessions.filter(session => 
    session.status === 'completed' && !session.exported
  );
  
  if (unexportedSessions.length === 0) {
    return null;
  }
  
  let content = '';
  const exportedPrestations: { patientId: string; prestationCode: string; date: string; }[] = [];
  
  if (format === 'CSV') {
    content = 'visit_id,prestation_code,prestation_date,physician\n';
    unexportedSessions.forEach((session: EncodingSession) => {
      session.zones.forEach((zone: any) => {
        if (zone.checked && zone.code) {
          const dateStr = session.completedAt ? new Date(session.completedAt).toLocaleDateString() : new Date().toLocaleDateString();
          const physician = (session as any).physician || 'Médecin inconnu';
          content += `${session.patientId},${zone.code},${dateStr},${physician}\n`;
          exportedPrestations.push({
            patientId: session.patientId,
            prestationCode: zone.code,
            date: dateStr
          });
        }
      });
    });
  } else {
    // Format MRT
    unexportedSessions.forEach((session: EncodingSession) => {
      session.zones.forEach((zone: any) => {
        if (zone.checked && zone.code) {
          const dateStr = session.completedAt ? new Date(session.completedAt).toLocaleDateString() : new Date().toLocaleDateString();
          const physician = (session as any).physician || 'Médecin inconnu';
          content += `${session.patientId} | ${zone.code} | ${dateStr} | ${physician}\n`;
          exportedPrestations.push({
            patientId: session.patientId,
            prestationCode: zone.code,
            date: dateStr
          });
        }
      });
    });
  }
  
  // Marquer les sessions comme exportées
  if (content && exportedPrestations.length > 0) {
    const allSessions = getEncodingSessions();
    const updatedSessions = allSessions.map(session => {
      if (unexportedSessions.find(us => us.id === session.id)) {
        return {
          ...session,
          exported: true,
          exportedAt: new Date()
        };
      }
      return session;
    });
    localStorage.setItem('encodingSessions', JSON.stringify(updatedSessions));
    
    // Sauvegarder l'historique d'export
    saveExportHistory({
      id: `export_${Date.now()}`,
      date: new Date(),
      mode: 'manual',
      format,
      prestations: exportedPrestations
    });
  }
  
  return content;
};

// Gestion de l'historique d'export
export const getExportHistory = (): ExportHistory[] => {
  try {
    const history = localStorage.getItem('exportHistory');
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    return [];
  }
};

export const saveExportHistory = (exportRecord: ExportHistory): void => {
  const history = getExportHistory();
  history.push(exportRecord);
  
  // Garder seulement les 100 derniers exports
  if (history.length > 100) {
    history.splice(0, history.length - 100);
  }
  
  localStorage.setItem('exportHistory', JSON.stringify(history));
};

// Obtenir le nombre de prestations non exportées
export const getUnexportedPrestationsCount = (): number => {
  const sessions = getEncodingSessions();
  const unexportedSessions = sessions.filter(session => 
    session.status === 'completed' && !session.exported
  );
  
  let count = 0;
  unexportedSessions.forEach(session => {
    session.zones.forEach(zone => {
      if (zone.checked && zone.code) {
        count++;
      }
    });
  });
  
  return count;
};

// Gestion des favoris utilisateur
export const getUserFavorites = (userId: string): UserFavorite[] => {
  try {
    const favorites = localStorage.getItem('userFavorites');
    const allFavorites: UserFavorite[] = favorites ? JSON.parse(favorites) : [];
    return allFavorites.filter(fav => fav.userId === userId);
  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error);
    return [];
  }
};

export const addToFavorites = (userId: string, documentId: string): UserFavorite => {
  const newFavorite: UserFavorite = {
    id: `${userId}_${documentId}_${Date.now()}`,
    userId,
    documentId,
    createdAt: new Date()
  };
  
  const allFavorites = JSON.parse(localStorage.getItem('userFavorites') || '[]');
  allFavorites.push(newFavorite);
  localStorage.setItem('userFavorites', JSON.stringify(allFavorites));
  
  return newFavorite;
};

export const removeFromFavorites = (userId: string, documentId: string): boolean => {
  const allFavorites = JSON.parse(localStorage.getItem('userFavorites') || '[]');
  const filteredFavorites = allFavorites.filter((fav: UserFavorite) => 
    !(fav.userId === userId && fav.documentId === documentId)
  );
  
  if (filteredFavorites.length === allFavorites.length) return false;
  
  localStorage.setItem('userFavorites', JSON.stringify(filteredFavorites));
  return true;
};

export const isDocumentFavorite = (userId: string, documentId: string): boolean => {
  const favorites = getUserFavorites(userId);
  return favorites.some(fav => fav.documentId === documentId);
};

export const getFavoriteDocuments = (userId: string): SavedDocument[] => {
  const favorites = getUserFavorites(userId);
  const documents = getDocuments();
  
  return favorites
    .map(fav => documents.find(doc => doc.id === fav.documentId))
    .filter((doc): doc is SavedDocument => doc !== undefined);
};