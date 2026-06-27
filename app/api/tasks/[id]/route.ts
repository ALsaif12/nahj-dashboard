import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { canViewProgramTasks, canEditTask } from '@/lib/permissions';
import { getTask, updateTask, deleteTask } from '@/lib/tasks-store';
import { resolveAssignee, validateLink } from '@/lib/task-helpers';
import { log } from '@/lib/audit-log';
import type { TaskPriority } from '@/lib/types';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const task = getTask(Number(params.id));
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  if (!canViewProgramTasks(user, task.programKey)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json({ task });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const task = getTask(Number(params.id));
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  if (!canEditTask(user, task)) {
    return NextResponse.json({ error: 'Forbidden — only the team head or CEO can edit tasks.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  const patch: Parameters<typeof updateTask>[1] = {};

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
    }
    patch.title = body.title;
  }
  if (body.description !== undefined) patch.description = typeof body.description === 'string' ? body.description : null;
  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
    patch.priority = body.priority;
  }
  if (body.dueDate !== undefined) {
    patch.dueDate = typeof body.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.dueDate) ? body.dueDate : null;
  }
  if (body.assignee !== undefined) {
    const assignee = resolveAssignee(task.programKey, body.assignee);
    if (assignee === 'invalid') {
      return NextResponse.json({ error: 'Assignee is not an active member of this program.' }, { status: 400 });
    }
    patch.assignee = assignee?.username ?? null;
    patch.assigneeName = assignee?.name ?? null;
  }
  if (body.link !== undefined) {
    const link = validateLink(task.programKey, body.link);
    if (link === 'invalid') {
      return NextResponse.json({ error: 'Linked item could not be found in this program.' }, { status: 400 });
    }
    patch.link = link;
  }

  const updated = await updateTask(task.id, patch, { username: user.username, name: user.displayName });
  if (!updated) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  log({
    actor: user.username,
    action: 'task.updated',
    entity: `task:${task.id}`,
    meta: { changedFields: Object.keys(body) },
  });
  return NextResponse.json({ ok: true, task: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const task = getTask(Number(params.id));
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  if (!canEditTask(user, task)) {
    return NextResponse.json({ error: 'Forbidden — only the team head or CEO can delete tasks.' }, { status: 403 });
  }
  await deleteTask(task.id);
  log({ actor: user.username, action: 'task.deleted', entity: `task:${task.id}`, meta: { title: task.title } });
  return NextResponse.json({ ok: true });
}
