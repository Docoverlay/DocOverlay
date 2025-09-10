// api/me.ts
import type { ModuleKey } from '../shared/modules';

export type MePreferences = {
  defaultModule: ModuleKey | null;
  enabledModules: ModuleKey[]; // préférences d'affichage (UI)
  allowedModules?: ModuleKey[]; // ce que le backend autorise à cet utilisateur (optionnel)
};

const mockPrefs: MePreferences = {
  defaultModule: null,
  enabledModules: ['scan', 'medix', 'encodage', 'oprest', 'doc'],
  allowedModules: ['scan', 'medix', 'encodage', 'oprest', 'doc'],
};

export async function getMyPreferences(): Promise<MePreferences> {
  try {
    const res = await fetch('/api/me/preferences', { credentials: 'include' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return (await res.json()) as MePreferences;
  } catch {
    // Fallback demo
    return structuredClone(mockPrefs);
  }
}

export async function updateMyPreferences(update: Partial<MePreferences>): Promise<MePreferences> {
  try {
    const res = await fetch('/api/me/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(update),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return (await res.json()) as MePreferences;
  } catch {
    // Fallback demo: merge into mock
    const current = await getMyPreferences();
    const merged: MePreferences = {
      defaultModule: update.defaultModule ?? current.defaultModule ?? null,
      enabledModules: update.enabledModules ?? current.enabledModules ?? [],
      allowedModules: current.allowedModules ?? update.allowedModules,
    };
    Object.assign(mockPrefs, merged);
    return structuredClone(mockPrefs);
  }
}