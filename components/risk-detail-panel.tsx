'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, AlertTriangle, User, ShieldCheck, Target, Calendar, ClipboardList } from 'lucide-react';
import type { Risk } from '@/lib/types';
import { Badge } from './ui/badge';
import { cn, RISK_COLORS } from '@/lib/utils';
import { useI18n } from './i18n-provider';
import { PROGRAM_NAME_TO_KEY, RISK_TYPE_TO_KEY } from '@/lib/i18n';

export function RiskDetailPanel({ risk, onClose }: { risk: Risk | null; onClose: () => void }) {
  const { t, dir } = useI18n();
  // The panel is anchored to the inline-end edge (right in LTR, left in RTL),
  // so it must slide in from that same edge.
  const offscreen = dir === 'rtl' ? '-100%' : '100%';

  React.useEffect(() => {
    if (!risk) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [risk, onClose]);

  return (
    <AnimatePresence>
      {risk && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-nahj-navy-deepest/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: offscreen }} animate={{ x: 0 }} exit={{ x: offscreen }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="fixed inset-y-0 end-0 z-50 w-full max-w-md glass-strong overflow-y-auto text-white"
          >
            <div className="sticky top-0 z-10 glass-strong border-b border-white/10 px-5 py-4 flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Badge variant="outline" className="font-mono text-[10px]">R{risk.id}</Badge>
                  {PROGRAM_NAME_TO_KEY[risk.program] && (
                    <Badge variant="outline" className="text-[10px]">{t(PROGRAM_NAME_TO_KEY[risk.program])}</Badge>
                  )}
                  <span
                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border"
                    style={{
                      color: RISK_COLORS[risk.band],
                      borderColor: `${RISK_COLORS[risk.band]}66`,
                      background: `${RISK_COLORS[risk.band]}1F`,
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: RISK_COLORS[risk.band], boxShadow: `0 0 6px ${RISK_COLORS[risk.band]}` }}
                    />
                    {t(`risk.band${risk.band[0].toUpperCase() + risk.band.slice(1)}` as any)}
                  </span>
                </div>
                <h2 dir="rtl" className="font-arabic text-base leading-snug text-white">{risk.name}</h2>
              </div>
              <button onClick={onClose} className="ms-3 rounded-md p-1 hover:bg-white/10 transition-colors" aria-label={t('common.close')}>
                <X className="h-4 w-4 text-white/60" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="rounded-xl glass p-4 relative overflow-hidden">
                <div
                  className="pointer-events-none absolute -top-8 -end-8 h-24 w-24 rounded-full blur-2xl opacity-30"
                  style={{ background: RISK_COLORS[risk.band] }}
                />
                <div className="relative">
                  <div className="text-[10px] uppercase tracking-wider text-white/45 mb-2">{t('risk.score')}</div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-serif text-3xl font-medium tabular-nums" style={{ color: RISK_COLORS[risk.band] }}>{risk.score}</div>
                      <div className="text-xs text-white/45">{t('risk.score.unit')}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <ScoreSegment label={t('risk.probability')} value={risk.probability} />
                      <ScoreSegment label={t('risk.impact')} value={risk.impact} />
                      <ScoreSegment label={t('risk.readiness')} value={risk.readiness} />
                    </div>
                  </div>
                </div>
              </div>

              <Section icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-300" />} label={t('risk.detail')}>
                <p dir="rtl" className="font-arabic text-sm leading-relaxed text-white/85">
                  {risk.detail || t('risk.detailNone')}
                </p>
              </Section>

              <Section icon={<ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />} label={t('risk.mitigation')}>
                <p dir="rtl" className="font-arabic text-sm leading-relaxed text-white/85">
                  {risk.mitigation || <span className="italic text-amber-300">{t('risk.mitigationNone')}</span>}
                </p>
              </Section>

              <div className="grid grid-cols-2 gap-3">
                <KvBox icon={<User className="h-3 w-3" />} label={t('risk.owner')} value={risk.owner || t('project.field.unassigned')} />
                <KvBox icon={<User className="h-3 w-3" />} label={t('risk.mitigationOwner')} value={risk.mitigationOwner || '—'} />
                <KvBox icon={<Target className="h-3 w-3" />} label={t('risk.type')} value={RISK_TYPE_TO_KEY[risk.type.trim()] ? t(RISK_TYPE_TO_KEY[risk.type.trim()]) : risk.type} />
                <KvBox icon={<Calendar className="h-3 w-3" />} label={t('risk.identified')} value={risk.identifiedAt ?? '—'} />
                <KvBox icon={<Calendar className="h-3 w-3" />} label={t('risk.mitigationDate')} value={risk.mitigationDate || '—'} />
                <KvBox icon={<ClipboardList className="h-3 w-3" />} label={t('risk.status')} value={risk.status || t('risk.statusOpen')} arabic={!!risk.status} />
              </div>

              {risk.notes && (
                <Section icon={<ClipboardList className="h-3.5 w-3.5" />} label={t('risk.notes')}>
                  <p dir="rtl" className="font-arabic text-sm leading-relaxed text-white/75">{risk.notes}</p>
                </Section>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function ScoreSegment({ label, value }: { label: string; value: number }) {
  const pct = (value / 5) * 100;
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-white/45">{label}</div>
      <div className="font-serif text-lg font-medium text-white tabular-nums">{value}<span className="text-xs text-white/45">/5</span></div>
      <div className="h-1 rounded-full bg-white/10 overflow-hidden mt-0.5">
        <div className="h-full bg-nahj-gold" style={{ width: `${pct}%`, boxShadow: '0 0 4px rgba(212,185,106,0.6)' }} />
      </div>
    </div>
  );
}

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/45 mb-1.5">{icon}{label}</div>
      {children}
    </div>
  );
}

function KvBox({ icon, label, value, arabic }: { icon: React.ReactNode; label: string; value: string; arabic?: boolean }) {
  return (
    <div className="rounded-lg glass p-2.5">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-white/45">{icon}{label}</div>
      <div className={cn('mt-0.5 text-xs font-medium text-white', arabic && 'font-arabic')} dir={arabic ? 'rtl' : 'ltr'}>
        {value}
      </div>
    </div>
  );
}
