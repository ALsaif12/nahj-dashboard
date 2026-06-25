'use client';

import * as React from 'react';
import type { Workbook, Kpi, Risk, Project } from '@/lib/types';
import { PageHeader } from './page-header';
import { StatusBanner } from './status-banner';
import { TrafficLightStrip } from './traffic-light-strip';
import { KpiCard } from './kpi-card';
import { RiskExplorer } from './risk-explorer';
import { Scorecard } from './scorecard';
import { Gauge } from './gauge';
import { ProgramGanttStrip } from './program-gantt-strip';
import { AtAGlanceWrapper } from './at-a-glance-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { InfoTooltip } from './info-tooltip';
import { effectiveActual, formatValue, ragStatus } from '@/lib/utils';
import { useI18n } from './i18n-provider';

interface Props {
  workbook: Workbook;
  visibleKpis: Kpi[];
  visibleRisks: Risk[];
  projects: Project[];
}

export function ExecutiveView({ workbook, visibleKpis, visibleRisks, projects }: Props) {
  const { t } = useI18n();

  const statuses = visibleKpis.map((k) => {
    const last = [...k.quarters].reverse().find((q) => effectiveActual(q) !== null);
    return ragStatus(last ? effectiveActual(last) : null, typeof k.annualTarget === 'number' ? k.annualTarget : null);
  });
  const greens = statuses.filter((s) => s === 'green').length;
  const ambers = statuses.filter((s) => s === 'amber').length;
  const reds = statuses.filter((s) => s === 'red').length;
  const criticalRisks = visibleRisks.filter((r) => r.band === 'critical').length;
  const totalBudget = projects.reduce((acc, p) => acc + (p.expectedBudget ?? p.totalCost), 0);

  const kpi17 = workbook.kpis.find((k) => k.id === 17);
  const kpi19 = workbook.kpis.find((k) => k.id === 19);
  function gaugeFor(k: Kpi | undefined) {
    if (!k) return null;
    const last = [...k.quarters].reverse().find((q) => effectiveActual(q) !== null);
    const actual = last ? effectiveActual(last) : null;
    const target = typeof k.annualTarget === 'number' ? k.annualTarget : 1;
    return { actual: actual ?? 0, target };
  }
  const g17 = gaugeFor(kpi17);
  const g19 = gaugeFor(kpi19);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('exec.title')}
        description={t('exec.description')}
        badge={<Badge variant="gold">{t('nav.allAccess')}</Badge>}
      />

      <StatusBanner
        onTrack={greens}
        totalKpis={visibleKpis.length}
        atRisk={ambers}
        offTrack={reds}
        totalRisks={visibleRisks.length}
        criticalRisks={criticalRisks}
        totalBudget={totalBudget}
        programs={projects}
        scope="executive"
      />

      <TrafficLightStrip kpis={visibleKpis} groupSize={10} />

      {/* Vision row — Arabic content from sheet, single-language UI labels */}
      <Card className="bg-gradient-to-br from-nahj-navy via-nahj-navy to-nahj-navy-deep text-nahj-ivory border-nahj-navy">
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 p-7">
          <Pillar label={t('exec.vision')} body={workbook.strategy.vision} />
          <Pillar label={t('exec.mission')} body={workbook.strategy.mission} />
          <Pillar label={t('exec.values')} body={workbook.strategy.values} footer={workbook.strategy.orgName} />
        </CardContent>
      </Card>

      {/* Program Gantt strip */}
      <section id="timeline">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-lg font-medium text-nahj-navy">{t('exec.timelineTitle')}</h2>
          <span className="text-xs text-muted-foreground">{t('exec.timelineSubtitle')}</span>
        </div>
        <ProgramGanttStrip projects={projects} />
      </section>

      <Tabs defaultValue="glance">
        <TabsList className="flex-wrap">
          <TabsTrigger value="glance">{t('tabs.glance')}</TabsTrigger>
          <TabsTrigger value="kpis">{t('tabs.kpis')} · {visibleKpis.length}</TabsTrigger>
          <TabsTrigger value="risks">{t('tabs.risks')} · {visibleRisks.length}</TabsTrigger>
          <TabsTrigger value="scorecard">{t('tabs.scorecard')}</TabsTrigger>
          <TabsTrigger value="signals">{t('tabs.signals')}</TabsTrigger>
        </TabsList>

        <TabsContent value="glance">
          <AtAGlanceWrapper kpis={visibleKpis} risks={visibleRisks} projects={projects} />
        </TabsContent>

        <TabsContent value="kpis">
          <div id="kpis" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {visibleKpis.map((k, i) => (
              <div key={k.id} id={`kpi-${k.id}`}><KpiCard kpi={k} delay={i * 0.03} /></div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="risks">
          <div id="risks">
            <RiskExplorer risks={visibleRisks} />
          </div>
        </TabsContent>

        <TabsContent value="scorecard">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-serif text-base font-medium text-nahj-navy">{t('scorecard.title')}</h3>
            <InfoTooltip body={t('glossary.bsc.body')} />
          </div>
          <Scorecard objectives={workbook.strategy.objectives} kpis={visibleKpis} pillars={workbook.strategy.pillars} />
        </TabsContent>

        <TabsContent value="signals">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('exec.signals.kpi17.title')}</CardTitle>
                <CardDescription dir="rtl" className="font-arabic">{kpi17?.arabicName}</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-6">
                {g17 ? <Gauge value={g17.actual} target={g17.target} label={t('exec.signals.kpi17.label')} sublabel={`${t('kpi.target')} ${formatValue(g17.target, 'percentage')}`} /> : null}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('exec.signals.kpi19.title')}</CardTitle>
                <CardDescription dir="rtl" className="font-arabic">{kpi19?.arabicName}</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-6">
                {g19 ? <Gauge value={g19.actual} target={g19.target} label={t('exec.signals.kpi19.label')} sublabel={`${t('kpi.target')} ${(g19.target / 1000).toFixed(0)}k SAR`} color="#E0A82E" /> : null}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Pillar({ label, body, footer }: { label: string; body: string; footer?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-nahj-gold mb-2 font-medium">{label}</div>
      <p dir="rtl" className="font-arabic text-sm leading-relaxed text-nahj-ivory/95">{body}</p>
      {footer && <div className="mt-4 text-[11px] text-nahj-ivory/60">{footer}</div>}
    </div>
  );
}
