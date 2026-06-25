import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { clearWorkbookCache, loadWorkbook } from '@/lib/excel-loader';
import { log } from '@/lib/audit-log';

export async function POST() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  clearWorkbookCache();
  const wb = loadWorkbook();
  log({
    actor: user.username,
    action: 'workbook.refreshed',
    entity: 'workbook',
    meta: { kpis: wb.kpis.length, risks: wb.risks.length },
  });
  return NextResponse.json({ ok: true, loadedAt: wb.loadedAt, kpis: wb.kpis.length, risks: wb.risks.length });
}
