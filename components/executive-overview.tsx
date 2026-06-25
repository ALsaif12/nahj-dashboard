'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { Project, Kpi, Risk } from '@/lib/types';
import { StatusBanner } from './status-banner';
import { ProgramSummaryCard } from './program-summary-card';
import { useI18n } from './i18n-provider';

interface Props {
  stats: {
    onTrack: number; totalKpis: number; atRisk: number; offTrack: number;
    totalRisks: number; criticalRisks: number; totalBudget: number;
  };
  perProgram: { project: Project; kpis: Kpi[]; risks: Risk[] }[];
  projects: Project[];
}

export function ExecutiveOverview({ stats, perProgram, projects }: Props) {
  const { t } = useI18n();

  return (
    <div className="space-y-8">
      {/* Status banner — clickable tiles route to the corresponding sub-page */}
      <StatusBanner
        onTrack={stats.onTrack}
        totalKpis={stats.totalKpis}
        atRisk={stats.atRisk}
        offTrack={stats.offTrack}
        totalRisks={stats.totalRisks}
        criticalRisks={stats.criticalRisks}
        totalBudget={stats.totalBudget}
        programs={projects}
        scope="executive"
        basePath="/dashboard/executive"
      />

      {/* Program summary cards */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-baseline justify-between mb-4"
        >
          <div>
            <h2 className="font-serif text-xl font-medium text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-nahj-gold" />
              {t('overview.programsTitle')}
            </h2>
            <p className="text-xs text-white/55 mt-0.5">{t('overview.programsSubtitle')}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {perProgram.map(({ project, kpis, risks }, i) => (
            <ProgramSummaryCard
              key={project.key}
              project={project}
              kpis={kpis}
              risks={risks}
              delay={0.15 + i * 0.08}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
