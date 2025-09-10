import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import DocumentEditor from './components/DocumentEditor';
import DocumentViewer from './components/DocumentViewer';
import OprestModule from './components/OprestModule';
import { User, SavedDocument, Patient } from './types';

type AppState = 'login' | 'dashboard' | 'editor' | 'viewer' | 'oprest';

export default function App() {
  const [currentState, setCurrentState] = useState<AppState>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingDocument, setEditingDocument] = useState<SavedDocument | null>(null);
  const [viewingDocument, setViewingDocument] = useState<SavedDocument | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showOprest, setShowOprest] = useState(false);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentState('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setEditingDocument(null);
    setViewingDocument(null);
    setSelectedPatient(null);
    setShowOprest(false);
    setCurrentState('login');
  };

  const handleCreateDocument = () => {
    // Vérifier les permissions
    if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'SUPERADMIN') {
      return;
    }
    setEditingDocument(null);
    setCurrentState('editor');
  };

  const handleEditDocument = (doc: SavedDocument) => {
    // Vérifier les permissions
    if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'SUPERADMIN') {
      return;
    }
    setEditingDocument(doc);
    setCurrentState('editor');
  };

  const handleUseDocument = (doc: SavedDocument, patient: Patient) => {
    setViewingDocument(doc);
    setSelectedPatient(patient);
    setCurrentState('viewer');
  };

  const handleShowOprest = () => {
    setCurrentState('oprest');
  };

  const handleBackToDashboard = () => {
    setEditingDocument(null);
    setViewingDocument(null);
    setSelectedPatient(null);
    setShowOprest(false);
    setCurrentState('dashboard');
  };

  // Fonction pour rafraîchir le dashboard sans déconnecter
  const handleRefreshDashboard = () => {
    // Force un re-render du dashboard en gardant l'utilisateur connecté
    setCurrentState('dashboard');
  };

  if (currentState === 'login') {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (currentState === 'dashboard' && currentUser) {
    return (
      <Dashboard
        user={currentUser}
        onLogout={handleLogout}
        onCreateDocument={handleCreateDocument}
        onEditDocument={handleEditDocument}
        onUseDocument={handleUseDocument}
        onRefresh={handleRefreshDashboard}
        onShowOprest={handleShowOprest}
      />
    );
  }

  if (currentState === 'editor' && currentUser) {
    return (
      <DocumentEditor
        user={currentUser}
        onBack={handleBackToDashboard}
        editingDocument={editingDocument}
      />
    );
  }

  if (currentState === 'viewer' && currentUser && viewingDocument && selectedPatient) {
    return (
      <DocumentViewer
        document={viewingDocument}
        patient={selectedPatient}
        onBack={handleBackToDashboard}
      />
    );
  }

  if (currentState === 'oprest' && currentUser) {
    return (
      <OprestModule
        user={currentUser}
        onClose={handleBackToDashboard}
      />
    );
  }

  // Fallback
  return <LoginPage onLogin={handleLogin} />;
}