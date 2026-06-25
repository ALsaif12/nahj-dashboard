import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getData } from '@/lib/data-service';
import { Shell } from '@/components/shell';
import { effectiveActual, ragStatus } from '@/lib/utils';
import { canAccessPanel } from '@/lib/permissions';
import type { Kpi, ProgramKey, Risk } from '@/lib/types';

export const dynamic = 'force-dynamic';

function badgeFor(kpis: Kpi[], risks: Risk[]) {
  const onTrack = kpis.filter((k) => {
    const last = [...k.quarters].reverse().find((q) => effectiveActual(q) !== null);
    const actual = last ? effectiveActual(last) : null;
    return ragStatus(actual, typeof k.annualTarget === 'number' ? k.annualTarget : null) === 'green';
  }).length;
  const criticalRisks = risks.filter((r) => r.band === 'critical').length;
  return { onTrack, totalKpis: kpis.length, openRisks: risks.length, criticalRisks };
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect('/login');
  const wb = getData();

  const programKeys: ProgramKey[] = ['badir', 'risala', 'iktashif'];
  const badges = {
    ...(canAccessPanel(user, 'executive') ? { executive: badgeFor(wb.kpis, wb.risks) } : {}),
    ...Object.fromEntries(
      programKeys
        .filter((p) => canAccessPanel(user, p))
        .map((p) => [
          p,
          badgeFor(
            wb.kpis.filter((k) => k.programs.includes(p)),
            wb.risks.filter((r) => r.programKey === p),
          ),
        ]),
    ),
  };

  return <Shell user={user} loadedAt={wb.loadedAt} badges={badges}>{children}</Shell>;
}
