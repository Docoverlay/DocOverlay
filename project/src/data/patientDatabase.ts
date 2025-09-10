import { Patient } from '../types';
import { 
  CAMPUS_IDS, 
  WARD_ADM_IDS, 
  ADM_DOCTOR_IDS, 
  FIRST_NAMES, 
  LAST_NAMES,
  CAMPUS_TO_SITE,
  getServiceName,
  generateDoctorName
} from './referenceData';

// Interface étendue pour les patients avec toutes les données
export interface ExtendedPatient extends Patient {
  patId: string;
  visitId: string;
  caseId: string;
  admDate: string;
  disDate: string;
  campusId: string;
  wardAdmId: string;
  admDoctorId: string;
  admDoctorName: string;
  reservId: string;
}

// Classe pour gérer la base de données des patients
class PatientDatabase {
  private patients: ExtendedPatient[] = [];
  private isInitialized = false;

  // Générer un patient aléatoire
  private generateRandomPatient(index: number): ExtendedPatient {
    const patId = (584135930 + index).toString();
    const visitId = (208817820 + index * 13).toString();
    
    // Générer des dates réalistes
    const admDate = this.generateRandomDate(new Date('2024-01-01'), new Date('2025-12-31'));
    const disDate = this.generateRandomDate(admDate, new Date(admDate.getTime() + 30 * 24 * 60 * 60 * 1000));
    
    // Sélectionner des données aléatoires
    const campusId = CAMPUS_IDS[Math.floor(Math.random() * CAMPUS_IDS.length)];
    const wardAdmId = WARD_ADM_IDS[Math.floor(Math.random() * WARD_ADM_IDS.length)];
    const admDoctorId = ADM_DOCTOR_IDS[Math.floor(Math.random() * ADM_DOCTOR_IDS.length)];
    
    // Générer nom et prénom
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    
    // Générer nom du médecin
    const doctorName = generateDoctorName(admDoctorId);
    
    // Générer NISS réaliste (format belge)
    const birthYear = Math.floor(Math.random() * 60) + 1940; // 1940-2000
    const birthMonth = Math.floor(Math.random() * 12) + 1;
    const birthDay = Math.floor(Math.random() * 28) + 1;
    const birthDate = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;
    
    const yearShort = birthYear.toString().slice(-2);
    const monthStr = birthMonth.toString().padStart(2, '0');
    const dayStr = birthDay.toString().padStart(2, '0');
    const sequence = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    const socialSecurityNumber = `${yearShort}${monthStr}${dayStr}${sequence}`;
    
    // Générer chambre et lit
    const room = Math.floor(Math.random() * 500) + 100; // 100-599
    const bed = Math.floor(Math.random() * 4) + 1; // 1-4
    
    // Mapper vers des noms plus lisibles
    const site = CAMPUS_TO_SITE[campusId] || campusId;
    const service = getServiceName(wardAdmId);
    
    return {
      id: patId,
      name: lastName,
      firstName: firstName,
      room: room.toString(),
      bed: bed.toString(),
      floor: service, // Garder le nom 'floor' pour compatibilité mais c'est maintenant le service
      site: site,
      birthDate: birthDate,
      socialSecurityNumber: socialSecurityNumber,
      
      // Données étendues
      patId: patId,
      visitId: visitId,
      caseId: (800000000 + index * 17).toString(),
      admDate: this.formatDate(admDate),
      disDate: this.formatDate(disDate),
      campusId: campusId,
      wardAdmId: wardAdmId,
      admDoctorId: admDoctorId,
      admDoctorName: `Dr. ${doctorName.firstName} ${doctorName.lastName}`,
      reservId: (212978000 + index * 11).toString()
    };
  }

  // Générer une date aléatoire entre deux dates
  private generateRandomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  // Formater une date au format YYYY-MM-DD HH:MM:SS
  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  // Initialiser la base de données avec 1000 patients
  public initialize(): void {
    if (this.isInitialized) return;
    
    console.log('🏥 Initialisation de la base de données patients...');
    this.patients = [];
    
    for (let i = 0; i < 1000; i++) {
      this.patients.push(this.generateRandomPatient(i));
    }
    
    this.isInitialized = true;
    console.log(`✅ Base de données initialisée avec ${this.patients.length} patients`);
  }

  // Obtenir tous les patients
  public getAllPatients(): ExtendedPatient[] {
    if (!this.isInitialized) {
      this.initialize();
    }
    return [...this.patients];
  }

  // Obtenir les patients au format simple pour la compatibilité
  public getSimplePatients(): Patient[] {
    return this.getAllPatients().map(patient => ({
      id: patient.id,
      name: patient.name,
      firstName: patient.firstName,
      room: patient.room,
      bed: patient.bed,
      floor: patient.floor,
      site: patient.site,
      birthDate: patient.birthDate,
      socialSecurityNumber: patient.socialSecurityNumber
    }));
  }

  // Rechercher des patients
  public searchPatients(query: string, filters: any = {}): ExtendedPatient[] {
    const searchTerm = query.toLowerCase().trim();
    let results = this.getAllPatients();

    // Appliquer les filtres
    if (filters.site) {
      results = results.filter(patient => patient.site === filters.site);
    }
    if (filters.floor) {
      results = results.filter(patient => patient.floor === filters.floor);
    }
    if (filters.campusId) {
      results = results.filter(patient => patient.campusId === filters.campusId);
    }

    // Recherche textuelle
    if (searchTerm) {
      results = results.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm) ||
        patient.firstName.toLowerCase().includes(searchTerm) ||
        patient.room.includes(searchTerm) ||
        patient.socialSecurityNumber.includes(searchTerm) ||
        patient.site.toLowerCase().includes(searchTerm) ||
        patient.floor.toLowerCase().includes(searchTerm) ||
        patient.admDoctorName.toLowerCase().includes(searchTerm)
      );
    }

    return results;
  }

  // Obtenir un patient par ID
  public getPatientById(id: string): ExtendedPatient | null {
    return this.getAllPatients().find(patient => patient.id === id) || null;
  }

  // Vider toutes les données
  public clearAllData(): void {
    console.log('🗑️ Suppression de toutes les données patients...');
    this.patients = [];
    this.isInitialized = false;
    console.log('✅ Toutes les données ont été supprimées');
  }

  // Réinitialiser avec de nouvelles données
  public regenerateData(): void {
    console.log('🔄 Régénération des données patients...');
    this.clearAllData();
    this.initialize();
  }

  // Obtenir des statistiques
  public getStats() {
    const patients = this.getAllPatients();
    const uniquePatientIds = new Set(patients.map(p => p.patId));
    
    const siteStats = patients.reduce((acc, patient) => {
      acc[patient.site] = (acc[patient.site] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const floorStats = patients.reduce((acc, patient) => {
      acc[patient.floor] = (acc[patient.floor] || 0) + 1; // floor = service maintenant
      return acc;
    }, {} as { [key: string]: number });

    return {
      total: patients.length,
      uniquePatients: uniquePatientIds.size,
      sites: siteStats,
      services: floorStats, // Renommer pour clarté
      campusIds: [...new Set(patients.map(p => p.campusId))],
      wardIds: [...new Set(patients.map(p => p.wardAdmId))],
      doctorIds: [...new Set(patients.map(p => p.admDoctorId))]
    };
  }

  // Export des données au format CSV
  public exportToCSV(): string {
    const patients = this.getAllPatients();
    const headers = [
      'pat_id', 'visit_id', 'firstname', 'lastname', 'case_id', 'adm_date', 
      'dis_date', 'campus_id', 'ward_adm_id', 'adm_doctor_id', 'reserv_id',
      'room', 'bed', 'site', 'floor', 'birth_date', 'social_security_number', 'doctor_name'
    ];

    const csvContent = [
      headers.join(','),
      ...patients.map(patient => [
        patient.patId,
        patient.visitId,
        patient.firstName,
        patient.name,
        patient.caseId,
        patient.admDate,
        patient.disDate,
        patient.campusId,
        patient.wardAdmId,
        patient.admDoctorId,
        patient.reservId,
        patient.room,
        patient.bed,
        patient.site,
        patient.floor,
        patient.birthDate,
        patient.socialSecurityNumber,
        patient.admDoctorName
      ].join(','))
    ].join('\n');

    return csvContent;
  }
}

// Instance singleton
export const patientDB = new PatientDatabase();

// Fonctions utilitaires pour la compatibilité
export const getMockPatients = (): Patient[] => {
  return patientDB.getSimplePatients();
};

export const clearPatientData = (): void => {
  patientDB.clearAllData();
};

export const regeneratePatientData = (): void => {
  patientDB.regenerateData();
};

export const getPatientStats = () => {
  return patientDB.getStats();
};

export const exportPatientData = (): string => {
  return patientDB.exportToCSV();
};