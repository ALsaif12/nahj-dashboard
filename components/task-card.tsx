'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Link2, Target, AlertTriangle, Flag, MessageSquare } from 'lucide-react';
import type { Task, ProgramKey } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';
import { useI18n } from './i18n-provider';
import {
  PRIORITY_STYLE, PRIORITY_LABEL_KEY, PROGRAM_DOT, isOverdue, initials,
} from '@/lib/task-ui';

const LINK_ICON = {
  kpi: <Target className="h-3 w-3" />,
  risk: <AlertTriangle className="h-3 w-3" />,
  milestone: <Flag className="h-3 w-3" />,
};

export function TaskCard({
  task, onOpen, showProgram,
}: {
  task: Task;
  onOpen: (t: Task) => void;
  showProgram?: boolean;
}) {
  const { t } = useI18n();
  const overdue = isOverdue(task);
  const humanComments = task.comments.filter((c) => !c.system).length;

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      onClick={() => onOpen(task)}
      className={cn(
        'group w-full text-start rounded-xl glass p-3 hover:border-white/25 hover:bg-white/[0.06] transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nahj-gold/40',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn('inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-md border', PRIORITY_STYLE[task.priority])}>
          {t(PRIORITY_LABEL_KEY[task.priority])}
        </span>
        {showProgram && (
          <span className="inline-flex items-center gap-1 text-[10px] text-white/55">
            <span className="h-2 w-2 rounded-full" style={{ background: PROGRAM_DOT[task.programKey as ProgramKey] }} />
            {t(`nav.${task.programKey}` as any)}
          </span>
        )}
      </div>

      <div className="mt-2 text-sm font-medium text-white leading-snug line-clamp-3">{task.title}</div>

      {task.link && (
        <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-nahj-gold-soft/90 bg-nahj-gold/10 border border-nahj-gold/25 rounded-md px-1.5 py-0.5">
          {LINK_ICON[task.link.kind] ?? <Link2 className="h-3 w-3" />}
          <span className="font-mono">{task.link.labelSnapshot}</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {task.assignee ? (
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-white/80 shrink-0"
              title={task.assigneeName ?? task.assignee}
            >
              {initials(task.assigneeName)}
            </span>
          ) : (
            <span className="text-[10px] text-white/40 italic">{t('task.unassigned')}</span>
          )}
          {humanComments > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-white/45">
              <MessageSquare className="h-3 w-3" />{humanComments}
            </span>
          )}
        </div>

        {task.dueDate && (
          <span className={cn('inline-flex items-center gap-1 text-[10px] shrink-0', overdue ? 'text-red-300' : 'text-white/45')}>
            <CalendarClock className="h-3 w-3" />
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </motion.button>
  );
}
