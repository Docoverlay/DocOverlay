import React, { useState } from 'react';
import { X, Shield, Search, Filter, Calendar, User, FileText } from 'lucide-react';
import { getAuditLogs } from '../utils/database';

interface AuditLogViewerProps {
  onClose: () => void;
}

export default function AuditLogViewer({ onClose }: AuditLogViewerProps) {
  // Ce composant n'est accessible qu'aux Super Admins
  // La vérification des permissions doit être faite dans le composant parent
  
  const [logs] = useState(getAuditLogs().slice(-100)); // Derniers 100 logs
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterAction === '' || log.action === filterAction;
    
    return matchesSearch && matchesFilter;
  });

  const uniqueActions = [...new Set(logs.map(log => log.action))];

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'DOCUMENT_ACCESS_ATTEMPT':
      case 'DOCUMENT_PREVIEW':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'ENCODING_SESSION_START':
      case 'ENCODING_SESSION_END':
        return <User className="w-4 h-4 text-green-600" />;
      case 'DOCUMENT_DELETE':
        return <X className="w-4 h-4 text-red-600" />;
      case 'MRT_EXPORT':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      default:
        return <Shield className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'DOCUMENT_ACCESS_ATTEMPT':
      case 'DOCUMENT_PREVIEW':
        return 'bg-blue-50 text-blue-700';
      case 'ENCODING_SESSION_START':
      case 'ENCODING_SESSION_END':
      case 'ENCODING_SAVE':
        return 'bg-green-50 text-green-700';
      case 'DOCUMENT_DELETE':
        return 'bg-red-50 text-red-700';
      case 'MRT_EXPORT':
        return 'bg-purple-50 text-purple-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const formatAction = (action: string) => {
    const actionMap: { [key: string]: string } = {
      'DOCUMENT_ACCESS_ATTEMPT': 'Accès document',
      'DOCUMENT_PREVIEW': 'Aperçu document',
      'ENCODING_SESSION_START': 'Début encodage',
      'ENCODING_SESSION_END': 'Fin encodage',
      'ENCODING_SAVE': 'Sauvegarde',
      'DOCUMENT_DELETE': 'Suppression',
      'MRT_EXPORT': 'Export MRT'
    };
    return actionMap[action] || action;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Journal d'audit RGPD</h2>
              <p className="text-sm text-gray-600">{logs.length} entrées • Conformité RGPD</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher dans les logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="min-w-[150px]">
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Toutes les actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>
                    {formatAction(action)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className="overflow-auto max-h-[60vh]">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Aucun log trouvé</p>
              <p className="text-sm">Aucune entrée ne correspond à vos critères de recherche</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getActionIcon(log.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {formatAction(log.action)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-900 mb-1">{log.details}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Utilisateur: {log.userId}</span>
                        {log.patientId && <span>Patient ID: {log.patientId}</span>}
                        {log.documentId && <span>Document ID: {log.documentId}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <strong>{filteredLogs.length}</strong> entrée(s) affichée(s) sur <strong>{logs.length}</strong> total
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500">
                Conformité RGPD • Traçabilité complète
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}