import React from 'react';
import { Shield } from 'lucide-react';

interface Props { onBack: () => void; }

export const AccessDenied: React.FC<Props> = ({ onBack }) => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
    <div className="bg-white rounded-lg shadow-xl p-8 text-center">
      <Shield className="w-16 h-16 mx-auto mb-4 text-red-600" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
      <p className="text-gray-600 mb-6">Vous n'avez pas les permissions nécessaires pour accéder à l'éditeur de feuilles.</p>
      <button
        onClick={onBack}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Retour au tableau de bord
      </button>
    </div>
  </div>
);

export default AccessDenied;
