import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { canAccessPanel, landingPath } from '@/lib/permissions';
import { getPanelData } from '@/lib/data-service';
import { Scorecard } from '@/components/scorecard';
import { Gauge } from '@/components/gauge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { effectiveActual, formatValue } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ExecutiveStrategyPage() {
  const user = await getSession();
  if (!user) redirect('/login');
  if (!canAccessPanel(user, 'executive')) redirect(landingPath(user));

  const { workbook, visibleKpis } = getPanelData('executive');
  const kpi17 = workbook.kpis.find((k) => k.id === 17);
  const kpi19 = workbook.kpis.find((k) => k.id === 19);
  const gauge = (k?: typeof kpi17) => {
    if (!k) return null;
    const last = [...k.quarters].reverse().find((q) => effectiveActual(q) !== null);
    const actual = last ? effectiveActual(last) : null;
    const target = typeof k.annualTarget === 'number' ? k.annualTarget : 1;
    return { actual: actual ?? 0, target };
  };
  const g17 = gauge(kpi17);
  const g19 = gauge(kpi19);

  return (
    <div className="space-y-6">
      <Scorecard objectives={workbook.strategy.objectives} kpis={visibleKpis} pillars={workbook.strategy.pillars} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>KPI 17 · Operating Model</CardTitle>
            <CardDescription dir="rtl" className="font-arabic">{kpi17?.arabicName}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            {g17 ? <Gauge value={g17.actual} target={g17.target} label="Operating model completion" sublabel={`Target ${formatValue(g17.target, 'percentage')}`} /> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>KPI 19 · Revenue Diversification</CardTitle>
            <CardDescription dir="rtl" className="font-arabic">{kpi19?.arabicName}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            {g19 ? <Gauge value={g19.actual} target={g19.target} label="Funding from diverse sources" sublabel={`Target ${(g19.target / 1000).toFixed(0)}k SAR`} color="#D4B96A" /> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
