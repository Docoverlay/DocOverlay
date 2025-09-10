import { useState } from 'react';
import { X, Plus, Shield, User as UserIcon, Check, Clock, Ban } from 'lucide-react';
import { User } from '../types';

interface UserManagementProps {
  onClose: () => void;
  currentUser: User;
}

const MOCK_USERS: User[] = [
  {
    id: '1',
    login: 'superadmin',
    role: 'super_admin',
    name: 'Super Administrateur',
    status: 'active',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    login: 'admin1',
    role: 'admin',
    name: 'Admin Principal',
    status: 'active',
    createdAt: new Date('2024-01-15'),
    approvedBy: '1'
  },
  {
    id: '3',
    login: 'user1',
    role: 'user',
    name: 'Utilisateur Test',
    status: 'active',
    createdAt: new Date('2024-02-01'),
    approvedBy: '2'
  },
  {
    id: '4',
    login: 'user2',
    role: 'user',
    name: 'Nouvel Utilisateur',
    status: 'pending',
    createdAt: new Date('2024-02-15'),
  },
  {
    id: '5',
    login: 'admin2',
    role: 'admin',
    name: 'Admin Secondaire',
    status: 'pending',
    createdAt: new Date('2024-02-20'),
  }
];

export default function UserManagement({ onClose, currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({
    login: '',
    name: '',
    role: 'user' as 'admin' | 'user'
  });

  const canManageUser = (targetUser: User): boolean => {
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.role === 'admin' && targetUser.role === 'user') return true;
    return false;
  };

  const handleApproveUser = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: 'active' as const, approvedBy: currentUser.id }
        : user
    ));
  };

  const handleRejectUser = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: 'inactive' as const }
        : user
    ));
  };

  const handleCreateUser = () => {
    if (!newUser.login.trim() || !newUser.name.trim()) {
      alert('Veuillez remplir tous les champs.');
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      login: newUser.login,
      name: newUser.name,
      role: newUser.role,
      status: 'pending',
      createdAt: new Date()
    };

    setUsers(prev => [...prev, user]);
    setNewUser({ login: '', name: '', role: 'user' });
    setShowNewUser(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-600" />;
      default:
        return <UserIcon className="w-4 h-4 text-green-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Administrateur';
      default:
        return 'Utilisateur';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Check className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'inactive':
        return <Ban className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const pendingUsers = users.filter(user => user.status === 'pending');
  const activeUsers = users.filter(user => user.status === 'active');
  const inactiveUsers = users.filter(user => user.status === 'inactive');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Gestion des utilisateurs</h2>
              <p className="text-sm text-gray-600">
                Gérer les comptes utilisateurs et leurs autorisations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentUser.role === 'super_admin' && (
              <button
                onClick={() => setShowNewUser(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nouvel utilisateur
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-auto max-h-[70vh]">
          {/* Utilisateurs en attente */}
          {pendingUsers.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Comptes en attente de validation ({pendingUsers.length})
              </h3>
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getRoleIcon(user.role)}
                        <div>
                          <h4 className="font-medium text-gray-900">{user.name}</h4>
                          <p className="text-sm text-gray-600">
                            {user.login} • {getRoleLabel(user.role)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Demandé le {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {canManageUser(user) && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveUser(user.id)}
                            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                          >
                            <Check className="w-4 h-4" />
                            Approuver
                          </button>
                          <button
                            onClick={() => handleRejectUser(user.id)}
                            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                          >
                            <Ban className="w-4 h-4" />
                            Rejeter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Utilisateurs actifs */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Comptes actifs ({activeUsers.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeUsers.map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getRoleIcon(user.role)}
                      <div>
                        <h4 className="font-medium text-gray-900">{user.name}</h4>
                        <p className="text-sm text-gray-600">{user.login}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {getStatusIcon(user.status)}
                      Actif
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Rôle: {getRoleLabel(user.role)}</p>
                    <p>Créé le: {new Date(user.createdAt).toLocaleDateString()}</p>
                    {user.approvedBy && (
                      <p>Approuvé par: {users.find(u => u.id === user.approvedBy)?.name || 'Inconnu'}</p>
                    )}
                  </div>
                  
                  {canManageUser(user) && user.id !== currentUser.id && (
                    <div className="mt-3 pt-3 border-t">
                      <button
                        onClick={() => handleRejectUser(user.id)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
                      >
                        <Ban className="w-4 h-4" />
                        Désactiver
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Utilisateurs inactifs */}
          {inactiveUsers.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-600" />
                Comptes inactifs ({inactiveUsers.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inactiveUsers.map((user) => (
                  <div key={user.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getRoleIcon(user.role)}
                        <div>
                          <h4 className="font-medium text-gray-900">{user.name}</h4>
                          <p className="text-sm text-gray-600">{user.login}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {getStatusIcon(user.status)}
                        Inactif
                      </span>
                    </div>
                    
                    {canManageUser(user) && (
                      <button
                        onClick={() => handleApproveUser(user.id)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                      >
                        <Check className="w-4 h-4" />
                        Réactiver
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal nouveau utilisateur */}
        {showNewUser && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Créer un nouvel utilisateur</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Identifiant de connexion
                  </label>
                  <input
                    type="text"
                    value={newUser.login}
                    onChange={(e) => setNewUser({ ...newUser, login: e.target.value })}
                    placeholder="Ex: jdupont"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Ex: Jean Dupont"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rôle
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'user' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="user">Utilisateur</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNewUser(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateUser}
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