// Server-side validation helpers shared by the task API routes.
// Never trust the client: assignees must belong to the program and be active,
// and entity links must resolve against the live workbook.

import 'server-only';
import type { ProgramKey, TaskLink } from './types';
import { findByUsername } from './users-store';
import { getData } from './data-service';
import { canAccessPanel } from './permissions';

export interface ResolvedAssignee { username: string; name: string; }

/**
 * Resolve an assignee for a task in `programKey`.
 * - null username        → unassigned (valid)
 * - 'invalid'            → user missing/inactive/not in program (reject 400)
 * - ResolvedAssignee     → ok, with a name snapshot
 */
export function resolveAssignee(
  programKey: ProgramKey,
  username: string | null | undefined,
): ResolvedAssignee | null | 'invalid' {
  if (!username) return null;
  const u = findByUsername(username);
  if (!u || !u.active) return 'invalid';
  // The assignee must be able to open this program's panel.
  const fakeSession = {
    username: u.username, role: u.role, displayName: u.name,
    permissions: u.permissions, scope: u.scope,
  };
  if (!canAccessPanel(fakeSession, programKey)) return 'invalid';
  return { username: u.username, name: u.name };
}

/**
 * Validate and snapshot an entity link against the live workbook.
 * - null/undefined input → null (no link, valid)
 * - 'invalid'            → kind/refId doesn't resolve (reject 400)
 * - TaskLink             → ok, with a fresh labelSnapshot
 */
export function validateLink(
  programKey: ProgramKey,
  input: { kind?: unknown; refId?: unknown } | null | undefined,
): TaskLink | null | 'invalid' {
  if (!input || input.kind == null) return null;
  const kind = input.kind;
  const refId = typeof input.refId === 'number' ? input.refId : Number(input.refId);
  if (!Number.isFinite(refId)) return 'invalid';
  if (kind !== 'kpi' && kind !== 'milestone' && kind !== 'risk') return 'invalid';

  const wb = getData();
  if (kind === 'kpi') {
    const k = wb.kpis.find((x) => x.id === refId && x.programs.includes(programKey));
    if (!k) return 'invalid';
    return { kind, programKey, refId, labelSnapshot: `KPI ${k.id}` };
  }
  if (kind === 'risk') {
    const r = wb.risks.find((x) => x.id === refId && x.programKey === programKey);
    if (!r) return 'invalid';
    return { kind, programKey, refId, labelSnapshot: `R${r.id}` };
  }
  // milestone
  const m = wb.projects[programKey]?.milestones?.find((x) => x.id === refId);
  if (!m) return 'invalid';
  return { kind, programKey, refId, labelSnapshot: m.name.slice(0, 60) };
}
