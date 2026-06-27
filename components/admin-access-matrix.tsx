'use client';

import * as React from 'react';
import { Check, X } from 'lucide-react';
import type { UserRecord, ProgramKey } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useI18n } from './i18n-provider';
import type { TranslationKey } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type ClientUser = Omit<UserRecord, 'password'>;

const PROGRAMS: ProgramKey[] = ['badir', 'risala', 'iktashif'];

interface Cell { allowed: boolean; readOnly?: boolean; }

export function AdminAccessMatrix({ users }: { users: ClientUser[] }) {
  const { t } = useI18n();
  const active = users.filter((u) => u.active);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.access.title')}</CardTitle>
        <CardDescription>{t('admin.access.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-white/55">
            <tr className="border-b border-white/10">
              <th className="py-2.5 pe-3 text-start">{t('admin.access.col.user')}</th>
              <Th>{t('admin.access.col.exec')}</Th>
              <Th>{t('nav.badir')}</Th>
              <Th>{t('nav.risala')}</Th>
              <Th>{t('nav.iktashif')}</Th>
              <Th>{t('admin.access.col.admin')}</Th>
              <Th>{t('admin.access.col.submit')}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {active.map((u) => {
              const cells: Cell[] = [
                { allowed: u.permissions.canAccessExecutive, readOnly: u.permissions.readOnly },
                ...PROGRAMS.map((p) => ({
                  allowed: u.permissions.accessibleProgramPanels.includes(p),
                  readOnly: u.permissions.readOnly,
                })),
                { allowed: u.permissions.canAccessAdmin },
                { allowed: u.permissions.canSubmitActuals && !u.permissions.readOnly },
              ];
              return (
                <tr key={u.id} className="hover:bg-white/[0.03]">
                  <td className="py-2.5 pe-3">
                    <div className="font-medium text-white">{u.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant={u.role === 'ceo' ? 'gold' : u.role === 'program-manager' ? 'teal' : 'outline'} className="text-[10px]">
                        {t(`admin.users.role.${u.role}` as TranslationKey)}
                      </Badge>
                      {u.scope && <span className="text-[10px] text-white/55">· {t(`nav.${u.scope}` as TranslationKey)}</span>}
                    </div>
                  </td>
                  {cells.map((c, i) => (
                    <td key={i} className="py-2.5 text-center">
                      <CellMark allowed={c.allowed} readOnly={c.readOnly} />
                    </td>
                  ))}
                </tr>
              );
            })}
            {active.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-white/55">{t('admin.access.empty')}</td></tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function CellMark({ allowed, readOnly }: { allowed: boolean; readOnly?: boolean }) {
  const { t } = useI18n();
  if (!allowed) return <X className="inline h-4 w-4 text-white/25" />;
  return (
    <div className="inline-flex items-center justify-center">
      <span
        className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/40"
        style={{ boxShadow: '0 0 8px rgba(16,185,129,0.35)' }}
        title={readOnly ? t('admin.access.cell.readOnly') : t('admin.access.cell.full')}
      >
        <Check className={cn('h-3.5 w-3.5', readOnly ? 'text-emerald-300/65' : 'text-emerald-300')} />
      </span>
      {readOnly && <span className="ms-1 text-[9px] uppercase tracking-wider text-white/45">{t('admin.access.cell.ro')}</span>}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="py-2.5 px-3 text-center font-medium">{children}</th>;
}
