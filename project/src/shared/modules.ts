// shared/modules.ts
export type Role = 'SUPERADMIN' | 'ADMIN' | 'USER';

export type ModuleKey = 'scan' | 'medix' | 'encodage' | 'oprest' | 'doc';

export const MODULES: Record<ModuleKey, { label: string; path: string }> = {
  scan:     { label: 'Scan2Overlay',            path: '/scan2overlay' },
  medix:    { label: 'Imagerie',                path: '/imagerie' },
  encodage: { label: 'Encodage',                path: '/encodage' },
  oprest:   { label: 'Oprest (Presse)',         path: '/oprest' },
  doc:      { label: 'DocOverlay (Dashboard)',  path: '/dashboard' },
};

export const ALL_MODULE_KEYS: ModuleKey[] = Object.keys(MODULES) as ModuleKey[];