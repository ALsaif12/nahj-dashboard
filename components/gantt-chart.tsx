'use client';
import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Milestone } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useI18n } from './i18n-provider';

interface Props {
  milestones: Milestone[];
  startDate?: string | null;
  endDate?: string | null;
  highlightCurrent?: boolean;
}

export function GanttChart({ milestones, startDate, endDate }: Props) {
  const { t } = useI18n();

  const dates = milestones.flatMap((m) => [m.start, m.end].filter(Boolean) as string[]);
  const dateNums = dates.map((d) => new Date(d).getTime()).filter(Number.isFinite);
  const min = startDate ? new Date(startDate).getTime() : (dateNums.length ? Math.min(...dateNums) : Date.now());
  const max = endDate ? new Date(endDate).getTime() : (dateNums.length ? Math.max(...dateNums) : Date.now());
  const yearStart = new Date(Date.UTC(new Date(min).getUTCFullYear(), 0, 1)).getTime();
  const yearEnd = new Date(Date.UTC(new Date(max).getUTCFullYear(), 11, 31)).getTime();
  const range = yearEnd - yearStart || 1;

  const grouped = React.useMemo(() => {
    const groups: { name: string | null; items: Milestone[] }[] = [];
    for (const m of milestones) {
      const last = groups[groups.length - 1];
      if (!last || last.name !== m.group) groups.push({ name: m.group, items: [m] });
      else last.items.push(m);
    }
    return groups;
  }, [milestones]);

  const today = Date.now();
  const yr = new Date(yearStart).getUTCFullYear();
  const quarters = [
    { name: 'Q1', start: Date.UTC(yr, 0, 1) },
    { name: 'Q2', start: Date.UTC(yr, 3, 1) },
    { name: 'Q3', start: Date.UTC(yr, 6, 1) },
    { name: 'Q4', start: Date.UTC(yr, 9, 1) },
  ];

  if (milestones.length === 0) {
    return (
      <div className="rounded-2xl glass p-12 text-center text-sm text-white/55 border-dashed">
        {t('gantt.noMilestones')}
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="rounded-2xl glass overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: 'minmax(220px, 1fr) 3fr' }}>
          <div className="border-b border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium uppercase tracking-wider text-white/55">
            {t('gantt.milestone')}
          </div>
          <div className="relative border-b border-white/10 bg-white/[0.03] h-9">
            {quarters.map((q) => (
              <div
                key={q.name}
                className="absolute top-0 h-full flex items-center text-xs font-semibold text-nahj-gold-soft ps-2"
                style={{ left: `${((q.start - yearStart) / range) * 100}%`, borderInlineStart: '1px dashed rgba(255,255,255,0.15)' }}
              >
                {q.name} {yr}
              </div>
            ))}
          </div>

          {grouped.map((group, gi) => (
            <React.Fragment key={`${group.name}-${gi}`}>
              {group.name && (
                <div className="col-span-2 border-b border-white/10 bg-white/[0.04] px-4 py-1.5">
                  <span dir="rtl" className="font-arabic text-xs font-semibold text-white/85">{group.name}</span>
                </div>
              )}
              {group.items.map((m, idx) => {
                const start = m.start ? new Date(m.start).getTime() : null;
                const end = m.end ? new Date(m.end).getTime() : null;
                const validEnd = end && (m.invalidEnd ? null : end);
                const drawEnd = validEnd ?? (start ? start + 7 * 86400000 : null);
                const left = start ? ((start - yearStart) / range) * 100 : 0;
                const width = start && drawEnd ? Math.max(((drawEnd - start) / range) * 100, 0.7) : 0;
                const completed = end && end < today;
                return (
                  <React.Fragment key={`${m.id}-${idx}`}>
                    <div className="border-b border-white/5 px-4 py-2 flex items-center gap-2">
                      <span dir="rtl" className="font-arabic text-xs leading-snug text-white/85 line-clamp-2 flex-1">{m.name}</span>
                      {m.invalidEnd && (
                        <Tooltip>
                          <TooltipTrigger><AlertTriangle className="h-3.5 w-3.5 text-amber-300" /></TooltipTrigger>
                          <TooltipContent>{t('gantt.invalidEnd', { date: m.end ?? '' })}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div className="relative border-b border-white/5 h-10">
                      {quarters.map((q) => (
                        <div
                          key={`g-${q.name}`}
                          className="absolute top-0 h-full"
                          style={{ left: `${((q.start - yearStart) / range) * 100}%`, borderInlineStart: '1px dashed rgba(255,255,255,0.08)' }}
                        />
                      ))}
                      {start && drawEnd && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'absolute top-1/2 -translate-y-1/2 h-5 rounded-md transition-all hover:h-6 cursor-pointer',
                                completed ? 'bg-nahj-teal' : 'bg-nahj-gold',
                                m.invalidEnd && 'bg-rag-amber/60',
                              )}
                              style={{
                                left: `${left}%`, width: `${width}%`, minWidth: 4,
                                boxShadow: completed
                                  ? '0 0 12px rgba(58,138,157,0.45)'
                                  : '0 0 12px rgba(212,185,106,0.5)',
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <div dir="rtl" className="font-arabic mb-1">{m.name}</div>
                            <div className="text-[10px] opacity-75">{m.start} → {m.end}{m.invalidEnd ? ' ⚠' : ''}</div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
