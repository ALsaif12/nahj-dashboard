import { loadTeamPanel } from '@/lib/team-panel-data';
import { KpiCard } from '@/components/kpi-card';
import { Card, CardContent } from '@/components/ui/card';
import { TeamKpisEmpty } from '@/components/team-kpis-empty';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const { kpis } = await loadTeamPanel('iktashif');
  if (kpis.length === 0) return <TeamKpisEmpty programKey="iktashif" />;
  return (
    <div id="kpis" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {kpis.map((k, i) => <div key={k.id} id={`kpi-${k.id}`}><KpiCard kpi={k} delay={i * 0.04} /></div>)}
    </div>
  );
}
