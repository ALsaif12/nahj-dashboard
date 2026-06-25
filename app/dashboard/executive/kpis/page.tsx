// Stub sub-page — keeps the existing KPI grid working in dark glass while we
// wait for approval on the Overview redesign before applying the same treatment
// to KPIs / Risks / Timeline / Strategy.
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { canAccessPanel, landingPath } from '@/lib/permissions';
import { getPanelData } from '@/lib/data-service';
import { KpiCard } from '@/components/kpi-card';

export const dynamic = 'force-dynamic';

export default async function ExecutiveKpisPage() {
  const user = await getSession();
  if (!user) redirect('/login');
  if (!canAccessPanel(user, 'executive')) redirect(landingPath(user));

  const { visibleKpis } = getPanelData('executive');

  return (
    <div id="kpis" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      {visibleKpis.map((k, i) => (
        <div key={k.id} id={`kpi-${k.id}`}><KpiCard kpi={k} delay={i * 0.03} /></div>
      ))}
    </div>
  );
}
