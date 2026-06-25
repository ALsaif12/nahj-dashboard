'use client';
import * as React from 'react';
import type { StrategicObjective, Kpi, BscPillar } from '@/lib/types';
import { ragStatus, cn, effectiveActual } from '@/lib/utils';
import { RagDot } from './rag-badge';
import { useI18n } from './i18n-provider';

const PILLAR_TONE: Record<BscPillar['key'], { glow: string; ring: string }> = {
  students:      { glow: 'from-nahj-gold/25 via-transparent to-transparent',  ring: 'before:bg-gradient-to-br before:from-nahj-gold/30 before:to-transparent' },
  customers:     { glow: 'from-nahj-teal/25 via-transparent to-transparent',  ring: 'before:bg-gradient-to-br before:from-nahj-teal/30 before:to-transparent' },
  internal:      { glow: 'from-violet-400/25 via-transparent to-transparent', ring: 'before:bg-gradient-to-br before:from-violet-400/30 before:to-transparent' },
  institutional: { glow: 'from-emerald-300/25 via-transparent to-transparent', ring: 'before:bg-gradient-to-br before:from-emerald-300/30 before:to-transparent' },
};

export function Scorecard({ objectives, kpis, pillars }: { objectives: StrategicObjective[]; kpis: Kpi[]; pillars: BscPillar[] }) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
      {pillars.map((p) => {
        const objs = objectives.filter((o) => o.pillar === p.key);
        const tone = PILLAR_TONE[p.key];
        return (
          <div key={p.key} className="relative rounded-2xl glass-card overflow-hidden">
            <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br', tone.glow)} />
            <div className="relative p-4 space-y-3">
              <h3 className="text-sm font-serif font-medium text-white">{t(`scorecard.pillar.${p.key}` as any)}</h3>
              <div className="space-y-2">
                {objs.map((o) => {
                  const linked = kpis.filter((k) => k.strategicObjectiveId === o.id);
                  const statuses = linked.map((k) => {
                    const last = [...k.quarters].reverse().find((q) => effectiveActual(q) !== null);
                    const actual = last ? effectiveActual(last) : null;
                    return ragStatus(actual, typeof k.annualTarget === 'number' ? k.annualTarget : null);
                  });
                  const overall = statuses.includes('red') ? 'red' : statuses.includes('amber') ? 'amber' : statuses.includes('green') ? 'green' : 'none';
                  return (
                    <div key={o.id} className="rounded-lg glass px-3 py-2 hover:bg-white/[0.06] transition-colors">
                      <div className="flex items-start gap-2">
                        <RagDot status={overall} className="mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-white/45">SO{o.id}</span>
                            {linked.length > 0 && <span className="text-[10px] text-white/45">{t('scorecard.kpiCount', { count: linked.length })}</span>}
                          </div>
                          <p dir="rtl" className="font-arabic text-xs leading-snug text-white/95 mt-0.5">{o.arabic}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {objs.length === 0 && <div className="text-xs text-white/45 italic">{t('scorecard.empty')}</div>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
