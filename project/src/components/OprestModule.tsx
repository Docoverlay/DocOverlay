import React, { useState } from 'react';
import { X, Search, User, FileText, Settings } from 'lucide-react';
import { User as UserType } from '../types';
import PatientSearch from './PatientSearch';
import Button from './ui/Button';
import ButtonGroup from './ui/ButtonGroup';

interface OprestModuleProps {
  user: UserType;
  onClose: () => void;
}

export default function OprestModule({ user, onClose }: OprestModuleProps) {
  // États pour les filtres
  const [selectedSite, setSelectedSite] = useState('Tous');
  const [selectedLocation, setSelectedLocation] = useState('Toutes');
  const [selectedContactType, setSelectedContactType] = useState('Tous');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [prestataire, setPrestataire] = useState('');
  const [interventionDate, setInterventionDate] = useState('');
  const [dateType, setDateType] = useState('Date relative');
  const [period, setPeriod] = useState('Aujourd\'hui');
  const [interventionType, setInterventionType] = useState('');
  const [sheetId, setSheetId] = useState('');
  const [sheetStatus, setSheetStatus] = useState('Tous');
  const [sheetValidity, setSheetValidity] = useState('Tous');
  const [commentary, setCommentary] = useState('');
  const [injectionDate, setInjectionDate] = useState('Date relative');
  const [injectionPeriod, setInjectionPeriod] = useState('Aucune');
  const [showPatientSearch, setShowPatientSearch] = useState(false);

  const handleResetSearch = () => {
    setSelectedSite('Tous');
    setSelectedLocation('Toutes');
    setSelectedContactType('Tous');
    setSelectedPatient('');
    setPrestataire('');
    setInterventionDate('');
    setInterventionType('');
    setSheetId('');
    setSheetStatus('Tous');
    setSheetValidity('Tous');
    setCommentary('');
  };

  const handleSaveAndApply = () => {
    // Logique pour enregistrer et appliquer les filtres
    console.log('Enregistrement et application des filtres...');
    alert('Filtres enregistrés et appliqués avec succès !');
  };

  const handleApplySearch = () => {
    // Logique pour appliquer la recherche
    console.log('Application de la recherche...');
    alert('Recherche appliquée !');
  };

  return (
    <div className="fixed inset-0 bg-white z-50">
      {/* Header */}
      <div className="h-16 border-b bg-white shadow-sm flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-slate-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Prest</h1>
            <p className="text-sm text-gray-600">Encodage numérique</p>
          </div>
        </div>
        
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          onClick={onClose}
        >
          Retour
        </button>
      </div>

      {/* Navigation/Breadcrumb */}
      <div className="bg-gray-50 border-b px-6 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Sélectionner une rech...</span>
          <select className="border border-gray-300 rounded px-2 py-1 text-sm bg-white">
            <option>Recherche standard</option>
          </select>
          <div className="flex items-center gap-2 ml-4">
            <Settings className="w-4 h-4 text-gray-500" />
            <Settings className="w-4 h-4 text-gray-500" />
            <button className="text-blue-600 hover:text-blue-800 text-sm">
              Masquer le contenu de la recherche
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne 1: Unité */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Unité</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Site</label>
                  <select
                    value={selectedSite}
                    onChange={(e) => setSelectedSite(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Tous">Tous</option>
                    <option value="Delta">Delta</option>
                    <option value="SARE">SARE</option>
                    <option value="HBW">HBW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Localisation</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Toutes">Toutes</option>
                    <option value="Consultation">Consultation</option>
                    <option value="Chirurgie">Chirurgie</option>
                    <option value="Médecine">Médecine</option>
                    <option value="Réa">Réa</option>
                    <option value="Radiologie">Radiologie</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Séjour */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Séjour</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de contact</label>
                <select
                  value={selectedContactType}
                  onChange={(e) => setSelectedContactType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Tous">Tous</option>
                  <option value="Hospitalisation">Hospitalisation</option>
                  <option value="Ambulatoire">Ambulatoire</option>
                  <option value="Urgence">Urgence</option>
                </select>
              </div>
            </div>

            {/* Intervention */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Intervention</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date d'intervention</label>
                  <div className="flex gap-2">
                    <select
                      value={dateType}
                      onChange={(e) => setDateType(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Date relative">Date relative</option>
                      <option value="Période">Période</option>
                      <option value="Date exacte">Date exacte</option>
                    </select>
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Aujourd'hui">Aujourd'hui</option>
                      <option value="Hier">Hier</option>
                      <option value="Cette semaine">Cette semaine</option>
                      <option value="Ce mois">Ce mois</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type d'intervention</label>
                  <input
                    type="text"
                    value={interventionType}
                    onChange={(e) => setInterventionType(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Saisissez le type d'intervention"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Colonne 2: Patient */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Patient</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={selectedPatient}
                      onChange={(e) => setSelectedPatient(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nom du patient"
                      readOnly
                    />
                    <button
                      onClick={() => setShowPatientSearch(true)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Rechercher un patient
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prestataire</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={prestataire}
                      onChange={(e) => setPrestataire(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nom, Prénom (3 car. min.)"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne 3: Feuille de prestation */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Feuille de prestation</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ID de feuille</label>
                  <input
                    type="text"
                    value={sheetId}
                    onChange={(e) => setSheetId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Identifiant de la feuille"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <select
                    value={sheetStatus}
                    onChange={(e) => setSheetStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Tous">Tous</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminé">Terminé</option>
                    <option value="Validé">Validé</option>
                    <option value="Archivé">Archivé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">État de validité</label>
                  <select
                    value={sheetValidity}
                    onChange={(e) => setSheetValidity(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Tous">Tous</option>
                    <option value="Valide">Valide</option>
                    <option value="À valider">À valider</option>
                    <option value="Invalide">Invalide</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire</label>
                  <select
                    value={commentary}
                    onChange={(e) => setCommentary(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Normal">Normal</option>
                    <option value="À revoir">À revoir</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date d'injection</label>
                  <div className="flex gap-2">
                    <select
                      value={injectionDate}
                      onChange={(e) => setInjectionDate(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Date relative">Date relative</option>
                      <option value="Période">Période</option>
                      <option value="Date exacte">Date exacte</option>
                    </select>
                    <select
                      value={injectionPeriod}
                      onChange={(e) => setInjectionPeriod(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Aucune">Aucune</option>
                      <option value="Aujourd'hui">Aujourd'hui</option>
                      <option value="Hier">Hier</option>
                      <option value="Cette semaine">Cette semaine</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8">
          <ButtonGroup align="right">
            <Button variant="tertiary" onClick={handleResetSearch}>
            Réinitialiser la recherche
            </Button>
            <Button variant="secondary" onClick={handleSaveAndApply}>
              Enregistrer et appliquer
            </Button>
            <Button variant="primary" onClick={handleApplySearch}>
              Appliquer la recherche
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {/* Modal de recherche de patient */}
      {showPatientSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Rechercher un patient</h2>
              <button 
                onClick={() => setShowPatientSearch(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <PatientSearch
              onSelectPatient={(patient) => {
                setSelectedPatient(`${patient.firstName} ${patient.name}`);
                setShowPatientSearch(false);
              }}
              className="mb-4"
            />
            
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setShowPatientSearch(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}