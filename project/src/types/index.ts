export interface Zone {
  id: number;
  top: number;    // en pixels (coordonnées natives de l'image)
  left: number;   // en pixels (coordonnées natives de l'image)
  width: number;  // en pixels (taille native de l'image)
  height: number; // en pixels (taille native de l'image)
  code: string;
  locked: boolean;
  checked: boolean;
  prestataire?: string; // Prestataire spécifique à cette zone (saisi lors de l'encodage)
  isBarcode?: boolean; // Indique que la zone est dédiée à la lecture d'un code-barres (Scan2Overlay)
}

export interface ExportData {
  documentName: string;
  docType: string;
  providerCode: string | null;
  zones: Zone[];
}

export interface Document {
  id: string;
  name: string;
  docType: DocType;
  providerCode: string | null;
  zones: Zone[];
  backgroundImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type DocType = 'divers' | 'prestations' | '';

export interface User {
  id: string;
  login: string;
  role: 'super_admin' | 'admin' | 'user';
  name: string;
  status: 'active' | 'pending' | 'inactive';
  createdAt: Date;
  approvedBy?: string;
}

export interface Patient {
  id: string;
  name: string;
  firstName: string;
  room: string;
  bed: string;
  floor: string;
  site: string;
  birthDate: string;
  socialSecurityNumber: string;
}

export interface SavedDocument extends Document {
  createdBy: string;
  convertedDocument?: ConvertedDocument;
}
export interface ConvertedDocument {
  pages: string[]; // URLs des images converties
  currentPage: number;
  totalPages: number;
  originalFileName: string;
  fileType: 'pdf' | 'docx' | 'doc' | 'image';
}

export interface UserFavorite {
  id: string;
  userId: string;
  documentId: string;
  createdAt: Date;
}

export interface EncodingSession {
  id: string;
  documentId: string;
  patientId: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  globalPrestataire?: string; // Prestataire global pour les prestations
  useGlobalPrestataire?: boolean; // Utiliser le prestataire global pour toute la feuille
  physician?: string; // Médecin responsable
  zones: Zone[];
  status: 'active' | 'completed' | 'cancelled';
  exported?: boolean;
  exportedAt?: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: Date;
  patientId?: string;
  documentId?: string;
}

export interface ExportSchedule {
  id: string;
  documentId: string;
  days: number[]; // 0=dimanche, 1=lundi, etc.
  time: string; // format HH:MM
  format: 'CSV' | 'MRT';
  active: boolean;
  lastExport?: Date;
  createdBy: string;
}

export interface ExportHistory {
  id: string;
  date: Date;
  mode: 'manual' | 'scheduled';
  format: 'CSV' | 'MRT';
  prestations: {
    patientId: string;
    prestationCode: string;
    date: string;
  }[];
}

// Nouvelles interfaces pour les améliorations UX
export interface UserPreference {
  id: string;
  userId: string;
  type: 'favorite_document' | 'favorite_site' | 'favorite_floor' | 'default_provider';
  itemId: string;
  value?: string; // Pour les valeurs comme le code prestataire par défaut
  createdAt: Date;
}

export interface UserTemplate {
  id: string;
  userId: string;
  name: string;
  type: 'custom' | 'pathology' | 'emergency';
  documentId: string;
  prefilledZones: { [zoneId: number]: string };
  preCheckedZones: { [zoneId: number]: boolean };
  defaultProvider?: string;
  defaultDate?: string;
  pathologyType?: 'trauma_head' | 'trauma_leg' | 'cardiac' | 'respiratory' | 'general';
  isPublic: boolean;
  createdAt: Date;
}

export interface UserSheetCustomization {
  id: string;
  userId: string;
  documentId: string;
  name: string; // Nom de la personnalisation
  prefilledZones: { [zoneId: number]: string }; // Codes pré-remplis
  preCheckedZones: { [zoneId: number]: boolean }; // Zones pré-cochées
  defaultProvider?: string; // Prestataire par défaut
  defaultDate?: string; // Date par défaut
  isDefault: boolean; // Si c'est la personnalisation par défaut pour cette feuille
  createdAt: Date;
  updatedAt: Date;
}

export interface SheetCustomizationSettings {
  autoApplyDefaults: boolean; // Appliquer automatiquement les valeurs par défaut
  showCustomizationHints: boolean; // Afficher les conseils de personnalisation
  saveOnFirstUse: boolean; // Proposer de sauvegarder après première utilisation
}
export interface SearchResult {
  id: string;
  type: 'document' | 'patient' | 'template';
  title: string;
  subtitle: string;
  metadata: any;
  relevanceScore: number;
}

export interface PatientStay {
  patientId: string;
  entryDate: Date;
  exitDate?: Date;
  isActive: boolean;
}

export interface SmartDate {
  suggested: Date;
  reason: 'today_in_stay' | 'entry_date' | 'fixed_stay' | 'manual';
  isValid: boolean;
  stayPeriod?: { start: Date; end?: Date };
}

// Interfaces pour la recherche de patients
export interface PatientSearchResult extends Patient {
  relevanceScore: number;
  matchedFields: string[];
}

export interface PatientSearchFilters {
  site?: string;
  floor?: string;
  name?: string;
  firstName?: string;
  room?: string;
  birthDate?: string;
  socialSecurityNumber?: string;
}

// Interface pour la multi-sélection
export interface MultiSelectionState {
  selectedPatients: Patient[];
  selectedDocument: SavedDocument | null;
  isActive: boolean;
}

// Interface pour les Web Workers
export interface WorkerMessage {
  type: 'SEARCH_PATIENTS' | 'SYNC_DATA' | 'CACHE_UPDATE';
  payload: any;
  id: string;
}

export interface WorkerResponse {
  type: string;
  payload: any;
  id: string;
  error?: string;
}