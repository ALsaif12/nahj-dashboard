'use client';

import * as React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { ReportingState } from '@/lib/reporting-status';
import { useI18n } from './i18n-provider';
import { cn } from '@/lib/utils';

const TONE = {
  pending:   { bg: 'bg-rag-amber/15 border-rag-amber/40 text-amber-300',  icon: <Clock className="h-3 w-3" />,         glow: 'rgba(245,158,11,0.45)' },
  partial:   { bg: 'bg-rag-amber/15 border-rag-amber/40 text-amber-300',  icon: <AlertCircle className="h-3 w-3" />,    glow: 'rgba(245,158,11,0.45)' },
  submitted: { bg: 'bg-rag-green/15 border-rag-green/40 text-emerald-300', icon: <CheckCircle2 className="h-3 w-3" />,   glow: 'rgba(16,185,129,0.45)' },
} as const;

export function ReportingStatusBadge({ state, size = 'md' }: { state: ReportingState; size?: 'sm' | 'md' }) {
  const { t } = useI18n();
  const tone = TONE[state.status];
  const label = state.status === 'submitted' ? t('reporting.submitted')
              : state.status === 'partial'   ? t('reporting.partial')
              : t('reporting.pending');
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium uppercase tracking-wider',
        tone.bg,
        size === 'sm' ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-2.5 py-1',
      )}
      style={state.status === 'submitted' ? { boxShadow: `0 0 10px ${tone.glow}` } : undefined}
    >
      {tone.icon}
      <span>{t('reporting.label', { quarter: state.quarter })} · {label}</span>
      {state.expected > 0 && (
        <span className="opacity-70">· {t('reporting.detail', { filed: state.filed, expected: state.expected })}</span>
      )}
    </span>
  );
}
