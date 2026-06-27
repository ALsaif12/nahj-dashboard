'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Megaphone, Compass, LogOut, RefreshCw, Loader2,
  PanelLeftClose, PanelLeftOpen, Home, ChevronRight, Languages, ChevronLeft, ShieldCheck,
  Lightbulb, Menu, X,
} from 'lucide-react';
import { useTour } from './tour-provider';
import { TourOverlay } from './tour-overlay';
import type { SessionUser } from '@/lib/types';
import { canAccessPanel, landingPath } from '@/lib/permissions';
import type { PanelKey } from '@/lib/permissions';
import type { TranslationKey } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { NahjLogo } from './nahj-logo';
import { useI18n } from './i18n-provider';
import { LiveUpdateToast } from './live-update-toast';

interface NavBadge { onTrack: number; totalKpis: number; openRisks: number; criticalRisks: number; }
interface NavItem {
  href: string;
  labelKey: TranslationKey;
  icon: React.ReactNode;
  panel: PanelKey;
  badge?: NavBadge;
  isAdmin?: boolean;
}

interface Props {
  user: SessionUser;
  loadedAt: string;
  badges: Partial<Record<'executive' | 'badir' | 'risala' | 'iktashif', NavBadge>>;
  children: React.ReactNode;
}

const NAV_BLUEPRINT: Omit<NavItem, 'badge'>[] = [
  { href: '/dashboard/executive', labelKey: 'nav.executiveAr', icon: <LayoutDashboard className="h-4 w-4" />, panel: 'executive' },
  { href: '/dashboard/badir', labelKey: 'nav.badir', icon: <Users className="h-4 w-4" />, panel: 'badir' },
  { href: '/dashboard/risala', labelKey: 'nav.risala', icon: <Megaphone className="h-4 w-4" />, panel: 'risala' },
  { href: '/dashboard/iktashif', labelKey: 'nav.iktashif', icon: <Compass className="h-4 w-4" />, panel: 'iktashif' },
  { href: '/dashboard/admin', labelKey: 'nav.admin', icon: <ShieldCheck className="h-4 w-4" />, panel: 'admin', isAdmin: true },
];

export function Shell({ user, children, loadedAt, badges }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale, setLocale, dir } = useI18n();
  const tour = useTour();
  const tourSetContext = tour.setContext;
  const [refreshing, setRefreshing] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Feed the tour engine with current permissions so it can skip steps the
  // signed-in user can't see. Depend ONLY on the primitive boolean.
  React.useEffect(() => {
    tourSetContext({ canAdmin: user.permissions.canAccessAdmin });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.permissions.canAccessAdmin]);

  // Close the mobile drawer whenever the route changes.
  React.useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Lock body scroll while the mobile drawer is open.
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  async function refresh() {
    setRefreshing(true);
    try {
      const r = await fetch('/api/refresh', { method: 'POST' });
      if (r.ok) router.refresh();
    } finally {
      setRefreshing(false);
    }
  }
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const visibleNav: NavItem[] = NAV_BLUEPRINT
    .filter((n) => canAccessPanel(user, n.panel))
    .map((n) => {
      const slug = n.href.split('/').pop() as keyof typeof badges;
      return { ...n, badge: badges[slug] };
    });
  const home = landingPath(user);

  const activeSlug = pathname.split('/')[2];
  const currentNav = visibleNav.find((n) => n.href.endsWith(`/${activeSlug}`));
  const ChevronIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  // Shared nav-link renderer for both the desktop sidebar and the mobile drawer.
  // `expanded` = show full labels/badges (always true in the drawer).
  function NavLinks({ expanded }: { expanded: boolean }) {
    return (
      <>
        {expanded && (
          <div className="px-2 pb-2 text-[10px] font-medium uppercase tracking-wider text-white/40">{t('nav.panels')}</div>
        )}
        {visibleNav.map((n) => {
          const active = pathname.startsWith(n.href);
          const hasCritical = (n.badge?.criticalRisks ?? 0) > 0;
          return (
            <Link
              key={n.href}
              href={n.href}
              title={!expanded ? t(n.labelKey) : undefined}
              data-tour={n.isAdmin ? 'admin-link' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg text-sm font-medium transition-all group relative',
                expanded ? 'px-3 py-3 md:py-2.5' : 'h-11 justify-center',
                active
                  ? 'bg-nahj-gold/15 text-white border border-nahj-gold/30 shadow-glow'
                  : 'text-white/80 hover:bg-white/5 hover:text-white active:bg-white/10',
                n.isAdmin && expanded && 'mt-2 border-t border-white/5 rounded-t-none pt-3 first:mt-0 first:border-t-0 first:pt-2.5',
              )}
            >
              <span className={cn('shrink-0 relative', active ? 'text-nahj-gold' : 'text-white/60')}>
                {n.icon}
                {hasCritical && (
                  <span className="absolute -top-1 -end-1 h-2 w-2 rounded-full bg-rag-red text-rag-red pulse-dot" aria-hidden />
                )}
              </span>
              {expanded && (
                <>
                  <div className="flex-1 min-w-0 leading-tight">{t(n.labelKey)}</div>
                  {n.badge && (
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={cn('text-[9px] font-mono px-1.5 rounded leading-tight', active ? 'bg-nahj-gold/20 text-nahj-gold-soft' : 'bg-white/5 text-white/55')}>
                        {n.badge.onTrack}/{n.badge.totalKpis}
                      </span>
                      {n.badge.openRisks > 0 && (
                        <span className={cn('text-[9px] font-mono px-1.5 rounded leading-tight', hasCritical ? 'bg-rag-red/25 text-red-300' : active ? 'bg-nahj-gold/20 text-nahj-gold-soft' : 'bg-white/5 text-white/55')}>
                          {n.badge.openRisks} {n.badge.openRisks > 1 ? t('nav.risks') : t('nav.risk')}
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </>
    );
  }

  function SyncFooter() {
    return (
      <div className="px-3 py-3 border-t border-white/10 space-y-2">
        <div className="px-2 text-[10px] text-white/45 leading-snug">
          {t('nav.workbookSynced')}<br />
          <span className="text-white/75 font-medium">{new Date(loadedAt).toLocaleString(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
        </div>
        <Button onClick={refresh} variant="outline" size="sm" className="w-full justify-start" disabled={refreshing}>
          {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {t('nav.refreshData')}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* ===== Desktop sidebar (md and up) ===== */}
      <motion.aside
        data-tour="sidebar"
        animate={{ width: collapsed ? 72 : 280 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        className="hidden md:flex shrink-0 flex-col relative glass-strong border-e border-white/10"
      >
        <div className={cn('px-4 py-5 border-b border-white/10 flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
          <Link href={home} className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <NahjLogo className="h-9 w-9 shrink-0" />
              <div className="absolute inset-0 bg-nahj-gold/20 blur-xl -z-10" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="font-serif text-base font-medium text-white leading-tight truncate">NAHJ</div>
                <div dir="rtl" className="font-arabic text-[10px] text-white/50 leading-tight truncate">جمعية نهج لتمكين الشباب</div>
              </div>
            )}
          </Link>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
          className={cn(
            'absolute top-7 h-6 w-6 rounded-full glass-strong flex items-center justify-center hover:bg-white/15 transition-colors z-10',
            dir === 'rtl' ? '-left-3' : '-right-3',
          )}
        >
          {collapsed
            ? <PanelLeftOpen className={cn('h-3 w-3 text-white/70', dir === 'rtl' && 'rotate-180')} />
            : <PanelLeftClose className={cn('h-3 w-3 text-white/70', dir === 'rtl' && 'rotate-180')} />}
        </button>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          <NavLinks expanded={!collapsed} />
        </nav>

        {!collapsed && <SyncFooter />}
      </motion.aside>

      {/* ===== Mobile drawer (below md) ===== */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-nahj-navy-deepest/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: dir === 'rtl' ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: dir === 'rtl' ? '100%' : '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="md:hidden fixed inset-y-0 start-0 z-50 w-[82%] max-w-[320px] flex flex-col glass-strong border-e border-white/10"
            >
              <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between gap-3">
                <Link href={home} className="flex items-center gap-3 min-w-0">
                  <NahjLogo className="h-8 w-8 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-serif text-base font-medium text-white leading-tight">NAHJ</div>
                    <div dir="rtl" className="font-arabic text-[10px] text-white/50 leading-tight truncate">جمعية نهج لتمكين الشباب</div>
                  </div>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label={t('common.close')}
                  className="h-9 w-9 rounded-lg flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                <NavLinks expanded />
              </nav>

              <SyncFooter />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ===== Main column ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 sm:gap-4 glass-strong border-b border-white/10 px-3 sm:px-4 md:px-8">
          <div className="flex items-center gap-2 text-sm min-w-0">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              aria-label={t('nav.panels')}
              className="md:hidden h-9 w-9 -ms-1 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10 active:bg-white/15 transition-colors shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Mobile logo (since the sidebar is hidden) */}
            <Link href={home} className="md:hidden flex items-center gap-2 shrink-0">
              <NahjLogo className="h-7 w-7" />
            </Link>

            {/* Breadcrumb — desktop only */}
            <div className="hidden md:flex items-center gap-2 min-w-0">
              <Link href={home} className="text-white/55 hover:text-white transition-colors flex items-center gap-1 shrink-0">
                <Home className="h-3.5 w-3.5" /> {t('breadcrumb.home')}
              </Link>
              {currentNav && (
                <>
                  <ChevronIcon className="h-3.5 w-3.5 text-white/30 shrink-0" />
                  <span className="font-medium text-white truncate">{t(currentNav.labelKey)}</span>
                </>
              )}
            </div>

            {/* Current panel label — mobile only (replaces breadcrumb) */}
            {currentNav && (
              <span className="md:hidden font-medium text-white text-sm truncate">{t(currentNav.labelKey)}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Badge variant="outline" className="font-mono text-[10px] hidden lg:inline-flex">{user.role.toUpperCase()}</Badge>

            <button
              type="button"
              onClick={() => tour.start()}
              className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium text-nahj-gold-soft hover:text-white hover:bg-nahj-gold/15 transition-colors"
              title={t('tour.start')}
              aria-label={t('tour.start')}
            >
              <Lightbulb className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{t('tour.start')}</span>
            </button>

            <div data-tour="locale-toggle" className="inline-flex items-center glass rounded-lg p-0.5" role="group" aria-label={t('nav.languageToggle')}>
              <button
                onClick={() => setLocale('en')}
                className={cn('h-7 px-2 sm:px-2.5 rounded-md text-xs font-medium transition-colors', locale === 'en' ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white')}
                aria-pressed={locale === 'en'}
              >
                EN
              </button>
              <button
                onClick={() => setLocale('ar')}
                className={cn('h-7 px-2 sm:px-2.5 rounded-md text-base leading-none font-medium transition-colors', locale === 'ar' ? 'bg-white/10 text-white' : 'text-white/55 hover:text-white')}
                aria-pressed={locale === 'ar'}
                title="العربية"
              >
                ع
              </button>
            </div>

            {/* Sign out — icon-only on mobile, labelled on sm+ */}
            <Button variant="ghost" size="sm" onClick={logout} className="px-2 sm:px-3" aria-label={t('nav.signOut')}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.signOut')}</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-5 md:py-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>

        <LiveUpdateToast />
        <TourOverlay />
      </div>
    </div>
  );
}
