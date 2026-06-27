'use client';

import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, ListChecks } from 'lucide-react';
import type { Task, ProgramKey } from '@/lib/types';
import { Button } from './ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { useI18n } from './i18n-provider';
import { TaskCard } from './task-card';
import { TaskDetailPanel } from './task-detail-panel';
import { TaskFormDialog } from './task-form-dialog';
import { TASK_STATUSES } from '@/lib/task-constants';
import {
  type BoardUser, type BoardMember, type ProgramLinkOptions,
  STATUS_LABEL_KEY, STATUS_ACCENT,
} from '@/lib/task-ui';
import { cn } from '@/lib/utils';

export function TaskBoard({
  initialTasks, user, members, linkOptions, programOptions,
  showProgram = false, showFilters = false,
}: {
  initialTasks: Task[];
  user: BoardUser;
  members: BoardMember[];
  linkOptions: Record<string, ProgramLinkOptions>;
  programOptions: ProgramKey[];
  showProgram?: boolean;
  showFilters?: boolean;
}) {
  const { t } = useI18n();
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState<{ open: boolean; mode: 'create' | 'edit'; task: Task | null }>({ open: false, mode: 'create', task: null });
  const [programFilter, setProgramFilter] = React.useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = React.useState<string>('all');

  React.useEffect(() => { setTasks(initialTasks); }, [initialTasks]);

  const upsert = (tk: Task) => setTasks((prev) => prev.some((x) => x.id === tk.id) ? prev.map((x) => x.id === tk.id ? tk : x) : [tk, ...prev]);
  const removeTask = (id: number) => { setTasks((prev) => prev.filter((x) => x.id !== id)); setSelectedId(null); };

  const canCreate = programOptions.length > 0;
  const selected = tasks.find((x) => x.id === selectedId) ?? null;
  // A user with multi-program access (e.g. CEO) appears once per program in
  // `members`; dedupe by username for the filter dropdown.
  const uniqueMembers = Array.from(new Map(members.map((m) => [m.username, m])).values());

  const filtered = tasks.filter((tk) => {
    if (programFilter !== 'all' && tk.programKey !== programFilter) return false;
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned' ? tk.assignee !== null : tk.assignee !== assigneeFilter) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {showFilters && (
            <>
              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger className="h-9 w-auto min-w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('task.filter.allPrograms')}</SelectItem>
                  {programOptions.map((p) => <SelectItem key={p} value={p}>{t(`nav.${p}` as any)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="h-9 w-auto min-w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('task.filter.allAssignees')}</SelectItem>
                  <SelectItem value="unassigned">{t('task.unassigned')}</SelectItem>
                  {uniqueMembers.map((m) => <SelectItem key={m.username} value={m.username}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
        {canCreate && (
          <Button variant="primary" size="sm" onClick={() => setForm({ open: true, mode: 'create', task: null })}>
            <Plus className="h-4 w-4" /> {t('task.new')}
          </Button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl glass p-12 text-center text-white/55">
          <ListChecks className="mx-auto mb-3 h-8 w-8 opacity-40" />
          <div className="text-sm">{t('task.empty')}</div>
          {canCreate && <div className="text-xs text-white/40 mt-1">{t('task.empty.hint')}</div>}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1">
          {TASK_STATUSES.map((status) => {
            const col = filtered.filter((tk) => tk.status === status);
            return (
              <div key={status} className="shrink-0 w-[270px]">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUS_ACCENT[status], boxShadow: `0 0 6px ${STATUS_ACCENT[status]}` }} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/75">{t(STATUS_LABEL_KEY[status])}</span>
                  </div>
                  <span className="text-[10px] font-mono text-white/45 bg-white/5 rounded px-1.5 py-0.5">{col.length}</span>
                </div>
                <div
                  className={cn('rounded-2xl glass p-2 space-y-2 min-h-[120px] border-t-2')}
                  style={{ borderTopColor: STATUS_ACCENT[status] }}
                >
                  <AnimatePresence initial={false}>
                    {col.map((tk) => (
                      <TaskCard key={tk.id} task={tk} onOpen={(x) => setSelectedId(x.id)} showProgram={showProgram} />
                    ))}
                  </AnimatePresence>
                  {col.length === 0 && <div className="py-6 text-center text-[10px] text-white/30">—</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskDetailPanel
        task={selected}
        user={user}
        onClose={() => setSelectedId(null)}
        onApply={upsert}
        onRemove={removeTask}
        onEdit={(tk) => setForm({ open: true, mode: 'edit', task: tk })}
      />

      <TaskFormDialog
        open={form.open}
        mode={form.mode}
        task={form.task}
        programOptions={programOptions}
        members={members}
        linkOptions={linkOptions}
        onClose={() => setForm((f) => ({ ...f, open: false }))}
        onSaved={(tk) => { upsert(tk); setForm((f) => ({ ...f, open: false })); setSelectedId(tk.id); }}
      />
    </div>
  );
}
