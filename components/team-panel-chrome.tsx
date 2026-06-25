'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Target, AlertTriangle, CalendarRange, Send, User, Building2, Coins, Calendar } from 'lucide-react';
import { PageHeader } from './page-header';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { PanelSubnav } from './panel-subnav';
import { useI18n } from './i18n-provider';
import { formatDate } from '@/lib/utils';
import type { ProgramKey, Project } from '@/lib/types';
import type { TranslationKey } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const PROGRAM_BG: Record<ProgramKey, string> = {
  badir: 'bg-nahj-gold/40',
  risala: 'bg-nahj-teal/45',
  iktashif: 'bg-violet-400/45',
};

const PROGRAM_ACCENT: Record<ProgramKey, string> = {
  badir: 'before:bg-gradient-to-br before:from-nahj-gold/30 before:to-transparent',
  risala: 'before:bg-gradient-to-br before:from-nahj-teal/30 before:to-transparent',
  iktashif: 'before:bg-gradient-to-br before:from-violet-400/30 before:to-transparent',
};

interface Props {
  programKey: ProgramKey;
  project: Project;
  counts: { kpis: number; risks: number; milestones: number };
  canSubmit: boolean;
  children: React.ReactNode;
}

/**
 * Client wrapper for a team panel: program identity card + glass sub-nav.
 * Sub-pages render into the slot via the route layout.
 */
export function TeamPanelChrome({ programKey, project, counts, canSubmit, children }: Props) {
  const { t, locale } = useI18n();
  const fmt = (n: number) => n.toLocaleString(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US');
  const programTitle = t(`nav.${programKey}` as TranslationKey);
  const totalBudget = project.expectedBudget ?? project.totalCost;
  const base = `/dashboard/${programKey}`;

  const items = [
    { href: `${base}/overview`, labelKey: 'subnav.overview' as const, icon: <LayoutDashboard className="h-3.5 w-3.5" />, count: null },
    { href: `${base}/kpis`, labelKey: 'subnav.kpis' as const, icon: <Target className="h-3.5 w-3.5" />, count: counts.kpis },
    { href: `${base}/risks`, labelKey: 'subnav.risks' as const, icon: <AlertTriangle className="h-3.5 w-3.5" />, count: counts.risks },
    { href: `${base}/timeline`, labelKey: 'subnav.timeline' as const, icon: <CalendarRange className="h-3.5 w-3.5" />, count: counts.milestones },
    ...(canSubmit ? [{ href: `${base}/submit`, labelKey: 'subnav.submit' as const, icon: <Send className="h-3.5 w-3.5" />, count: null as number | null }] : []),
  ];

  return (
    <div>
      <PageHeader
        title={programTitle}
        description={project.purpose ?? undefined}
        badge={
          <div className="flex items-center gap-1.5">
            <Badge variant="teal">{counts.kpis} {counts.kpis === 1 ? t('nav.kpis').replace(/s$/, '') : t('nav.kpis')}</Badge>
            <Badge variant="gold">{counts.risks} {counts.risks === 1 ? t('nav.risk') : t('nav.risks')}</Badge>
          </div>
        }
      />

      {/* Identity card */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-4">
        <Card className={cn('relative overflow-hidden', PROGRAM_ACCENT[programKey])}>
          <div
            className={cn('pointer-events-none absolute -top-12 -end-12 h-48 w-48 rounded-full blur-3xl opacity-50', PROGRAM_BG[programKey])}
          />
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 relative">
            <ProjectField icon={<User className="h-3.5 w-3.5" />} label={t('project.field.manager')} value={project.manager || t('project.field.unassigned')} />
            <ProjectField icon={<Building2 className="h-3.5 w-3.5" />} label={t('project.field.sponsor')} value={project.sponsor || '—'} />
            <ProjectField icon={<Calendar className="h-3.5 w-3.5" />} label={t('project.field.timeline')} value={project.startDate || project.endDate ? `${formatDate(project.startDate)} → ${formatDate(project.endDate)}` : t('project.field.timelinePending')} />
            <ProjectField icon={<Coins className="h-3.5 w-3.5" />} label={t('project.field.budget')} value={totalBudget ? t('common.budgetSar', { amount: fmt(totalBudget) }) : t('project.field.budgetNone')} gold />
          </CardContent>
        </Card>
      </motion.div>

      <PanelSubnav items={items} />

      <div className="space-y-6">{children}</div>
    </div>
  );
}

function ProjectField({ icon, label, value, gold }: { icon: React.ReactNode; label: string; value: string; gold?: boolean }) {
  const isArabic = /[؀-ۿ]/.test(value);
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/45 mb-1">
        {icon}{label}
      </div>
      <div dir={isArabic ? 'rtl' : 'ltr'} className={cn('text-sm', isArabic && 'font-arabic', gold ? 'text-nahj-gold font-medium' : 'text-white/95')}>
        {value}
      </div>
    </div>
  );
}
