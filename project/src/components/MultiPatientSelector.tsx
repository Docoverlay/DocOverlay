import React, { useState } from 'react';
import { Users, CheckCircle, AlertCircle, Play, X } from 'lucide-react';
import { Patient, SavedDocument } from '../types';
import PatientSearch from './PatientSearch';

interface MultiPatientSelectorProps {
  onClose: () => void;
  onStartGroupEncoding: (patients: Patient[], document: SavedDocument) => void;
  documents: SavedDocument[];
}

export default function MultiPatientSelector({ onClose, onStartGroupEncoding, documents }: MultiPatientSelectorProps) {
  const [selectedPatients, setSelectedPatients] = useState<Patient[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<SavedDocument | null>(null);
  const [step, setStep] = useState<'patients' | 'document' | 'confirm'>('patients');

  const handlePatientsSelected = (patients: Patient[]) => {
    setSelectedPatients(patients);
  };

  const handleDocumentSelected = (doc: SavedDocument) => {
    setSelectedDocument(doc);
    setStep('confirm');
  };

  const handleStartEncoding = () => {
    if (selectedPatients.length > 0 && selectedDocument) {
      onStartGroupEncoding(selectedPatients, selectedDocument);
    }
  };

  const removePatient = (patientId: string) => {
    setSelectedPatients(prev => prev.filter(p => p.id !== patientId));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Encodage groupé</h2>
              <p className="text-sm text-gray-600">
                {step === 'patients' && 'Sélectionnez les patients'}
                {step === 'document' && 'Choisissez la feuille à appliquer'}
                {step === 'confirm' && 'Confirmez l\'encodage groupé'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-center space-x-8">
            <div className={`flex items-center space-x-2 ${step === 'patients' ? 'text-blue-600' : selectedPatients.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'patients' ? 'bg-blue-100 text-blue-600' : 
                selectedPatients.length > 0 ? 'bg-green-100 text-green-600' : 
                'bg-gray-100 text-gray-400'
              }`}>
                {selectedPatients.length > 0 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="text-sm font-medium">Patients ({selectedPatients.length})</span>
            </div>
            
            <div className={`w-16 h-0.5 ${selectedPatients.length > 0 ? 'bg-green-300' : 'bg-gray-300'}`} />
            
            <div className={`flex items-center space-x-2 ${step === 'document' ? 'text-blue-600' : selectedDocument ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'document' ? 'bg-blue-100 text-blue-600' : 
                selectedDocument ? 'bg-green-100 text-green-600' : 
                'bg-gray-100 text-gray-400'
              }`}>
                {selectedDocument ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <span className="text-sm font-medium">Feuille</span>
            </div>
            
            <div className={`w-16 h-0.5 ${selectedDocument ? 'bg-green-300' : 'bg-gray-300'}`} />
            
            <div className={`flex items-center space-x-2 ${step === 'confirm' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'confirm' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Confirmation</span>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-auto max-h-[60vh]">
          {/* Étape 1: Sélection des patients */}
          {step === 'patients' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rechercher et sélectionner les patients</h3>
                <PatientSearch
                  onSelectPatient={() => {}} // Non utilisé en mode multi
                  onSelectMultiple={handlePatientsSelected}
                  allowMultiSelect={true}
                  selectedPatients={selectedPatients}
                  className="mb-6"
                />
              </div>

              {selectedPatients.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">
                    Patients sélectionnés ({selectedPatients.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-auto">
                    {selectedPatients.map((patient) => (
                      <div key={patient.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {patient.firstName} {patient.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {patient.site} - {patient.floor} - Chambre {patient.room} - Lit {patient.bed}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removePatient(patient.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Étape 2: Sélection de la feuille */}
          {step === 'document' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Choisir la feuille à appliquer</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Cette feuille sera utilisée pour l'encodage de tous les patients sélectionnés.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleDocumentSelected(doc)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{doc.name}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        doc.docType === 'divers' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {doc.docType === 'divers' ? 'Frais divers' : 'Prestations'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {doc.zones.length} zone(s) • Créé le {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>

              {documents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Aucune feuille disponible</p>
                  <p className="text-sm mt-2">Créez d'abord une feuille pour pouvoir l'utiliser en encodage groupé</p>
                </div>
              )}
            </div>
          )}

          {/* Étape 3: Confirmation */}
          {step === 'confirm' && selectedDocument && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmation de l'encodage groupé</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Attention</h4>
                      <p className="text-sm text-blue-800">
                        L'encodage groupé appliquera la même feuille à tous les patients sélectionnés. 
                        Vous pourrez ensuite personnaliser individuellement chaque encodage.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Feuille sélectionnée</h4>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900">{selectedDocument.name}</h5>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedDocument.docType === 'divers' ? 'Frais divers' : 'Prestations'} • {selectedDocument.zones.length} zone(s)
                    </p>
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
              {step === 'patients' && selectedPatients.length > 0 && (
                <span>{selectedPatients.length} patient(s) sélectionné(s)</span>
              )}
              {step === 'document' && selectedDocument && (
                <span>Feuille: {selectedDocument.name}</span>
              )}
              {step === 'confirm' && (
                <span>Prêt pour l'encodage groupé</span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {step !== 'patients' && (
                <button
                  onClick={() => setStep(step === 'document' ? 'patients' : 'document')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Précédent
                </button>
              )}
              
              {step === 'patients' && (
                <button
                  onClick={() => setStep('document')}
                  disabled={selectedPatients.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Continuer ({selectedPatients.length})
                </button>
              )}
              
              {step === 'document' && (
                <button
                  onClick={() => setStep('confirm')}
                  disabled={!selectedDocument}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Continuer
                </button>
              )}
              
              {step === 'confirm' && (
                <button
                  onClick={handleStartEncoding}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Play className="w-4 h-4" />
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