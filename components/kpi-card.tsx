'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight, ArrowDownRight, Minus, Activity, Calendar,
  User, Target, Sigma, ClockAlert, ListChecks,
} from 'lucide-react';
import {
  LineChart, Line, ResponsiveContainer, YAxis, XAxis, ReferenceLine, Tooltip as RTooltip,
} from 'recharts';
import { Badge } from './ui/badge';
import { RagBadge } from './rag-badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import type { Kpi, Quarter } from '@/lib/types';
import { cn, formatValue, ragStatus, currentQuarter, effectiveActual, RAG_COLORS } from '@/lib/utils';
import { useI18n } from './i18n-provider';
import type { TranslationKey } from '@/lib/i18n';
import { FREQUENCY_TO_KEY } from '@/lib/i18n';

const QUARTER_DEADLINES: Record<Quarter, string> = {
  Q1: '31 Mar 2026', Q2: '30 Jun 2026', Q3: '30 Sep 2026', Q4: '31 Dec 2026',
};

interface Props {
  kpi: Kpi;
  emphasize?: boolean;
  delay?: number;
}

export function KpiCard({ kpi, emphasize, delay = 0 }: Props) {
  const { t, locale } = useI18n();
  const [open, setOpen] = React.useState(false);
  const cq = currentQuarter();
  const annualTarget = typeof kpi.annualTarget === 'number' ? kpi.annualTarget : null;

  const series = kpi.quarters.map((q) => ({
    quarter: q.quarter,
    actual: effectiveActual(q),
    target: annualTarget,
  }));

  const filled = series.filter((s) => s.actual !== null) as Array<{ quarter: string; actual: number; target: number | null }>;
  const latestActual = filled.length ? filled[filled.length - 1].actual : null;
  const status = ragStatus(latestActual, annualTarget);
  const ragHex = RAG_COLORS[status];

  const trend = filled.length >= 2 ? filled[filled.length - 1].actual - filled[filled.length - 2].actual : 0;
  const TrendIcon = trend > 0 ? ArrowUpRight : trend < 0 ? ArrowDownRight : Minus;
  const trendColor = trend > 0 ? 'text-emerald-300' : trend < 0 ? 'text-red-300' : 'text-white/55';

  const hasData = filled.length > 0;
  const noTarget = annualTarget === null;
  const cqHasData = series.find((s) => s.quarter === cq)?.actual !== null;
  const fmtNum = (n: number) => n.toLocaleString(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US');

  const sparkGradId = `spark-${kpi.id}`;
  const sparkColor = hasData ? ragHex : 'rgba(255,255,255,0.4)';

  return (
    <TooltipProvider delayDuration={250}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay, ease: 'easeOut' }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.995 }}
            className={cn(
              'group relative w-full text-start rounded-2xl overflow-hidden transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nahj-gold/50',
              hasData ? 'glass-card' : 'rounded-2xl glass border-dashed',
              emphasize && 'ring-2 ring-nahj-gold/40',
            )}
          >
            {/* Status rail across the top */}
            <div className={cn(
              'absolute inset-x-0 top-0 h-[2px]',
              status === 'green' && 'bg-rag-green shadow-[0_0_12px_rgba(16,185,129,0.6)]',
              status === 'amber' && 'bg-rag-amber shadow-[0_0_12px_rgba(245,158,11,0.6)]',
              status === 'red' && 'bg-rag-red shadow-[0_0_12px_rgba(239,68,68,0.6)]',
              status === 'none' && 'bg-white/10',
            )} />

            {/* RAG-tinted corner glow */}
            {hasData && (
              <div
                className="pointer-events-none absolute -top-12 -end-12 h-32 w-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"
                style={{ background: ragHex }}
              />
            )}

            <div className="p-5 pt-6 relative">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px] font-mono">{t('kpi.label')} {kpi.id}</Badge>
                    <Badge variant="outline" className="text-[10px]">{t(FREQUENCY_TO_KEY[kpi.frequency])}</Badge>
                    {kpi.programs.length > 0 && (
                      <Badge variant="teal" className="text-[10px]">
                        {kpi.programs.map((p) => t(`nav.${p}` as TranslationKey)).join(' · ')}
                      </Badge>
                    )}
                  </div>
                  <p dir="rtl" lang="ar" className="font-arabic text-sm leading-snug text-white/95 line-clamp-2 min-h-[2.5rem]">
                    {kpi.arabicName || '—'}
                  </p>
                </div>
                <RagBadge status={status} size="sm" />
              </div>

              {!hasData ? (
                <EmptyState noTarget={noTarget} cq={cq} cqHasData={cqHasData} />
              ) : (
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-3xl font-serif font-medium text-white leading-none tabular-nums">
                      {formatValue(latestActual, kpi.unit)}
                    </div>
                    <div className="mt-1.5 text-xs text-white/55 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {t('kpi.target')}: <span className="text-white/85 font-medium">{
                          typeof kpi.annualTarget === 'number'
                            ? formatValue(kpi.annualTarget, kpi.unit)
                            : kpi.annualTarget ?? '—'
                        }</span>
                      </span>
                      {trend !== 0 && (
                        <span className={cn('inline-flex items-center gap-0.5 font-medium', trendColor)}>
                          <TrendIcon className="h-3 w-3" />
                          {Math.abs(trend) < 1 ? Math.abs(trend).toFixed(2) : fmtNum(Math.round(Math.abs(trend)))}
                        </span>
                      )}
                    </div>
                  </div>

                  {filled.length >= 2 && (
                    <div className="h-12 w-32 -mb-1 relative">
                      <Sparkline
                        values={series.map((s) => s.actual)}
                        target={annualTarget}
                        color={sparkColor}
                        gradId={sparkGradId}
                      />
                      <div className="absolute end-0 top-1/2 -translate-y-1/2 text-[9px] font-bold tabular-nums" style={{ color: sparkColor }}>
                        {formatValue(latestActual, kpi.unit)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-[11px] text-white/45 border-t border-white/10 pt-3">
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3 w-3" />
                  <span>
                    {cq} {cqHasData
                      ? <span className="text-emerald-300 font-medium">{t('kpi.reported')}</span>
                      : <span className="text-amber-300 font-medium">{t('kpi.pending')}</span>}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {kpi.quarters.map((q) => {
                    const v = effectiveActual(q);
                    const isCurrent = q.quarter === cq;
                    const onTargetExpected = annualTarget !== null
                      ? annualTarget * (q.quarter === 'Q1' ? 0.4 : q.quarter === 'Q2' ? 0.65 : q.quarter === 'Q3' ? 0.85 : 1)
                      : null;
                    const onTrackish = v !== null && onTargetExpected !== null && v >= onTargetExpected;
                    return (
                      <span
                        key={q.quarter}
                        title={`${q.quarter}: ${v !== null ? formatValue(v, kpi.unit) : t('kpi.notReported')}`}
                        className={cn(
                          'inline-block h-1.5 w-5 rounded-full transition-all',
                          v === null && 'bg-white/15',
                          v !== null && onTrackish && 'bg-rag-green shadow-[0_0_6px_rgba(16,185,129,0.6)]',
                          v !== null && !onTrackish && 'bg-rag-amber shadow-[0_0_6px_rgba(245,158,11,0.6)]',
                          isCurrent && 'ring-2 ring-offset-1 ring-offset-transparent ring-nahj-gold/50',
                        )}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="text-xs space-y-1">
            <div><span className="opacity-60">{t('kpi.formulaLabel')}:</span> <span dir="rtl" className="font-arabic">{kpi.formula || '—'}</span></div>
            <div><span className="opacity-60">{t('kpi.ownerLabel')}:</span> {kpi.owner || <span className="italic text-amber-300">{t('kpi.unassignedShort')}</span>}</div>
            <div><span className="opacity-60">{t('kpi.frequency')}:</span> {t(FREQUENCY_TO_KEY[kpi.frequency])}</div>
            <div className="opacity-50 text-[10px] mt-1">{t('kpi.fullDetail')}</div>
          </div>
        </TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="outline" className="font-mono">{t('kpi.label')} {kpi.id}</Badge>
                <Badge variant="outline">{t(FREQUENCY_TO_KEY[kpi.frequency])}</Badge>
                <RagBadge status={status} size="sm" />
                {kpi.programs.map((p) => (
                  <Badge key={p} variant="teal">{t(`nav.${p}` as TranslationKey)}</Badge>
                ))}
              </div>
              <DialogTitle dir="rtl" className="font-arabic">{kpi.arabicName}</DialogTitle>
              <DialogDescription className="mt-2 leading-snug text-white/60">
                {t('kpi.strategicObjective')}
                <span dir="rtl" className="block font-arabic mt-1 text-white/85">{kpi.strategicObjective}</span>
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <KvBox label={t('kpi.latestReading')} value={hasData ? formatValue(latestActual, kpi.unit) : '—'} accent={status} />
              <KvBox label={t('kpi.annualTarget')} value={typeof kpi.annualTarget === 'number' ? formatValue(kpi.annualTarget, kpi.unit) : kpi.annualTarget ?? '—'} accent="gold" />
              <KvBox label={t('kpi.baseline')} value={kpi.baseline !== null ? formatValue(kpi.baseline, kpi.unit) : t('kpi.notSet')} />
            </div>

            <div className="rounded-xl glass p-4">
              <div className="text-xs uppercase tracking-wider text-white/45 mb-2">{t('kpi.quarterlyTrend')}</div>
              {hasData ? (
                <div className="h-48">
                  <ResponsiveContainer>
                    <LineChart data={series} margin={{ top: 8, right: 16, bottom: 24, left: 0 }}>
                      <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.55)' }} stroke="rgba(255,255,255,0.15)" />
                      <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.55)' }} stroke="rgba(255,255,255,0.15)" />
                      {annualTarget !== null && (
                        <ReferenceLine
                          y={annualTarget}
                          stroke="#D4B96A"
                          strokeDasharray="4 4"
                          label={{ value: `${t('kpi.target')} ${formatValue(annualTarget, kpi.unit)}`, position: 'right', fontSize: 10, fill: '#D4B96A' }}
                        />
                      )}
                      <RTooltip
                        contentStyle={{ background: 'rgba(10,22,40,0.95)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 12, backdropFilter: 'blur(12px)' }}
                        formatter={(value: any) => [formatValue(value, kpi.unit), t('kpi.latestReading')]}
                      />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke={sparkColor}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: sparkColor, stroke: '#0A1628', strokeWidth: 1.5 }}
                        activeDot={{ r: 6, fill: '#D4B96A' }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-sm text-white/45 italic">
                  {t('kpi.noReadings')}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailSection icon={<ListChecks className="h-3.5 w-3.5" />} label={t('kpi.description')}>
                <p dir="rtl" className="font-arabic text-sm text-white/85 leading-relaxed">{kpi.description || t('kpi.notProvided')}</p>
              </DetailSection>
              <DetailSection icon={<Sigma className="h-3.5 w-3.5" />} label={t('kpi.formula')}>
                <p dir="rtl" className="font-arabic text-sm text-white/85 leading-relaxed">{kpi.formula || t('kpi.notProvided')}</p>
              </DetailSection>
              <DetailSection icon={<User className="h-3.5 w-3.5" />} label={t('kpi.owner')}>
                <p className="text-sm">{kpi.owner ? (
                  <span className="text-white/95">{kpi.owner}</span>
                ) : (
                  <span className="italic text-amber-300">{t('kpi.unassigned')}</span>
                )}</p>
              </DetailSection>
              <DetailSection icon={<Calendar className="h-3.5 w-3.5" />} label={t('kpi.cadence')}>
                <p className="text-sm text-white/95">{t(FREQUENCY_TO_KEY[kpi.frequency])} <span dir="rtl" className="font-arabic text-white/55 ms-2">({kpi.frequencyArabic})</span></p>
              </DetailSection>
            </div>

            {kpi.linkedProjects.length > 0 && (
              <DetailSection icon={<ClockAlert className="h-3.5 w-3.5" />} label={t('kpi.linkedProjects')}>
                <ul className="space-y-1">
                  {kpi.linkedProjects.map((lp, i) => (
                    <li key={i} dir="rtl" className="font-arabic text-sm text-white/80">• {lp}</li>
                  ))}
                </ul>
              </DetailSection>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

/**
 * Lightweight pure-SVG sparkline. Replaces a Recharts ResponsiveContainer per
 * card (which each spin up a ResizeObserver) — on a 20-KPI grid that's a big
 * mount/perf win, especially on mobile and on every locale switch.
 */
function Sparkline({ values, target, color, gradId }: {
  values: (number | null)[];
  target: number | null;
  color: string;
  gradId: string;
}) {
  const W = 128, H = 44, PADX = 4, PADY = 6;
  // Points present at their quarter index; nulls are skipped but keep x spacing.
  const pts = values
    .map((v, i) => ({ v, i }))
    .filter((p): p is { v: number; i: number } => p.v !== null);
  if (pts.length < 2) return null;

  const nums = [...pts.map((p) => p.v), ...(target !== null ? [target] : [])];
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const n = values.length;
  const x = (i: number) => PADX + (i / (n - 1)) * (W - PADX * 2);
  const y = (v: number) => PADY + (1 - (v - min) / span) * (H - PADY * 2);

  const line = pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${x(p.i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
  const first = pts[0], last = pts[pts.length - 1];
  const area = `${line} L ${x(last.i).toFixed(1)} ${H - PADY} L ${x(first.i).toFixed(1)} ${H - PADY} Z`;
  const targetY = target !== null ? y(target) : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {targetY !== null && (
        <line x1={PADX} y1={targetY} x2={W - PADX} y2={targetY} stroke="#D4B96A" strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />
      )}
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {pts.map((p, idx) => (
        <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={idx === pts.length - 1 ? 3 : 2} fill={color} stroke="#0A1628" strokeWidth={1} />
      ))}
    </svg>
  );
}

function EmptyState({ noTarget, cq, cqHasData }: { noTarget: boolean; cq: Quarter; cqHasData: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="h-9 w-9 rounded-lg glass flex items-center justify-center shrink-0">
        <Calendar className="h-4 w-4 text-nahj-gold" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white/95">
          {noTarget ? t('kpi.awaitTarget') : t('kpi.awaitFirst')}
        </div>
        <div className="text-xs text-white/55 mt-0.5 leading-snug">
          {cqHasData ? `${t('kpi.reportedFor')} ${cq}` : `${cq} ${t('kpi.deadlineFor')} ${QUARTER_DEADLINES[cq]}`}
          <span className="block">{t('kpi.submitVia')}</span>
        </div>
      </div>
    </div>
  );
}

function KvBox({ label, value, accent }: { label: string; value: string | number | null; accent?: 'green' | 'amber' | 'red' | 'none' | 'gold' }) {
  return (
    <div className={cn(
      'rounded-xl glass p-3 relative overflow-hidden',
      accent === 'gold' && 'ring-1 ring-nahj-gold/30',
      accent === 'green' && 'ring-1 ring-rag-green/30',
      accent === 'amber' && 'ring-1 ring-rag-amber/30',
      accent === 'red' && 'ring-1 ring-rag-red/30',
    )}>
      {accent && accent !== 'none' && (
        <div
          className="pointer-events-none absolute -top-6 -end-6 h-16 w-16 rounded-full blur-2xl opacity-30"
          style={{
            background:
              accent === 'gold' ? '#D4B96A' :
              accent === 'green' ? '#10B981' :
              accent === 'amber' ? '#F59E0B' : '#EF4444',
          }}
        />
      )}
      <div className="relative">
        <div className="text-[10px] uppercase tracking-wider text-white/45">{label}</div>
        <div className="mt-0.5 font-serif text-xl font-medium text-white tabular-nums">{value ?? '—'}</div>
      </div>
    </div>
  );
}

function DetailSection({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/45 mb-1.5">
        {icon}{label}
      </div>
      {children}
    </div>
  );
}
