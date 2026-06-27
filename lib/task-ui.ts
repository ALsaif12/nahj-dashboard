// Client-safe task helpers: capability checks (mirroring lib/permissions, used
// only to decide which controls to SHOW — the server re-checks every write) plus
// style/label maps shared by the board components.

import type { ProgramKey, Task, TaskStatus, TaskPriority } from './types';
import { TASK_TRANSITIONS, isApprovalTransition } from './task-constants';
import type { TranslationKey } from './i18n';

export interface BoardUser {
  username: string;
  displayName: string;
  /** Programs where this user can manage/approve tasks (CEO: all 3). */
  managePrograms: ProgramKey[];
}

export interface BoardMember {
  username: string;
  name: string;
  programKey: ProgramKey;
}

export interface LinkOption { id: number; label: string; }
export interface ProgramLinkOptions {
  kpis: LinkOption[];
  milestones: LinkOption[];
  risks: LinkOption[];
}

export function canManage(user: BoardUser, programKey: ProgramKey): boolean {
  return user.managePrograms.includes(programKey);
}
export function canApprove(user: BoardUser, task: Task): boolean {
  return canManage(user, task.programKey);
}
export function canAdvance(user: BoardUser, task: Task): boolean {
  return canManage(user, task.programKey) || task.assignee === user.username;
}

/** Status targets this user is allowed to move the task to right now. */
export function allowedTransitions(task: Task, user: BoardUser): TaskStatus[] {
  return (TASK_TRANSITIONS[task.status] ?? []).filter((to) =>
    isApprovalTransition(task.status, to) ? canApprove(user, task) : canAdvance(user, task),
  );
}

export interface TransitionAction { key: TranslationKey; variant: 'primary' | 'default' | 'ghost' | 'destructive'; }

/** Human label + button style for a specific transition. */
export function actionFor(from: TaskStatus, to: TaskStatus): TransitionAction {
  if (to === 'blocked') return { key: 'task.setBlocked', variant: 'ghost' };
  if (from === 'todo' && to === 'in-progress') return { key: 'task.start', variant: 'default' };
  if (from === 'blocked' && to === 'in-progress') return { key: 'task.resume', variant: 'default' };
  if (from === 'in-progress' && to === 'in-review') return { key: 'task.markDone', variant: 'primary' };
  if (from === 'in-review' && to === 'done') return { key: 'task.approve', variant: 'primary' };
  if (from === 'in-review' && to === 'in-progress') return { key: 'task.requestChanges', variant: 'default' };
  if (from === 'done' && to === 'in-progress') return { key: 'task.reopen', variant: 'default' };
  if (to === 'todo') return { key: 'task.moveToTodo', variant: 'ghost' };
  return { key: 'task.start', variant: 'default' };
}

export const STATUS_LABEL_KEY: Record<TaskStatus, TranslationKey> = {
  'todo': 'task.col.todo',
  'in-progress': 'task.col.inProgress',
  'blocked': 'task.col.blocked',
  'in-review': 'task.col.inReview',
  'done': 'task.col.done',
};

export const PRIORITY_LABEL_KEY: Record<TaskPriority, TranslationKey> = {
  low: 'task.priority.low',
  medium: 'task.priority.medium',
  high: 'task.priority.high',
  urgent: 'task.priority.urgent',
};

// Pill colors for priority (matches the glass palette).
export const PRIORITY_STYLE: Record<TaskPriority, string> = {
  low: 'bg-white/8 text-white/55 border-white/15',
  medium: 'bg-nahj-teal/15 text-nahj-teal border-nahj-teal/30',
  high: 'bg-nahj-gold/15 text-nahj-gold-soft border-nahj-gold/30',
  urgent: 'bg-rag-red/20 text-red-300 border-red-400/40',
};

// Accent color per column (left border + count chip).
export const STATUS_ACCENT: Record<TaskStatus, string> = {
  'todo': 'rgba(255,255,255,0.35)',
  'in-progress': '#5ed0c4',
  'blocked': '#f87171',
  'in-review': '#d4b96a',
  'done': '#34d399',
};

export const PROGRAM_DOT: Record<ProgramKey, string> = {
  badir: '#d4b96a',
  risala: '#5ed0c4',
  iktashif: '#a78bfa',
};

export function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'done') return false;
  const today = new Date().toISOString().slice(0, 10);
  return task.dueDate < today;
}

export function initials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}
