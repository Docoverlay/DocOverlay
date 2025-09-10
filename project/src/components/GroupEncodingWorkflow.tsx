import React, { useState } from 'react';
import { Users, FileText, CheckCircle, ArrowRight, Settings, Save, Star } from 'lucide-react';
import { SavedDocument, Patient, Zone } from '../types';
import { getDocuments } from '../utils/database';
import { getUserSheetCustomizations } from '../utils/userPreferences';
import PatientSearch from './PatientSearch';

interface GroupEncodingWorkflowProps {
  onClose: () => void;
  onStartGroupEncoding: (document: SavedDocument, patients: Patient[], prefilledData: any) => void;
  userId: string;
}

export default function GroupEncodingWorkflow({ 
  onClose, 
  onStartGroupEncoding, 
  userId 
}: GroupEncodingWorkflowProps) {
  const [step, setStep] = useState<'sheet' | 'fill' | 'patients' | 'confirm'>('sheet');
  const [selectedDocument, setSelectedDocument] = useState<SavedDocument | null>(null);
  const [selectedPatients, setSelectedPatients] = useState<Patient[]>([]);
  const [prefilledZones, setPrefilledZones] = useState<{ [zoneId: number]: { code: string; checked: boolean } }>({});
  const [globalProvider, setGlobalProvider] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const documents = getDocuments();
  const userCustomizations = getUserSheetCustomizations(userId);

  const handleDocumentSelect = (doc: SavedDocument) => {
    setSelectedDocument(doc);
    // Initialiser les zones avec les valeurs par défaut
    const initialZones: { [zoneId: number]: { code: string; checked: boolean } } = {};
    doc.zones.forEach(zone => {
      initialZones[zone.id] = {
        code: zone.code || '',
        checked: false
      };
    });
    setPrefilledZones(initialZones);
    setStep('fill');
  };

  const handleZoneUpdate = (zoneId: number, field: 'code' | 'checked', value: string | boolean) => {
    setPrefilledZones(prev => ({
      ...prev,
      [zoneId]: {
        ...prev[zoneId],
        [field]: value
      }
    }));
  };

  const handlePatientsSelected = (patients: Patient[]) => {
    setSelectedPatients(patients);
  };

  const handleStartEncoding = () => {
    if (selectedDocument && selectedPatients.length > 0) {
      const prefilledData = {
        zones: prefilledZones,
        globalProvider,
        saveAsTemplate,
        templateName: saveAsTemplate ? templateName : undefined
      };
      onStartGroupEncoding(selectedDocument, selectedPatients, prefilledData);
    }
  };

  const removePatient = (patientId: string) => {
    setSelectedPatients(prev => prev.filter(p => p.id !== patientId));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full h-[90vh] flex flex-col">
        {/* Header */} {/* Changed max-w-6xl to w-full for full width */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Encodage groupé</h2>
              <p className="text-sm text-gray-600">
                {step === 'sheet' && 'Choisissez la feuille à préparer'}
                {step === 'fill' && 'Pré-remplissez la feuille'}
                {step === 'patients' && 'Sélectionnez les patients'}
                {step === 'confirm' && 'Confirmez l\'encodage groupé'}
              </p>
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

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-center space-x-8">
            <div className={`flex items-center space-x-2 ${step === 'sheet' ? 'text-purple-600' : selectedDocument ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'sheet' ? 'bg-purple-100 text-purple-600' : 
                selectedDocument ? 'bg-green-100 text-green-600' : 
                'bg-gray-100 text-gray-400'
              }`}>
                {selectedDocument ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="text-sm font-medium">Feuille</span>
            </div>
            
            <ArrowRight className={`w-4 h-4 ${selectedDocument ? 'text-green-300' : 'text-gray-300'}`} />
            
            <div className={`flex items-center space-x-2 ${step === 'fill' ? 'text-purple-600' : step === 'patients' || step === 'confirm' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'fill' ? 'bg-purple-100 text-purple-600' : 
                (step === 'patients' || step === 'confirm') ? 'bg-green-100 text-green-600' : 
                'bg-gray-100 text-gray-400'
              }`}>
                {(step === 'patients' || step === 'confirm') ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <span className="text-sm font-medium">Pré-remplissage</span>
            </div>
            
            <ArrowRight className={`w-4 h-4 ${(step === 'patients' || step === 'confirm') ? 'text-green-300' : 'text-gray-300'}`} />
            
            <div className={`flex items-center space-x-2 ${step === 'patients' ? 'text-purple-600' : selectedPatients.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'patients' ? 'bg-purple-100 text-purple-600' : 
                selectedPatients.length > 0 ? 'bg-green-100 text-green-600' : 
                'bg-gray-100 text-gray-400'
              }`}>
                {selectedPatients.length > 0 ? <CheckCircle className="w-5 h-5" /> : '3'}
              </div>
              <span className="text-sm font-medium">Patients ({selectedPatients.length})</span>
            </div>
            
            <ArrowRight className={`w-4 h-4 ${selectedPatients.length > 0 ? 'text-green-300' : 'text-gray-300'}`} />
            
            <div className={`flex items-center space-x-2 ${step === 'confirm' ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'confirm' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
              }`}>
                4
              </div>
              <span className="text-sm font-medium">Confirmation</span>
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Étape 1: Sélection de la feuille */}
          {step === 'sheet' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Choisissez la feuille à préparer</h3>
              
              {/* Feuilles personnalisées */}
              {userCustomizations.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-600" />
                    Mes feuilles personnalisées ({userCustomizations.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userCustomizations.map((customization) => {
                      const baseDocument = documents.find(doc => doc.id === customization.documentId);
                      if (!baseDocument) return null;
                      
                      return (
                        <button
                          key={customization.id}
                          onClick={() => handleDocumentSelect(baseDocument)}
                          className="p-4 border-2 border-purple-200 bg-purple-50 rounded-lg hover:border-purple-500 hover:bg-purple-100 transition-all text-left"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-purple-900">{customization.name}</h4>
                            {customization.isDefault && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                          </div>
                          <p className="text-sm text-purple-700 mb-2">
                            Basé sur: {baseDocument.name}
                          </p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                            baseDocument.docType === 'divers' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {baseDocument.docType === 'divers' ? 'Frais divers' : 'Prestations'}
                          </span>
                          <p className="text-xs text-purple-600">
                            {Object.values(customization.preCheckedZones).filter(Boolean).length} zone(s) pré-cochée(s)
                            {customization.defaultProvider && ` • Prestataire: ${customization.defaultProvider}`}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Feuilles standard */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Feuilles standard ({documents.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleDocumentSelect(doc)}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">{doc.name}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                        doc.docType === 'divers' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {doc.docType === 'divers' ? 'Frais divers' : 'Prestations'}
                      </span>
                      <p className="text-sm text-gray-600">
                        {doc.zones.length} zone(s) • Créé le {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Pré-remplissage */}
          {step === 'fill' && selectedDocument && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Pré-remplissage: {selectedDocument.name}
                </h3>
                <div className="flex items-center gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveAsTemplate}
                      onChange={(e) => setSaveAsTemplate(e.target.checked)}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Sauvegarder comme template</span>
                  </label>
                </div>
              </div>

              {saveAsTemplate && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-purple-900 mb-2">
                    Nom du template
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Ex: Bilan cardiaque standard"
                    className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              {selectedDocument.docType === 'prestations' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Prestataire global (optionnel)
                  </label>
                  <input
                    type="text"
                    value={globalProvider}
                    onChange={(e) => setGlobalProvider(e.target.value)}
                    placeholder="Ex: Dr. Martin, 123456"
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-blue-700 mt-1">
                    Si renseigné, sera appliqué à tous les patients sélectionnés
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Zones disponibles</h4>
                {selectedDocument.zones.map((zone) => (
                  <div key={zone.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-4 mb-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={prefilledZones[zone.id]?.checked || false}
                          onChange={(e) => handleZoneUpdate(zone.id, 'checked', e.target.checked)}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Pré-cocher cette zone
                        </span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code par défaut
                      </label>
                      <input
                        type="text"
                        value={prefilledZones[zone.id]?.code || ''}
                        onChange={(e) => handleZoneUpdate(zone.id, 'code', e.target.value)}
                        placeholder={zone.code || "Entrez un code par défaut"}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Étape 3: Sélection des patients */}
          {step === 'patients' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sélectionnez les patients</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full"> {/* Added h-full */}
                {/* Colonne de gauche: Recherche de patients */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Rechercher et ajouter</h4>
                  <PatientSearch
                    onSelectPatient={() => {}} // Non utilisé en mode multi
                    onSelectMultiple={handlePatientsSelected} 
                    allowMultiSelect={true}
                    selectedPatients={selectedPatients}
                    className="mb-6"
                  />
                </div>

                {/* Colonne de droite: Patients sélectionnés */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3 shrink-0"> {/* Added shrink-0 */}
                    Patients sélectionnés ({selectedPatients.length})
                  </h4>
                  {selectedPatients.length > 0 ? (
                    <div className="flex flex-col flex-1 overflow-hidden"> {/* Added flex flex-col flex-1 overflow-hidden */}
                      <div className="space-y-2 overflow-auto flex-1"> {/* Modified classes */}
                        {selectedPatients.map((patient) => (
                          <div key={patient.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">
                                {patient.firstName} {patient.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {patient.site} - {patient.floor} - Chambre {patient.room} - Lit {patient.bed}
                              </div>
                            </div>
                            <button
                              onClick={() => removePatient(patient.id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">Aucun patient sélectionné pour le moment.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Étape 4: Confirmation */}
          {step === 'confirm' && selectedDocument && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Confirmation de l'encodage groupé</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Feuille préparée</h4>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900">{selectedDocument.name}</h5>
                    <p className="text-sm text-gray-600 mt-1">
                      {Object.values(prefilledZones).filter(z => z.checked).length} zone(s) pré-cochée(s)
                    </p>
                    {globalProvider && (
                      <p className="text-sm text-blue-600 mt-1">
                        Prestataire: {globalProvider}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Patients concernés ({selectedPatients.length})
                  </h4>
                  <div className="border border-gray-200 rounded-lg p-4 max-h-40 overflow-auto">
                    {selectedPatients.map((patient) => (
                      <div key={patient.id} className="text-sm text-gray-700 py-1">
                        {patient.firstName} {patient.name} - {patient.site} {patient.room}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {step === 'sheet' && 'Sélectionnez une feuille pour commencer'}
              {step === 'fill' && selectedDocument && `Feuille: ${selectedDocument.name}`}
              {step === 'patients' && `${selectedPatients.length} patient(s) sélectionné(s)`}
              {step === 'confirm' && 'Prêt pour l\'encodage groupé'}
            </div>
            
            <div className="flex items-center gap-3">
              {step !== 'sheet' && (
                <button
                  onClick={() => {
                    if (step === 'fill') setStep('sheet');
                    else if (step === 'patients') setStep('fill');
                    else if (step === 'confirm') setStep('patients');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  ← Précédent
                </button>
              )}
              
              {step === 'sheet' && selectedDocument && (
                <button
                  onClick={() => setStep('fill')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Continuer →
                </button>
              )}
              
              {step === 'fill' && (
                <button
                  onClick={() => setStep('patients')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Continuer →
                </button>
              )}
              
              {step === 'patients' && selectedPatients.length > 0 && (
                <button
                  onClick={() => setStep('confirm')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Continuer →
                </button>
              )}
              
              {step === 'confirm' && (
                <button
                  onClick={handleStartEncoding}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Démarrer l'encodage groupé
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}