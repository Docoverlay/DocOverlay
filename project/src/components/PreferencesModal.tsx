import React, { useEffect, useState } from 'react';
import { X, Settings, Save, Shield, Monitor } from 'lucide-react';
import { ModuleKey, MODULES, ALL_MODULE_KEYS } from '../shared/modules';
import { getMyPreferences, updateMyPreferences, MePreferences } from '../api/me';
import Button from './ui/Button';

interface PreferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PreferencesModal({ open, onOpenChange }: PreferencesModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<MePreferences | null>(null);

  const allowed = React.useMemo<ModuleKey[]>(() => {
    if (!prefs) return [];
    return (prefs.allowedModules && prefs.allowedModules.length > 0)
      ? prefs.allowedModules
      : ALL_MODULE_KEYS; // si backend ne renvoie pas, on affiche tout
  }, [prefs]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getMyPreferences()
      .then((p) => setPrefs(p))
      .finally(() => setLoading(false));
  }, [open]);

  function toggleModule(m: ModuleKey) {
    if (!prefs) return;
    const set = new Set(prefs.enabledModules);
    if (set.has(m)) set.delete(m); else set.add(m);
    setPrefs({ ...prefs, enabledModules: Array.from(set) });
  }

  async function onSave() {
    if (!prefs) return;
    setSaving(true);
    try {
      const cleaned = {
        defaultModule: prefs.defaultModule ?? null,
        enabledModules: prefs.enabledModules.filter((m) => allowed.includes(m)),
      } as Partial<MePreferences>;
      const saved = await updateMyPreferences(cleaned);
      setPrefs(saved);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  function onResetDefault() {
    if (!prefs) return;
    setPrefs({ ...prefs, defaultModule: null });
  }

  function setDefaultModule(value: string) {
    if (!prefs) return;
    setPrefs({ ...prefs, defaultModule: (value === 'none' ? null : value as ModuleKey) });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Préférences utilisateur</h2>
              <p className="text-sm text-gray-600">Personnalisez votre expérience</p>
            </div>
          </div>
          <Button variant="tertiary" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
              <span className="ml-2">Chargement...</span>
            </div>
          ) : prefs ? (
            <div className="space-y-8">
              {/* Module d'ouverture par défaut */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Module d'ouverture par défaut
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-4">
                    Choisissez le module qui s'ouvrira automatiquement à votre connexion.
                  </p>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="defaultModule"
                        checked={prefs.defaultModule === null}
                        onChange={() => setDefaultModule('none')}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Dashboard complet (par défaut)</span>
                        <p className="text-xs text-gray-500">Afficher le tableau de bord principal</p>
                      </div>
                    </label>
                    {allowed.filter(m => m !== 'doc').map((moduleKey) => (
                      <label key={moduleKey} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="defaultModule"
                          checked={prefs.defaultModule === moduleKey}
                          onChange={() => setDefaultModule(moduleKey)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">{MODULES[moduleKey].label}</span>
                          <p className="text-xs text-gray-500">Redirection vers {MODULES[moduleKey].path}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modules visibles */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Modules visibles sur le dashboard
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Sélectionnez les modules que vous souhaitez voir sur votre dashboard.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {allowed.map((moduleKey) => (
                      <label key={moduleKey} className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-white transition-colors">
                        <input
                          type="checkbox"
                          checked={prefs.enabledModules.includes(moduleKey)}
                          onChange={() => toggleModule(moduleKey)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">{MODULES[moduleKey].label}</span>
                          <p className="text-xs text-gray-500">{MODULES[moduleKey].path}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Erreur lors du chargement des préférences</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {prefs && (
                <>
                  Module par défaut: <strong>{prefs.defaultModule ? MODULES[prefs.defaultModule].label : 'Dashboard'}</strong>
                  <span className="mx-2">•</span>
                  {prefs.enabledModules.length} module(s) visible(s)
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button 
                variant="primary" 
                leadingIcon={<Save className="w-4 h-4" />}
                onClick={onSave}
                loading={saving}
                disabled={!prefs || loading}
              >
                Sauvegarder
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}