'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { useI18n } from './i18n-provider';
import type { Task, ProgramKey, TaskPriority } from '@/lib/types';
import { TASK_PRIORITIES } from '@/lib/task-constants';
import type { BoardMember, ProgramLinkOptions } from '@/lib/task-ui';
import { PRIORITY_LABEL_KEY } from '@/lib/task-ui';

type LinkKind = 'none' | 'kpi' | 'milestone' | 'risk';

export function TaskFormDialog({
  open, mode, task, programOptions, members, linkOptions, onClose, onSaved,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  task: Task | null;
  programOptions: ProgramKey[];               // programs the user may create in
  members: BoardMember[];                      // all eligible assignees (any program)
  linkOptions: Record<string, ProgramLinkOptions>; // by programKey
  onClose: () => void;
  onSaved: (task: Task) => void;
}) {
  const { t } = useI18n();
  const [program, setProgram] = React.useState<ProgramKey>(programOptions[0] ?? 'badir');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [assignee, setAssignee] = React.useState<string>('none');
  const [dueDate, setDueDate] = React.useState('');
  const [priority, setPriority] = React.useState<TaskPriority>('medium');
  const [linkKind, setLinkKind] = React.useState<LinkKind>('none');
  const [linkRef, setLinkRef] = React.useState<string>('');
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && task) {
      setProgram(task.programKey);
      setTitle(task.title);
      setDescription(task.description ?? '');
      setAssignee(task.assignee ?? 'none');
      setDueDate(task.dueDate ?? '');
      setPriority(task.priority);
      setLinkKind(task.link?.kind ?? 'none');
      setLinkRef(task.link ? String(task.link.refId) : '');
    } else {
      setProgram(programOptions[0] ?? 'badir');
      setTitle(''); setDescription(''); setAssignee('none'); setDueDate('');
      setPriority('medium'); setLinkKind('none'); setLinkRef('');
    }
    setErr(null);
  }, [open, mode, task, programOptions]);

  const programMembers = members.filter((m) => m.programKey === program);
  const opts = linkOptions[program] ?? { kpis: [], milestones: [], risks: [] };
  const entityList = linkKind === 'kpi' ? opts.kpis : linkKind === 'milestone' ? opts.milestones : linkKind === 'risk' ? opts.risks : [];

  async function save() {
    setBusy(true); setErr(null);
    try {
      const body: any = {
        title,
        description: description || null,
        priority,
        assignee: assignee === 'none' ? null : assignee,
        dueDate: dueDate || null,
        link: linkKind === 'none' || !linkRef ? null : { kind: linkKind, refId: Number(linkRef) },
      };
      let url: string; let method: string;
      if (mode === 'create') { body.programKey = program; url = '/api/tasks'; method = 'POST'; }
      else { url = `/api/tasks/${task!.id}`; method = 'PATCH'; }
      const r = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed');
      onSaved(data.task);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? t('task.new') : t('task.edit')}</DialogTitle>
          <DialogDescription>{mode === 'create' ? t('task.new.body') : ''}</DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4">
          {mode === 'create' && programOptions.length > 1 && (
            <div>
              <Label>{t('task.field.program')}</Label>
              <Select value={program} onValueChange={(v) => setProgram(v as ProgramKey)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {programOptions.map((p) => <SelectItem key={p} value={p}>{t(`nav.${p}` as any)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>{t('task.field.title')}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" autoFocus />
          </div>

          <div>
            <Label>{t('task.field.description')}</Label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="mt-1.5 w-full rounded-lg glass px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-nahj-gold/40 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('task.field.assignee')}</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('task.unassigned')}</SelectItem>
                  {programMembers.map((m) => <SelectItem key={m.username} value={m.username}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('task.field.priority')}</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{t(PRIORITY_LABEL_KEY[p])}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('task.field.due')}</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>{t('task.field.linkKind')}</Label>
              <Select value={linkKind} onValueChange={(v) => { setLinkKind(v as LinkKind); setLinkRef(''); }}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('task.link.none')}</SelectItem>
                  <SelectItem value="kpi">{t('task.link.kpi')}</SelectItem>
                  <SelectItem value="milestone">{t('task.link.milestone')}</SelectItem>
                  <SelectItem value="risk">{t('task.link.risk')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {linkKind !== 'none' && (
            <div>
              <Label>{t('task.field.linkEntity')}</Label>
              <Select value={linkRef} onValueChange={setLinkRef}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder={t('task.link.pick')} /></SelectTrigger>
                <SelectContent>
                  {entityList.length === 0
                    ? <SelectItem value="__none" disabled>{t('task.link.empty')}</SelectItem>
                    : entityList.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {err && <div className="text-xs text-red-300">{err}</div>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>{t('admin.users.cancel')}</Button>
            <Button variant="primary" onClick={save} disabled={busy || !title.trim()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('task.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
