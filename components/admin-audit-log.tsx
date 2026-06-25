'use client';

import * as React from 'react';
import {
  CheckCircle2, AlertCircle, RefreshCw, UserPlus, UserMinus, UserCog,
  FileEdit, ScrollText, Bot,
} from 'lucide-react';
import type { AuditEntry } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useI18n } from './i18n-provider';
import { cn } from '@/lib/utils';

const ACTION_META: Record<string, { icon: React.ReactNode; tone: 'green' | 'red' | 'amber' | 'gold' | 'teal' | 'default' }> = {
  'auth.login.success':   { icon: <CheckCircle2 className="h-3.5 w-3.5" />, tone: 'green' },
  'auth.login.failed':    { icon: <AlertCircle className="h-3.5 w-3.5" />, tone: 'red' },
  'workbook.refreshed':   { icon: <RefreshCw className="h-3.5 w-3.5" />, tone: 'teal' },
  'workbook.autoRefreshed': { icon: <Bot className="h-3.5 w-3.5" />, tone: 'teal' },
  'actual.submitted':     { icon: <FileEdit className="h-3.5 w-3.5" />, tone: 'gold' },
  'user.created':         { icon: <UserPlus className="h-3.5 w-3.5" />, tone: 'green' },
  'user.updated':         { icon: <UserCog className="h-3.5 w-3.5" />, tone: 'amber' },
  'user.deactivated':     { icon: <UserMinus className="h-3.5 w-3.5" />, tone: 'red' },
};

export function AdminAuditLog({ entries }: { entries: AuditEntry[] }) {
  const { t, locale } = useI18n();
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-nahj-gold" />
              {t('admin.audit.title')}
            </CardTitle>
            <CardDescription>{t('admin.audit.subtitle')}</CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px]">{entries.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="rounded-xl glass p-10 text-center text-sm text-white/55">{t('admin.audit.empty')}</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {entries.map((e) => {
              const meta = ACTION_META[e.action] ?? { icon: <ScrollText className="h-3.5 w-3.5" />, tone: 'default' as const };
              return (
                <li key={e.id} className="py-3 flex items-start gap-3">
                  <div className={cn(
                    'h-7 w-7 rounded-lg flex items-center justify-center shrink-0',
                    meta.tone === 'green' && 'bg-emerald-500/15 text-emerald-300',
                    meta.tone === 'red' && 'bg-red-500/15 text-red-300',
                    meta.tone === 'amber' && 'bg-amber-500/15 text-amber-300',
                    meta.tone === 'gold' && 'bg-nahj-gold/15 text-nahj-gold-soft',
                    meta.tone === 'teal' && 'bg-nahj-teal/15 text-cyan-200',
                    meta.tone === 'default' && 'bg-white/10 text-white/70',
                  )}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] text-white/85">{e.action}</span>
                      <span className="text-[11px] text-white/55">·</span>
                      <span className="text-[11px] text-white/85">{e.actor === 'system' ? t('admin.audit.actor.system') : e.actor}</span>
                      {e.entity && (
                        <>
                          <span className="text-[11px] text-white/55">→</span>
                          <span className="text-[11px] font-mono text-white/65">{e.entity}</span>
                        </>
                      )}
                    </div>
                    {e.meta && Object.keys(e.meta).length > 0 && (
                      <div className="mt-0.5 text-[10px] text-white/50 line-clamp-2">{JSON.stringify(e.meta)}</div>
                    )}
                  </div>
                  <div className="text-[10px] text-white/45 tabular-nums whitespace-nowrap">{fmt(e.ts)}</div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
