'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useI18n } from './i18n-provider';
import type { TranslationKey } from '@/lib/i18n';

export interface SubNavItem {
  href: string;
  labelKey: TranslationKey;
  icon: React.ReactNode;
  count?: number | null;
}

/**
 * Glass tab bar for switching between sub-pages within a panel (Executive,
 * Badir, Risala, Iktashif). Active state is determined from the current URL.
 */
export function PanelSubnav({ items }: { items: SubNavItem[] }) {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <div className="relative mb-6" data-tour="subnav">
      <div className="glass rounded-2xl p-1.5 inline-flex flex-wrap gap-1 max-w-full">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(`${it.href}/`);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                'relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors',
                active ? 'text-white' : 'text-white/55 hover:text-white',
              )}
            >
              {active && (
                <motion.div
                  layoutId="subnav-active"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-white/10 border border-white/15 shadow-glow"
                  style={{ zIndex: 0 }}
                />
              )}
              <span className="relative inline-flex items-center gap-2">
                <span className={cn('shrink-0', active ? 'text-nahj-gold' : 'text-white/45')}>{it.icon}</span>
                <span className="leading-none">{t(it.labelKey)}</span>
                {it.count !== undefined && it.count !== null && (
                  <span className={cn('ms-1 inline-block min-w-[18px] text-center text-[10px] font-mono px-1.5 py-0.5 rounded-md', active ? 'bg-nahj-gold/20 text-nahj-gold-soft' : 'bg-white/5 text-white/55')}>
                    {it.count}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
