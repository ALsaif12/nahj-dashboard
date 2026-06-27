'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import type { Kpi } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn, effectiveActual, formatValue, ragStatus } from '@/lib/utils';
import { InfoTooltip } from './info-tooltip';
import { useI18n } from './i18n-provider';

interface Props {
  kpis: Kpi[];
  /** Group squares in rows of N (default 10) — Executive panel uses 10. */
  groupSize?: number;
}

const TONE_BG: Record<string, string> = {
  green: 'bg-rag-green',
  amber: 'bg-rag-amber',
  red: 'bg-rag-red',
  none: 'bg-white/15',
};
const TONE_GLOW: Record<string, string> = {
  green: '0 0 8px rgba(16,185,129,0.6)',
  amber: '0 0 8px rgba(245,158,11,0.6)',
  red: '0 0 8px rgba(239,68,68,0.6)',
  none: 'none',
};

function applyFlash(el: HTMLElement) {
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('kpi-flash');
  window.setTimeout(() => el.classList.remove('kpi-flash'), 1700);
}

/**
 * Scroll to and highlight a KPI card. If the card isn't on the current view
 * (e.g. we're on the Overview tab and the grid lives on the KPIs sub-page),
 * navigate to that panel's KPIs page with a #kpi-N hash and flash on arrival,
 * so the action always lands the user on the target KPI.
 */
export function flashKpiCard(id: number) {
  const el = document.getElementById(`kpi-${id}`);
  if (el) { applyFlash(el); return; }

  // Derive the panel base from the current path (/dashboard/<panel>/...).
  const seg = window.location.pathname.split('/')[2] || 'executive';
  const target = `/dashboard/${seg}/kpis#kpi-${id}`;
  // Remember the intended flash; the kpis page reads the hash on load.
  try { sessionStorage.setItem('nahj_flash_kpi', String(id)); } catch { /* ignore */ }
  window.location.assign(target);
}

// On any page load, if a flash was requested via hash/sessionStorage, run it.
if (typeof window !== 'undefined') {
  const run = () => {
    const m = window.location.hash.match(/^#kpi-(\d+)$/);
    const stored = (() => { try { return sessionStorage.getItem('nahj_flash_kpi'); } catch { return null; } })();
    const id = m ? m[1] : stored;
    if (!id) return;
    const el = document.getElementById(`kpi-${id}`);
    if (el) {
      applyFlash(el);
      try { sessionStorage.removeItem('nahj_flash_kpi'); } catch { /* ignore */ }
    }
  };
  // Defer so the target grid has mounted. Handle both "still loading" and
  // "already loaded" (client-side nav) cases.
  if (document.readyState === 'complete') setTimeout(run, 400);
  else window.addEventListener('load', () => setTimeout(run, 400));
}

export function TrafficLightStrip({ kpis, groupSize = 10 }: Props) {
  const { t, locale } = useI18n();
  const fmt = (n: number) => n.toLocaleString(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US');

  const rows: Kpi[][] = [];
  for (let i = 0; i < kpis.length; i += groupSize) rows.push(kpis.slice(i, i + groupSize));

  const counts = (['green', 'amber', 'red', 'none'] as const).reduce((acc, s) => {
    acc[s] = kpis.filter((k) => {
      const last = [...k.quarters].reverse().find((q) => effectiveActual(q) !== null);
      return ragStatus(last ? effectiveActual(last) : null, typeof k.annualTarget === 'number' ? k.annualTarget : null) === s;
    }).length;
    return acc;
  }, { green: 0, amber: 0, red: 0, none: 0 } as Record<'green' | 'amber' | 'red' | 'none', number>);

  return (
    <TooltipProvider delayDuration={120}>
      <div className="rounded-2xl glass p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/55 flex items-center gap-1.5">
              {t('tls.title')}
              <InfoTooltip body={t('glossary.rag.body')} />
            </div>
            <div className="text-sm font-medium text-white mt-0.5">{t('tls.subtitle', { count: fmt(kpis.length) })}</div>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            {(['green', 'amber', 'red', 'none'] as const).map((s) => (
              <span key={s} className="flex items-center gap-1 text-white/55">
                <span className={cn('h-2.5 w-2.5 rounded-sm', TONE_BG[s])} style={{ boxShadow: TONE_GLOW[s] }} />
                {t(`tls.legend.${s}` as any)} <b className="text-white">{counts[s]}</b>
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex flex-wrap gap-1.5">
              {row.map((k, i) => {
                const last = [...k.quarters].reverse().find((q) => effectiveActual(q) !== null);
                const actual = last ? effectiveActual(last) : null;
                const status = ragStatus(actual, typeof k.annualTarget === 'number' ? k.annualTarget : null);
                return (
                  <Tooltip key={k.id}>
                    <TooltipTrigger asChild>
                      <motion.button
                        type="button"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (rowIdx * 10 + i) * 0.012, duration: 0.25 }}
                        whileHover={{ scale: 1.18 }}
                        onClick={() => flashKpiCard(k.id)}
                        className={cn(
                          'h-7 w-7 rounded-md text-[10px] font-bold text-white inline-flex items-center justify-center shrink-0 transition-shadow',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nahj-gold/50',
                          TONE_BG[status],
                        )}
                        style={{ boxShadow: TONE_GLOW[status] }}
                        aria-label={`KPI ${k.id}: ${t(`rag.${status}` as any)}`}
                      >
                        {k.id}
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="font-bold mb-1">{t('kpi.label')} {k.id} · {t(`rag.${status}` as any)}</div>
                      <div dir="rtl" lang="ar" className="font-arabic text-[11px] leading-snug mb-1.5">{k.arabicName}</div>
                      <div className="text-[10px] opacity-80 space-y-0.5">
                        <div>{t('kpi.latestReading')}: {formatValue(actual, k.unit)} · {t('kpi.target')}: {typeof k.annualTarget === 'number' ? formatValue(k.annualTarget, k.unit) : k.annualTarget ?? '—'}</div>
                        <div className="opacity-60">{t('common.scrollHint')}</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
