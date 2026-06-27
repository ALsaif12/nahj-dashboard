'use client';

import * as React from 'react';
import { LayoutDashboard, Target, AlertTriangle, CalendarRange, Sparkles, ListChecks } from 'lucide-react';
import { PageHeader } from './page-header';
import { Badge } from './ui/badge';
import { PanelSubnav } from './panel-subnav';
import { useI18n } from './i18n-provider';

interface Props {
  counts: { kpis: number; risks: number; onTrack: number; timeline: number; strategy: number; tasks: number };
  children: React.ReactNode;
}

/**
 * Client wrapper for the Executive panel: renders the header + glass sub-nav,
 * then drops the active sub-page into the slot. Server-rendered counts are
 * passed in so the badges stay live without an extra fetch.
 */
export function ExecutivePanelChrome({ counts, children }: Props) {
  const { t } = useI18n();

  const items = [
    { href: '/dashboard/executive/overview', labelKey: 'subnav.overview' as const, icon: <LayoutDashboard className="h-3.5 w-3.5" />, count: null },
    { href: '/dashboard/executive/kpis', labelKey: 'subnav.kpis' as const, icon: <Target className="h-3.5 w-3.5" />, count: counts.kpis },
    { href: '/dashboard/executive/risks', labelKey: 'subnav.risks' as const, icon: <AlertTriangle className="h-3.5 w-3.5" />, count: counts.risks },
    { href: '/dashboard/executive/timeline', labelKey: 'subnav.timeline' as const, icon: <CalendarRange className="h-3.5 w-3.5" />, count: counts.timeline },
    { href: '/dashboard/executive/strategy', labelKey: 'subnav.strategy' as const, icon: <Sparkles className="h-3.5 w-3.5" />, count: counts.strategy },
    { href: '/dashboard/executive/tasks', labelKey: 'subnav.tasks' as const, icon: <ListChecks className="h-3.5 w-3.5" />, count: counts.tasks },
  ];

  return (
    <div>
      <PageHeader
        title={t('exec.title')}
        description={t('exec.description')}
        badge={<Badge variant="gold">{t('nav.allAccess')}</Badge>}
      />
      <PanelSubnav items={items} />
      <div className="space-y-6">{children}</div>
    </div>
  );
}
