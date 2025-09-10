import React, { useEffect, useState } from 'react';
import { Plus, FileText, LogOut, Edit, Trash2, Search, Settings, Shield, Download, Star, Users, HelpCircle, RefreshCw, AlertCircle, FileCode, Scan, Layers, Copy, Radiation, Monitor as monitor, Ghost as hospital, Wallet as wallet, MoreHorizontal, SlidersHorizontal, Pin, PinOff, LayoutTemplate, Image as ImageIcon } from 'lucide-react';

import Button from './ui/Button';
import DocumentCard from './DocumentCard';
import PreferencesModal from './PreferencesModal';
import SuperadminConsole from './superadmin/SuperadminConsole';
import DocumentPreview from './DocumentPreview';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import PatientSheetSelector from './PatientSheetSelector';
import GroupEncodingWorkflow from './GroupEncodingWorkflow';
import UserManagement from './UserManagement';
import AdminExportManager from './AdminExportManager';
import AuditLogViewer from './AuditLogViewer';
import UserPreferencesModal from './UserPreferencesModal';
import PatientSearch from './PatientSearch';
import HelpModal from './HelpModal';
import SheetCustomizationModal from './SheetCustomizationModal';
import PersonalizedSheetsManager from './PersonalizedSheetsManager';
import Scan2OverlayModule from './Scan2OverlayModule';
import CategoryManager from './CategoryManager';

import { useLaunchRedirect } from '../hooks/useLaunchRedirect';
import { getMyPreferences, MePreferences } from '../api/me';
import { User, SavedDocument, Patient, UserSheetCustomization } from '../types';
import {
  getDocuments, deleteDocument, isDocumentFavorite, addToFavorites, removeFromFavorites,
} from '../utils/database';
import { getUserSheetCustomizations, deleteUserSheetCustomization } from '../utils/userPreferences';
import { clearPatientData, regeneratePatientData, getPatientStats, exportPatientData } from '../data/patientDatabase';

/* --------------------------------- Types --------------------------------- */
type Category = { id: string; name: string; color: string };

type ModuleKey =
  | 'docoverlay'
  | 'scan2overlay'
  | 'patients'
  | 'oprest'
  | 'batch'
  | 'MediXray';

/* -------------------------- Helpers UI internes --------------------------- */

function OverflowMenu({ onRefresh, onOpenPreferences }:{
  onRefresh: () => void; onOpenPreferences: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="tertiary" leadingIcon={<MoreHorizontal className="w-5 h-5" />} onClick={() => setOpen(v => !v)}>
        Plus
      </Button>
      {open && (
        <div role="menu" aria-label="Plus d'actions"
             className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-20 p-1">
          <Button variant="tertiary" className="w-full justify-start"
                  leadingIcon={<RefreshCw className="w-4 h-4" />}
                  onClick={() => { setOpen(false); onRefresh(); }}>
            Actualiser
          </Button>
          <Button variant="tertiary" className="w-full justify-start"
                  leadingIcon={<SlidersHorizontal className="w-4 h-4" />}
                  onClick={() => { setOpen(false); onOpenPreferences(); }}>
            Préférences d'affichage
          </Button>
        </div>
      )}
    </div>
  );
}

function EnvBadge() {
  const env = (import.meta as any)?.env?.VITE_ENV || import.meta.env.MODE || 'DEV';
  const label = String(env).toUpperCase();
  const map: Record<string,string> = {
    PROD: 'bg-green-100 text-green-800',
    TEST: 'bg-amber-100 text-amber-800',
    QUALIF: 'bg-violet-100 text-violet-800',
    DEVELOPMENT: 'bg-amber-100 text-amber-800',
  };
  const cls = map[label] || 'bg-amber-100 text-amber-800';
  return <span className={`text-[11px] px-2 py-0.5 rounded ${cls}`}>{label}</span>;
}

/* ------------------------------ Composant ------------------------------ */

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onCreateDocument: () => void;
  onEditDocument: (doc: SavedDocument) => void;
  onUseDocument: (doc: SavedDocument, patient: Patient) => void;
  onRefresh: () => void;
  onShowOprest: () => void; // ouvre le module Oprest (si externe)
}

export default function Dashboard(props: DashboardProps) {
  const {
    user, onLogout, onCreateDocument, onEditDocument, onUseDocument, onRefresh, onShowOprest,
  } = props;

  /* ------------------------------ State données ------------------------------ */
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<SavedDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [userCustomizations, setUserCustomizations] = useState<UserSheetCustomization[]>([]);
  const [userPreferences, setUserPreferences] = useState<MePreferences | null>(null);

  /* ------------------------------ State modals ------------------------------ */
  const [previewDocument, setPreviewDocument] = useState<SavedDocument | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<SavedDocument | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [customizingDocument, setCustomizingDocument] = useState<SavedDocument | null>(null);
  const [editingCustomization, setEditingCustomization] = useState<UserSheetCustomization | null>(null);
  const [showPersonalizedSheets, setShowPersonalizedSheets] = useState(false);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [selectedPatientForSheet, setSelectedPatientForSheet] = useState<Patient | null>(null);
  const [selectedDocumentForEncoding, setSelectedDocumentForEncoding] = useState<SavedDocument | null>(null);
  const [showGroupEncoding, setShowGroupEncoding] = useState(false);
  const [showExportManager, setShowExportManager] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [showSuperadminConsole, setShowSuperadminConsole] = useState(false);

  /* ------------------------------ State layout ------------------------------ */
  // Module actif (la page à droite)
  const [activeModule, setActiveModule] = useState<ModuleKey>('docoverlay');

  // Sidebar : verrouillage + hover
  const [sideLocked, setSideLocked] = useState<boolean>(() => localStorage.getItem('sidebar.locked') === '1');
  const [hovering, setHovering] = useState(false);
  const sideExpanded = sideLocked || hovering;
  useEffect(() => { localStorage.setItem('sidebar.locked', sideLocked ? '1' : '0'); }, [sideLocked]);

  /* ------------------------------ Data load ------------------------------ */
  useLaunchRedirect(); // garde telle quelle

  useEffect(() => {
    loadDocuments();
    loadUserCustomizations();
    loadUserPreferences();
  }, []);

  useEffect(() => {
    filterDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents, searchTerm, selectedCategory, favorites]);

  const loadDocuments = () => {
    const docs = getDocuments();
    setDocuments(docs);
    const userFavorites = docs.filter(d => isDocumentFavorite(user.id, d.id)).map(d => d.id);
    setFavorites(userFavorites);
  };

  const loadUserCustomizations = () => {
    const customizations = getUserSheetCustomizations(user.id);
    setUserCustomizations(customizations);
  };

  const loadUserPreferences = async () => {
    try { setUserPreferences(await getMyPreferences()); } catch {}
  };

  const filterDocuments = () => {
    let filtered = documents;
    if (searchTerm) {
      const q = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(doc => doc.name.toLowerCase().includes(q) || doc.docType.toLowerCase().includes(q));
    }
    if (selectedCategory) filtered = filtered.filter(doc => doc.categoryId === selectedCategory);
    filtered.sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setFilteredDocuments(filtered);
  };

  /* ------------------------------ Actions documents ------------------------------ */
  const handleDeleteDocument = (doc: SavedDocument) => setDocumentToDelete(doc);
  const confirmDelete = () => {
    if (documentToDelete && deleteDocument(documentToDelete.id)) {
      loadDocuments(); setDocumentToDelete(null);
    }
  };
  const toggleFavorite = (docId: string) => {
    if (favorites.includes(docId)) {
      removeFromFavorites(user.id, docId); setFavorites(prev => prev.filter(id => id !== docId));
    } else {
      addToFavorites(user.id, docId); setFavorites(prev => [...prev, docId]);
    }
  };

  const handlePatientSelected = (patient: Patient) => {
    if (selectedDocumentForEncoding) {
      setShowPatientSearch(false);
      const doc = selectedDocumentForEncoding;
      setSelectedDocumentForEncoding(null);
      onUseDocument(doc, patient);
    } else {
      setShowPatientSearch(false);
      setSelectedPatientForSheet(patient);
      // on affiche le sélecteur de feuille (toujours dans DocOverlay)
    }
  };
  const handlePatientSearchClosed = () => { setShowPatientSearch(false); setSelectedDocumentForEncoding(null); };
  const handlePatientSheetSelected = (patient: Patient, document: SavedDocument) => {
    setSelectedPatientForSheet(null);
    // Dans ce design, l’encodage démarre ensuite
    onUseDocument(document, patient);
  };

  const handleCustomizeSheet = (doc: SavedDocument) => {
    setCustomizingDocument(doc); setEditingCustomization(null); setShowCustomization(true);
  };
  const handleEditCustomization = (doc: SavedDocument) => {
    const customization = userCustomizations.find(c => c.documentId === doc.id && c.isDefault);
    setCustomizingDocument(doc); setEditingCustomization(customization || null); setShowCustomization(true);
  };
  const handleDeleteCustomization = (doc: SavedDocument) => {
    const customization = userCustomizations.find(c => c.documentId === doc.id && c.isDefault);
    if (customization && confirm(`Supprimer la personnalisation « ${customization.name} » ?`)) {
      deleteUserSheetCustomization(customization.id); loadUserCustomizations();
    } else {
      alert('Action réservée aux administrateurs.');
    }
  };

  const displayRole =
    user.role === 'SUPERADMIN' ? 'Super Administrateur'
    : user.role === 'ADMIN' ? 'Administrateur'
    : 'Utilisateur';

  /* --------------------------------- RENDER --------------------------------- */

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex">
        {/* ---------- SIDEBAR (collapsible + lock) ---------- */}
        <aside
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          className={`transition-[width] duration-200 text-white h-screen sticky top-0
            ${sideExpanded ? 'w-60' : 'w-16'}`}
          style={{ backgroundColor: '#0f2c52' }}
        >
          {/* Header logo + env */}
          <div className="h-14 flex items-center justify-between px-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              {sideExpanded && <span className="font-semibold">DocOverlay</span>}
              }
            </div>
            {sideExpanded && <EnvBadge />}
          </div>

          {/* Nav items */}
          <nav className="py-2">
            <SideItem
              active={activeModule === 'docoverlay'}
              label="DocOverlay"
              icon={<Copy className="w-5 h-5" />} 
              expanded={sideExpanded}
              onClick={() => setActiveModule('docoverlay')}
            />
            <SideItem
              active={activeModule === 'scan2overlay'}
              label="Scan2Overlay"
              icon={<FileText className="w-5 h-5" />}
              expanded={sideExpanded}
              onClick={() => setActiveModule('scan2overlay')}
            />
            <SideItem
              active={activeModule === 'patients'}
              label="Rechercher un patient"
              icon={<Search className="w-5 h-5" />}
              expanded={sideExpanded}
              onClick={() => setActiveModule('patients')}
            />
            <SideItem
              active={activeModule === 'oprest'}
              label="Encodage Oprest"
              icon={<Plus className="w-5 h-5" />}
              expanded={sideExpanded}
              onClick={() => setActiveModule('oprest')}
            />
            <SideItem
              active={activeModule === 'batch'}
              label="Encodage en lot"
              icon={<Users className="w-5 h-5" />}
              expanded={sideExpanded}
              onClick={() => setActiveModule('batch')}
            />
            <SideItem
              active={activeModule === 'MediXray'}
              label="MediXray"
              icon={<Radiation className="w-5 h-5" />}
              expanded={sideExpanded}
              onClick={() => setActiveModule('MediXray')}
            />
          </nav>

          {/* Footer : lock toggle */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-[#0f2c52] p-2">
            <button
              type="button"
              onClick={() => setSideLocked(v => !v)}
              className="w-full h-9 rounded-md bg-[#00c2b2] hover:bg-[#00aa9e] text-[#0f2c52] text-sm inline-flex items-center justify-center gap-2"
              title={sideLocked ? 'Déverrouiller la barre' : 'Verrouiller la barre'}
            >
              {sideLocked ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
              {sideExpanded && (sideLocked ? 'Barre verrouillée' : 'Verrouiller la barre')}
            </button>
          </div>
        </aside>

        {/* ---------- MAIN (topbar + contenu) ---------- */}
        <div className="flex-1 min-w-0">
          {/* TOPBAR */}
          <header className="h-14 bg-white border-b border-gray-200 px-4">
            <div className="h-full flex items-center justify-between">
              <div className="text-sm text-gray-600">{displayRole}</div>
              <div className="flex items-center gap-2">
                {user.role === 'SUPERADMIN' && (
                  <Button variant="secondary" leadingIcon={<Shield className="w-4 h-4" />} onClick={() => setShowSuperadminConsole(true)}>
                    Console Système
                  </Button>
                )}
                <Button variant="tertiary" leadingIcon={<HelpCircle className="w-4 h-4" />} onClick={() => setShowHelp(true)}>Aide</Button>
                <Button variant="secondary" leadingIcon={<Settings className="w-4 h-4" />} onClick={() => setShowPreferencesModal(true)}>Préférences</Button>
                <Button variant="danger" leadingIcon={<LogOut className="w-4 h-4" />} onClick={onLogout}>Déconnexion</Button>
              </div>
            </div>
          </header>

          {/* CONTENU */}
          <main className="p-6">
            {activeModule === 'docoverlay' && (
              <DocOverlayView
                user={user}
                documents={filteredDocuments}
                allDocuments={documents}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                onCreateDocument={onCreateDocument}
                onPreview={(doc) => setPreviewDocument(doc)}
                onEncode={(doc) => { setActiveModule('patients'); setShowPatientSearch(true); setSelectedDocumentForEncoding(doc); }}
                onCustomize={handleCustomizeSheet}
                onEdit={onEditDocument}
                onDelete={handleDeleteDocument}
                onRefresh={() => { loadDocuments(); onRefresh(); }}
                openPrefs={() => setShowPreferences(true)}
              />
            )}

            {activeModule === 'scan2overlay' && (
              <section className="card p-0 overflow-hidden">
                {/* ➜ version intégrée : voir patch du composant plus bas */}
                <Scan2OverlayModule
                  user={user}
                  onClose={() => setActiveModule('docoverlay')}
                  onDocumentProcessed={(document, patient) => onUseDocument(document, patient)}
                  /* @ts-ignore */
                  embedded
                />
              </section>
            )}

            {activeModule === 'patients' && (
              <section className="card p-6">
                <h2 className="text-xl font-semibold mb-4">Recherche de patient</h2>
                <PatientSearch onSelectPatient={handlePatientSelected} />
              </section>
            )}

            {activeModule === 'oprest' && (
              <section className="card p-6">
                <h2 className="text-xl font-semibold mb-2">Encodage Oprest</h2>
                <p className="text-gray-600 mb-4">Lancer le module Oprest. La barre latérale restera accessible.</p>
                <Button variant="primary" leadingIcon={<FileCode className="w-4 h-4" />} onClick={onShowOprest}>
                  Ouvrir Oprest
                </Button>
              </section>
            )}

            {activeModule === 'batch' && (
              <section className="card p-6">
                <h2 className="text-xl font-semibold mb-2">Encodage en lot</h2>
                <p className="text-gray-600 mb-4">Préparez un encodage groupé pour plusieurs patients.</p>
                <Button variant="primary" leadingIcon={<Users className="w-4 h-4" />} onClick={() => setShowGroupEncoding(true)}>
                  Démarrer un encodage groupé
                </Button>
              </section>
            )}

            {activeModule === 'MediXray' && (
              <section className="card p-6">
                <h2 className="text-xl font-semibold mb-1">MediXray — Imagerie (Radio & Nucléaire)</h2>
                <p className="text-gray-600">Module d’imagerie. (Si un composant dédié existe, monte-le ici.)</p>
              </section>
            )}
          </main>
        </div>
      </div>

      {/* --------------------------- Modals (hors vues) --------------------------- */}
      {previewDocument && <DocumentPreview document={previewDocument} onClose={() => setPreviewDocument(null)} />}
      <DeleteConfirmationModal open={!!documentToDelete} documentName={documentToDelete?.name || ''} onConfirm={confirmDelete} onCancel={() => setDocumentToDelete(null)} />
      <PreferencesModal open={showPreferencesModal} onOpenChange={setShowPreferencesModal} />
      {showSuperadminConsole && user.role === 'SUPERADMIN' && <SuperadminConsole onClose={() => setShowSuperadminConsole(false)} />}
      {showUserManagement && user.role === 'SUPERADMIN' && <UserManagement onClose={() => setShowUserManagement(false)} currentUser={user} />}
      {showExportManager && user.role === 'SUPERADMIN' && <AdminExportManager onClose={() => setShowExportManager(false)} />}
      {showAuditLogs && user.role === 'SUPERADMIN' && <AuditLogViewer onClose={() => setShowAuditLogs(false)} />}

      {showPreferences && (
        <UserPreferencesModal
          user={user}
          onClose={() => setShowPreferences(false)}
          onPreferencesUpdated={() => { loadDocuments(); setShowPreferences(false); }}
        />
      )}

      {showPatientSearch && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedDocumentForEncoding ? `Encoder avec : ${selectedDocumentForEncoding.name}` : 'Recherche de patient'}
              </h2>
              <Button variant="tertiary" onClick={handlePatientSearchClosed}>Fermer</Button>
            </div>
            <PatientSearch onSelectPatient={handlePatientSelected} className="mb-4" />
            <div className="flex justify-end">
              <Button variant="secondary" onClick={handlePatientSearchClosed}>Fermer</Button>
            </div>
          </div>
        </div>
      )}

      {selectedPatientForSheet && (
        <PatientSheetSelector
          patient={selectedPatientForSheet}
          onSelectSheet={handlePatientSheetSelected}
          onBack={() => { setSelectedPatientForSheet(null); }}
          userId={user.id}
        />
      )}

      {showGroupEncoding && (
        <GroupEncodingWorkflow
          onClose={() => setShowGroupEncoding(false)}
          onStartGroupEncoding={(doc, patients, data) => { setShowGroupEncoding(false); console.log('Encodage groupé', patients.length, 'patients'); }}
          userId={user.id}
        />
      )}

      {showHelp && <HelpModal userRole={user.role} onClose={() => setShowHelp(false)} />}

      {showCustomization && customizingDocument && (
        <SheetCustomizationModal
          document={customizingDocument}
          userId={user.id}
          onClose={() => { setShowCustomization(false); setCustomizingDocument(null); setEditingCustomization(null); }}
          onSaved={() => { setShowCustomization(false); setCustomizingDocument(null); setEditingCustomization(null); loadDocuments(); loadUserCustomizations(); }}
          existingCustomization={editingCustomization}
        />
      )}

      {showPersonalizedSheets && (
        <PersonalizedSheetsManager
          userId={user.id}
          onClose={() => setShowPersonalizedSheets(false)}
          onCustomizationUpdated={() => { loadDocuments(); loadUserCustomizations(); }}
          onStartEncodingWithPatient={(document, patient) => { onUseDocument(document, patient); }}
        />
      )}

      {showDataManagement && user.role === 'SUPERADMIN' && <DataManagementModal onClose={() => setShowDataManagement(false)} />}
    </div>
  );
}

/* -------------------------- Sous-composants locaux -------------------------- */

function SideItem({
  active, label, icon, onClick, expanded,
}: { active:boolean; label:string; icon:React.ReactNode; onClick:()=>void; expanded:boolean; }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full flex items-center gap-3 px-3 py-2 text-sm
      ${active ? 'bg-slate-800 text-white border-l-4 border-blue-500' : 'text-slate-200 hover:bg-slate-800'}
      ${expanded ? 'justify-start' : 'justify-center'}`}
      title={expanded ? undefined : label}
    >
      <span className="shrink-0">{icon}</span>
      {expanded && <span className="truncate">{label}</span>}
      }
    </button>
  );
}

function DocOverlayView({
  user, documents, allDocuments, searchTerm, setSearchTerm, favorites, toggleFavorite,
  onCreateDocument, onPreview, onEncode, onCustomize, onEdit, onDelete, onRefresh, openPrefs,
}:{
  user: User;
  documents: SavedDocument[];
  allDocuments: SavedDocument[];
  searchTerm: string; setSearchTerm:(v:string)=>void;
  favorites: string[]; toggleFavorite:(id:string)=>void;
  onCreateDocument:()=>void;
  onPreview:(d:SavedDocument)=>void;
  onEncode:(d:SavedDocument)=>void;
  onCustomize:(d:SavedDocument)=>void;
  onEdit:(d:SavedDocument)=>void;
  onDelete:(d:SavedDocument)=>void;
  onRefresh:()=>void;
  openPrefs:()=>void;
}) {
  const canAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';
  return (
    <>
      {/* Titre + bouton (le bouton sous le titre, vert sauge) */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Gestion des feuilles</h1>

        {canAdmin && (
          <button
            type="button"
            onClick={onCreateDocument}
           className="mt-3 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium
             bg-[#0F766E] hover:bg-[#115E59] text-white shadow
             focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5EEAD4]"
          >
            <Plus className="w-4 h-4" />
            Créer une feuille
          </button>
        )}
      </div>

      {/* Barre outils */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" leadingIcon={<Star className="w-4 h-4" />}>Favoris</Button>
          <Button variant="secondary" size="sm">Catégorie</Button>
          <Button variant="secondary" size="sm">Date</Button>
          <div className="ml-auto w-full sm:w-[380px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Rechercher feuilles…"
                className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {searchTerm && (
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={()=>setSearchTerm('')} aria-label="Effacer">×</button>
              )}
            </div>
          </div>
          <OverflowMenu onRefresh={onRefresh} onOpenPreferences={openPrefs} />
        </div>
      </div>

      {/* Grille de documents */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-200 p-6">
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" aria-hidden />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {allDocuments.length === 0 ? 'Aucune feuille créée' : 'Aucun résultat'}
            </h3>
            <p className="text-gray-600 mb-6">
              {allDocuments.length === 0 ? 'Commencez par créer votre première feuille interactive.' : 'Essayez de modifier vos critères de recherche.'}
            </p>
          
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map(doc => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                isFavorite={favorites.includes(doc.id)}
                onToggleFavorite={() => toggleFavorite(doc.id)}
                onPreview={() => onPreview(doc)}
                onEncode={() => onEncode(doc)}
                onCustomize={() => onCustomize(doc)}
                onEdit={() => onEdit(doc)}
                onDelete={() => onDelete(doc)}
                canAdmin={canAdmin}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ----------------------- Modal “Gestion des données” ----------------------- */
function DataManagementModal({ onClose }: { onClose: () => void }) {
  const [stats, setStats] = useState(getPatientStats());
  const [isLoading, setIsLoading] = useState(false);

  const handleClearData = async () => {
    if (confirm('⚠️ ATTENTION : Cette action supprimera TOUS les patients de la base. Action irréversible. Continuer ?')) {
      setIsLoading(true); clearPatientData(); setStats(getPatientStats()); setIsLoading(false); alert('✅ Toutes les données ont été supprimées.');
    }
  };
  const handleRegenerateData = async () => {
    if (confirm('Régénérer 1000 nouveaux patients ? Les données actuelles seront remplacées.')) {
      setIsLoading(true); regeneratePatientData(); setStats(getPatientStats()); setIsLoading(false); alert('✅ 1000 nouveaux patients générés.');
    }
  };
  const handleExportData = () => {
    const csvContent = exportPatientData();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `patients_export_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-indigo-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Gestion de la base de données</h2>
              <p className="text-sm text-gray-600">Administration des données patients</p>
            </div>
          </div>
          <Button variant="tertiary" onClick={onClose}>Fermer</Button>
        </div>

        <div className="p-6 overflow-auto max-h-[60vh]">
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Statistiques actuelles</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-blue-800">Séjours total</div>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-indigo-600">{stats.uniquePatients || 'N/A'}</div>
                <div className="text-sm text-indigo-800">Patients uniques</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{Object.keys(stats.sites).length}</div>
                <div className="text-sm text-green-800">Sites différents</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.floors).length}</div>
                <div className="text-sm text-purple-800">Services différents</div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3">Répartition par services</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {Object.entries(stats.services || {}).map(([service, count]) => (
                  <div key={service} className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>{service}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button variant="secondary" className="w-full justify-center" leadingIcon={<Download className="w-4 h-4" />} onClick={handleExportData}>
              Exporter toutes les données (CSV)
            </Button>
            <Button variant="secondary" className="w-full justify-center" leadingIcon={<RefreshCw className="w-4 h-4" />} onClick={handleRegenerateData}>
              Régénérer 1000 nouveaux séjours
            </Button>
            <Button variant="danger" className="w-full justify-center" leadingIcon={<Trash2 className="w-4 h-4" />} onClick={handleClearData}>
              Vider toutes les données
            </Button>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-1">⚠️ Attention</h4>
                <p className="text-sm text-yellow-800">
                  Les données sont stockées en mémoire. Elles seront perdues lors du rechargement de la page.
                  La suppression des données est <strong>irréversible</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <Button variant="secondary" className="w-full justify-center" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </div>
  );
}
