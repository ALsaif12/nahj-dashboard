'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Calendar, AlertTriangle, AlertCircle } from 'lucide-react';
import type { Project } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useI18n } from './i18n-provider';

const PROGRAM_TONE: Record<string, { dot: string; bar: string }> = {
  badir: {
    dot: 'bg-nahj-gold',
    bar: 'bg-gradient-to-r from-nahj-gold-soft via-nahj-gold to-nahj-gold-deep',
  },
  risala: {
    dot: 'bg-nahj-teal',
    bar: 'bg-gradient-to-r from-nahj-teal-soft via-nahj-teal to-nahj-teal',
  },
  iktashif: {
    dot: 'bg-violet-400',
    bar: 'bg-gradient-to-r from-violet-300 via-violet-400 to-violet-500',
  },
};

const FY_YEAR = 2026;
const FY_START = Date.UTC(FY_YEAR, 0, 1);
const FY_END = Date.UTC(FY_YEAR, 11, 31);
const FY_RANGE = FY_END - FY_START;

interface RowRange { start: number; end: number; valid: boolean; }

function projectRange(p: Project): RowRange {
  const validMilestones = p.milestones.filter((m) => !m.invalidEnd);
  const candidates: number[] = [];
  if (p.startDate) candidates.push(new Date(p.startDate).getTime());
  if (p.endDate) candidates.push(new Date(p.endDate).getTime());
  for (const m of validMilestones) {
    if (m.start) candidates.push(new Date(m.start).getTime());
    if (m.end) candidates.push(new Date(m.end).getTime());
  }
  const ts = candidates.filter(Number.isFinite);
  if (ts.length === 0 || validMilestones.length === 0) {
    return { start: FY_START, end: FY_END, valid: false };
  }
  return {
    start: Math.max(FY_START, Math.min(...ts)),
    end: Math.min(FY_END, Math.max(...ts)),
    valid: true,
  };
}

export function ProgramGanttStrip({ projects }: { projects: Project[] }) {
  const { t, locale } = useI18n();
  const today = Date.now();
  const todayInRange = today >= FY_START && today <= FY_END;
  const todayPct = ((today - FY_START) / FY_RANGE) * 100;

  const QUARTERS = [
    { name: 'Q1', start: Date.UTC(FY_YEAR, 0, 1), label: t('common.q1Range') },
    { name: 'Q2', start: Date.UTC(FY_YEAR, 3, 1), label: t('common.q2Range') },
    { name: 'Q3', start: Date.UTC(FY_YEAR, 6, 1), label: t('common.q3Range') },
    { name: 'Q4', start: Date.UTC(FY_YEAR, 9, 1), label: t('common.q4Range') },
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <div className="rounded-2xl glass overflow-hidden">
        <div className="flex items-center border-b border-white/10 bg-white/[0.04]">
          <div className="w-52 px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-white/55">{t('gantt.program')}</div>
          <div className="relative flex-1 h-11">
            {QUARTERS.map((q, i) => {
              const left = ((q.start - FY_START) / FY_RANGE) * 100;
              return (
                <div
                  key={q.name}
                  className="absolute top-0 h-full flex flex-col justify-center ps-3"
                  style={{ left: `${left}%`, borderInlineStart: i > 0 ? '1px dashed rgba(255,255,255,0.18)' : undefined }}
                >
                  <div className="text-xs font-semibold text-nahj-gold-soft leading-tight">{q.name} {FY_YEAR}</div>
                  <div className="text-[10px] text-white/45 leading-tight">{q.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative">
          {todayInRange && (
            <>
              <div
                className="absolute top-0 bottom-0 w-px bg-rag-red/70 z-10 pointer-events-none"
                style={{ left: `calc(208px + ${todayPct}% * (100% - 208px) / 100%)`, boxShadow: '0 0 8px rgba(239,68,68,0.5)' }}
              />
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="absolute top-1 -translate-x-1/2 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rag-red text-white z-20 pointer-events-none shadow-[0_0_12px_rgba(239,68,68,0.7)]"
                style={{ left: `calc(208px + ${todayPct}% * (100% - 208px) / 100%)` }}
              >
                {t('gantt.today')}
              </motion.div>
            </>
          )}

          {projects.map((p, idx) => {
            const tone = PROGRAM_TONE[p.key];
            const range = projectRange(p);
            const validMilestones = p.milestones.filter((m) => !m.invalidEnd && m.end);
            const flaggedCount = p.milestones.length - validMilestones.length;
            const programLabel = locale === 'ar' ? p.arabicName : p.englishName;

            return (
              <motion.div
                key={p.key}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08, ease: 'easeOut' }}
                className="flex items-stretch group hover:bg-white/[0.04] transition-colors border-b border-white/5 last:border-b-0"
              >
                <Link href={`/dashboard/${p.key}`} className="w-52 shrink-0 px-5 py-4 flex items-center gap-3 border-e border-white/10">
                  <span className={cn('h-3 w-3 rounded-full', tone.dot)} style={{ boxShadow: '0 0 12px currentColor' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{programLabel}</div>
                    <div className="text-[10px] text-white/45 mt-0.5">
                      {range.valid ? t('gantt.milestoneCount', { count: p.milestones.length }) : t('gantt.noMilestones')}
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-white/35 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </Link>

                <div className="relative flex-1 h-16">
                  {QUARTERS.map((q, i) => i > 0 && (
                    <div
                      key={`d-${q.name}`}
                      className="absolute top-0 h-full pointer-events-none"
                      style={{ left: `${((q.start - FY_START) / FY_RANGE) * 100}%`, borderInlineStart: '1px dashed rgba(255,255,255,0.06)' }}
                    />
                  ))}

                  {!range.valid ? (
                    <div className="absolute inset-0 flex items-center px-4 text-xs text-white/45 italic">
                      <AlertCircle className="h-3.5 w-3.5 me-2 shrink-0 text-amber-300" />
                      <span>{t('gantt.noMilestones')}</span>
                    </div>
                  ) : (
                    <>
                      <Link href={`/dashboard/${p.key}`} className="block">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.div
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ duration: 0.6, delay: 0.2 + idx * 0.08, ease: 'easeOut' }}
                              style={{
                                left: `${((range.start - FY_START) / FY_RANGE) * 100}%`,
                                width: `${Math.max(((range.end - range.start) / FY_RANGE) * 100, 4)}%`,
                                minWidth: 60,
                                transformOrigin: 'left center',
                              }}
                              className={cn(
                                'absolute top-1/2 -translate-y-1/2 h-9 rounded-lg flex items-center px-3 text-xs font-medium text-nahj-navy-deepest cursor-pointer',
                                'hover:h-10 transition-all',
                                tone.bar,
                              )}
                            >
                              <Calendar className="h-3 w-3 me-1.5 opacity-70 shrink-0" />
                              <span className="truncate">{formatDate(new Date(range.start).toISOString())} → {formatDate(new Date(range.end).toISOString())}</span>
                              {flaggedCount > 0 && (
                                <span className="ms-auto inline-flex items-center gap-0.5 text-[10px] bg-black/20 px-1.5 py-0.5 rounded">
                                  <AlertTriangle className="h-2.5 w-2.5" />{flaggedCount}
                                </span>
                              )}
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <div className="font-semibold mb-1">{programLabel}</div>
                            <div className="text-[10px] opacity-80 space-y-0.5">
                              <div>{t('gantt.milestoneCount', { count: p.milestones.length })}</div>
                              {flaggedCount > 0 && <div className="text-amber-300">{flaggedCount > 1 ? t('gantt.flaggedDatesPlural', { count: flaggedCount }) : t('gantt.flaggedDates', { count: flaggedCount })}</div>}
                              <div>{t('gantt.openPanel')}</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </Link>

                      {validMilestones.map((m) => {
                        const ms = m.end ? new Date(m.end).getTime() : 0;
                        if (ms < FY_START || ms > FY_END) return null;
                        const lpct = ((ms - FY_START) / FY_RANGE) * 100;
                        return (
                          <Tooltip key={m.id}>
                            <TooltipTrigger asChild>
                              <button
                                className="absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white border border-white/40 hover:scale-150 hover:z-10 transition-transform"
                                style={{ left: `${lpct}%`, boxShadow: '0 0 6px rgba(255,255,255,0.5)' }}
                                tabIndex={-1}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <div dir="rtl" className="font-arabic text-xs mb-0.5">{m.name}</div>
                              <div className="text-[10px] opacity-75">{formatDate(m.start)} → {formatDate(m.end)}</div>
                              {m.group && <div dir="rtl" className="font-arabic text-[10px] opacity-55 mt-0.5">{m.group}</div>}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 px-5 py-2.5 border-t border-white/10 bg-white/[0.02] text-[10px] text-white/55 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-nahj-gold" />{t('nav.badir')}</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-nahj-teal" />{t('nav.risala')}</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-violet-400" />{t('nav.iktashif')}</span>
          <span className="ms-auto flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-white/80" />{t('gantt.legend.milestone')}</span>
          {todayInRange && <span className="flex items-center gap-1.5"><span className="h-3 w-px bg-rag-red" />{t('gantt.legend.today')}</span>}
        </div>
      </div>
    </TooltipProvider>
  );
}
