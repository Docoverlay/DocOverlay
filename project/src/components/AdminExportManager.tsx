import React, { useState } from 'react';
import { X, Download, Calendar, Clock, Plus, Trash2, Settings, History, AlertCircle } from 'lucide-react';
import { ExportSchedule } from '../types';
import { getExportSchedules, saveExportSchedule, deleteExportSchedule, generateInstantExport, getExportHistory, getUnexportedPrestationsCount } from '../utils/database';

interface AdminExportManagerProps {
  onClose: () => void;
}

export default function AdminExportManager({ onClose }: AdminExportManagerProps) {
  // Ce composant n'est accessible qu'aux Super Admins
  // La vérification des permissions doit être faite dans le composant parent
  
  const [schedules, setSchedules] = useState<ExportSchedule[]>(getExportSchedules());
  const [exportHistory] = useState(getExportHistory().slice(-20)); // Derniers 20 exports
  const [unexportedCount] = useState(getUnexportedPrestationsCount());
  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [newSchedule, setNewSchedule] = useState<Partial<ExportSchedule>>({
    days: [],
    time: '03:00',
    format: 'MRT',
    active: true
  });

  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  const handleInstantExport = (format: 'CSV' | 'MRT') => {
    const content = generateInstantExport(format);
    
    if (content === null) {
      alert('Aucune prestation non exportée trouvée.');
      return;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${format.toLowerCase()}_${new Date().toISOString().split('T')[0]}.${format.toLowerCase() === 'csv' ? 'csv' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSchedule = () => {
    if (!newSchedule.days || newSchedule.days.length === 0) {
      alert('Veuillez sélectionner au moins un jour.');
      return;
    }

    const schedule: ExportSchedule = {
      id: Date.now().toString(),
      documentId: 'all', // Pour tous les documents
      days: newSchedule.days,
      time: newSchedule.time || '03:00',
      format: newSchedule.format || 'MRT',
      active: true,
      createdBy: 'admin'
    };

    saveExportSchedule(schedule);
    setSchedules([...schedules, schedule]);
    setShowNewSchedule(false);
    setNewSchedule({ days: [], time: '03:00', format: 'MRT', active: true });
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette planification ?')) {
      deleteExportSchedule(scheduleId);
      setSchedules(schedules.filter(s => s.id !== scheduleId));
    }
  };

  const toggleScheduleActive = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (schedule) {
      const updatedSchedule = { ...schedule, active: !schedule.active };
      saveExportSchedule(updatedSchedule);
      setSchedules(schedules.map(s => s.id === scheduleId ? updatedSchedule : s));
    }
  };

  const toggleDay = (day: number) => {
    const days = newSchedule.days || [];
    setNewSchedule({
      ...newSchedule,
      days: days.includes(day) 
        ? days.filter(d => d !== day)
        : [...days, day].sort()
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Gestion des exports</h2>
              <p className="text-sm text-gray-600">
                Exports manuels et planifications automatiques • {unexportedCount} prestation(s) non exportée(s)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <History className="w-4 h-4" />
              Historique
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-auto max-h-[70vh]">
          {/* Alerte si pas de prestations à exporter */}
          {unexportedCount === 0 && (
            <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Aucune prestation non exportée disponible. Tous les encodages ont déjà été exportés.
            </div>
          )}

          {/* Export manuel */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export manuel instantané
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => handleInstantExport('MRT')}
                disabled={unexportedCount === 0}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Exporter MRT ({unexportedCount})
              </button>
              <button
                onClick={() => handleInstantExport('CSV')}
                disabled={unexportedCount === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Exporter CSV ({unexportedCount})
              </button>
            </div>
            {unexportedCount > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                ⚠️ Une fois exportées, ces prestations seront marquées comme traitées et ne réapparaîtront plus dans les exports futurs.
              </p>
            )}
          </div>

          {/* Planifications */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Exports programmés ({schedules.length})
              </h3>
              <button
                onClick={() => setShowNewSchedule(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nouvelle planification
              </button>
            </div>

            {schedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Aucune planification d'export configurée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            schedule.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {schedule.active ? 'Actif' : 'Inactif'}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            Format {schedule.format}
                          </span>
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {schedule.time}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Jours: {schedule.days.map(d => dayNames[d]).join(', ')}
                        </div>
                        {schedule.lastExport && (
                          <div className="text-xs text-gray-500 mt-1">
                            Dernier export: {new Date(schedule.lastExport).toLocaleString()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleScheduleActive(schedule.id)}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            schedule.active
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {schedule.active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal historique d'export */}
        {showHistory && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Historique des exports
                </h4>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="overflow-auto max-h-[60vh]">
                {exportHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Aucun export réalisé</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {exportHistory.map((export_) => (
                      <div key={export_.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              export_.format === 'MRT' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {export_.format}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              export_.mode === 'manual' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {export_.mode === 'manual' ? 'Manuel' : 'Planifié'}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {new Date(export_.date).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700">
                          {export_.prestations.length} prestation(s) exportée(s)
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={() => setShowHistory(false)}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal nouvelle planification */}
        {showNewSchedule && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Nouvelle planification</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jours de la semaine
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {dayNames.map((day, index) => (
                      <label key={index} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(newSchedule.days || []).includes(index)}
                          onChange={() => toggleDay(index)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Heure d'export
                  </label>
                  <input
                    type="time"
                    value={newSchedule.time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Format d'export
                  </label>
                  <select
                    value={newSchedule.format}
                    onChange={(e) => setNewSchedule({ ...newSchedule, format: e.target.value as 'CSV' | 'MRT' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="MRT">MRT</option>
                    <option value="CSV">CSV</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNewSchedule(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveSchedule}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}