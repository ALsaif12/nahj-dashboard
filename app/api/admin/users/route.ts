import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { canAccessPanel } from '@/lib/permissions';
import { createUser, listUsers } from '@/lib/users-store';
import { log } from '@/lib/audit-log';
import type { ProgramKey, Role } from '@/lib/types';

async function ensureCeo() {
  const user = await getSession();
  if (!user) return { user: null, err: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!canAccessPanel(user, 'admin')) return { user: null, err: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { user, err: null as null };
}

export async function GET() {
  const { user, err } = await ensureCeo();
  if (err) return err;
  const users = listUsers().map(({ password, ...u }) => u);
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const { user, err } = await ensureCeo();
  if (err) return err;
  const body = await req.json().catch(() => null);
  if (!body || !body.username || !body.password || !body.name || !body.email || !body.role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  try {
    const created = createUser({
      username: body.username,
      password: body.password,
      name: body.name,
      email: body.email,
      role: body.role as Role,
      scope: (body.scope ?? null) as ProgramKey | null,
      permissions: body.permissions,
    });
    log({ actor: user!.username, action: 'user.created', entity: `user:${created.id}`, meta: { username: created.username, role: created.role } });
    const { password, ...safe } = created;
    return NextResponse.json({ ok: true, user: safe });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
