import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { canApproveTask, canAdvanceTask } from '@/lib/permissions';
import { getTask, setStatus, canTransition } from '@/lib/tasks-store';
import { isApprovalTransition, TASK_STATUSES } from '@/lib/task-constants';
import { log } from '@/lib/audit-log';
import type { TaskStatus } from '@/lib/types';

const STATUSES = TASK_STATUSES;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const task = getTask(Number(params.id));
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const to = body?.to as TaskStatus;
  if (!STATUSES.includes(to)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  if (to === task.status) return NextResponse.json({ ok: true, task });

  if (!canTransition(task.status, to)) {
    return NextResponse.json({ error: `Cannot move a task from ${task.status} to ${to}.` }, { status: 400 });
  }

  // Authorize: approval-type transitions need manage rights; the rest only
  // need the assignee (or a manager).
  const allowed = isApprovalTransition(task.status, to)
    ? canApproveTask(user, task)
    : canAdvanceTask(user, task);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden — you cannot make this change.' }, { status: 403 });
  }

  const result = await setStatus(task.id, to, { username: user.username, name: user.displayName });
  if (result === 'illegal') return NextResponse.json({ error: 'Illegal transition' }, { status: 400 });
  if (!result) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  const action =
    task.status === 'in-review' && to === 'done' ? 'task.approved' :
    task.status === 'in-review' && to === 'in-progress' ? 'task.changes-requested' :
    `task.status.${to}`;
  log({ actor: user.username, action, entity: `task:${task.id}`, meta: { from: task.status, to } });

  return NextResponse.json({ ok: true, task: result });
}
