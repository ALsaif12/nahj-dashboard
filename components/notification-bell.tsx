'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCircle2, CalendarClock } from 'lucide-react';
import type { Task } from '@/lib/types';
import { useI18n } from './i18n-provider';
import { cn, formatDate } from '@/lib/utils';
import { isOverdue } from '@/lib/task-ui';

function today(): string { return new Date().toISOString().slice(0, 10); }

export function NotificationBell() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [mine, setMine] = React.useState<Task[]>([]);
  const [review, setReview] = React.useState<Task[]>([]);
  const ref = React.useRef<HTMLDivElement>(null);

  const load = React.useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        fetch('/api/tasks?mine=1').then((r) => r.ok ? r.json() : { tasks: [] }),
        fetch('/api/tasks?needsReview=1').then((r) => r.ok ? r.json() : { tasks: [] }),
      ]);
      setMine(a.tasks ?? []);
      setReview(b.tasks ?? []);
    } catch { /* ignore transient errors */ }
  }, []);

  React.useEffect(() => {
    load();
    const id = window.setInterval(load, 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  // Refresh when the route changes (e.g. after acting on a task).
  React.useEffect(() => { load(); }, [pathname, load]);

  // Close on outside click.
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const td = today();
  const mineActionable = mine.filter((tk) =>
    tk.status !== 'done' && (tk.status === 'todo' || tk.status === 'in-progress' || (!!tk.dueDate && tk.dueDate < td)),
  );
  const count = mineActionable.length + review.length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative h-8 w-8 inline-flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        aria-label={t('bell.title')}
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -end-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rag-red text-[9px] font-bold text-white inline-flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute end-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl glass-strong border border-white/10 shadow-xl overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-white/10 text-sm font-semibold text-white">{t('bell.title')}</div>
            <div className="max-h-[60vh] overflow-y-auto">
              {count === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-white/50">{t('bell.empty')}</div>
              ) : (
                <>
                  {review.length > 0 && (
                    <Group label={t('bell.needsReview')} icon={<CheckCircle2 className="h-3.5 w-3.5 text-nahj-gold" />}>
                      {review.map((tk) => (
                        <Item key={`r${tk.id}`} task={tk} href={`/dashboard/${tk.programKey}/tasks`} onClick={() => setOpen(false)} />
                      ))}
                    </Group>
                  )}
                  {mineActionable.length > 0 && (
                    <Group label={t('bell.assigned')} icon={<CalendarClock className="h-3.5 w-3.5 text-nahj-teal" />}>
                      {mineActionable.map((tk) => (
                        <Item key={`m${tk.id}`} task={tk} href="/dashboard/my-tasks" onClick={() => setOpen(false)} />
                      ))}
                    </Group>
                  )}
                </>
              )}
            </div>
            <Link
              href="/dashboard/my-tasks"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-center text-xs font-medium text-nahj-gold-soft hover:bg-white/5 border-t border-white/10"
            >
              {t('bell.viewAll')}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Group({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <div className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] uppercase tracking-wider text-white/45">{icon}{label}</div>
      {children}
    </div>
  );
}

function Item({ task, href, onClick }: { task: Task; href: string; onClick: () => void }) {
  const { t } = useI18n();
  const overdue = isOverdue(task);
  return (
    <Link href={href} onClick={onClick} className="block px-4 py-2 hover:bg-white/5 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-white/90 line-clamp-1 flex-1">{task.title}</span>
        <span className="text-[10px] text-white/45 shrink-0">{t(`nav.${task.programKey}` as any)}</span>
      </div>
      {task.dueDate && (
        <div className={cn('mt-0.5 text-[10px]', overdue ? 'text-red-300' : 'text-white/40')}>
          {formatDate(task.dueDate)}
        </div>
      )}
    </Link>
  );
}
