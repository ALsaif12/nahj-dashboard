// Shared task constants + the status state-machine. No 'server-only' so the
// client board can import the same rules the API enforces (single source of
// truth for which moves are legal).

import type { TaskStatus, TaskPriority } from './types';

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in-progress', 'blocked', 'in-review', 'done'];
export const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

/** Legal status transitions. Authorization is layered on top (see permissions). */
export const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  'todo': ['in-progress', 'blocked'],
  'in-progress': ['in-review', 'blocked', 'todo'],
  'blocked': ['in-progress', 'todo'],
  'in-review': ['done', 'in-progress'],   // approve | request-changes
  'done': ['in-progress'],                // reopen
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return TASK_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Transitions that close/judge a task — reserved for the head/CEO. */
export function isApprovalTransition(from: TaskStatus, to: TaskStatus): boolean {
  if (from === 'in-review' && (to === 'done' || to === 'in-progress')) return true; // approve / request-changes
  if (from === 'done' && to === 'in-progress') return true;                          // reopen
  return false;
}
