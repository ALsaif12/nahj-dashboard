'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Coins, User, Building2 } from 'lucide-react';
import type { Workbook, ProgramKey, Project, Kpi, Risk } from '@/lib/types';
import { PageHeader } from './page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { KpiCard } from './kpi-card';
import { RiskExplorer } from './risk-explorer';
import { GanttChart } from './gantt-chart';
import { InputForm } from './input-form';
import { TrafficLightStrip } from './traffic-light-strip';
import { StatusBanner } from './status-banner';
import { AtAGlanceWrapper } from './at-a-glance-wrapper';
import { ProjectCharterAccordion } from './project-charter-accordion';
import { effectiveActual, formatDate, ragStatus } from '@/lib/utils';
import { useI18n } from './i18n-provider';
import type { TranslationKey } from '@/lib/i18n';

const PROGRAM_TONE: Record<ProgramKey, { tone: string; accent: string }> = {
  badir: { tone: 'from-nahj-gold/15 via-white to-white', accent: 'border-l-nahj-gold' },
  risala: { tone: 'from-nahj-teal/15 via-white to-white', accent: 'border-l-nahj-teal' },
  iktashif: { tone: 'from-nahj-navy/10 via-white to-white', accent: 'border-l-nahj-navy' },
};

interface Props {
  programKey: ProgramKey;
  project: Project;
  kpis: Kpi[];
  risks: Risk[];
  canSubmit: boolean;
  workbook: Workbook;
}

export function TeamPanel({ programKey, project, kpis, risks, canSubmit }: Props) {
  const { t, locale } = useI18n();
  const fmt = (n: number) => n.toLocaleString(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US');
  const meta = PROGRAM_TONE[programKey];
  const programTitle = t(`nav.${programKey}` as TranslationKey);

  const statuses = kpis.map((k) => {
    const last = [...k.quarters].reverse().find((q) => effectiveActual(q) !== null);
    return ragStatus(last ? effectiveActual(last) : null, typeof k.annualTarget === 'number' ? k.annualTarget : null);
  });
  const greens = statuses.filter((s) => s === 'green').length;
  const ambers = statuses.filter((s) => s === 'amber').length;
  const reds = statuses.filter((s) => s === 'red').length;
  const criticalRisks = risks.filter((r) => r.band === 'critical').length;
  const totalBudget = project.expectedBudget ?? project.totalCost;

  return (
    <div className="space-y-6">
      <PageHeader
        title={programTitle}
        description={project.purpose ?? undefined}
        badge={
          <div className="flex items-center gap-1.5">
            <Badge variant="teal">{kpis.length} {kpis.length === 1 ? t('nav.kpis').slice(0, -1) || t('nav.kpis') : t('nav.kpis')}</Badge>
            <Badge variant="gold">{risks.length} {risks.length === 1 ? t('nav.risk') : t('nav.risks')}</Badge>
          </div>
        }
      />

      {kpis.length > 0 && (
        <StatusBanner
          onTrack={greens}
          totalKpis={kpis.length}
          atRisk={ambers}
          offTrack={reds}
          totalRisks={risks.length}
          criticalRisks={criticalRisks}
          totalBudget={totalBudget}
          programs={[project]}
          scope={programKey}
        />
      )}

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className={`bg-gradient-to-br ${meta.tone} border-l-4 ${meta.accent}`}>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6">
            <ProjectField icon={<User className="h-3.5 w-3.5" />} label={t('project.field.manager')} value={project.manager || t('project.field.unassigned')} />
            <ProjectField icon={<Building2 className="h-3.5 w-3.5" />} label={t('project.field.sponsor')} value={project.sponsor || '—'} />
            <ProjectField icon={<Calendar className="h-3.5 w-3.5" />} label={t('project.field.timeline')} value={project.startDate || project.endDate ? `${formatDate(project.startDate)} → ${formatDate(project.endDate)}` : t('project.field.timelinePending')} />
            <ProjectField icon={<Coins className="h-3.5 w-3.5" />} label={t('project.field.budget')} value={totalBudget ? t('common.budgetSar', { amount: fmt(totalBudget) }) : t('project.field.budgetNone')} />
          </CardContent>
        </Card>
      </motion.div>

      {kpis.length > 0 && <TrafficLightStrip kpis={kpis} />}

      {/* Collapsible project charter — replaces the old always-visible brief block. */}
      <ProjectCharterAccordion project={project} />

      <Tabs defaultValue="glance">
        <TabsList className="flex-wrap">
          <TabsTrigger value="glance">{t('tabs.glance')}</TabsTrigger>
          <TabsTrigger value="kpis">{t('tabs.kpisShort')} · {kpis.length}</TabsTrigger>
          <TabsTrigger value="risks">{t('tabs.risksShort')} · {risks.length}</TabsTrigger>
          <TabsTrigger value="gantt">{t('tabs.gantt')} · {project.milestones.length}</TabsTrigger>
          {project.costs.length > 0 && <TabsTrigger value="budget">{t('tabs.budget')}</TabsTrigger>}
        </TabsList>

        <TabsContent value="glance">
          <AtAGlanceWrapper kpis={kpis} risks={risks} projects={[project]} />
        </TabsContent>

        <TabsContent value="kpis">
          <div id="kpis">
            {kpis.length === 0 ? (
              <Card><CardContent className="py-12 text-center">
                <div className="text-sm font-medium text-nahj-navy mb-1">{t('kpi.noKpisMapped')}</div>
                <div className="text-xs max-w-md mx-auto text-muted-foreground">
                  {t('kpi.noKpisMappedDetail', { program: programTitle })}
                </div>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {kpis.map((k, i) => <div key={k.id} id={`kpi-${k.id}`}><KpiCard kpi={k} delay={i * 0.04} /></div>)}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="risks">
          <div id="risks">
            {risks.length === 0 ? (
              <Card><CardContent className="py-12 text-center">
                <div className="text-sm font-medium text-nahj-navy mb-1">{t('risk.noRisks.title')}</div>
                <div className="text-xs text-muted-foreground">{t('risk.noRisks.detail', { program: programTitle })}</div>
              </CardContent></Card>
            ) : (
              <RiskExplorer risks={risks} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="gantt">
          <Card>
            <CardHeader>
              <CardTitle>{t('tabs.gantt')} · {locale === 'ar' ? project.arabicName : project.englishName}</CardTitle>
              <CardDescription>{t('project.milestones.count', { count: project.milestones.length, packages: new Set(project.milestones.map((m) => m.group)).size })}</CardDescription>
            </CardHeader>
            <CardContent>
              <GanttChart milestones={project.milestones} startDate={project.startDate} endDate={project.endDate} />
            </CardContent>
          </Card>
        </TabsContent>

        {project.costs.length > 0 && (
          <TabsContent value="budget">
            <Card>
              <CardHeader>
                <CardTitle>{t('budget.title')}</CardTitle>
                <CardDescription>{t('budget.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead className="text-start text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="pb-2 text-start">{t('budget.col.item')}</th>
                      <th className="pb-2 text-start">{t('budget.col.resource')}</th>
                      <th className="pb-2 text-end">{t('budget.col.unit')}</th>
                      <th className="pb-2 text-end">{t('budget.col.qty')}</th>
                      <th className="pb-2 text-end">{t('budget.col.totalSar')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {project.costs.map((c, i) => (
                      <tr key={i}>
                        <td className="py-2.5" dir="rtl"><span className="font-arabic">{c.type}</span></td>
                        <td className="py-2.5 text-muted-foreground" dir="rtl"><span className="font-arabic">{c.resource ?? '—'}</span></td>
                        <td className="py-2.5 text-end tabular-nums">{c.unitValue !== null ? fmt(c.unitValue) : '—'}</td>
                        <td className="py-2.5 text-end tabular-nums">{c.quantity ?? '—'}</td>
                        <td className="py-2.5 text-end tabular-nums font-medium">{fmt(c.total)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-nahj-navy/20 bg-nahj-cream/30">
                      <td colSpan={4} className="py-3 text-end font-medium text-nahj-navy uppercase tracking-wider text-xs">{t('budget.total')}</td>
                      <td className="py-3 text-end font-serif text-lg text-nahj-navy tabular-nums">{t('common.budgetSar', { amount: fmt(project.totalCost) })}</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {canSubmit && kpis.length > 0 && (
        <div id="input-form">
          <InputForm kpis={kpis} />
        </div>
      )}
    </div>
  );
}

function ProjectField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const isArabic = /[؀-ۿ]/.test(value);
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        {icon}{label}
      </div>
      <div dir={isArabic ? 'rtl' : 'ltr'} className={isArabic ? 'font-arabic text-sm text-nahj-navy' : 'text-sm text-nahj-navy'}>
        {value}
      </div>
    </div>
  );
}
