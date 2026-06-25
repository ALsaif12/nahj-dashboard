import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { insertActual, listActuals } from '@/lib/db';
import { getData } from '@/lib/data-service';
import { canSubmitActuals } from '@/lib/permissions';
import { log } from '@/lib/audit-log';
import type { Quarter } from '@/lib/types';

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ actuals: listActuals() });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.kpiId !== 'number' || typeof body.quarter !== 'string' || typeof body.value !== 'number') {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
  const validQ: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  if (!validQ.includes(body.quarter)) return NextResponse.json({ error: 'Invalid quarter' }, { status: 400 });

  const wb = getData();
  const kpi = wb.kpis.find((k) => k.id === body.kpiId);
  if (!kpi) return NextResponse.json({ error: 'KPI not found' }, { status: 404 });
  if (!canSubmitActuals(user, kpi.programs)) {
    return NextResponse.json({ error: 'Forbidden — you do not have submit rights for this KPI.' }, { status: 403 });
  }

  const saved = insertActual({
    kpiId: body.kpiId,
    quarter: body.quarter,
    value: body.value,
    submittedBy: user.username,
    submittedByRole: user.role,
    note: typeof body.note === 'string' ? body.note : null,
  });

  log({
    actor: user.username,
    action: 'actual.submitted',
    entity: `kpi:${body.kpiId}:${body.quarter}`,
    meta: { value: body.value, role: user.role, note: body.note ?? null },
  });

  return NextResponse.json({ ok: true, actual: saved });
}
