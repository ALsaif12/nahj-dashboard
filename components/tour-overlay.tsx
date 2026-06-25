'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { useTour } from './tour-provider';
import { useI18n } from './i18n-provider';
import { Button } from './ui/button';

const PAD = 12;
const CARD_W = 360;
const CARD_GAP = 18;

interface Rect { top: number; left: number; width: number; height: number; }

/**
 * The visual layer for the guided tour. Renders:
 *   - A dimmed full-screen backdrop with a spotlight cut-out around the target
 *   - A glowing gold ring around the highlighted element
 *   - A glass card with the step copy + Prev/Next/Skip controls
 *
 * Steps that don't have a target are shown as a centered modal (welcome/done).
 *
 * The target is located by re-querying its selector every animation frame
 * until found (handles cases where the page is still navigating).
 */
export function TourOverlay() {
  const { active, stepIndex, steps, next, prev, stop } = useTour();
  const { t, dir } = useI18n();
  const [rect, setRect] = React.useState<Rect | null>(null);

  const step = steps[stepIndex];
  const total = steps.length;

  // Re-locate the target on every step + tick (handles route changes + scroll).
  React.useEffect(() => {
    if (!active || !step) { setRect(null); return; }
    if (!step.target) { setRect(null); return; }

    let cancelled = false;
    let raf = 0;
    let tries = 0;
    const findIt = () => {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(step.target!);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        // Scroll element into view so the highlight is on screen.
        if (r.top < 80 || r.bottom > window.innerHeight - 80) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (tries++ < 60) {
        raf = requestAnimationFrame(findIt);
      }
    };
    findIt();

    // Reposition on scroll/resize so the highlight tracks the element.
    const onMove = () => {
      const el = document.querySelector<HTMLElement>(step.target!);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      }
    };
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [active, step]);

  // Escape to skip.
  React.useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stop();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, next, prev, stop]);

  if (!active || !step) return null;
  const isCenter = step.placement === 'center' || !step.target;
  const cardPos = isCenter ? null : placeCard(rect, step.placement ?? 'bottom', dir);

  return (
    <AnimatePresence>
      <motion.div
        key="tour"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[100]"
      >
        {/* Backdrop — SVG with a punched-out rectangle around the target. */}
        <svg className="absolute inset-0 w-full h-full pointer-events-auto" onClick={stop}>
          <defs>
            <mask id="nahj-tour-mask">
              <rect width="100%" height="100%" fill="white" />
              {rect && !isCenter && (
                <motion.rect
                  initial={false}
                  animate={{
                    x: rect.left - PAD,
                    y: rect.top - PAD,
                    width: rect.width + PAD * 2,
                    height: rect.height + PAD * 2,
                    rx: 16,
                    ry: 16,
                  }}
                  transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(5,11,20,0.78)" mask="url(#nahj-tour-mask)" />
        </svg>

        {/* Glowing ring on the target */}
        {rect && !isCenter && (
          <motion.div
            initial={false}
            animate={{
              top: rect.top - PAD,
              left: rect.left - PAD,
              width: rect.width + PAD * 2,
              height: rect.height + PAD * 2,
            }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            className="absolute pointer-events-none rounded-2xl"
            style={{
              border: '2px solid rgba(212,185,106,0.9)',
              boxShadow:
                '0 0 0 1px rgba(212,185,106,0.35), 0 0 32px rgba(212,185,106,0.45), inset 0 0 32px rgba(212,185,106,0.18)',
            }}
          />
        )}

        {/* Card */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="absolute pointer-events-auto"
          style={
            isCenter
              ? { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: Math.min(CARD_W + 40, 480) }
              : cardPos
                ? { left: cardPos.left, top: cardPos.top, width: CARD_W }
                : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: CARD_W }
          }
        >
          <div className="rounded-2xl glass-strong p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-nahj-gold-soft font-medium">
                <Sparkles className="h-3 w-3" />
                {t('tour.step', { n: stepIndex + 1, total })}
              </div>
              <button onClick={stop} aria-label={t('tour.skip')} className="rounded-md p-1 text-white/55 hover:text-white hover:bg-white/10 transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            <h3 className="font-serif text-xl font-medium leading-tight mb-2">{t(step.titleKey)}</h3>
            <p className="text-sm leading-relaxed text-white/80">{t(step.bodyKey)}</p>

            <div className="mt-5 flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={stop}>
                {t('tour.skip')}
              </Button>
              <div className="flex items-center gap-2">
                {stepIndex > 0 && (
                  <Button variant="outline" size="sm" onClick={prev}>
                    {dir === 'rtl' ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
                    {t('tour.prev')}
                  </Button>
                )}
                <Button variant="primary" size="sm" onClick={next}>
                  {stepIndex + 1 >= total ? t('tour.done') : t('tour.next')}
                  {stepIndex + 1 < total && (dir === 'rtl' ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />)}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Place the card adjacent to the target without overflowing the viewport.
 * If the requested placement doesn't fit, fall back to the opposite side
 * or just centre below.
 */
function placeCard(rect: Rect | null, placement: 'top' | 'bottom' | 'left' | 'right' | 'center', dir: 'ltr' | 'rtl'): { top: number; left: number } | null {
  if (!rect) return null;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardH = 260; // approximate
  let pos: { top: number; left: number };

  // Mirror left/right in RTL.
  let p = placement;
  if (dir === 'rtl') {
    if (placement === 'left') p = 'right';
    else if (placement === 'right') p = 'left';
  }

  switch (p) {
    case 'top':
      pos = {
        top: Math.max(16, rect.top - cardH - CARD_GAP),
        left: clamp(rect.left + rect.width / 2 - CARD_W / 2, 16, vw - CARD_W - 16),
      };
      break;
    case 'bottom':
      pos = {
        top: Math.min(vh - cardH - 16, rect.top + rect.height + CARD_GAP),
        left: clamp(rect.left + rect.width / 2 - CARD_W / 2, 16, vw - CARD_W - 16),
      };
      break;
    case 'left':
      pos = {
        top: clamp(rect.top + rect.height / 2 - cardH / 2, 16, vh - cardH - 16),
        left: Math.max(16, rect.left - CARD_W - CARD_GAP),
      };
      break;
    case 'right':
      pos = {
        top: clamp(rect.top + rect.height / 2 - cardH / 2, 16, vh - cardH - 16),
        left: Math.min(vw - CARD_W - 16, rect.left + rect.width + CARD_GAP),
      };
      break;
    default:
      pos = { top: vh / 2 - cardH / 2, left: vw / 2 - CARD_W / 2 };
  }

  return pos;
}

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }
