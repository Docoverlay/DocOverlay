// api/superadmin.ts
import type { ModuleKey, Role } from '../shared/modules';

export type SuperUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  authorizedModules: ModuleKey[]; // ce que cet utilisateur peut utiliser (côté org/policy)
};

export type ImportJob = {
  id: string;
  filename: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  createdAt: string;
};

export type ExportJob = {
  id: string;
  type: string; // ex: 'full', 'patients', 'billing'
  status: 'queued' | 'running' | 'done' | 'failed';
  createdAt: string;
};

export type AuditEntry = {
  id: string;
  actor: string; // email ou nom
  action: string; // ex: 'UPDATE_ROLE', 'IMPORT_DB', 'RUN_EXPORT'
  target?: string; // ex: userId, module, export type
  createdAt: string;
};

// --- Mock de secours ---
let MOCK_USERS: SuperUser[] = [
  { id: '1', name: 'Super Admin', email: 'superadmin@demo.local', role: 'SUPERADMIN', authorizedModules: ['scan','medix','encodage','oprest','doc'] },
  { id: '2', name: 'Administrateur', email: 'admin@demo.local', role: 'ADMIN', authorizedModules: ['scan','encodage','doc'] },
  { id: '3', name: 'Utilisateur', email: 'user@demo.local', role: 'USER', authorizedModules: ['doc','oprest'] },
];

let MOCK_IMPORTS: ImportJob[] = [];
let MOCK_EXPORTS: ExportJob[] = [];
let MOCK_AUDIT: AuditEntry[] = [];

function pushAudit(entry: Omit<AuditEntry, 'id'|'createdAt'>) {
  MOCK_AUDIT.unshift({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...entry });
}

// --- Users ---
export async function listUsers(): Promise<SuperUser[]> {
  try {
    const res = await fetch('/api/superadmin/users', { credentials: 'include' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch {
    return structuredClone(MOCK_USERS);
  }
}

export async function updateUserRole(userId: string, role: Role): Promise<SuperUser> {
  try {
    const res = await fetch(`/api/superadmin/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const updated = await res.json();
    return updated as SuperUser;
  } catch {
    const u = MOCK_USERS.find(u => u.id === userId);
    if (!u) throw new Error('User not found');
    u.role = role;
    pushAudit({ actor: 'demo@system', action: 'UPDATE_ROLE', target: `${u.email} -> ${role}` });
    return structuredClone(u);
  }
}

export async function updateUserModules(userId: string, modules: ModuleKey[]): Promise<SuperUser> {
  try {
    const res = await fetch(`/api/superadmin/users/${userId}/modules`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ modules }),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch {
    const u = MOCK_USERS.find(u => u.id === userId);
    if (!u) throw new Error('User not found');
    u.authorizedModules = modules;
    pushAudit({ actor: 'demo@system', action: 'UPDATE_MODULES', target: `${u.email} -> ${modules.join(',')}` });
    return structuredClone(u);
  }
}

// --- DB Imports ---
export async function listImports(): Promise<ImportJob[]> {
  try {
    const res = await fetch('/api/superadmin/imports', { credentials: 'include' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch {
    return structuredClone(MOCK_IMPORTS);
  }
}

export async function importDatabase(file: File): Promise<ImportJob> {
  try {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/superadmin/db/import', {
      method: 'POST',
      credentials: 'include',
      body: form,
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch {
    const job: ImportJob = {
      id: crypto.randomUUID(),
      filename: file.name,
      status: 'done',
      createdAt: new Date().toISOString(),
    };
    MOCK_IMPORTS.unshift(job);
    pushAudit({ actor: 'demo@system', action: 'IMPORT_DB', target: file.name });
    return job;
  }
}

// --- Exports ---
export async function listExports(): Promise<ExportJob[]> {
  try {
    const res = await fetch('/api/superadmin/exports', { credentials: 'include' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch {
    return structuredClone(MOCK_EXPORTS);
  }
}

export async function runExport(type: string): Promise<ExportJob> {
  try {
    const res = await fetch('/api/superadmin/exports/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ type }),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch {
    const job: ExportJob = {
      id: crypto.randomUUID(),
      type,
      status: 'done',
      createdAt: new Date().toISOString(),
    };
    MOCK_EXPORTS.unshift(job);
    pushAudit({ actor: 'demo@system', action: 'RUN_EXPORT', target: type });
    return job;
  }
}

// --- Audit ---
export async function listAudit(params?: { from?: string; to?: string; user?: string; action?: string }): Promise<AuditEntry[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.set('from', params.from);
    if (params?.to) searchParams.set('to', params.to);
    if (params?.user) searchParams.set('user', params.user);
    if (params?.action) searchParams.set('action', params.action);
    
    const res = await fetch(`/api/superadmin/audit?${searchParams}`, { credentials: 'include' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch {
    return structuredClone(MOCK_AUDIT);
  }
}