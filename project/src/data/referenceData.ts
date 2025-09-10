// Données de référence pour la génération des patients
export const CAMPUS_IDS = [
  'D', 'S', 'H'
];

export const WARD_ADM_IDS = [
  // Services Delta (D)
  'D-CONS', 'D-END', 'D-A4C', 'D-RMN', 'D-RISO', 'D-A3B', 'D-KINE', 'D-RADI', 
  'D-A3G', 'D-A3C', 'D-LSA', 'D-ECGY', 'D-A2F', 'D-CIA', 'D-A3F', 'D-A2B', 
  'D-PLA', 'D-A1E', 'D-PPO', 'D-LABO', 'D-A4D', 'D-CIP', 'D-PPC', 'D-CPN', 
  'D-A2E', 'D-A3A', 'D-MON', 'D-A3D', 'D-CIN', 'D-PRE', 'D-A4E', 'D-PCL', 
  'D-A2G', 'D-HDI', 'D-SI1', 'D-A3E', 'D-LSE', 'D-URG', 'D-SAC', 'D-SI2', 
  'D-A4G', 'D-A4B', 'D-HPR', 'D-A4H', 'D-RXT', 'D-GHR', 'D-ANAP', 'D-A4A', 
  'D-PHAR', 'D-NNE', 'D-NIC', 'D-ADI', 'D-A3H', 'D-SAT',
  
  // Services SARE (S)
  'S-CONS', 'S-C20', 'S-RADI', 'S-RMN', 'S-CPN', 'S-KINE', 'S-C30', 'S-CSI', 
  'S-MON', 'S-C10', 'S-B21', 'S-C60', 'S-C40', 'S-SAC', 'S-URG', 'S-A10', 
  'S-A30', 'S-HPR', 'S-ADI', 'S-A20', 'S-SI1', 'S-B40', 'S-PTEC', 'S-NNE', 
  'S-B30', 'S-C50', 'S-B22', 'S-PJ1', 'S-A50', 'S-A40', 'S-PREO', 'S-ANAP', 
  'S-PJ2', 'S-CSTO', 'S-PHAR', 'S-CGYP', 'S-RISO', 'S-END',
  
  // Services HBW (H)
  'H-CONS', 'H-PCL', 'H-DS1', 'H-LSA', 'H-PL', 'H-RMN', 'H-RADI', 'H-D11', 
  'H-B11', 'H-RISO', 'H-A42', 'H-KINE', 'H-REVA', 'H-D01', 'H-LABO', 'H-A11', 
  'H-PMA', 'H-B21', 'H-A12', 'H-B31', 'H-MON', 'H-CPN', 'H-SOIN', 'H-PHAR', 
  'H-ADI', 'H-SI1', 'H-HJG', 'H-ANAP', 'H-NNE', 'H-A31', 'H-A21', 'H-HPR', 
  'H-D21', 'H-A22', 'H-SAC', 'H-END'
];

export const ADM_DOCTOR_IDS = [
  '183446', '177185', '157078', '189627', '186690', '120625', '319130', '186711',
  '120489', '183960', '185367', '185377', '417733', '195687', '186895', '184232',
  '185440', '189962', '196127', '199567', '120224', '187903', '185754', '129411',
  '196466', '184549', '181426', '168859', '121063', '187656', '186560', '188570',
  '127768', '498684', '120268', '189745', '120619', '196059', '157817', '184444',
  '187688', '186901', '120808', '187596', '185189', '177589', '159456', '177625',
  '888922', '189696', '888930', '189629', '128008', '196086', '127413', '184051',
  '197254', '189033', '127121', '128026', '484697', '562747', '100314', '167046',
  '538140', '157738', '197422', '479742', '120520', '128646', '199415', '780129',
  '158897', '187912', '187649', '120468', '178432', '183825', '158670', '189141',
  '188120', '188039', '888942', '187432', '121219', '189438', '199109', '158811',
  '406387', '189617', '100781', '541553', '157435', '120589', '183334', '188178',
  '181433', '186111', '197749', '187417', '888038', '185520', '195945', '159047',
  '188577', '800184', '120512', '120555', '196025', '197074', '154135', '186562',
  '185159', '189336', '189419', '157055', '183743', '183433', '126592', '183278',
  '188558', '187488', '197456', '156745', '188756', '193827', '188606', '780360',
  '780001', '700116', '127519', '129733', '120815', '156519', '167624', '888890',
  '187400', '178201', '104886', '129216', '157540', '193613', '197236', '400259',
  '128003', '148483', '189772', '185017', '109950', '562026', '186144', '169112',
  '187746', '159763', '188877', '156428', '196693', '120708', '120871', '188849'
];

// Noms et prénoms français réalistes
export const FIRST_NAMES = [
  'Jean', 'Marie', 'Pierre', 'Michel', 'Alain', 'Philippe', 'Jacques', 'Bernard',
  'André', 'Paul', 'François', 'Louis', 'Daniel', 'Henri', 'Robert', 'Claude',
  'Gérard', 'René', 'Marcel', 'Roger', 'Patrick', 'Yves', 'Christian', 'Maurice',
  'Julien', 'Thierry', 'Nicolas', 'Olivier', 'Stéphane', 'Pascal', 'Éric', 'Laurent',
  'Frédéric', 'David', 'Christophe', 'Sébastien', 'Vincent', 'Bruno', 'Antoine',
  'Fabrice', 'Didier', 'Sylvain', 'Jérôme', 'Cédric', 'Lionel', 'Franck',
  'Nathalie', 'Isabelle', 'Sylvie', 'Catherine', 'Françoise', 'Monique', 'Christine',
  'Martine', 'Nicole', 'Brigitte', 'Véronique', 'Chantal', 'Dominique', 'Jacqueline',
  'Michèle', 'Danielle', 'Corinne', 'Sandrine', 'Valérie', 'Karine', 'Céline',
  'Stéphanie', 'Sophie', 'Patricia', 'Laurence', 'Pascale', 'Carole', 'Agnès',
  'Hélène', 'Muriel', 'Sabine', 'Audrey', 'Laetitia', 'Émilie', 'Julie', 'Virginie',
  'Delphine', 'Caroline', 'Florence', 'Amélie', 'Claire', 'Camille', 'Manon',
  'Sarah', 'Laura', 'Marine', 'Pauline', 'Charlotte', 'Léa', 'Emma', 'Chloé'
];

export const LAST_NAMES = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand',
  'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David',
  'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Lefèvre',
  'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'François', 'Martinez', 'Legrand',
  'Garnier', 'Faure', 'Rousseau', 'Blanc', 'Guerin', 'Muller', 'Henry', 'Roussel',
  'Nicolas', 'Perrin', 'Morin', 'Mathieu', 'Clement', 'Gauthier', 'Dumont',
  'Lopez', 'Fontaine', 'Chevalier', 'Robin', 'Masson', 'Sanchez', 'Gerard',
  'Nguyen', 'Boyer', 'Denis', 'Lemaire', 'Duval', 'Joly', 'Gautier', 'Roger',
  'Roche', 'Roy', 'Noel', 'Meyer', 'Lucas', 'Meunier', 'Jean', 'Perez',
  'Marchand', 'Dufour', 'Blanchard', 'Marie', 'Barbier', 'Brun', 'Dumas',
  'Brunet', 'Schmitt', 'Leroux', 'Colin', 'Fernandez', 'Castel', 'Giraud',
  'Fabre', 'Carpentier', 'Berger', 'Leclerc', 'Vasseur', 'Bourgeois', 'Vidal'
];

// Mapping des campus vers des noms de sites plus lisibles
export const CAMPUS_TO_SITE: { [key: string]: string } = {
  'D': 'Delta',
  'S': 'SARE',
  'H': 'HBW'
};

// Mapping des ward vers des services plus lisibles
export const WARD_TO_SERVICE: { [key: string]: string } = {
  'CONS': 'Consultation',
  'RADI': 'Radiologie',
  'LABO': 'Laboratoire',
  'KINE': 'Kinésithérapie',
  'URG': 'Urgences',
  'END': 'Endoscopie',
  'RMN': 'IRM',
  'RISO': 'Radiologie interventionnelle',
  'CPN': 'Cardiologie',
  'MON': 'Monitoring',
  'CSI': 'Chirurgie',
  'PCL': 'Polyclinique',
  'LSA': 'Laboratoire',
  'ANAP': 'Anesthésie',
  'NNE': 'Néonatologie',
  'HPR': 'Hôpital de jour',
  'SAC': 'Soins ambulatoires',
  'ADI': 'Admission',
  'PHAR': 'Pharmacie',
  'SOIN': 'Soins généraux',
  'PPC': 'Soins palliatifs',
  'SI1': 'Soins intensifs 1',
  'SI2': 'Soins intensifs 2',
  'PTEC': 'Plateau technique',
  'PJ1': 'Pédiatrie 1',
  'PJ2': 'Pédiatrie 2',
  'CSTO': 'Chirurgie stomatologie',
  'PREO': 'Pré-opératoire',
  'HJG': 'Hôpital de jour gériatrie',
  'NIC': 'Néonatologie intensive',
  'CGYP': 'Chirurgie gynécologique',
  'PAIN': 'Clinique de la douleur',
  'SAT': 'Satellite',
  'HUYL': 'Huy-Liège',
  'CMJ': 'Centre médical jeunes',
  'NEUR': 'Neurologie',
  'OPHT': 'Ophtalmologie',
  'ORTH': 'Orthopédie',
  'ORL': 'ORL',
  'REVA': 'Révalidation',
  'PMA': 'Procréation assistée',
  'PRE': 'Prématurés',
  'CIP': 'Chirurgie plastique',
  'CIA': 'Chirurgie ambulatoire',
  'PLA': 'Plastique',
  'PPO': 'Post-opératoire',
  'CCM': 'Cardiologie interventionnelle',
  'ECGY': 'Échocardiographie',
  'CIN': 'Chirurgie infantile',
  'HDI': 'Hôpital de jour',
  'LSE': 'Laboratoire spécialisé',
  'GHR': 'Gériatrie',
  'RXT': 'Radiothérapie'
};

// Fonction pour obtenir les services par site
export const getServicesBySite = (campusId: string): string[] => {
  return WARD_ADM_IDS.filter(wardId => {
    // Si le ward commence par le campus_id, il appartient à ce site
    return wardId.startsWith(campusId + '-') || wardId === campusId;
  });
};

// Fonction pour obtenir le nom lisible d'un service
export const getServiceName = (wardId: string): string => {
  // Extraire la partie service du ward_id (après le tiret)
  const servicePart = wardId.includes('-') ? wardId.split('-')[1] : wardId;
  return WARD_TO_SERVICE[servicePart] || servicePart;
};

// Fonction pour obtenir tous les sites disponibles
export const getAllSites = (): Array<{id: string, name: string}> => {
  return CAMPUS_IDS.map(id => ({
    id,
    name: CAMPUS_TO_SITE[id] || id
  }));
};

// Génération de noms de médecins
export const generateDoctorName = (doctorId: string): { firstName: string; lastName: string } => {
  // Utiliser l'ID comme seed pour avoir des noms cohérents
  const seed = parseInt(doctorId) || 123456;
  const firstNameIndex = seed % FIRST_NAMES.length;
  const lastNameIndex = (seed * 7) % LAST_NAMES.length;
  
  return {
    firstName: FIRST_NAMES[firstNameIndex],
    lastName: LAST_NAMES[lastNameIndex]
  };
};