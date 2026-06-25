'use client';

import * as React from 'react';
import type { Project, ProgramKey } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { useI18n } from './i18n-provider';

const PROGRAM_TONE: Record<ProgramKey, string> = {
  badir: 'bg-nahj-gold',
  risala: 'bg-nahj-teal',
  iktashif: 'bg-violet-400',
};

export function BudgetBreakdownDialog({
  open, onOpenChange, programs, scope,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  programs: Project[];
  scope: 'executive' | ProgramKey;
}) {
  const { t, locale } = useI18n();
  const fmt = (n: number) => n.toLocaleString(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US');
  const visible = scope === 'executive' ? programs : programs.filter((p) => p.key === scope);
  const grandTotal = visible.reduce((acc, p) => acc + (p.expectedBudget ?? p.totalCost), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('common.budgetBreakdown')}</DialogTitle>
          <DialogDescription>
            {t('common.totalAcross', { count: visible.length, plural: visible.length > 1 ? 's' : '' })}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          <div className="rounded-2xl glass p-4 relative overflow-hidden">
            <div className="pointer-events-none absolute -top-8 -end-8 h-24 w-24 rounded-full blur-3xl bg-nahj-gold/40" />
            <div className="relative">
              <div className="text-[10px] uppercase tracking-wider text-white/45">{t('banner.budget')}</div>
              <div className="mt-1 font-serif text-4xl font-medium text-white tabular-nums">
                {grandTotal > 0 ? t('common.budgetSar', { amount: fmt(grandTotal) }) : '—'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {visible.map((p) => {
              const total = p.expectedBudget ?? p.totalCost;
              return (
                <div key={p.key} className="rounded-xl glass p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${PROGRAM_TONE[p.key]}`}
                        style={{ boxShadow: '0 0 8px currentColor' }}
                      />
                      <div>
                        <div className="text-sm font-medium text-white">{p.englishName}</div>
                        <div dir="rtl" className="font-arabic text-[11px] text-white/55 leading-tight">{p.arabicName}</div>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="font-serif text-lg font-medium text-white tabular-nums">
                        {total > 0 ? t('common.budgetSar', { amount: fmt(total) }) : '—'}
                      </div>
                      {p.costs.length > 0 && (
                        <div className="text-[10px] text-white/45 mt-0.5">
                          {p.costs.length} line items
                        </div>
                      )}
                    </div>
                  </div>

                  {p.costs.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                      {p.costs.map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span dir="rtl" className="font-arabic text-white/85">{c.type}</span>
                          <span className="text-white/55 tabular-nums">{fmt(c.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
