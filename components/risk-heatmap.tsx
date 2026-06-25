'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import type { Risk } from '@/lib/types';
import { cn, RISK_COLORS } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useI18n } from './i18n-provider';

interface Props {
  risks: Risk[];
  selectedId?: number | null;
  onSelect?: (risk: Risk) => void;
}

export function RiskHeatmap({ risks, onSelect, selectedId }: Props) {
  const { t } = useI18n();
  const [hoveredCell, setHoveredCell] = React.useState<string | null>(null);

  const grouped = React.useMemo(() => {
    const map = new Map<string, Risk[]>();
    for (const r of risks) {
      const k = `${r.probability}-${r.impact}`;
      const arr = map.get(k) || [];
      arr.push(r);
      map.set(k, arr);
    }
    return map;
  }, [risks]);

  // Cell tint scaled by P×I (1..25). Translucent so the dark background bleeds through.
  const cellTint = (p: number, i: number) => {
    const s = p * i;
    if (s <= 4)  return 'rgba(16,185,129,0.10)';   // green
    if (s <= 9)  return 'rgba(16,185,129,0.18)';
    if (s <= 14) return 'rgba(245,158,11,0.18)';
    if (s <= 19) return 'rgba(249,115,22,0.22)';
    return 'rgba(239,68,68,0.26)';
  };
  const cellBorder = (p: number, i: number) => {
    const s = p * i;
    if (s <= 4)  return 'rgba(16,185,129,0.25)';
    if (s <= 9)  return 'rgba(16,185,129,0.40)';
    if (s <= 14) return 'rgba(245,158,11,0.40)';
    if (s <= 19) return 'rgba(249,115,22,0.55)';
    return 'rgba(239,68,68,0.60)';
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="inline-block">
        <div className="flex">
          <div className="flex flex-col items-center justify-center pe-3">
            <div className="-rotate-90 whitespace-nowrap text-[11px] font-medium uppercase tracking-wider text-white/55">
              {t('risk.heatmap.impact')}
            </div>
          </div>
          <div>
            <div className="grid" style={{ gridTemplateColumns: 'auto repeat(5, 64px)' }}>
              <div />
              {[1, 2, 3, 4, 5].map((p) => (
                <div key={`pl-${p}`} className="text-center text-[11px] font-medium text-white/55 pb-1.5">{p}</div>
              ))}
              {[5, 4, 3, 2, 1].map((i) => (
                <React.Fragment key={`row-${i}`}>
                  <div className="text-[11px] font-medium text-white/55 pe-2 flex items-center justify-end">{i}</div>
                  {[1, 2, 3, 4, 5].map((p) => {
                    const cellKey = `${p}-${i}`;
                    const cellRisks = grouped.get(cellKey) || [];
                    const isHovered = hoveredCell === cellKey;
                    const dimmed = hoveredCell !== null && !isHovered && cellRisks.length === 0;

                    return (
                      <motion.div
                        key={`c-${p}-${i}`}
                        onMouseEnter={() => cellRisks.length > 0 && setHoveredCell(cellKey)}
                        onMouseLeave={() => setHoveredCell(null)}
                        animate={{ opacity: dimmed ? 0.30 : 1, scale: isHovered ? 1.04 : 1 }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                          'relative h-16 w-16 m-0.5 rounded-md flex items-center justify-center backdrop-blur',
                          cellRisks.length > 0 && 'cursor-pointer',
                        )}
                        style={{
                          background: cellTint(p, i),
                          boxShadow: `inset 0 0 0 ${isHovered ? 2 : 1}px ${cellBorder(p, i)}`,
                        }}
                      >
                        <div className="flex flex-wrap gap-0.5 items-center justify-center max-w-[56px]">
                          {cellRisks.map((r) => (
                            <Tooltip key={r.id}>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => onSelect?.(r)}
                                  className={cn(
                                    'h-6 w-6 rounded-full text-[10px] font-bold text-white inline-flex items-center justify-center transition-all',
                                    'hover:scale-125 hover:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                                    selectedId === r.id && 'ring-2 ring-white scale-125 z-10',
                                  )}
                                  style={{
                                    background: RISK_COLORS[r.band],
                                    boxShadow: `0 0 12px ${RISK_COLORS[r.band]}99, 0 0 0 1px rgba(255,255,255,0.2)`,
                                  }}
                                  aria-label={`Risk ${r.id}: ${r.name}`}
                                >
                                  R{r.id}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-sm">
                                <div className="font-bold mb-1">R{r.id} · {r.name}</div>
                                <div dir="rtl" lang="ar" className="font-arabic text-[11px] mb-1.5 opacity-90 leading-snug">{r.detail}</div>
                                <div className="space-y-0.5 text-[10px] opacity-80">
                                  <div>{t('risk.probability')} × {t('risk.impact')} × {t('risk.readiness')} = {r.probability} × {r.impact} × {r.readiness} = <b>{r.score}</b></div>
                                  {r.owner && <div>{t('risk.owner')}: {r.owner}</div>}
                                  <div>{t(`risk.band${r.band[0].toUpperCase() + r.band.slice(1)}` as any)}</div>
                                  <div className="opacity-60 mt-1">{t('kpi.fullDetail')}</div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </React.Fragment>
              ))}
              <div />
              <div className="col-span-5 text-center text-[11px] font-medium uppercase tracking-wider text-white/55 pt-1.5">
                {t('risk.heatmap.probability')}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-white/55 flex-wrap">
          <span className="flex items-center gap-1.5"><GlowDot color={RISK_COLORS.low} />{t('risk.heatmap.legendLow')}</span>
          <span className="flex items-center gap-1.5"><GlowDot color={RISK_COLORS.medium} />{t('risk.heatmap.legendMedium')}</span>
          <span className="flex items-center gap-1.5"><GlowDot color={RISK_COLORS.high} />{t('risk.heatmap.legendHigh')}</span>
          <span className="flex items-center gap-1.5"><GlowDot color={RISK_COLORS.critical} />{t('risk.heatmap.legendCritical')}</span>
        </div>
      </div>
    </TooltipProvider>
  );
}

function GlowDot({ color }: { color: string }) {
  return <span className="h-2.5 w-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />;
}
