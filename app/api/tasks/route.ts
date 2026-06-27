import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { canManageTasks } from '@/lib/permissions';
import { listTasks, createTask } from '@/lib/tasks-store';
import { resolveAssignee, validateLink } from '@/lib/task-helpers';
import { log } from '@/lib/audit-log';
import type { ProgramKey, TaskPriority } from '@/lib/types';

const PROGRAMS: ProgramKey[] = ['badir', 'risala', 'iktashif'];
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

function manageablePrograms(user: Awaited<ReturnType<typeof getSession>>): ProgramKey[] {
  if (!user) return [];
  return PROGRAMS.filter((p) => canManageTasks(user, p));
}

export async function GET(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const mine = url.searchParams.get('mine') === '1';
  const needsReview = url.searchParams.get('needsReview') === '1';
  const programParam = url.searchParams.get('program') as ProgramKey | null;
  const statusParam = url.searchParams.get('status');

  // Base visibility: the programs this user can open.
  let scope = user.permissions.accessibleProgramPanels;
  if (programParam && PROGRAMS.includes(programParam)) {
    scope = scope.filter((p) => p === programParam);
  }
  // needsReview is a manager view → restrict to programs the user manages.
  if (needsReview) scope = manageablePrograms(user).filter((p) => scope.includes(p));

  let tasks = listTasks({ programKeys: scope });
  if (mine) tasks = tasks.filter((t) => t.assignee === user.username);
  if (needsReview) tasks = tasks.filter((t) => t.status === 'in-review');
  if (statusParam) tasks = tasks.filter((t) => t.status === statusParam);

  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.title !== 'string' || !body.title.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }
  const programKey = body.programKey as ProgramKey;
  if (!PROGRAMS.includes(programKey)) {
    return NextResponse.json({ error: 'Invalid program' }, { status: 400 });
  }
  if (!canManageTasks(user, programKey)) {
    return NextResponse.json({ error: 'Forbidden — only the team head or CEO can create tasks.' }, { status: 403 });
  }

  const priority: TaskPriority = PRIORITIES.includes(body.priority) ? body.priority : 'medium';

  const assignee = resolveAssignee(programKey, body.assignee);
  if (assignee === 'invalid') {
    return NextResponse.json({ error: 'Assignee is not an active member of this program.' }, { status: 400 });
  }
  const link = validateLink(programKey, body.link);
  if (link === 'invalid') {
    return NextResponse.json({ error: 'Linked item could not be found in this program.' }, { status: 400 });
  }
  const dueDate = typeof body.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.dueDate) ? body.dueDate : null;

  const task = await createTask({
    programKey,
    title: body.title,
    description: typeof body.description === 'string' ? body.description : null,
    priority,
    assignee: assignee?.username ?? null,
    assigneeName: assignee?.name ?? null,
    dueDate,
    link,
    createdBy: user.username,
    createdByName: user.displayName,
  });

  log({
    actor: user.username,
    action: 'task.created',
    entity: `task:${task.id}`,
    meta: { programKey, title: task.title, assignee: task.assignee, link: link?.kind ?? null },
  });

  return NextResponse.json({ ok: true, task });
}
