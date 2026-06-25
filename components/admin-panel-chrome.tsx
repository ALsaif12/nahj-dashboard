'use client';

import * as React from 'react';
import { Users, Grid3x3, ScrollText } from 'lucide-react';
import { PageHeader } from './page-header';
import { Badge } from './ui/badge';
import { PanelSubnav } from './panel-subnav';
import { useI18n } from './i18n-provider';

export function AdminPanelChrome({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();

  const items = [
    { href: '/dashboard/admin/users', labelKey: 'admin.subnav.users' as const, icon: <Users className="h-3.5 w-3.5" />, count: null },
    { href: '/dashboard/admin/access', labelKey: 'admin.subnav.access' as const, icon: <Grid3x3 className="h-3.5 w-3.5" />, count: null },
    { href: '/dashboard/admin/audit', labelKey: 'admin.subnav.audit' as const, icon: <ScrollText className="h-3.5 w-3.5" />, count: null },
  ];

  return (
    <div>
      <PageHeader
        title={t('admin.title')}
        description={t('admin.description')}
        badge={<Badge variant="gold">CEO only</Badge>}
      />
      <PanelSubnav items={items} />
      <div className="space-y-6">{children}</div>
    </div>
  );
}
