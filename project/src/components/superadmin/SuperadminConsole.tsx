import React, { useState, useEffect } from 'react';
import { Shield, Database, Users, FileDown, ClipboardList, RefreshCw, Upload, Settings, X } from 'lucide-react';
import Button from '../ui/Button';
import { ModuleKey, MODULES, ALL_MODULE_KEYS, Role } from '../../shared/modules';
import { 
  listUsers, 
  updateUserRole, 
  updateUserModules, 
  listImports, 
  importDatabase, 
  listExports, 
  runExport, 
  listAudit,
  SuperUser,
  ImportJob,
  ExportJob,
  AuditEntry 
} from '../../api/superadmin';

interface SuperadminConsoleProps {
  onClose: () => void;
}

export default function SuperadminConsole({ onClose }: SuperadminConsoleProps) {
  const [activeTab, setActiveTab] = useState('db');

  return (
    <div className="fixed inset-0 bg-white z-50">
      {/* Header */}
      <div className="h-16 border-b bg-white shadow-sm flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-purple-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Console Système</h1>
            <p className="text-sm text-gray-600">Administration avancée</p>
          </div>
        </div>
        
        <Button variant="tertiary" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('db')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'db'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Database className="w-4 h-4 inline mr-2" />
              Base de données
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Utilisateurs & droits
            </button>
            <button
              onClick={() => setActiveTab('exports')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'exports'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileDown className="w-4 h-4 inline mr-2" />
              Exports
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'audit'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ClipboardList className="w-4 h-4 inline mr-2" />
              Audit RGPD
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'db' && <DbImportPanel />}
        {activeTab === 'users' && <UsersManagementPanel />}
        {activeTab === 'exports' && <ExportsPanel />}
        {activeTab === 'audit' && <AuditPanel />}
      </div>
    </div>
  );
}

// --- DB IMPORT PANEL ---
function DbImportPanel() {
  const [imports, setImports] = useState<ImportJob[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const data = await listImports();
    setImports(data);
  }

  useEffect(() => { refresh(); }, []);

  async function onImport() {
    if (!file) return;
    setBusy(true);
    try {
      await importDatabase(file);
      setFile(null);
      await refresh();
    } finally { setBusy(false); }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Import de base de données</h2>
            <p className="text-sm text-gray-600">Importer des données structurées</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <input
            type="file"
            accept=".sql,.csv,.xlsx,.json"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            variant="primary"
            leadingIcon={<Upload className="w-4 h-4" />}
            onClick={onImport}
            disabled={!file || busy}
            loading={busy}
          >
            Importer
          </Button>
          <Button
            variant="secondary"
            leadingIcon={<RefreshCw className="w-4 h-4" />}
            onClick={refresh}
            disabled={busy}
          >
            Actualiser
          </Button>
        </div>

        <div className="border border-gray-200 rounded-lg">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Historique des imports</h3>
          </div>
          <div className="max-h-80 overflow-auto">
            {imports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Aucun import réalisé</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {imports.map((imp) => (
                  <div key={imp.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{imp.filename}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(imp.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      imp.status === 'done' ? 'bg-green-100 text-green-800' :
                      imp.status === 'failed' ? 'bg-red-100 text-red-800' :
                      imp.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {imp.status === 'done' ? 'Terminé' :
                       imp.status === 'failed' ? 'Échec' :
                       imp.status === 'running' ? 'En cours' : 'En attente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- USERS MANAGEMENT PANEL ---
function UsersManagementPanel() {
  const [users, setUsers] = useState<SuperUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<SuperUser | null>(null);

  async function refresh() {
    setLoading(true);
    const data = await listUsers();
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function handleUpdateRole(userId: string, role: Role) {
    try {
      const updated = await updateUserRole(userId, role);
      setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    } catch (error) {
      console.error('Erreur mise à jour rôle:', error);
    }
  }

  async function handleUpdateModules(userId: string, modules: ModuleKey[]) {
    try {
      const updated = await updateUserModules(userId, modules);
      setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    } catch (error) {
      console.error('Erreur mise à jour modules:', error);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Gestion des utilisateurs</h2>
              <p className="text-sm text-gray-600">Rôles et autorisations</p>
            </div>
          </div>
          <Button variant="secondary" leadingIcon={<RefreshCw className="w-4 h-4" />} onClick={refresh}>
            Actualiser
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Utilisateurs ({users.length})</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <div key={user.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Modules autorisés: {user.authorizedModules.join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value as Role)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPERADMIN">SUPERADMIN</option>
                      </select>
                      <Button
                        variant="secondary"
                        size="sm"
                        leadingIcon={<Settings className="w-4 h-4" />}
                        onClick={() => setEditingUser(user)}
                      >
                        Modules
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal édition modules */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Modules autorisés - {editingUser.name}
              </h4>
              <div className="space-y-3 mb-6">
                {ALL_MODULE_KEYS.map((moduleKey) => (
                  <label key={moduleKey} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingUser.authorizedModules.includes(moduleKey)}
                      onChange={(e) => {
                        const modules = e.target.checked
                          ? [...editingUser.authorizedModules, moduleKey]
                          : editingUser.authorizedModules.filter(m => m !== moduleKey);
                        setEditingUser({ ...editingUser, authorizedModules: modules });
                      }}
                      className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{MODULES[moduleKey].label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setEditingUser(null)} className="flex-1">
                  Annuler
                </Button>
                <Button 
                  variant="primary" 
                  onClick={async () => {
                    await handleUpdateModules(editingUser.id, editingUser.authorizedModules);
                    setEditingUser(null);
                  }}
                  className="flex-1"
                >
                  Sauvegarder
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- EXPORTS PANEL ---
function ExportsPanel() {
  const [exports, setExports] = useState<ExportJob[]>([]);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const data = await listExports();
    setExports(data);
  }

  useEffect(() => { refresh(); }, []);

  async function onRunExport(type: string) {
    setBusy(true);
    try {
      await runExport(type);
      await refresh();
    } finally { setBusy(false); }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileDown className="w-6 h-6 text-orange-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Gestion des exports</h2>
            <p className="text-sm text-gray-600">Lancer et suivre les exports de données</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Button
            variant="primary"
            onClick={() => onRunExport('patients')}
            disabled={busy}
            className="justify-center"
          >
            Export Patients
          </Button>
          <Button
            variant="primary"
            onClick={() => onRunExport('prestations')}
            disabled={busy}
            className="justify-center"
          >
            Export Prestations
          </Button>
          <Button
            variant="primary"
            onClick={() => onRunExport('audit')}
            disabled={busy}
            className="justify-center"
          >
            Export Audit
          </Button>
        </div>

        <div className="border border-gray-200 rounded-lg">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Historique des exports</h3>
          </div>
          <div className="max-h-80 overflow-auto">
            {exports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileDown className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Aucun export réalisé</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {exports.map((exp) => (
                  <div key={exp.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{exp.type}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(exp.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      exp.status === 'done' ? 'bg-green-100 text-green-800' :
                      exp.status === 'failed' ? 'bg-red-100 text-red-800' :
                      exp.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {exp.status === 'done' ? 'Terminé' :
                       exp.status === 'failed' ? 'Échec' :
                       exp.status === 'running' ? 'En cours' : 'En attente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- AUDIT PANEL ---
function AuditPanel() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const data = await listAudit();
    setEntries(data);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-red-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Journal d'audit RGPD</h2>
              <p className="text-sm text-gray-600">Traçabilité complète des actions sensibles</p>
            </div>
          </div>
          <Button variant="secondary" leadingIcon={<RefreshCw className="w-4 h-4" />} onClick={refresh}>
            Actualiser
          </Button>
        </div>

        <div className="border border-gray-200 rounded-lg">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Entrées récentes</h3>
          </div>
          <div className="max-h-96 overflow-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : entries.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Aucune entrée d'audit</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {entries.map((entry) => (
                  <div key={entry.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{entry.action}</div>
                        <div className="text-sm text-gray-600">Par: {entry.actor}</div>
                        {entry.target && (
                          <div className="text-sm text-gray-500">Cible: {entry.target}</div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(entry.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}