'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, User, CalendarClock, Flag, Target, AlertTriangle, Link2, Pencil, Trash2,
  Loader2, Send, CheckCircle2, History,
} from 'lucide-react';
import type { Task, TaskComment, TaskStatus } from '@/lib/types';
import { Button } from './ui/button';
import { cn, formatDate } from '@/lib/utils';
import { useI18n } from './i18n-provider';
import {
  type BoardUser, allowedTransitions, actionFor, canManage,
  STATUS_LABEL_KEY, PRIORITY_LABEL_KEY, PRIORITY_STYLE, isOverdue, initials,
} from '@/lib/task-ui';

const LINK_ICON = {
  kpi: <Target className="h-3.5 w-3.5" />,
  risk: <AlertTriangle className="h-3.5 w-3.5" />,
  milestone: <Flag className="h-3.5 w-3.5" />,
};

export function TaskDetailPanel({
  task, user, onClose, onApply, onRemove, onEdit,
}: {
  task: Task | null;
  user: BoardUser;
  onClose: () => void;
  onApply: (t: Task) => void;
  onRemove: (id: number) => void;
  onEdit: (t: Task) => void;
}) {
  const { t, dir, locale } = useI18n();
  const offscreen = dir === 'rtl' ? '-100%' : '100%';
  const [busy, setBusy] = React.useState<string | null>(null);
  const [comment, setComment] = React.useState('');
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!task) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [task, onClose]);

  React.useEffect(() => { setComment(''); setErr(null); }, [task?.id]);

  if (!task) return <AnimatePresence />;

  const manage = canManage(user, task.programKey);
  const transitions = allowedTransitions(task, user);

  async function move(to: TaskStatus) {
    setBusy(to); setErr(null);
    try {
      const r = await fetch(`/api/tasks/${task!.id}/status`, {
        method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ to }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed');
      onApply(data.task);
    } catch (e: any) { setErr(e.message); } finally { setBusy(null); }
  }

  async function postComment() {
    if (!comment.trim()) return;
    setBusy('comment'); setErr(null);
    try {
      const r = await fetch(`/api/tasks/${task!.id}/comments`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ body: comment }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed');
      onApply({ ...task!, comments: [...task!.comments, data.comment] });
      setComment('');
    } catch (e: any) { setErr(e.message); } finally { setBusy(null); }
  }

  async function remove() {
    if (!window.confirm(t('task.deleteConfirm'))) return;
    setBusy('delete'); setErr(null);
    try {
      const r = await fetch(`/api/tasks/${task!.id}`, { method: 'DELETE' });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed');
      onRemove(task!.id);
    } catch (e: any) { setErr(e.message); setBusy(null); }
  }

  const overdue = isOverdue(task);

  return (
    <AnimatePresence>
      {task && (
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
            <div className="sticky top-0 z-10 glass-strong border-b border-white/10 px-5 py-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-mono text-[10px] text-white/45">#{task.id}</span>
                  <span className={cn('inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-md border', PRIORITY_STYLE[task.priority])}>
                    {t(PRIORITY_LABEL_KEY[task.priority])}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-white/55">{t(STATUS_LABEL_KEY[task.status])}</span>
                </div>
                <h2 className="text-base font-medium leading-snug">{task.title}</h2>
              </div>
              <button onClick={onClose} className="rounded-md p-1 hover:bg-white/10 transition-colors" aria-label={t('common.close')}>
                <X className="h-4 w-4 text-white/60" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Action buttons */}
              {transitions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {transitions.map((to) => {
                    const a = actionFor(task.status, to);
                    return (
                      <Button
                        key={to} size="sm" variant={a.variant === 'primary' ? 'primary' : a.variant === 'ghost' ? 'ghost' : 'default'}
                        disabled={!!busy} onClick={() => move(to)}
                      >
                        {busy === to ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (a.variant === 'primary' ? <CheckCircle2 className="h-3.5 w-3.5" /> : null)}
                        {t(a.key)}
                      </Button>
                    );
                  })}
                </div>
              )}

              {task.description && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/45 mb-1.5">{t('task.field.description')}</div>
                  <p className="text-sm leading-relaxed text-white/85 whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              {task.link && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/45 mb-1.5">{t('task.field.link')}</div>
                  <div className="inline-flex items-center gap-2 rounded-lg glass px-3 py-2 text-sm">
                    <span className="text-nahj-gold-soft">{LINK_ICON[task.link.kind] ?? <Link2 className="h-3.5 w-3.5" />}</span>
                    <span>{t(`task.link.${task.link.kind}` as any)}</span>
                    <span className="font-mono text-white/70">{task.link.labelSnapshot}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <KvBox icon={<User className="h-3 w-3" />} label={t('task.field.assignee')}
                  value={task.assigneeName ?? (task.assignee || t('task.unassigned'))} />
                <KvBox icon={<CalendarClock className="h-3 w-3" />} label={t('task.field.due')}
                  value={task.dueDate ? formatDate(task.dueDate) : '—'} danger={overdue} />
              </div>

              {/* Manager controls */}
              {manage && (
                <div className="flex items-center gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => onEdit(task)} disabled={!!busy}>
                    <Pencil className="h-3.5 w-3.5" /> {t('task.edit')}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-300 hover:text-red-200" onClick={remove} disabled={!!busy}>
                    {busy === 'delete' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} {t('task.delete')}
                  </Button>
                </div>
              )}

              {err && <div className="text-xs text-red-300">{err}</div>}

              {/* Activity + comments */}
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/45 mb-3">
                  <History className="h-3.5 w-3.5" />{t('task.activity')}
                </div>
                <div className="space-y-3">
                  {task.comments.map((c) => <ActivityItem key={c.id} c={c} locale={locale} />)}
                </div>

                <div className="mt-4 flex items-end gap-2">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('task.addComment')}
                    rows={2}
                    className="flex-1 rounded-lg glass px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-nahj-gold/40 resize-none"
                  />
                  <Button size="icon" variant="primary" onClick={postComment} disabled={busy === 'comment' || !comment.trim()} aria-label={t('task.addComment')}>
                    {busy === 'comment' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function ActivityItem({ c, locale }: { c: TaskComment; locale: string }) {
  const { t } = useI18n();
  const time = new Date(c.createdAt).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' });

  if (c.system) {
    let text: string;
    switch (c.system.kind) {
      case 'created': text = t('task.system.created', { who: c.authorName }); break;
      case 'approve': text = t('task.system.approved', { who: c.authorName }); break;
      case 'request-changes': text = t('task.system.changesRequested', { who: c.authorName }); break;
      case 'assign': text = t('task.system.assigned', { who: c.authorName, to: c.system.to ?? '' }); break;
      default: {
        const toKey = c.system.to ? STATUS_LABEL_KEY[c.system.to as keyof typeof STATUS_LABEL_KEY] : undefined;
        text = t('task.system.statusChanged', { who: c.authorName, to: toKey ? t(toKey) : (c.system.to ?? '') });
      }
    }
    return (
      <div className="flex items-center gap-2 text-[11px] text-white/45">
        <span className="h-1.5 w-1.5 rounded-full bg-white/25 shrink-0" />
        <span className="flex-1">{text}</span>
        <span className="shrink-0 tabular-nums">{time}</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg glass p-2.5">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-white/80">{initials(c.authorName)}</span>
          <span className="text-xs font-medium text-white/85">{c.authorName}</span>
        </div>
        <span className="text-[10px] text-white/40 tabular-nums">{time}</span>
      </div>
      <p className="text-sm text-white/80 whitespace-pre-wrap leading-snug">{c.body}</p>
    </div>
  );
}

function KvBox({ icon, label, value, danger }: { icon: React.ReactNode; label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-lg glass p-2.5">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-white/45">{icon}{label}</div>
      <div className={cn('mt-0.5 text-xs font-medium', danger ? 'text-red-300' : 'text-white')}>{value}</div>
    </div>
  );
}
