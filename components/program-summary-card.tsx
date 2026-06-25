'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, User, Building2, Coins, Target, AlertTriangle, Calendar, AlertOctagon, ShieldCheck } from 'lucide-react';
import type { Project, Kpi, Risk, ProgramKey } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useI18n } from './i18n-provider';
import { cn, effectiveActual, ragStatus } from '@/lib/utils';
import { ReportingStatusBadge } from './reporting-status-badge';
import { reportingFor } from '@/lib/reporting-status';

const PROGRAM_TONE: Record<ProgramKey, { ring: string; glow: string; chip: string; orb: string }> = {
  badir: {
    ring: 'before:bg-gradient-to-br before:from-nahj-gold/40 before:via-white/10 before:to-nahj-gold/20',
    glow: 'group-hover:shadow-glow',
    chip: 'bg-nahj-gold/15 text-nahj-gold-soft border-nahj-gold/40',
    orb: 'bg-nahj-gold/40',
  },
  risala: {
    ring: 'before:bg-gradient-to-br before:from-nahj-teal/40 before:via-white/10 before:to-nahj-teal/20',
    glow: 'group-hover:shadow-[0_0_24px_-4px_rgba(58,138,157,0.5)]',
    chip: 'bg-nahj-teal/15 text-cyan-200 border-nahj-teal/40',
    orb: 'bg-nahj-teal/45',
  },
  iktashif: {
    ring: 'before:bg-gradient-to-br before:from-violet-400/40 before:via-white/10 before:to-violet-300/20',
    glow: 'group-hover:shadow-[0_0_24px_-4px_rgba(167,139,250,0.5)]',
    chip: 'bg-violet-500/15 text-violet-200 border-violet-400/40',
    orb: 'bg-violet-400/45',
  },
};

interface Props {
  project: Project;
  kpis: Kpi[];
  risks: Risk[];
  delay?: number;
}

export function ProgramSummaryCard({ project, kpis, risks, delay = 0 }: Props) {
  const { t, locale } = useI18n();
  const fmt = (n: number) => n.toLocaleString(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US');
  const tone = PROGRAM_TONE[project.key];

  // Roll up KPI status
  const onTrack = kpis.filter((k) => {
    const last = [...k.quarters].reverse().find((q) => effectiveActual(q) !== null);
    return ragStatus(last ? effectiveActual(last) : null, typeof k.annualTarget === 'number' ? k.annualTarget : null) === 'green';
  }).length;
  const offTrack = kpis.filter((k) => {
    const last = [...k.quarters].reverse().find((q) => effectiveActual(q) !== null);
    return ragStatus(last ? effectiveActual(last) : null, typeof k.annualTarget === 'number' ? k.annualTarget : null) === 'red';
  }).length;
  const critical = risks.filter((r) => r.band === 'critical').length;

  const health: 'good' | 'attention' | 'critical' =
    critical > 0 ? 'critical' :
    (offTrack > 0 || risks.some((r) => r.band === 'high')) ? 'attention' :
    'good';
  const healthLabel =
    health === 'good' ? t('overview.healthGood') :
    health === 'attention' ? t('overview.healthAttention') :
    t('overview.healthCritical');
  const healthIcon =
    health === 'good' ? <ShieldCheck className="h-3 w-3" /> :
    health === 'attention' ? <AlertTriangle className="h-3 w-3" /> :
    <AlertOctagon className="h-3 w-3" />;
  const healthClass =
    health === 'good' ? 'bg-rag-green/15 text-emerald-300 border-rag-green/40' :
    health === 'attention' ? 'bg-rag-amber/15 text-amber-300 border-rag-amber/40' :
    'bg-rag-red/15 text-red-300 border-rag-red/40';

  const totalBudget = project.expectedBudget ?? project.totalCost;
  const programLabel = locale === 'ar' ? project.arabicName : project.englishName;
  const programSecondary = locale === 'ar' ? project.englishName : project.arabicName;

  const milestoneCount = project.milestones.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
    >
      <Link href={`/dashboard/${project.key}`} className="block group focus-visible:outline-none">
        <Card className={cn('relative cursor-pointer transition-all duration-300', tone.glow)}>
          {/* Decorative coloured orb that bleeds out the top corner */}
          <div className={cn('pointer-events-none absolute -top-12 -end-12 h-40 w-40 rounded-full blur-3xl opacity-40 group-hover:opacity-70 transition-opacity', tone.orb)} />

          <CardContent className="p-6">
            {/* Heading */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Badge className={cn('font-mono text-[10px] uppercase tracking-wider', tone.chip)}>
                    {project.key}
                  </Badge>
                  <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border', healthClass)}>
                    {healthIcon}{healthLabel}
                  </span>
                  <ReportingStatusBadge state={reportingFor(kpis, project.key)} size="sm" />
                </div>
                <h3 className="font-serif text-2xl font-medium text-white leading-tight">{programLabel}</h3>
                <div dir={locale === 'ar' ? 'ltr' : 'rtl'} className={cn('mt-0.5 text-[11px] text-white/50 leading-tight truncate', locale !== 'ar' && 'font-arabic')}>
                  {programSecondary}
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-white/30 group-hover:text-nahj-gold group-hover:translate-x-1 transition-all shrink-0 mt-1" />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <Stat
                icon={<Target className="h-3 w-3" />}
                label={t('overview.programKpis')}
                value={kpis.length === 0 ? '—' : `${onTrack}/${kpis.length}`}
                tone={kpis.length === 0 ? 'muted' : onTrack === kpis.length ? 'green' : offTrack > 0 ? 'red' : 'amber'}
              />
              <Stat
                icon={<AlertTriangle className="h-3 w-3" />}
                label={t('overview.programRisks')}
                value={risks.length === 0 ? '—' : String(risks.length)}
                tone={critical > 0 ? 'red' : risks.length > 5 ? 'amber' : risks.length > 0 ? 'green' : 'muted'}
                accent={critical > 0 ? `${critical} critical` : undefined}
              />
              <Stat
                icon={<Calendar className="h-3 w-3" />}
                label={t('overview.programMilestones')}
                value={milestoneCount === 0 ? '—' : String(milestoneCount)}
                tone="muted"
              />
            </div>

            {/* Meta row */}
            <div className="grid grid-cols-1 gap-2 text-xs">
              <Meta icon={<User className="h-3 w-3" />} label={t('overview.programManager')} value={project.manager || t('project.field.unassigned')} />
              <Meta icon={<Building2 className="h-3 w-3" />} label={t('overview.programSponsor')} value={project.sponsor || '—'} />
              <Meta
                icon={<Coins className="h-3 w-3" />}
                label={t('overview.programBudget')}
                value={totalBudget > 0 ? t('common.budgetSar', { amount: fmt(totalBudget) }) : t('project.field.budgetNone')}
                gold
              />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function Stat({ icon, label, value, tone, accent }: { icon: React.ReactNode; label: string; value: string; tone: 'green' | 'amber' | 'red' | 'muted'; accent?: string }) {
  return (
    <div className="rounded-lg glass p-2.5">
      <div className="flex items-center justify-between gap-1 text-[9px] uppercase tracking-wider text-white/45">
        <span className="flex items-center gap-1">{icon}{label}</span>
      </div>
      <div className={cn(
        'mt-0.5 font-serif text-xl font-medium tabular-nums leading-tight',
        tone === 'green' && 'text-emerald-300',
        tone === 'amber' && 'text-amber-300',
        tone === 'red' && 'text-red-300',
        tone === 'muted' && 'text-white/85',
      )}>
        {value}
      </div>
      {accent && <div className="mt-0.5 text-[9px] text-red-300/80">{accent}</div>}
    </div>
  );
}

function Meta({ icon, label, value, gold }: { icon: React.ReactNode; label: string; value: string; gold?: boolean }) {
  const isArabic = /[؀-ۿ]/.test(value);
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/45">
        {icon}{label}
      </span>
      <span dir={isArabic ? 'rtl' : 'ltr'} className={cn('truncate font-medium', gold ? 'text-nahj-gold' : 'text-white/85', isArabic && 'font-arabic')}>
        {value}
      </span>
    </div>
  );
}
