// Local JSON store for tasks (the execution layer).
// Same {items, nextId} + atomic-rename pattern as lib/db.ts, but every mutator
// runs inside withLock() so concurrent team writes can't clobber each other.

import 'server-only';
import fs from 'node:fs';
import type {
  Task, TaskStatus, TaskPriority, TaskLink, TaskComment, ProgramKey,
} from './types';
import { storeFile } from './paths';
import { withLock } from './store-lock';
import { getData } from './data-service';
import { canTransition } from './task-constants';

interface Store { tasks: Task[]; nextId: number; }

const PROGRAMS: ProgramKey[] = ['badir', 'risala', 'iktashif'];

function storePath(): string {
  return storeFile('tasks.json');
}
function lockKey(): string {
  return storePath();
}

const EMPTY: Store = { tasks: [], nextId: 1 };

function read(): Store {
  const file = storePath();
  if (!fs.existsSync(file)) {
    // First run — seed sample tasks so the board demos full, then persist.
    const seeded = buildSeed();
    try { write(seeded); } catch { /* read-only FS — usable in memory */ }
    return seeded;
  }
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw) as Store;
    if (!Array.isArray(parsed.tasks) || typeof parsed.nextId !== 'number') return { ...EMPTY };
    return parsed;
  } catch {
    return { ...EMPTY };
  }
}

function write(s: Store): void {
  const file = storePath();
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(s, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

// ----- Queries (sync) -----

export interface TaskFilter {
  programKey?: ProgramKey;
  programKeys?: ProgramKey[];
  assignee?: string;
  status?: TaskStatus;
  needsReview?: boolean;
}

const PRIORITY_RANK: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export function listTasks(filter: TaskFilter = {}): Task[] {
  let xs = read().tasks;
  if (filter.programKey) xs = xs.filter((t) => t.programKey === filter.programKey);
  if (filter.programKeys) xs = xs.filter((t) => filter.programKeys!.includes(t.programKey));
  if (filter.assignee) xs = xs.filter((t) => t.assignee === filter.assignee);
  if (filter.status) xs = xs.filter((t) => t.status === filter.status);
  if (filter.needsReview) xs = xs.filter((t) => t.status === 'in-review');
  // Open tasks first, then by priority, then earliest due date.
  return [...xs].sort((a, b) => {
    const aDone = a.status === 'done' ? 1 : 0;
    const bDone = b.status === 'done' ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (p !== 0) return p;
    const ad = a.dueDate ?? '9999';
    const bd = b.dueDate ?? '9999';
    return ad < bd ? -1 : ad > bd ? 1 : a.id - b.id;
  });
}

export function getTask(id: number): Task | undefined {
  return read().tasks.find((t) => t.id === id);
}

export function tasksByProgram(programKey: ProgramKey): Task[] {
  return listTasks({ programKey });
}

export function tasksByAssignee(username: string): Task[] {
  return listTasks({ assignee: username });
}

export function tasksNeedingReview(programKeys: ProgramKey[]): Task[] {
  return listTasks({ programKeys, needsReview: true });
}

export function countOpenByProgram(): Record<ProgramKey, number> {
  const out = { badir: 0, risala: 0, iktashif: 0 } as Record<ProgramKey, number>;
  for (const t of read().tasks) if (t.status !== 'done') out[t.programKey] += 1;
  return out;
}

/** Count of items that demand the user's attention (for the notification bell). */
export function countActionable(username: string, managePrograms: ProgramKey[]): number {
  const today = new Date().toISOString().slice(0, 10);
  const tasks = read().tasks;
  const mineOpen = tasks.filter(
    (t) => t.assignee === username && t.status !== 'done' &&
      (t.status === 'todo' || t.status === 'in-progress' || (t.dueDate !== null && t.dueDate < today)),
  ).length;
  const needsReview = tasks.filter(
    (t) => t.status === 'in-review' && managePrograms.includes(t.programKey),
  ).length;
  return mineOpen + needsReview;
}

// ----- Mutators (async, serialized) -----

export interface CreateTaskInput {
  programKey: ProgramKey;
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  assignee?: string | null;
  assigneeName?: string | null;
  dueDate?: string | null;
  link?: TaskLink | null;
  createdBy: string;
  createdByName: string;
}

export function createTask(input: CreateTaskInput): Promise<Task> {
  return withLock(lockKey(), () => {
    const s = read();
    const now = new Date().toISOString();
    const task: Task = {
      id: s.nextId,
      programKey: input.programKey,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: 'todo',
      priority: input.priority ?? 'medium',
      assignee: input.assignee ?? null,
      assigneeName: input.assigneeName ?? null,
      createdBy: input.createdBy,
      dueDate: input.dueDate ?? null,
      link: input.link ?? null,
      comments: [{
        id: 1,
        author: 'system',
        authorName: input.createdByName,
        body: '',
        createdAt: now,
        system: { kind: 'created' },
      }],
      nextCommentId: 2,
      createdAt: now,
      updatedAt: now,
      reviewRequestedAt: null,
      closedAt: null,
      closedBy: null,
    };
    s.tasks.push(task);
    s.nextId += 1;
    write(s);
    return task;
  });
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  assignee?: string | null;
  assigneeName?: string | null;
  dueDate?: string | null;
  link?: TaskLink | null;
}

export function updateTask(id: number, patch: UpdateTaskInput, actor: { username: string; name: string }): Promise<Task | null> {
  return withLock(lockKey(), () => {
    const s = read();
    const t = s.tasks.find((x) => x.id === id);
    if (!t) return null;
    const now = new Date().toISOString();

    // Record an assignment system comment when the assignee changes.
    if (patch.assignee !== undefined && patch.assignee !== t.assignee) {
      t.comments.push({
        id: t.nextCommentId++,
        author: actor.username,
        authorName: actor.name,
        body: '',
        createdAt: now,
        system: { kind: 'assign', to: patch.assigneeName ?? patch.assignee ?? 'unassigned' },
      });
    }
    if (patch.title !== undefined) t.title = patch.title.trim();
    if (patch.description !== undefined) t.description = patch.description?.trim() || null;
    if (patch.priority !== undefined) t.priority = patch.priority;
    if (patch.assignee !== undefined) { t.assignee = patch.assignee; t.assigneeName = patch.assigneeName ?? null; }
    if (patch.dueDate !== undefined) t.dueDate = patch.dueDate;
    if (patch.link !== undefined) t.link = patch.link;
    t.updatedAt = now;
    write(s);
    return t;
  });
}

export function deleteTask(id: number): Promise<boolean> {
  return withLock(lockKey(), () => {
    const s = read();
    const before = s.tasks.length;
    s.tasks = s.tasks.filter((t) => t.id !== id);
    if (s.tasks.length === before) return false;
    write(s);
    return true;
  });
}

// Status state-machine lives in lib/task-constants (shared with the client).
export { canTransition };

export function setStatus(
  id: number,
  to: TaskStatus,
  actor: { username: string; name: string },
): Promise<Task | null | 'illegal'> {
  return withLock(lockKey(), () => {
    const s = read();
    const t = s.tasks.find((x) => x.id === id);
    if (!t) return null;
    if (t.status === to) return t;
    if (!canTransition(t.status, to)) return 'illegal';
    const now = new Date().toISOString();
    const from = t.status;

    let kind: NonNullable<TaskComment['system']>['kind'] = 'status';
    if (from === 'in-review' && to === 'done') { kind = 'approve'; t.closedAt = now; t.closedBy = actor.username; }
    else if (from === 'in-review' && to === 'in-progress') kind = 'request-changes';
    else if (to === 'in-review') t.reviewRequestedAt = now;
    if (to !== 'done') { t.closedAt = null; t.closedBy = null; }

    t.status = to;
    t.updatedAt = now;
    t.comments.push({
      id: t.nextCommentId++,
      author: actor.username,
      authorName: actor.name,
      body: '',
      createdAt: now,
      system: { kind, from, to },
    });
    write(s);
    return t;
  });
}

export function addComment(
  id: number,
  input: { author: string; authorName: string; body: string },
): Promise<TaskComment | null> {
  return withLock(lockKey(), () => {
    const s = read();
    const t = s.tasks.find((x) => x.id === id);
    if (!t) return null;
    const comment: TaskComment = {
      id: t.nextCommentId++,
      author: input.author,
      authorName: input.authorName,
      body: input.body.trim(),
      createdAt: new Date().toISOString(),
    };
    t.comments.push(comment);
    t.updatedAt = comment.createdAt;
    write(s);
    return comment;
  });
}

// ----- First-run seed -----

/**
 * Build a handful of demo tasks per program, linked to REAL KPI/milestone/risk
 * ids resolved from the workbook, spread across statuses (incl. one in-review so
 * the approval flow demos) and assigned to the seeded demo members / heads.
 * Assignee names are best-effort; if a member account isn't created yet the
 * username still matches once Phase-2 seeding runs.
 */
function buildSeed(): Store {
  const tasks: Task[] = [];
  let id = 1;
  const now = '2026-01-05T08:00:00.000Z';

  // Resolve real entity ids from the workbook (best-effort; tolerate failure).
  let workbook: import('./types').Workbook | null = null;
  try { workbook = getData(); } catch { workbook = null; }

  const memberName: Record<string, string> = {
    'badir-m1': 'Sara (Badir)', 'badir-m2': 'Omar (Badir)',
    'risala-m1': 'Layla (Risala)', 'risala-m2': 'Yousef (Risala)',
    'iktashif-m1': 'Noura (Iktashif)', 'iktashif-m2': 'Khalid (Iktashif)',
  };

  for (const program of PROGRAMS) {
    const kpi = workbook?.kpis.find((k) => k.programs.includes(program));
    const milestone = workbook?.projects[program]?.milestones?.find((m) => !m.invalidEnd);
    const risk = workbook?.risks.find((r) => r.programKey === program);
    const m1 = `${program}-m1`, m2 = `${program}-m2`;

    const make = (
      title: string, status: TaskStatus, priority: TaskPriority,
      assignee: string | null, dueOffsetDays: number | null,
      link: TaskLink | null,
    ): Task => {
      const due = dueOffsetDays === null ? null
        : new Date(Date.UTC(2026, 1, 1 + dueOffsetDays)).toISOString().slice(0, 10);
      const comments: TaskComment[] = [{
        id: 1, author: 'system', authorName: 'Program Head', body: '', createdAt: now,
        system: { kind: 'created' },
      }];
      return {
        id: id++, programKey: program, title, description: null, status, priority,
        assignee, assigneeName: assignee ? (memberName[assignee] ?? assignee) : null,
        createdBy: program, dueDate: due, link, comments, nextCommentId: 2,
        createdAt: now, updatedAt: now,
        reviewRequestedAt: status === 'in-review' ? now : null,
        closedAt: status === 'done' ? now : null,
        closedBy: status === 'done' ? program : null,
      };
    };

    if (kpi) tasks.push(make(
      `Collect Q2 data for KPI ${kpi.id}`, 'in-progress', 'high', m1, 20,
      { kind: 'kpi', programKey: program, refId: kpi.id, labelSnapshot: `KPI ${kpi.id}` },
    ));
    if (milestone) tasks.push(make(
      milestone.name.slice(0, 60), 'todo', 'medium', m2, 45,
      { kind: 'milestone', programKey: program, refId: milestone.id, labelSnapshot: milestone.name.slice(0, 40) },
    ));
    if (risk) tasks.push(make(
      `Execute mitigation for R${risk.id}`, 'in-review', 'urgent', m1, 10,
      { kind: 'risk', programKey: program, refId: risk.id, labelSnapshot: `R${risk.id}` },
    ));
    tasks.push(make('Weekly team sync notes', 'done', 'low', m2, -5, null));
  }

  return { tasks, nextId: id };
}
