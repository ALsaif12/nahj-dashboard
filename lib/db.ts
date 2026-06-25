// Local JSON store for KPI actuals submitted via team input forms.
// The Excel file is never modified — submissions live here and overlay
// the read-only sheet values when displayed.

import 'server-only';
import fs from 'node:fs';
import type { ActualSubmission, Quarter, Role } from './types';
import { storeFile } from './paths';

interface Store { actuals: ActualSubmission[]; nextId: number; }

function storePath(): string {
  return storeFile('actuals.json');
}

function read(): Store {
  const file = storePath();
  if (!fs.existsSync(file)) return { actuals: [], nextId: 1 };
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw) as Store;
    if (!parsed.actuals || !parsed.nextId) return { actuals: [], nextId: 1 };
    return parsed;
  } catch {
    return { actuals: [], nextId: 1 };
  }
}

function write(s: Store): void {
  const file = storePath();
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(s, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

export function listActuals(): ActualSubmission[] {
  const s = read();
  return [...s.actuals].sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
}

/** Latest submitted actual per (kpiId, quarter). */
export function latestActualsByKpi(): Record<string, ActualSubmission> {
  const s = read();
  const map: Record<string, ActualSubmission> = {};
  for (const a of s.actuals) {
    const key = `${a.kpiId}:${a.quarter}`;
    if (!map[key] || map[key].submittedAt < a.submittedAt) map[key] = a;
  }
  return map;
}

export function insertActual(input: {
  kpiId: number; quarter: Quarter; value: number;
  submittedBy: string; submittedByRole: Role;
  note?: string | null;
}): ActualSubmission {
  const s = read();
  const submission: ActualSubmission = {
    id: s.nextId,
    kpiId: input.kpiId,
    quarter: input.quarter,
    value: input.value,
    submittedBy: input.submittedBy,
    submittedByRole: input.submittedByRole,
    submittedAt: new Date().toISOString(),
    note: input.note ?? null,
  };
  s.actuals.push(submission);
  s.nextId += 1;
  write(s);
  return submission;
}
