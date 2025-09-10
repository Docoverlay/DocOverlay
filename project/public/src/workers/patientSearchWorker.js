// Web Worker pour la recherche de patients
// Ce worker permet de décharger la recherche du thread principal

self.onmessage = function(event) {
  const { type, payload, id } = event.data;
  
  try {
    switch (type) {
      case 'SEARCH_PATIENTS':
        const results = performPatientSearch(payload.query, payload.filters);
        self.postMessage({
          type: 'SEARCH_RESULTS',
          payload: results,
          id: id
        });
        break;
        
      case 'SYNC_DATA':
        // Synchronisation des données en arrière-plan
        syncPatientData(payload);
        self.postMessage({
          type: 'SYNC_COMPLETE',
          payload: { success: true },
          id: id
        });
        break;
        
      default:
        self.postMessage({
          type: 'ERROR',
          payload: null,
          id: id,
          error: `Type de message non reconnu: ${type}`
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      payload: null,
      id: id,
      error: error.message
    });
  }
};

// Fonction de recherche optimisée pour le worker
function performPatientSearch(query, filters = {}) {
  const patients = getMockPatients();
  const searchTerm = query.toLowerCase().trim();
  const results = [];

  // Utiliser un algorithme de recherche optimisé
  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    
    // Appliquer les filtres rapidement
    if (filters.site && patient.site !== filters.site) continue;
    if (filters.floor && patient.floor !== filters.floor) continue;
    
    const matchedFields = [];
    let score = 0;
    
    // Recherche optimisée avec early exit
    const nameMatch = patient.name.toLowerCase();
    const firstNameMatch = patient.firstName.toLowerCase();
    
    if (nameMatch.includes(searchTerm)) {
      matchedFields.push('name');
      score += nameMatch.startsWith(searchTerm) ? 100 : 80;
    }
    
    if (firstNameMatch.includes(searchTerm)) {
      matchedFields.push('firstName');
      score += firstNameMatch.startsWith(searchTerm) ? 100 : 80;
    }
    
    if (patient.room.includes(searchTerm)) {
      matchedFields.push('room');
      score += 90;
    }
    
    if (patient.socialSecurityNumber.includes(searchTerm)) {
      matchedFields.push('niss');
      score += 95;
    }
    
    if (patient.birthDate.includes(searchTerm)) {
      matchedFields.push('birthDate');
      score += 70;
    }
    
    const siteMatch = patient.site.toLowerCase();
    const floorMatch = patient.floor.toLowerCase();
    if (siteMatch.includes(searchTerm) || floorMatch.includes(searchTerm)) {
      matchedFields.push('location');
      score += 60;
    }
    
    if (score > 0) {
      results.push({
        ...patient,
        relevanceScore: score,
        matchedFields: matchedFields
      });
    }
  }
  
  // Tri rapide par score
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  return results;
}

// Synchronisation des données (simulation)
function syncPatientData(config) {
  // Simulation d'une synchronisation avec une base de données distante
  // En production, ceci ferait des appels API
  
  console.log('Synchronisation des données patients en arrière-plan...');
  
  // Simuler un délai de synchronisation
  const delay = Math.random() * 2000 + 1000; // 1-3 secondes
  
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('Synchronisation terminée');
      resolve(true);
    }, delay);
  });
}

// Fonction pour générer des patients (version simplifiée pour le worker)
function getMockPatients() {
  // Pour le worker, on génère un échantillon plus petit pour les performances
  const patients = [];
  const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Michel', 'Claire', 'Paul', 'Anne', 'Jacques', 'Julie'];
  const lastNames = ['Martin', 'Dubois', 'Moreau', 'Bernard', 'Roux', 'Leroy', 'Petit', 'Fournier', 'Garnier', 'Lambert'];
  const sites = ['Delta', 'Waterloo', 'Saint-Pierre', 'Horta', 'Nivelles'];
  const floors = ['Chirurgie', 'Médecine', 'Réa', 'Consultation', 'Radiologie'];
  
  for (let i = 0; i < 100; i++) { // Échantillon de 100 pour le worker
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
    const site = sites[i % sites.length];
    const floor = floors[i % floors.length];
    const room = (100 + i).toString();
    const bed = ((i % 4) + 1).toString();
    const year = 1950 + (i % 50);
    const month = (i % 12) + 1;
    const day = (i % 28) + 1;
    const birthDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const niss = `${year.toString().slice(-2)}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}${(i % 1000).toString().padStart(3, '0')}`;
    
    patients.push({
      id: (i + 1).toString(),
      name: lastName,
      firstName: firstName,
      room: room,
      bed: bed,
      floor: floor,
      site: site,
      birthDate: birthDate,
      socialSecurityNumber: niss
    });
  }
  
  return patients;
}