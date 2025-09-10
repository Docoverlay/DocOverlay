import React, { useState } from 'react';
import { LogIn, User as UserIcon, Shield } from 'lucide-react';
import Button from './ui/Button';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const MOCK_USERS: User[] = [
  {
    id: '1',
    login: 'superadmin',
    role: 'SUPERADMIN',
    name: 'Super Admin',
    status: 'active',
    createdAt: new Date()
  },
  {
    id: '2',
    login: 'admin',
    role: 'ADMIN',
    name: 'Administrateur',
    status: 'active',
    createdAt: new Date()
  },
  {
    id: '3',
    login: 'user',
    role: 'USER',
    name: 'Utilisateur',
    status: 'active',
    createdAt: new Date()
  }
];

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = MOCK_USERS.find(u => u.login === login.toLowerCase());
    
    if (user) {
      onLogin(user);
    } else {
      setError('Login non reconnu. Utilisez "admin" ou "user"');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="Doc (2).png" 
            alt="DocOverlay Logo" 
            className="w-[600px] h-auto mx-auto mb-6"
          />
          <p className="text-gray-600 mt-2">Plateforme de gestion de feuilles interactives</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Identifiant
            </label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Entrez votre identifiant"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <Button 
            type="submit"
            variant="primary" 
            leadingIcon={<LogIn className="w-4 h-4" />}
            className="w-full"
          >
            Se connecter
          </Button>
        </form>

        {/* Test Accounts */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Comptes de test :</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="font-mono">superadmin</span>
              <span className="text-gray-500">- Accès complet + gestion utilisateurs</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Shield className="w-4 h-4 text-purple-600" />
              <span className="font-mono">admin</span>
              <span className="text-gray-500">- Création et modification de feuilles</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <UserIcon className="w-4 h-4 text-green-600" />
              <span className="font-mono">user</span>
              <span className="text-gray-500">- Encodage uniquement</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}