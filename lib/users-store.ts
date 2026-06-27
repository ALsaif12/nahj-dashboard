// Local JSON store for users and their permissions.
//
// On first read, the file at `data/users.json` is seeded with four default
// accounts that mirror the legacy quick-account logins (executive / badir /
// risala / iktashif). The CEO can then add, edit, deactivate, and reassign
// roles via the admin panel — the changes write back to this JSON file.
//
// Passwords are stored in plaintext here because this is an on-prem dev tool;
// when NAHJ moves to an IDP, swap `authenticate()` for the provider and drop
// the `password` field.

import 'server-only';
import fs from 'node:fs';
import type { ProgramKey, Role, UserPermissions, UserRecord } from './types';
import { storeFile } from './paths';

const STORE_FILE = () => storeFile('users.json');

interface Store { users: UserRecord[]; }

function defaultPermissionsFor(role: Role, scope: ProgramKey | null): UserPermissions {
  switch (role) {
    case 'ceo':
      return {
        accessibleProgramPanels: ['badir', 'risala', 'iktashif'],
        canAccessExecutive: true,
        canAccessAdmin: true,
        canSubmitActuals: true,
        readOnly: false,
      };
    case 'program-manager':
      return {
        accessibleProgramPanels: scope ? [scope] : [],
        canAccessExecutive: false,
        canAccessAdmin: false,
        canSubmitActuals: true,
        readOnly: false,
      };
    case 'board-member':
      return {
        accessibleProgramPanels: ['badir', 'risala', 'iktashif'],
        canAccessExecutive: true,
        canAccessAdmin: false,
        canSubmitActuals: false,
        readOnly: true,
      };
    case 'viewer':
      return {
        accessibleProgramPanels: scope ? [scope] : [],
        canAccessExecutive: false,
        canAccessAdmin: false,
        canSubmitActuals: false,
        readOnly: true,
      };
    case 'sponsor':
      return {
        accessibleProgramPanels: scope ? [scope] : [],
        canAccessExecutive: false,
        canAccessAdmin: false,
        canSubmitActuals: false,
        readOnly: true,
      };
  }
}

// The four built-in accounts. Defined as a pure function so they can be used
// both for first-run seeding AND as a guaranteed fallback (see ensureDemoAccounts).
export function demoUsers(): UserRecord[] {
  const now = '2026-01-01T00:00:00.000Z'; // stable timestamp so the records are deterministic
  return [
    {
      id: 'u_executive',
      username: 'executive',
      password: process.env.NAHJ_PW_EXEC || '1',
      name: 'Fahad — Executive Director',
      email: 'executive@nahj.org',
      role: 'ceo',
      permissions: defaultPermissionsFor('ceo', null),
      scope: null,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'u_badir',
      username: 'badir',
      password: process.env.NAHJ_PW_BADIR || '1',
      name: 'Badir Program Manager',
      email: 'badir@nahj.org',
      role: 'program-manager',
      permissions: defaultPermissionsFor('program-manager', 'badir'),
      scope: 'badir',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'u_risala',
      username: 'risala',
      password: process.env.NAHJ_PW_RISALA || '1',
      name: 'Risala Program Manager',
      email: 'risala@nahj.org',
      role: 'program-manager',
      permissions: defaultPermissionsFor('program-manager', 'risala'),
      scope: 'risala',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'u_iktashif',
      username: 'iktashif',
      password: process.env.NAHJ_PW_IKTASHIF || '1',
      name: 'Iktashif Nahj Program Manager',
      email: 'iktashif@nahj.org',
      role: 'program-manager',
      permissions: defaultPermissionsFor('program-manager', 'iktashif'),
      scope: 'iktashif',
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function seed(): Store {
  return { users: demoUsers() };
}

const DEMO_USERNAMES = new Set(['executive', 'badir', 'risala', 'iktashif']);

/**
 * Guarantee the four built-in accounts always exist AND enforce their canonical
 * role/scope/permissions/active state, ignoring any drift on disk.
 *
 * Why force, not merge: these are fixed-meaning accounts. `executive` must be a
 * full CEO; each program manager must see ONLY their own program — never the
 * Executive panel or another program. Earlier admin/demo edits had left e.g.
 * `risala` with canAccessExecutive=true, which let a program manager open the
 * Executive panel. Re-deriving from the canonical definition on every read
 * makes the access model bulletproof regardless of disk state.
 *
 * Preserved from disk: name, email, and password (so a CEO can rename or change
 * the password of a built-in account and it sticks). Everything access-related
 * is canonical.
 */
function ensureDemoAccounts(users: UserRecord[]): UserRecord[] {
  const canon = new Map(demoUsers().map((d) => [d.username.toLowerCase(), d]));
  const seen = new Set<string>();

  const normalized = users.map((u) => {
    const key = u.username.toLowerCase();
    const def = canon.get(key);
    if (!def) return u; // not a built-in account — leave fully as-is
    seen.add(key);
    return {
      ...u,
      // keep disk identity + credentials
      name: u.name,
      email: u.email,
      password: u.password,
      // force the access model to canonical
      role: def.role,
      scope: def.scope,
      permissions: def.permissions,
      active: true,
    };
  });

  // Add any built-in accounts missing from disk entirely.
  const missing = demoUsers().filter((d) => !seen.has(d.username.toLowerCase()));
  return missing.length ? [...normalized, ...missing] : normalized;
}

function read(): Store {
  const file = STORE_FILE();
  if (!fs.existsSync(file)) {
    const s = seed();
    try { write(s); } catch { /* read-only FS — still usable in memory */ }
    return s;
  }
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw) as Store;
    if (!parsed.users || !Array.isArray(parsed.users)) return seed();
    return { users: ensureDemoAccounts(parsed.users) };
  } catch {
    return seed();
  }
}

function write(s: Store): void {
  const file = STORE_FILE();
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(s, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

export function listUsers(): UserRecord[] {
  return read().users;
}

export function findByUsername(username: string): UserRecord | undefined {
  return read().users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
}

export function findById(id: string): UserRecord | undefined {
  return read().users.find((u) => u.id === id);
}

export interface CreateUserInput {
  username: string;
  password: string;
  name: string;
  email: string;
  role: Role;
  scope: ProgramKey | null;
  permissions?: Partial<UserPermissions>;
}

export function createUser(input: CreateUserInput): UserRecord {
  const s = read();
  if (s.users.some((u) => u.username.toLowerCase() === input.username.toLowerCase())) {
    throw new Error('A user with that username already exists.');
  }
  const now = new Date().toISOString();
  const base = defaultPermissionsFor(input.role, input.scope);
  const user: UserRecord = {
    id: 'u_' + Math.random().toString(36).slice(2, 9),
    username: input.username.trim(),
    password: input.password,
    name: input.name.trim(),
    email: input.email.trim(),
    role: input.role,
    permissions: { ...base, ...(input.permissions ?? {}) },
    scope: input.scope,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  s.users.push(user);
  write(s);
  return user;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
  scope?: ProgramKey | null;
  permissions?: Partial<UserPermissions>;
  active?: boolean;
}

export function updateUser(id: string, input: UpdateUserInput): UserRecord {
  const s = read();
  const idx = s.users.findIndex((u) => u.id === id);
  if (idx < 0) throw new Error('User not found.');
  const prev = s.users[idx];
  const role = input.role ?? prev.role;
  const scope = input.scope === undefined ? prev.scope : input.scope;
  // Only re-derive base permissions when role/scope ACTUALLY change. The edit
  // dialog sends role+scope on every save, so comparing against prev prevents
  // a name/email edit from silently resetting custom permission grants.
  const roleOrScopeChanged = role !== prev.role || scope !== prev.scope;
  const basePerms = roleOrScopeChanged ? defaultPermissionsFor(role, scope) : prev.permissions;
  const next: UserRecord = {
    ...prev,
    name: input.name ?? prev.name,
    email: input.email ?? prev.email,
    password: input.password ?? prev.password,
    role,
    scope,
    permissions: { ...basePerms, ...(input.permissions ?? {}) },
    active: input.active ?? prev.active,
    updatedAt: new Date().toISOString(),
  };
  s.users[idx] = next;
  write(s);
  return next;
}

/** Recompute the default permissions for a (role, scope) tuple — used by the UI. */
export function getDefaultPermissions(role: Role, scope: ProgramKey | null): UserPermissions {
  return defaultPermissionsFor(role, scope);
}
