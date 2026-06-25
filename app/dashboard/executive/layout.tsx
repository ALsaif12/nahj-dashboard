import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { canAccessPanel, landingPath } from '@/lib/permissions';
import { getPanelData } from '@/lib/data-service';
import { effectiveActual, ragStatus } from '@/lib/utils';
import { ExecutivePanelChrome } from '@/components/executive-panel-chrome';

export const dynamic = 'force-dynamic';

export default async function ExecutiveLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect('/login');
  if (!canAccessPanel(user, 'executive')) redirect(landingPath(user));

  const { workbook, visibleKpis, visibleRisks } = getPanelData('executive');

  // Sub-nav counts so each tab shows live numbers.
  const onTrack = visibleKpis.filter((k) => {
    const last = [...k.quarters].reverse().find((q) => effectiveActual(q) !== null);
    const actual = last ? effectiveActual(last) : null;
    return ragStatus(actual, typeof k.annualTarget === 'number' ? k.annualTarget : null) === 'green';
  }).length;

  const counts = {
    kpis: visibleKpis.length,
    risks: visibleRisks.length,
    onTrack,
    timeline: 3, // 3 programs
    strategy: workbook.strategy.objectives.length,
  };

  return <ExecutivePanelChrome counts={counts}>{children}</ExecutivePanelChrome>;
}
