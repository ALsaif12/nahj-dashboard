'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Power, ShieldCheck, ShieldOff, Loader2, X } from 'lucide-react';
import type { ProgramKey, Role, UserPermissions, UserRecord } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { useI18n } from './i18n-provider';
import type { TranslationKey } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type ClientUser = Omit<UserRecord, 'password'>;

const ROLES: Role[] = ['ceo', 'program-manager', 'board-member', 'viewer', 'sponsor'];
const PROGRAM_KEYS: ProgramKey[] = ['badir', 'risala', 'iktashif'];

interface Props { initialUsers: ClientUser[]; }

export function AdminUsersTable({ initialUsers }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [users, setUsers] = React.useState(initialUsers);
  const [editing, setEditing] = React.useState<ClientUser | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function refresh() {
    const r = await fetch('/api/admin/users');
    if (r.ok) {
      const data = await r.json();
      setUsers(data.users);
      router.refresh();
    }
  }

  async function toggleActive(u: ClientUser) {
    setPendingId(u.id);
    try {
      const r = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ active: !u.active }),
      });
      if (r.ok) await refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle>{t('admin.users.title')}</CardTitle>
              <CardDescription>{t('admin.users.subtitle')}</CardDescription>
            </div>
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              {t('admin.users.new')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-start text-[10px] uppercase tracking-wider text-white/55">
              <tr className="border-b border-white/10">
                <Th>{t('admin.users.col.name')}</Th>
                <Th>{t('admin.users.col.role')}</Th>
                <Th>{t('admin.users.col.scope')}</Th>
                <Th>{t('admin.users.col.panels')}</Th>
                <Th>{t('admin.users.col.write')}</Th>
                <Th>{t('admin.users.col.status')}</Th>
                <Th className="text-end">{t('admin.users.col.actions')}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn('hover:bg-white/[0.03]', !u.active && 'opacity-50')}
                >
                  <td className="py-2.5 pe-3">
                    <div className="font-medium text-white">{u.name}</div>
                    <div className="text-[11px] text-white/55">{u.email}</div>
                    <div className="text-[10px] font-mono text-white/40">{u.username}</div>
                  </td>
                  <td className="py-2.5 pe-3">
                    <Badge variant={u.role === 'ceo' ? 'gold' : u.role === 'program-manager' ? 'teal' : 'outline'}>
                      {t(`admin.users.role.${u.role}` as TranslationKey)}
                    </Badge>
                  </td>
                  <td className="py-2.5 pe-3 text-white/85">
                    {u.scope ? t(`nav.${u.scope}` as TranslationKey) : <span className="text-white/35">—</span>}
                  </td>
                  <td className="py-2.5 pe-3">
                    <PanelChips perms={u.permissions} />
                  </td>
                  <td className="py-2.5 pe-3">
                    {u.permissions.canSubmitActuals && !u.permissions.readOnly
                      ? <span className="inline-flex items-center gap-1 text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" /> {t('admin.users.statusActive')}</span>
                      : <span className="inline-flex items-center gap-1 text-white/45"><ShieldOff className="h-3.5 w-3.5" /> read-only</span>}
                  </td>
                  <td className="py-2.5 pe-3">
                    <Badge variant={u.active ? 'green' : 'red'}>
                      {u.active ? t('admin.users.statusActive') : t('admin.users.statusInactive')}
                    </Badge>
                  </td>
                  <td className="py-2.5 text-end whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(u)}>
                      <Pencil className="h-3.5 w-3.5" />{t('admin.users.edit')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(u)} disabled={pendingId === u.id} className="ms-1">
                      {pendingId === u.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : u.active
                          ? <><Power className="h-3.5 w-3.5" />{t('admin.users.deactivate')}</>
                          : <><Power className="h-3.5 w-3.5 text-emerald-300" />{t('admin.users.activate')}</>}
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <UserDialog
        open={creating || editing !== null}
        mode={creating ? 'create' : 'edit'}
        user={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSaved={async () => { setCreating(false); setEditing(null); await refresh(); }}
      />
    </>
  );
}

function PanelChips({ perms }: { perms: UserPermissions }) {
  const { t } = useI18n();
  const chips: { label: string; tone: 'gold' | 'teal' | 'default' }[] = [];
  if (perms.canAccessAdmin) chips.push({ label: t('nav.admin'), tone: 'gold' });
  if (perms.canAccessExecutive) chips.push({ label: t('nav.executiveAr'), tone: 'gold' });
  for (const p of perms.accessibleProgramPanels) chips.push({ label: t(`nav.${p}` as TranslationKey), tone: 'teal' });
  if (chips.length === 0) return <span className="text-white/35 text-xs">none</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {chips.map((c, i) => <Badge key={i} variant={c.tone as any} className="text-[10px]">{c.label}</Badge>)}
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn('py-2 pe-3 text-start font-medium', className)}>{children}</th>;
}

interface DialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  user: ClientUser | null;
  onClose: () => void;
  onSaved: () => void;
}

function UserDialog({ open, mode, user, onClose, onSaved }: DialogProps) {
  const { t } = useI18n();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<Role>('viewer');
  const [scope, setScope] = React.useState<ProgramKey | ''>('');
  const [overrides, setOverrides] = React.useState<{ canSubmit: boolean; readOnly: boolean; admin: boolean; exec: boolean } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && user) {
      setName(user.name); setEmail(user.email); setUsername(user.username); setPassword('');
      setRole(user.role); setScope(user.scope ?? '');
      setOverrides({
        canSubmit: user.permissions.canSubmitActuals,
        readOnly: user.permissions.readOnly,
        admin: user.permissions.canAccessAdmin,
        exec: user.permissions.canAccessExecutive,
      });
    } else {
      setName(''); setEmail(''); setUsername(''); setPassword('');
      setRole('viewer'); setScope('');
      setOverrides(null);
    }
    setErr(null);
  }, [open, mode, user]);

  async function save() {
    setBusy(true); setErr(null);
    try {
      const body: any = {
        name, email, username,
        role, scope: scope || null,
      };
      if (password) body.password = password;
      if (overrides) {
        body.permissions = {
          canSubmitActuals: overrides.canSubmit,
          readOnly: overrides.readOnly,
          canAccessAdmin: overrides.admin,
          canAccessExecutive: overrides.exec,
        };
      }
      const url = mode === 'create' ? '/api/admin/users' : `/api/admin/users/${user!.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const r = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed');
      onSaved();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? t('admin.users.create.title') : t('admin.users.edit.title')}</DialogTitle>
          <DialogDescription>{mode === 'create' ? t('admin.users.create.body') : ''}</DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('admin.users.field.name')}>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
            </Field>
            <Field label={t('admin.users.field.email')}>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
            </Field>
            <Field label={t('admin.users.field.username')}>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1.5" disabled={mode === 'edit'} />
            </Field>
            <Field label={t('admin.users.field.password')} hint={mode === 'edit' ? t('admin.users.field.passwordHint') : undefined}>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
            </Field>
            <Field label={t('admin.users.field.role')}>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{t(`admin.users.role.${r}` as TranslationKey)}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t('admin.users.field.scope')}>
              <Select value={scope || 'none'} onValueChange={(v) => setScope(v === 'none' ? '' : v as ProgramKey)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('admin.users.field.scope.none')}</SelectItem>
                  {PROGRAM_KEYS.map((p) => <SelectItem key={p} value={p}>{t(`nav.${p}` as TranslationKey)}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {overrides !== null && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <Toggle checked={overrides.exec} onChange={(v) => setOverrides({ ...overrides, exec: v })} label={t('admin.users.field.execAccess')} />
              <Toggle checked={overrides.admin} onChange={(v) => setOverrides({ ...overrides, admin: v })} label={t('admin.users.field.adminAccess')} />
              <Toggle checked={overrides.canSubmit} onChange={(v) => setOverrides({ ...overrides, canSubmit: v })} label={t('admin.users.field.canSubmit')} />
              <Toggle checked={overrides.readOnly} onChange={(v) => setOverrides({ ...overrides, readOnly: v })} label={t('admin.users.field.readOnly')} />
            </div>
          )}

          {err && <div className="text-xs text-red-300">{err}</div>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>{t('admin.users.cancel')}</Button>
            <Button variant="primary" onClick={save} disabled={busy || !name || !email || !username || (mode === 'create' && !password)}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('admin.users.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint && <div className="mt-1 text-[10px] text-white/45">{hint}</div>}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-white/85">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-white/20 bg-white/5 accent-nahj-gold"
      />
      {label}
    </label>
  );
}
