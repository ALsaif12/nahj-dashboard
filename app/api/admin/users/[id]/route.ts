import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { canAccessPanel } from '@/lib/permissions';
import { findById, updateUser } from '@/lib/users-store';
import { log } from '@/lib/audit-log';

async function ensureCeo() {
  const user = await getSession();
  if (!user) return { user: null, err: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!canAccessPanel(user, 'admin')) return { user: null, err: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { user, err: null as null };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { user, err } = await ensureCeo();
  if (err) return err;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

  // Safety: don't let an admin lock themselves out of the only admin seat.
  const target = findById(params.id);
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  try {
    const updated = updateUser(params.id, body);
    const action =
      body.active === false && target.active ? 'user.deactivated' :
      body.active === true && !target.active ? 'user.reactivated' :
      'user.updated';
    log({ actor: user!.username, action, entity: `user:${updated.id}`, meta: { changedFields: Object.keys(body) } });
    const { password, ...safe } = updated;
    return NextResponse.json({ ok: true, user: safe });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
