// Centralised access-control helpers. Every page/route that needs to gate
// content goes through these so the rules live in one place.

import type { ProgramKey, SessionUser, Task } from './types';

export type PanelKey = 'executive' | 'admin' | ProgramKey;

/** Can the user open this panel at all? */
export function canAccessPanel(user: SessionUser, panel: PanelKey): boolean {
  if (panel === 'admin') return user.permissions.canAccessAdmin;
  if (panel === 'executive') return user.permissions.canAccessExecutive;
  return user.permissions.accessibleProgramPanels.includes(panel);
}

/** Is the user allowed to write (submit actuals, edit risks, …)? */
export function canWrite(user: SessionUser): boolean {
  return !user.permissions.readOnly;
}

export function canSubmitActuals(user: SessionUser, kpiPrograms: ProgramKey[]): boolean {
  if (!canWrite(user)) return false;
  if (!user.permissions.canSubmitActuals) return false;
  if (user.permissions.canAccessExecutive) return true; // CEO can submit on any KPI
  // Otherwise the KPI must be tied to one of the user's accessible programs.
  return kpiPrograms.some((p) => user.permissions.accessibleProgramPanels.includes(p));
}

/** First panel a user should land on when they sign in. */
export function landingPath(user: SessionUser): string {
  if (user.permissions.canAccessExecutive) return '/dashboard/executive';
  const p = user.permissions.accessibleProgramPanels[0];
  if (p) return `/dashboard/${p}`;
  // Fallback — sponsor/viewer with no scope should still see something.
  return '/dashboard/executive';
}

// ===== Task manager access control =====
//
// "Manage" = create/edit/assign/approve. The CEO manages every program; a
// program-manager (team head) manages only their own. Team-members can VIEW
// their program's board but only ADVANCE tasks assigned to them.

/** Head of this program (or CEO): full task control within it. */
export function canManageTasks(user: SessionUser, programKey: ProgramKey): boolean {
  if (user.permissions.canAccessExecutive) return true; // CEO across all programs
  if (user.role === 'program-manager') return user.scope === programKey;
  return false;
}

/** Anyone who can open the program panel can read its board. */
export function canViewProgramTasks(user: SessionUser, programKey: ProgramKey): boolean {
  return canAccessPanel(user, programKey);
}

/** Edit task fields / delete: head or CEO only. */
export function canEditTask(user: SessionUser, task: Task): boolean {
  return canManageTasks(user, task.programKey);
}

/** Approve / request-changes / reopen: head or CEO only. */
export function canApproveTask(user: SessionUser, task: Task): boolean {
  return canManageTasks(user, task.programKey);
}

/** Advance through todo→in-progress→in-review etc: manager, or the assignee. */
export function canAdvanceTask(user: SessionUser, task: Task): boolean {
  if (canManageTasks(user, task.programKey)) return true;
  return task.assignee === user.username && canAccessPanel(user, task.programKey);
}
