// Server helpers that assemble the (serializable) props the client TaskBoard
// needs: the viewer's manage scope, eligible assignees per program, and the
// KPI/milestone/risk link options resolved from the live workbook.

import 'server-only';
import type { ProgramKey, SessionUser } from './types';
import type { BoardUser, BoardMember, ProgramLinkOptions, LinkOption } from './task-ui';
import { canManageTasks } from './permissions';
import { listUsers } from './users-store';
import { getData } from './data-service';

const PROGRAMS: ProgramKey[] = ['badir', 'risala', 'iktashif'];

export function buildBoardUser(user: SessionUser): BoardUser {
  return {
    username: user.username,
    displayName: user.displayName,
    managePrograms: PROGRAMS.filter((p) => canManageTasks(user, p)),
  };
}

/**
 * Active, write-capable users who can access each requested program — i.e. the
 * people a task can be assigned to (team members + the head). Read-only roles
 * (board-member/viewer/sponsor) are excluded. A user with multi-program access
 * (e.g. CEO) appears once per program.
 */
export function eligibleMembers(programKeys: ProgramKey[]): BoardMember[] {
  const out: BoardMember[] = [];
  for (const u of listUsers()) {
    if (!u.active || u.permissions.readOnly) continue;
    for (const p of programKeys) {
      if (u.permissions.accessibleProgramPanels.includes(p)) {
        out.push({ username: u.username, name: u.name, programKey: p });
      }
    }
  }
  return out;
}

function truncate(s: string, n = 50): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export function buildLinkOptions(programKeys: ProgramKey[]): Record<string, ProgramLinkOptions> {
  const wb = getData();
  const out: Record<string, ProgramLinkOptions> = {};
  for (const p of programKeys) {
    const kpis: LinkOption[] = wb.kpis
      .filter((k) => k.programs.includes(p))
      .map((k) => ({ id: k.id, label: `KPI ${k.id} — ${truncate(k.arabicName, 40)}` }));
    const milestones: LinkOption[] = (wb.projects[p]?.milestones ?? [])
      .map((m) => ({ id: m.id, label: truncate(m.name, 55) }));
    const risks: LinkOption[] = wb.risks
      .filter((r) => r.programKey === p)
      .map((r) => ({ id: r.id, label: `R${r.id} — ${truncate(r.name, 40)}` }));
    out[p] = { kpis, milestones, risks };
  }
  return out;
}
