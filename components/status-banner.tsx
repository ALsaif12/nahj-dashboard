'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Target, AlertTriangle, Coins, CalendarRange } from 'lucide-react';
import { cn, currentQuarter } from '@/lib/utils';
import { useI18n } from './i18n-provider';
import { BudgetBreakdownDialog } from './budget-breakdown-dialog';
import type { Project } from '@/lib/types';

type Tone = 'green' | 'amber' | 'red' | 'gold' | 'navy';

interface Props {
  onTrack: number;
  totalKpis: number;
  atRisk: number;
  offTrack: number;
  totalRisks: number;
  criticalRisks: number;
  totalBudget: number;
  fiscalYear?: number;
  programs: Project[];
  scope: 'executive' | 'badir' | 'risala' | 'iktashif';
  /** Base path that hosts the sub-pages (e.g. /dashboard/executive). Used for cross-page navigation. */
  basePath?: string;
}

export function StatusBanner({
  onTrack, totalKpis, atRisk, offTrack, totalRisks, criticalRisks, totalBudget,
  fiscalYear = 2026, programs, scope, basePath,
}: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const cq = currentQuarter();
  const [budgetOpen, setBudgetOpen] = React.useState(false);

  const fmtNum = (n: number) => n.toLocaleString(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US');

  const kpisTone: Tone = onTrack === totalKpis && totalKpis > 0 ? 'green' : offTrack === 0 ? 'amber' : 'red';
  const risksTone: Tone = criticalRisks > 0 ? 'red' : totalRisks > 5 ? 'amber' : 'green';

  const budgetSub = (() => {
    if (totalBudget <= 0) return t('banner.budgetSub.none');
    if (scope === 'executive') return t('banner.budgetSub.exec');
    const programArabic = programs.find((p) => p.key === scope)?.arabicName ?? '';
    const programEnglish = programs.find((p) => p.key === scope)?.englishName ?? '';
    return t('banner.budgetSub.team', { program: locale === 'ar' ? programArabic : programEnglish });
  })();

  const goTo = (sub: string) => {
    if (basePath) router.push(`${basePath}/${sub}`);
    else {
      const trigger = document.querySelector<HTMLButtonElement>(`[role="tab"][id$="trigger-${sub}"]`);
      trigger?.click();
      setTimeout(() => document.getElementById(sub)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  };

  const tiles: { label: string; value: string; sub: string; icon: React.ReactNode; tone: Tone; onClick: () => void }[] = [
    {
      label: t('banner.kpisOnTrack'),
      value: `${fmtNum(onTrack)} / ${fmtNum(totalKpis)}`,
      sub: t('banner.kpisOnTrackSub', { atRisk: fmtNum(atRisk), offTrack: fmtNum(offTrack) }),
      icon: <Target className="h-4 w-4" />,
      tone: kpisTone,
      onClick: () => goTo('kpis'),
    },
    {
      label: t('banner.openRisks'),
      value: fmtNum(totalRisks),
      sub: criticalRisks > 0 ? t('banner.openRisksSub.critical', { count: fmtNum(criticalRisks) }) : t('banner.openRisksSub.none'),
      icon: <AlertTriangle className="h-4 w-4" />,
      tone: risksTone,
      onClick: () => goTo('risks'),
    },
    {
      label: t('banner.budget'),
      value: totalBudget > 0 ? t('common.budgetSar', { amount: `${fmtNum(Math.round(totalBudget / 1000))}k` }) : '—',
      sub: budgetSub,
      icon: <Coins className="h-4 w-4" />,
      tone: 'gold',
      onClick: () => setBudgetOpen(true),
    },
    {
      label: t('banner.currentQuarter'),
      value: t('common.fyLabel', { q: cq, year: fiscalYear }),
      sub: cq === 'Q4' ? t('banner.currentQuarter.q4') : t('banner.currentQuarter.open'),
      icon: <CalendarRange className="h-4 w-4" />,
      tone: 'navy',
      onClick: () => {
        if (basePath) router.push(`${basePath}/submit`);
        else document.getElementById('input-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((ti, i) => (
          <motion.button
            key={ti.label}
            type="button"
            onClick={ti.onClick}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'group relative text-start rounded-2xl p-4 sm:p-5 cursor-pointer overflow-hidden',
              'glass-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nahj-gold/60',
              ti.tone === 'green' && 'hover:shadow-glow-green',
              ti.tone === 'amber' && 'hover:shadow-glow-amber',
              ti.tone === 'red' && 'hover:shadow-glow-red',
              ti.tone === 'gold' && 'hover:shadow-glow',
            )}
          >
            <GlowOrb tone={ti.tone} />

            <div className="relative">
              <div className="flex items-start justify-between gap-2">
                <div className="text-[10px] font-medium uppercase tracking-wider text-white/55">
                  {ti.label}
                </div>
                <div className={cn(
                  'h-7 w-7 rounded-lg glass flex items-center justify-center',
                  ti.tone === 'green' && 'text-rag-green',
                  ti.tone === 'amber' && 'text-rag-amber',
                  ti.tone === 'red' && 'text-rag-red',
                  ti.tone === 'gold' && 'text-nahj-gold',
                  ti.tone === 'navy' && 'text-nahj-teal-soft',
                )}>
                  {ti.icon}
                </div>
              </div>
              <div className="mt-2 sm:mt-3 font-serif text-2xl sm:text-3xl lg:text-4xl font-medium tabular-nums text-white leading-tight">
                {ti.value}
              </div>
              <div className="mt-1 text-[11px] sm:text-xs text-white/55 leading-snug">
                {ti.sub}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <BudgetBreakdownDialog
        open={budgetOpen}
        onOpenChange={setBudgetOpen}
        programs={programs}
        scope={scope}
      />
    </>
  );
}

/** Soft coloured orb that bleeds out the corner of each tile based on tone. */
function GlowOrb({ tone }: { tone: Tone }) {
  const color =
    tone === 'green' ? 'bg-rag-green' :
    tone === 'amber' ? 'bg-rag-amber' :
    tone === 'red' ? 'bg-rag-red' :
    tone === 'gold' ? 'bg-nahj-gold' :
    'bg-nahj-teal';
  return (
    <div className={cn('pointer-events-none absolute -top-12 -end-12 h-32 w-32 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity', color)} />
  );
}
