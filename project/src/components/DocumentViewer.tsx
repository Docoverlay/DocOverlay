import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Save, FileText, User as UserIcon, Download, Building2, CheckCircle, AlertCircle, Calendar, Users } from 'lucide-react';
import Button from './ui/Button';
import ButtonGroup from './ui/ButtonGroup';
import { SavedDocument, Patient, Zone } from '../types';
import { saveEncodingSession, completeEncodingSession, addAuditLog } from '../utils/database';
import { getUserSheetCustomizations, getDefaultProviderCode } from '../utils/userPreferences';

interface DocumentViewerProps {
  document: SavedDocument;
  patient: Patient;
  onBack: () => void;
  userId?: string;
}

export default function DocumentViewer({ document, patient, onBack, userId = 'current_user' }: DocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Initialiser les zones avec la personnalisation par défaut si disponible
  const [zones, setZones] = useState<Zone[]>(() => {
    // Initialisation simple sans personnalisation (sera appliquée dans useEffect)
    return document.zones.map(zone => ({ ...zone, checked: false }));
  });
  
  const [scale, setScale] = useState(1);
  const [success, setSuccess] = useState<string>('');
  const [sessionId] = useState<string>(`session_${Date.now()}`);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateValidated, setDateValidated] = useState(false);
  const [showMultiDateModal, setShowMultiDateModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isMultiDate, setIsMultiDate] = useState(false);
  
  // États pour la gestion du prestataire (seulement pour les prestations)
  const [globalPrestataire, setGlobalPrestataire] = useState('');
  const [useGlobalPrestataire, setUseGlobalPrestataire] = useState(true);
  const [zonePrestataires, setZonePrestataires] = useState<{ [zoneId: number]: string }>({});
  const [error, setError] = useState<string>('');

  // Appliquer la personnalisation par défaut et le code prestataire au chargement
  useEffect(() => {
    const customizations = getUserSheetCustomizations(userId, document.id);
    const defaultCustomization = customizations.find(c => c.isDefault) || customizations[0] || null;
    
    // Charger le code prestataire par défaut
    if (document.docType === 'prestations') {
      let defaultProvider = '';
      
      // Priorité 1: Prestataire de la personnalisation
      if (defaultCustomization?.defaultProvider && defaultCustomization.defaultProvider.trim() !== '') {
        defaultProvider = defaultCustomization.defaultProvider;
      } else {
        // Priorité 2: Prestataire des préférences générales
        const userDefaultProvider = getDefaultProviderCode(userId);
        if (userDefaultProvider && userDefaultProvider.trim() !== '') {
          defaultProvider = userDefaultProvider;
        }
      }
      
      setGlobalPrestataire(defaultProvider);
    }
    
    if (defaultCustomization) {
      // Appliquer les zones pré-cochées
      setZones(prevZones => {
        const updatedZones = prevZones.map(zone => {
          const shouldBeChecked = defaultCustomization.preCheckedZones?.[zone.id] === true;
          return {
            ...zone,
            checked: shouldBeChecked
          };
        });
        return updatedZones;
      });
    }
  }, [userId, document.id]);

  // Calculate scale factor for responsive image
  React.useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    
    function updateScale() {
      if (img.naturalWidth > 0) {
        const ratio = img.clientWidth / img.naturalWidth;
        setScale(ratio);
      }
    }
    
    if (img.complete && img.naturalWidth > 0) {
      updateScale();
    }
    
    img.addEventListener('load', updateScale);
    window.addEventListener('resize', updateScale);
    
    return () => {
      img.removeEventListener('load', updateScale);
      window.removeEventListener('resize', updateScale);
    };
  }, [document.backgroundImage]);
  React.useEffect(() => {
    // Log du début de session
    addAuditLog({
      userId: 'current_user',
      action: 'ENCODING_SESSION_START',
      details: `Début d'encodage - Document: ${document.name}, Patient: ${patient.firstName} ${patient.name}`,
      documentId: document.id,
      patientId: patient.id
    });

    // Créer la session d'encodage
    saveEncodingSession({
      id: sessionId,
      documentId: document.id,
      patientId: patient.id,
      userId: 'current_user',
      startedAt: new Date(),
      zones: zones,
      status: 'active'
    });
  }, []);

  const toggleZone = (id: number) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, checked: !z.checked } : z));
    setHasUnsavedChanges(true);
    
    // Si la zone est décochée, supprimer son prestataire individuel
    const zone = zones.find(z => z.id === id);
    if (zone?.checked) { // Si on décoche la zone
      setZonePrestataires(prev => {
        const newPrestataires = { ...prev };
        delete newPrestataires[id];
        return newPrestataires;
      });
    }
    
    // Sauvegarder automatiquement la session
    setTimeout(() => {
      const updatedZones = zones.map(z => z.id === id ? { ...z, checked: !z.checked } : z);
      saveEncodingSession({
        id: sessionId,
        documentId: document.id,
        patientId: patient.id,
        userId: 'current_user',
        startedAt: new Date(),
        zones: updatedZones,
        status: 'active'
      });
    }, 100);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const handleSave = () => {
    // TODO: Sauvegarder les données encodées pour le patient
    
    // Vérification des prestataires pour les prestations
    if (document.docType === 'prestations') {
      const checkedZones = zones.filter(z => z.checked && z.code.trim() !== '');
      
      if (!useGlobalPrestataire) {
        // Vérifier que chaque zone cochée a un prestataire
        const missingPrestataires = checkedZones.filter(zone => 
          !zonePrestataires[zone.id] || zonePrestataires[zone.id].trim() === ''
        );
        
        if (missingPrestataires.length > 0) {
          showError(`Prestataire requis pour chaque prestation cochée. ${missingPrestataires.length} prestation(s) sans prestataire.`);
          return;
        }
      } else if (!globalPrestataire.trim()) {
        showError('Veuillez renseigner le prestataire global.');
        return;
      }
    }
    
    const encodingData = {
      documentId: document.id,
      patientId: patient.id,
      zones: zones.filter(z => z.code.trim() !== ''),
      encodedAt: new Date(),
      docType: document.docType,
      providerCode: document.providerCode,
      globalPrestataire: document.docType === 'prestations' ? globalPrestataire : undefined,
      useGlobalPrestataire: document.docType === 'prestations' ? useGlobalPrestataire : undefined,
      zonePrestataires: document.docType === 'prestations' && !useGlobalPrestataire ? zonePrestataires : undefined
    };
    
    // Pour l'instant, sauvegarde dans localStorage
    const encodings = JSON.parse(localStorage.getItem('encodings') || '[]');
    encodings.push(encodingData);
    localStorage.setItem('encodings', JSON.stringify(encodings));
    
    // Compléter la session
    completeEncodingSession(sessionId);
    
    // Log de la sauvegarde
    addAuditLog({
      userId: 'current_user',
      action: 'ENCODING_SAVE',
      details: `Sauvegarde encodage - ${zones.filter(z => z.checked).length} zones cochées`,
      documentId: document.id,
      patientId: patient.id
    });
    
    setHasUnsavedChanges(false);
    setSuccess('Encodage sauvegardé avec succès !');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleExportMRT = () => {
    const checkedZones = zones.filter(z => z.checked && z.code.trim() !== '');
    
    if (checkedZones.length === 0) {
      alert('Aucune zone cochée avec un code valide.');
      return;
    }
    
    if (!dateValidated) {
      alert('Veuillez valider la date de prestation avant l\'export.');
      return;
    }
    
    // Vérification des prestataires pour les prestations
    if (document.docType === 'prestations') {
      if (!useGlobalPrestataire) {
        // Vérifier que chaque zone cochée a un prestataire
        const missingPrestataires = checkedZones.filter(zone => 
          !zonePrestataires[zone.id] || zonePrestataires[zone.id].trim() === ''
        );
        
        if (missingPrestataires.length > 0) {
          showError(`Veuillez renseigner le prestataire pour toutes les prestations cochées (${missingPrestataires.length} manquante(s)).`);
          return;
        }
      } else if (!globalPrestataire.trim()) {
        showError('Veuillez renseigner le prestataire global.');
        return;
      }
    }

    const datesToExport = isMultiDate && selectedDates.length > 0 ? selectedDates : [currentDate];
    
    const lines: string[] = [];
    datesToExport.forEach(date => {
      checkedZones.forEach(zone => {
        // Déterminer le prestataire à utiliser
        let prestataire = '';
        if (document.docType === 'divers') {
          prestataire = document.providerCode || '';
        } else if (useGlobalPrestataire && globalPrestataire) {
          prestataire = globalPrestataire;
        } else {
          prestataire = zonePrestataires[zone.id] || '';
        }
        
        lines.push(`${patient.socialSecurityNumber} | Chambre ${patient.room} | Lit ${patient.bed} | Code prestation ${zone.code} | Prestataire: ${prestataire} | Date: ${date}`);
      });
    });

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MRT_${patient.name}_${patient.firstName}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Log de l'export
    addAuditLog({
      userId: 'current_user',
      action: 'MRT_EXPORT',
      details: `Export MRT - ${checkedZones.length} prestations exportées`,
      documentId: document.id,
      patientId: patient.id
    });
  };
  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (!confirm('Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?')) {
        return;
      }
    }
    
    // Log de fin de session
    addAuditLog({
      userId: 'current_user',
      action: 'ENCODING_SESSION_END',
      details: `Fin d'encodage - ${zones.filter(z => z.checked).length} zones cochées`,
      documentId: document.id,
      patientId: patient.id
    });
    
    onBack();
  };

  const getZoneColor = (zone: Zone) => {
    if (zone.checked && zone.code) return 'bg-green-200 border-green-500';
    if (zone.checked) return 'bg-blue-200 border-blue-500';
    if (zone.code) return 'bg-gray-200 border-gray-400';
    return 'bg-red-200 border-red-400';
  };

  const getZoneText = (zone: Zone) => {
    if (zone.checked) return '✓';
    return '';
  };

  const toggleDate = (date: string) => {
    setSelectedDates(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    
    return days;
  };
  const handleZonePrestataire = (zoneId: number, value: string) => {
    setZonePrestataires(prev => ({
      ...prev,
      [zoneId]: value
    }));
    setHasUnsavedChanges(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="secondary" leadingIcon={<ArrowLeft className="w-4 h-4" />} onClick={handleBack}>
              Retour
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                Encodage - {document.name}
              </h1>
              <p className="text-gray-600">
                Patient: {patient.firstName} {patient.name}
              </p>
            </div>
            <ButtonGroup>
              <Button 
                variant="primary" 
                leadingIcon={<Save className="w-4 h-4" />} 
                onClick={handleSave}
                disabled={!dateValidated}
              >
                Enregistrer l'encodage
              </Button>
              <Button 
                variant="secondary" 
                leadingIcon={<Download className="w-4 h-4" />} 
                onClick={handleExportMRT}
                disabled={!dateValidated}
              >
                Exporter MRT
              </Button>
            </ButtonGroup>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Vous avez des modifications non sauvegardées. N'oubliez pas de sauvegarder !
          </div>
        )}

        {/* Date de prestation */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Date de prestation
          </h2>
          
          <div className="space-y-4">
            {/* Mode de sélection des dates */}
            <div className="flex items-center gap-6 mb-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="dateMode"
                  checked={!isMultiDate}
                  onChange={() => {
                    setIsMultiDate(false);
                    setSelectedDates([]);
                    setDateValidated(false);
                  }}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Date unique</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="dateMode"
                  checked={isMultiDate}
                  onChange={() => {
                    setIsMultiDate(true);
                    setSelectedDates([currentDate]);
                    setDateValidated(false);
                  }}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Dates multiples</span>
              </label>
            </div>

            {/* Sélection date unique */}
            {!isMultiDate && (
              <div className="flex items-center gap-4">
                <div className="flex items-end gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de la prestation
                    </label>
                    <input
                      type="date"
                      value={currentDate}
                      onChange={(e) => {
                        setCurrentDate(e.target.value);
                        setDateValidated(false);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <button
                    onClick={() => setDateValidated(true)}
                    disabled={dateValidated}
                    className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-green-600 disabled:cursor-default focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    {dateValidated ? '✓ Validée' : 'Valider'}
                  </button>
                </div>
              </div>
            )}

            {/* Sélection dates multiples */}
            {isMultiDate && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Sélectionnez les dates de prestation
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                      {selectedDates.length} date(s) sélectionnée(s)
                    </span>
                    <button
                      onClick={() => setDateValidated(true)}
                      disabled={dateValidated || selectedDates.length === 0}
                      className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-green-600 disabled:cursor-default focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                      {dateValidated ? '✓ Validées' : 'Valider'}
                    </button>
                  </div>
                </div>

                {/* Calendrier intégré */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </h4>
                    <p className="text-xs text-gray-600">
                      Cliquez sur les dates pour les sélectionner/désélectionner
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                    {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
                      <div key={day} className="font-medium text-gray-500 p-2">{day}</div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendarDays().map((date, index) => {
                      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                      const isCurrentMonth = date.getMonth() === new Date().getMonth();
                      const isSelected = selectedDates.includes(dateStr);
                      const today = new Date();
                      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                      const isToday = dateStr === todayStr;
                      
                      return (
                        <button
                          key={index}
                          onClick={() => toggleDate(dateStr)}
                          disabled={!isCurrentMonth}
                          className={`p-2 text-sm rounded transition-colors ${
                            !isCurrentMonth 
                              ? 'text-gray-300 cursor-not-allowed'
                              : isSelected
                              ? 'bg-blue-600 text-white font-semibold'
                              : isToday
                              ? 'bg-blue-100 text-blue-600 font-semibold hover:bg-blue-200'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          {new Date(date + 'T12:00:00').toLocaleDateString('fr-FR')}
                        </button>
                      );
                    })}
                  </div>
                  
                  {selectedDates.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-300">
                      <h5 className="text-xs font-semibold text-gray-700 mb-2">Dates sélectionnées :</h5>
                      <div className="flex flex-wrap gap-1">
                        {selectedDates.sort().map(date => (
                          <span
                            key={date}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                          >
                            {new Date(date).toLocaleDateString('fr-FR')}
                            <button
                              onClick={() => toggleDate(date)}
                              className="text-blue-600 hover:text-blue-800 ml-1"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => setSelectedDates([])}
                        className="mt-2 text-xs text-red-600 hover:text-red-800"
                      >
                        Effacer toutes les dates
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Facturation multi-dates - déplacé immédiatement après la date */}
            {/* Gestion du prestataire pour les prestations */}
            {document.docType === 'prestations' && (
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Prestataire
                </h3>
                <div className="space-y-3">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prestataire global {globalPrestataire && globalPrestataire.trim() !== '' && (
                          <span className="text-xs text-green-600 font-normal">(pré-rempli depuis vos préférences)</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={globalPrestataire}
                        onChange={(e) => {
                          setGlobalPrestataire(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="Ex: Dr. Martin, 123456"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {globalPrestataire && globalPrestataire.trim() !== '' && (
                        <p className="text-xs text-gray-600 mt-1">
                          💡 Ce code provient de vos préférences utilisateur. Vous pouvez le modifier si nécessaire.
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useGlobalPrestataire"
                      checked={useGlobalPrestataire}
                      onChange={(e) => {
                        setUseGlobalPrestataire(e.target.checked);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="useGlobalPrestataire" className="text-sm text-gray-700">
                      Appliquer ce prestataire à toute la feuille
                    </label>
                  </div>
                  
                  {!useGlobalPrestataire && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Mode individuel activé :</strong> Un champ prestataire apparaîtra à côté de chaque case cochée. 
                        Tous les champs doivent être remplis avant la sauvegarde.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {!dateValidated && (
              <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg text-sm">
                ⚠️ La validation {isMultiDate && selectedDates.length > 1 ? 'des dates' : 'de la date'} est obligatoire pour activer la sauvegarde et l'export.
              </div>
            )}
          </div>
        </div>

        {/* Patient Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            Informations patient
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700 critical-info">Site:</span>
              <div className="flex items-center gap-1 critical-info">
                <Building2 className="w-4 h-4 text-blue-600" />
                {patient.site}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700 critical-info">Nom:</span>
              <div className="critical-info">{patient.name}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700 critical-info">Prénom:</span>
              <div className="critical-info">{patient.firstName}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700 critical-info">Chambre:</span>
              <div className="critical-info">{patient.room}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700 critical-info">Lit:</span>
              <div className="critical-info">{patient.bed}</div>
            </div>
            <div>
              <span className="font-medium text-gray-700 critical-info">Date de naissance:</span>
              <div className="critical-info">{new Date(patient.birthDate).toLocaleDateString()}</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <span className="font-medium text-gray-700 critical-info">NISS:</span>
            <div className="font-mono text-lg critical-info">{patient.socialSecurityNumber}</div>
          </div>
        </div>

        {/* Document Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Informations document
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Type:</span>
              <div>{document.docType === 'divers' ? 'Frais divers' : 'Prestations'}</div>
            </div>
            {document.providerCode && (
              <div>
                <span className="font-medium text-gray-700">Code prestataire:</span>
                <div>{document.providerCode}</div>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700">Zones:</span>
              <div>{document.zones.length} zone(s)</div>
            </div>
          </div>
        </div>

        {/* Document Viewer */}
        <div className="relative">
          <div 
            ref={containerRef}
            className="relative mx-auto bg-white"
            style={{ 
              position: 'relative',
              display: 'inline-block',
              padding: 0,
              margin: 0,
              lineHeight: 0
            }}
          >
            {document.backgroundImage ? (
              <img 
                ref={imgRef}
                src={document.backgroundImage} 
                alt="Document background" 
                className="block"
                style={{
                  display: 'block',
                  verticalAlign: 'top',
                  width: 'auto',
                  maxWidth: '100%',
                  height: 'auto',
                  margin: 0,
                  padding: 0,
                  lineHeight: 0
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[500px] text-gray-500">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">Document sans image de fond</p>
                </div>
              </div>
            )}
            
            {zones.map(zone => (
              <div
                key={zone.id}
                className="absolute transition-all duration-200 cursor-pointer group"
                style={{
                  position: 'absolute',
                  top: `${zone.top * scale}px`,
                  left: `${zone.left * scale}px`,
                  width: `${zone.width * scale}px`,
                  height: `${zone.height * scale}px`,
                  backgroundColor: zone.checked ? 'rgba(46, 204, 113, 0.2)' : 'rgba(0,0,0,0.05)',
                  zIndex: 10,
                  border: zone.checked ? '2px solid #2ecc71' : '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '2px',
                  boxSizing: 'border-box'
                }}
                onClick={() => toggleZone(zone.id)}
                onMouseEnter={(e) => {
                  if (!zone.checked) {
                    e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!zone.checked) {
                    e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
                  }
                }}
              >
                {zone.checked && (
                  <div 
                    className="flex items-center justify-center w-full h-full"
                    style={{ 
                      backgroundColor: 'rgba(46, 204, 113, 0.95)',
                      pointerEvents: 'none'
                    }}
                  >
                    <span style={{ 
                      color: 'white', 
                      fontSize: `${Math.min(zone.width * scale / 3, zone.height * scale / 2, 48)}px`,
                      fontWeight: 'bold',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      lineHeight: '1',
                      userSelect: 'none'
                    }}>
                    ✓
                    </span>
                  </div>
                )}
                
                {/* Champ prestataire individuel pour les prestations */}
                {zone.checked && 
                 document.docType === 'prestations' && 
                 !useGlobalPrestataire && (
                  <div 
                    className="absolute bg-white border-2 border-blue-400 rounded-lg shadow-lg p-2 z-20"
                    style={{
                      top: `${zone.height * scale + 5}px`,
                      left: '0px',
                      minWidth: `${Math.max(150, zone.width * scale)}px`,
                      fontSize: '12px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-3 h-3 text-gray-500" />
                      <span className="text-xs font-medium text-gray-700">Prestataire requis</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={zonePrestataires[zone.id] || ''}
                        onChange={(e) => handleZonePrestataire(zone.id, e.target.value)}
                        placeholder="Ex: Dr. Martin"
                        className={`flex-1 px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          !zonePrestataires[zone.id] || zonePrestataires[zone.id].trim() === '' 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-green-300 bg-green-50'
                        }`}
                        autoFocus
                      />
                      {zonePrestataires[zone.id] && zonePrestataires[zone.id].trim() !== '' && (
                        <span className="text-green-600 text-xs">✓</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bouton de sauvegarde dupliqué en bas */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <strong>{zones.filter(z => z.checked).length}</strong> prestation(s) cochée(s)
              {isMultiDate && selectedDates.length > 1 && (
                <span className="ml-2">• <strong>{selectedDates.length}</strong> date(s) sélectionnée(s)</span>
              )}
              {hasUnsavedChanges && (
                <span className="ml-2 text-yellow-600">• Modifications non sauvegardées</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <ButtonGroup>
                <Button 
                  variant="primary" 
                  leadingIcon={<Save className="w-4 h-4" />} 
                  onClick={handleSave}
                  disabled={!dateValidated}
                >
                  Enregistrer l'encodage
                </Button>
                <Button 
                  variant="secondary" 
                  leadingIcon={<Download className="w-4 h-4" />} 
                  onClick={handleExportMRT}
                  disabled={!dateValidated}
                >
                  Exporter MRT
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </div>

        {/* Modal de sélection multi-dates */}
        {showMultiDateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Sélectionner les dates de facturation
              </h3>
              
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">
                  {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                  {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
                    <div key={day} className="font-medium text-gray-500 p-2">{day}</div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays().map((date, index) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const isCurrentMonth = date.getMonth() === new Date().getMonth();
                    const isSelected = selectedDates.includes(dateStr);
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    
                    return (
                      <button
                        key={index}
                        onClick={() => toggleDate(dateStr)}
                        disabled={!isCurrentMonth}
                        className={`p-2 text-sm rounded transition-colors ${
                          !isCurrentMonth 
                            ? 'text-gray-300 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-600 text-white'
                            : isToday
                            ? 'bg-blue-100 text-blue-600 font-semibold'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowMultiDateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setShowMultiDateModal(false);
                    if (selectedDates.length > 0) {
                      setDateValidated(false); // Forcer une nouvelle validation
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Confirmer ({selectedDates.length})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}