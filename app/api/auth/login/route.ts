import { NextResponse } from 'next/server';
import { authenticate, createSession } from '@/lib/auth';
import { log } from '@/lib/audit-log';
import { landingPath } from '@/lib/permissions';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.username !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
  const user = await authenticate(body.username, body.password);
  if (!user) {
    log({ actor: body.username || 'unknown', action: 'auth.login.failed', entity: null, meta: null });
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  await createSession(user);
  log({ actor: user.username, action: 'auth.login.success', entity: null, meta: { role: user.role } });
  return NextResponse.json({ ok: true, role: user.role, landing: landingPath(user) });
}
