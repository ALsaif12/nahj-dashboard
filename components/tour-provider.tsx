'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { TOUR_STEPS, type TourStep } from '@/lib/tour-steps';

interface TourCtx {
  active: boolean;
  stepIndex: number;
  steps: TourStep[];
  start: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  /** Set context flags (e.g. whether the current user is a CEO) so steps can self-gate. */
  setContext: (ctx: { canAdmin: boolean }) => void;
}

const Ctx = React.createContext<TourCtx | null>(null);

const STORAGE_KEY = 'nahj_tour_seen_v1';

export function TourProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [ctx, setContext] = React.useState({ canAdmin: false });

  // Filter steps that don't apply (e.g. admin step for non-CEO users).
  const steps = React.useMemo(
    () => TOUR_STEPS.filter((s) => !s.showIf || s.showIf(ctx)),
    [ctx],
  );

  // Auto-show on first visit per device.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!pathname.startsWith('/dashboard')) return;
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      // Slight delay so the page paints first.
      const t = window.setTimeout(() => setActive(true), 600);
      return () => window.clearTimeout(t);
    }
  }, [pathname]);

  // Navigate to the step's page if it differs from the current one.
  React.useEffect(() => {
    if (!active) return;
    const step = steps[stepIndex];
    if (step?.page && pathname !== step.page) router.push(step.page);
  }, [active, stepIndex, steps, pathname, router]);

  const start = React.useCallback(() => { setStepIndex(0); setActive(true); }, []);
  const stop = React.useCallback(() => {
    setActive(false);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, '1');
  }, []);
  const next = React.useCallback(() => {
    setStepIndex((i) => {
      if (i + 1 >= steps.length) {
        setActive(false);
        if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, '1');
        return i;
      }
      return i + 1;
    });
  }, [steps.length]);
  const prev = React.useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), []);

  const value: TourCtx = { active, stepIndex, steps, start, stop, next, prev, setContext };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTour(): TourCtx {
  const c = React.useContext(Ctx);
  if (!c) throw new Error('useTour must be used inside <TourProvider>');
  return c;
}
