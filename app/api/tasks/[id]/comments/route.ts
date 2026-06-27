import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { canViewProgramTasks } from '@/lib/permissions';
import { getTask, addComment } from '@/lib/tasks-store';
import { log } from '@/lib/audit-log';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const task = getTask(Number(params.id));
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  // Anyone who can see the board can comment on its tasks.
  if (!canViewProgramTasks(user, task.programKey)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.body !== 'string' || !body.body.trim()) {
    return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
  }

  const comment = await addComment(task.id, {
    author: user.username,
    authorName: user.displayName,
    body: body.body,
  });
  if (!comment) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  log({ actor: user.username, action: 'task.commented', entity: `task:${task.id}`, meta: null });
  return NextResponse.json({ ok: true, comment });
}
