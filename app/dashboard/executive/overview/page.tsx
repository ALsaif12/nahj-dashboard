import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { canAccessPanel, landingPath } from '@/lib/permissions';
import { getPanelData } from '@/lib/data-service';
import { effectiveActual, ragStatus } from '@/lib/utils';
import { ExecutiveOverview } from '@/components/executive-overview';

export const dynamic = 'force-dynamic';

export default async function ExecutiveOverviewPage() {
  const user = await getSession();
  if (!user) redirect('/login');
  if (!canAccessPanel(user, 'executive')) redirect(landingPath(user));

  const { workbook, visibleKpis, visibleRisks } = getPanelData('executive');
  const projects = [workbook.projects.badir, workbook.projects.risala, workbook.projects.iktashif];

  // Pre-compute aggregates so the client component just renders.
  const greens = visibleKpis.filter((k) => {
    const last = [...k.quarters].reverse().find((q) => effectiveActual(q) !== null);
    return ragStatus(last ? effectiveActual(last) : null, typeof k.annualTarget === 'number' ? k.annualTarget : null) === 'green';
  }).length;
  const ambers = visibleKpis.filter((k) => {
    const last = [...k.quarters].reverse().find((q) => effectiveActual(q) !== null);
    return ragStatus(last ? effectiveActual(last) : null, typeof k.annualTarget === 'number' ? k.annualTarget : null) === 'amber';
  }).length;
  const reds = visibleKpis.filter((k) => {
    const last = [...k.quarters].reverse().find((q) => effectiveActual(q) !== null);
    return ragStatus(last ? effectiveActual(last) : null, typeof k.annualTarget === 'number' ? k.annualTarget : null) === 'red';
  }).length;
  const criticalRisks = visibleRisks.filter((r) => r.band === 'critical').length;
  const totalBudget = projects.reduce((acc, p) => acc + (p.expectedBudget ?? p.totalCost), 0);

  // Per-program slices for the summary cards.
  const perProgram = projects.map((p) => ({
    project: p,
    kpis: workbook.kpis.filter((k) => k.programs.includes(p.key)),
    risks: workbook.risks.filter((r) => r.programKey === p.key),
  }));

  return (
    <ExecutiveOverview
      stats={{
        onTrack: greens,
        totalKpis: visibleKpis.length,
        atRisk: ambers,
        offTrack: reds,
        totalRisks: visibleRisks.length,
        criticalRisks,
        totalBudget,
      }}
      perProgram={perProgram}
      projects={projects}
    />
  );
}
