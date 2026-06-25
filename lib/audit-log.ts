// Tiny append-only audit log stored in data/audit.json.
//
// Purpose: when a board member or donor asks "when was this updated and by
// whom?", the Admin → Audit page has the answer. Each entry records actor,
// action verb, entity, timestamp, and an optional meta blob.

import 'server-only';
import fs from 'node:fs';
import type { AuditEntry } from './types';
import { storeFile } from './paths';

const STORE_FILE = () => storeFile('audit.json');
const MAX_ENTRIES = 5000; // ring buffer; oldest entries drop off

interface Store { entries: AuditEntry[]; nextId: number; }

function read(): Store {
  const file = STORE_FILE();
  if (!fs.existsSync(file)) return { entries: [], nextId: 1 };
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw) as Store;
    if (!Array.isArray(parsed.entries) || typeof parsed.nextId !== 'number') {
      return { entries: [], nextId: 1 };
    }
    return parsed;
  } catch {
    return { entries: [], nextId: 1 };
  }
}

function write(s: Store): void {
  const file = STORE_FILE();
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(s, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

export function log(input: { actor: string; action: string; entity?: string | null; meta?: Record<string, unknown> | null }): void {
  const s = read();
  s.entries.push({
    id: s.nextId,
    ts: new Date().toISOString(),
    actor: input.actor,
    action: input.action,
    entity: input.entity ?? null,
    meta: input.meta ?? null,
  });
  s.nextId += 1;
  if (s.entries.length > MAX_ENTRIES) s.entries = s.entries.slice(-MAX_ENTRIES);
  // Don't let a logging failure ever crash the caller — best-effort.
  try { write(s); }
  catch (err) { console.error('[audit] write failed', err); }
}

export function listEntries(opts?: { limit?: number; action?: string; actor?: string }): AuditEntry[] {
  const s = read();
  let xs = s.entries.slice();
  if (opts?.action) xs = xs.filter((e) => e.action === opts.action);
  if (opts?.actor) xs = xs.filter((e) => e.actor === opts.actor);
  xs.sort((a, b) => (a.ts < b.ts ? 1 : -1));
  if (opts?.limit) xs = xs.slice(0, opts.limit);
  return xs;
}
