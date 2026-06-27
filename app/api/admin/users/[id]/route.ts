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

  const target = findById(params.id);
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Safety: don't let the acting CEO lock themselves out of admin access.
  const editingSelf = user!.username.toLowerCase() === target.username.toLowerCase();
  if (editingSelf) {
    const losingAdmin =
      body.active === false ||
      (body.permissions && body.permissions.canAccessAdmin === false);
    if (losingAdmin) {
      return NextResponse.json(
        { error: 'You cannot remove your own admin access or deactivate yourself.' },
        { status: 400 },
      );
    }
  }

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
