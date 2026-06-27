'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  AlertOctagon, AlertTriangle, Clock, ChevronRight, Calendar, CheckCircle2,
  ListChecks, CalendarClock, UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import type { Kpi, Risk, Project, Task, ProgramKey } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { cn, currentQuarter, formatDate, formatValue, ragStatus, effectiveActual, RISK_COLORS } from '@/lib/utils';
import { useI18n } from './i18n-provider';
import { flashKpiCard } from './traffic-light-strip';
import { isOverdue } from '@/lib/task-ui';

interface Props {
  kpis: Kpi[];
  risks: Risk[];
  projects: Project[];
  tasks?: Task[];
  viewer?: { username: string; managePrograms: ProgramKey[] };
  onSelectRisk?: (r: Risk) => void;
}

export function AtAGlance({ kpis, risks, projects, tasks = [], viewer, onSelectRisk }: Props) {
  const { t, locale } = useI18n();
  const cq = currentQuarter();
  const today = Date.now();

  const overdueTasks = tasks.filter((tk) => isOverdue(tk));
  const reviewTasks = viewer
    ? tasks.filter((tk) => tk.status === 'in-review' && viewer.managePrograms.includes(tk.programKey))
    : [];
  const myOpenTasks = viewer
    ? tasks.filter((tk) => tk.assignee === viewer.username && tk.status !== 'done')
    : [];

  const urgentRisks = risks.filter((r) => r.band === 'critical' || r.band === 'high').sort((a, b) => b.score - a.score);

  const offTrack = kpis.filter((k) => {
    const last = [...k.quarters].reverse().find((q) => effectiveActual(q) !== null);
    const actual = last ? effectiveActual(last) : null;
    return ragStatus(actual, typeof k.annualTarget === 'number' ? k.annualTarget : null) === 'red';
  });

  const missingCq = kpis.filter((k) => {
    if (k.frequency === 'semiannual' && (cq === 'Q1' || cq === 'Q3')) return false;
    if (k.frequency === 'annual' && cq !== 'Q4') return false;
    const cqEntry = k.quarters.find((q) => q.quarter === cq);
    return cqEntry ? effectiveActual(cqEntry) === null : false;
  });

  const overdueMilestones: { project: Project; name: string; end: string }[] = [];
  for (const p of projects) {
    for (const m of p.milestones) {
      if (m.invalidEnd) continue;
      if (m.end && new Date(m.end).getTime() < today) {
        const daysOverdue = (today - new Date(m.end).getTime()) / 86400000;
        if (daysOverdue > 30 && daysOverdue < 365) {
          overdueMilestones.push({ project: p, name: m.name, end: m.end });
        }
      }
    }
  }
  overdueMilestones.sort((a, b) => new Date(a.end).getTime() - new Date(b.end).getTime());

  const allClear = urgentRisks.length === 0 && offTrack.length === 0 && missingCq.length === 0
    && overdueMilestones.length === 0 && overdueTasks.length === 0 && reviewTasks.length === 0 && myOpenTasks.length === 0;

  if (allClear) {
    return (
      <Card className="overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rag-green/15 via-transparent to-transparent" />
        <CardContent className="py-12 flex flex-col items-center text-center relative">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <div
              className="h-16 w-16 rounded-full bg-rag-green text-white flex items-center justify-center mb-4"
              style={{ boxShadow: '0 0 32px rgba(16,185,129,0.7)' }}
            >
              <CheckCircle2 className="h-8 w-8" />
            </div>
          </motion.div>
          <h2 className="font-serif text-2xl font-medium text-white">{t('glance.allClear.title')}</h2>
          <p className="text-sm text-white/65 max-w-md mt-3">
            {t('glance.allClear.body', { quarter: cq, year: new Date().getFullYear() })}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {urgentRisks.length > 0 && (
        <AlertCard
          icon={<AlertOctagon className="h-5 w-5" />}
          accent="red"
          title={t('glance.urgentRisks.title')}
          subtitle={urgentRisks.length === 1
            ? t('glance.urgentRisks.subtitle', { count: urgentRisks.length })
            : t('glance.urgentRisks.subtitlePlural', { count: urgentRisks.length })}
        >
          {urgentRisks.slice(0, 4).map((r, i) => (
            <motion.button
              key={r.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onSelectRisk?.(r)}
              className="w-full text-start rounded-lg glass p-2.5 hover:bg-white/[0.07] hover:border-rag-red/30 transition-all group flex items-center gap-3"
            >
              <span
                className="h-8 w-8 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: RISK_COLORS[r.band], boxShadow: `0 0 12px ${RISK_COLORS[r.band]}80` }}
              >
                {r.score}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[9px] font-mono">R{r.id}</Badge>
                  <span className="text-[10px] text-white/55">{t(`risk.band${r.band[0].toUpperCase() + r.band.slice(1)}` as any)}</span>
                </div>
                <div dir="rtl" className="font-arabic text-xs leading-snug text-white/95 line-clamp-1 mt-0.5">{r.name}</div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-white/35 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </motion.button>
          ))}
        </AlertCard>
      )}

      {offTrack.length > 0 && (
        <AlertCard
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="amber"
          title={t('glance.offTrack.title')}
          subtitle={offTrack.length === 1
            ? t('glance.offTrack.subtitle', { count: offTrack.length })
            : t('glance.offTrack.subtitlePlural', { count: offTrack.length })}
        >
          {offTrack.slice(0, 4).map((k, i) => {
            const last = [...k.quarters].reverse().find((q) => effectiveActual(q) !== null);
            const actual = last ? effectiveActual(last) : null;
            return (
              <motion.button
                key={k.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => flashKpiCard(k.id)}
                className="w-full text-start rounded-lg glass p-2.5 hover:bg-white/[0.07] hover:border-rag-amber/30 transition-all flex items-center gap-3"
              >
                <Badge variant="outline" className="font-mono text-[10px] shrink-0">{t('kpi.label')} {k.id}</Badge>
                <div className="flex-1 min-w-0">
                  <div dir="rtl" className="font-arabic text-xs leading-snug text-white/95 line-clamp-1">{k.arabicName}</div>
                  <div className="text-[10px] text-white/55 mt-0.5">
                    {formatValue(actual, k.unit)} / {typeof k.annualTarget === 'number' ? formatValue(k.annualTarget, k.unit) : k.annualTarget}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </AlertCard>
      )}

      {missingCq.length > 0 && (
        <AlertCard
          icon={<Clock className="h-5 w-5" />}
          accent="amber"
          title={t('glance.missing.title', { quarter: cq })}
          subtitle={missingCq.length === 1
            ? t('glance.missing.subtitle', { count: missingCq.length, quarter: cq })
            : t('glance.missing.subtitlePlural', { count: missingCq.length, quarter: cq })}
        >
          {missingCq.slice(0, 5).map((k, i) => (
            <motion.div
              key={k.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-lg border border-dashed border-white/15 p-2.5 flex items-center gap-3"
            >
              <Badge variant="outline" className="font-mono text-[10px] shrink-0">{t('kpi.label')} {k.id}</Badge>
              <div className="flex-1 min-w-0">
                <div dir="rtl" className="font-arabic text-xs leading-snug text-white/95 line-clamp-1">{k.arabicName}</div>
                {k.programs.length > 0 && (
                  <div className="text-[10px] text-white/55 mt-0.5">
                    {t('glance.missing.submitVia')} {k.programs.map((p) => (
                      <Link key={p} href={`/dashboard/${p}`} className="text-nahj-gold hover:underline me-1">{t(`nav.${p}` as any)}</Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {missingCq.length > 5 && (
            <div className="text-[10px] text-white/45 text-center pt-1">{t('glance.missing.more', { count: missingCq.length - 5 })}</div>
          )}
        </AlertCard>
      )}

      {overdueMilestones.length > 0 && (
        <AlertCard
          icon={<Calendar className="h-5 w-5" />}
          accent="red"
          title={t('glance.overdue.title')}
          subtitle={overdueMilestones.length === 1
            ? t('glance.overdue.subtitle', { count: overdueMilestones.length })
            : t('glance.overdue.subtitlePlural', { count: overdueMilestones.length })}
        >
          {overdueMilestones.slice(0, 5).map((m, i) => (
            <motion.div
              key={`${m.project.key}-${m.name}-${i}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-lg glass p-2.5 flex items-center gap-3"
            >
              <Badge variant="outline" className="text-[10px] shrink-0">{locale === 'ar' ? m.project.arabicName : m.project.englishName}</Badge>
              <div className="flex-1 min-w-0">
                <div dir="rtl" className="font-arabic text-xs leading-snug text-white/95 line-clamp-1">{m.name}</div>
                <div className="text-[10px] text-red-300 mt-0.5">{t('glance.overdue.due', { date: formatDate(m.end) })}</div>
              </div>
            </motion.div>
          ))}
        </AlertCard>
      )}

      {overdueTasks.length > 0 && (
        <AlertCard
          icon={<CalendarClock className="h-5 w-5" />}
          accent="red"
          title={t('glance.overdueTasks.title')}
          subtitle={t('glance.overdueTasks.subtitle', { count: overdueTasks.length })}
        >
          {overdueTasks.slice(0, 5).map((tk, i) => <TaskRow key={tk.id} task={tk} i={i} href={`/dashboard/${tk.programKey}/tasks`} danger />)}
        </AlertCard>
      )}

      {reviewTasks.length > 0 && (
        <AlertCard
          icon={<UserCheck className="h-5 w-5" />}
          accent="gold"
          title={t('glance.needsReview.title')}
          subtitle={t('glance.needsReview.subtitle', { count: reviewTasks.length })}
        >
          {reviewTasks.slice(0, 5).map((tk, i) => <TaskRow key={tk.id} task={tk} i={i} href={`/dashboard/${tk.programKey}/tasks`} />)}
        </AlertCard>
      )}

      {myOpenTasks.length > 0 && (
        <AlertCard
          icon={<ListChecks className="h-5 w-5" />}
          accent="teal"
          title={t('glance.assignedToMe.title')}
          subtitle={t('glance.assignedToMe.subtitle', { count: myOpenTasks.length })}
        >
          {myOpenTasks.slice(0, 5).map((tk, i) => <TaskRow key={tk.id} task={tk} i={i} href="/dashboard/my-tasks" />)}
        </AlertCard>
      )}
    </div>
  );
}

function TaskRow({ task, i, href, danger }: { task: Task; i: number; href: string; danger?: boolean }) {
  const { t } = useI18n();
  return (
    <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
      <Link href={href} className="w-full text-start rounded-lg glass p-2.5 hover:bg-white/[0.07] transition-all flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-white/95 line-clamp-1">{task.title}</div>
          <div className="text-[10px] text-white/55 mt-0.5">
            {t(`nav.${task.programKey}` as any)}
            {task.dueDate && <span className={cn('ms-2', danger && 'text-red-300')}>{formatDate(task.dueDate)}</span>}
          </div>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-white/35 shrink-0" />
      </Link>
    </motion.div>
  );
}

function AlertCard({
  icon, accent, title, subtitle, children,
}: {
  icon: React.ReactNode;
  accent: 'red' | 'amber' | 'gold' | 'teal';
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const blob = accent === 'red' ? 'bg-rag-red' : accent === 'amber' ? 'bg-rag-amber' : accent === 'gold' ? 'bg-nahj-gold' : 'bg-nahj-teal';
  const glow = accent === 'red' ? '0 0 16px rgba(239,68,68,0.5)'
    : accent === 'amber' ? '0 0 16px rgba(245,158,11,0.5)'
    : accent === 'gold' ? '0 0 16px rgba(212,185,106,0.5)'
    : '0 0 16px rgba(94,208,196,0.5)';
  return (
    <Card className="relative overflow-hidden">
      <div className={cn('pointer-events-none absolute -top-12 -end-12 h-32 w-32 rounded-full blur-3xl opacity-40', blob)} />
      <CardHeader className="border-b border-white/10 relative">
        <div className="flex items-start gap-3">
          <div
            className={cn('h-9 w-9 rounded-lg flex items-center justify-center text-white shrink-0', blob)}
            style={{ boxShadow: glow }}
          >{icon}</div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs mt-0.5">{subtitle}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-3 relative">
        {children}
      </CardContent>
    </Card>
  );
}
