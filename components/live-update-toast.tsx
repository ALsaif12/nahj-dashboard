'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useI18n } from './i18n-provider';

export function LiveUpdateToast() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [shown, setShown] = React.useState<{ at: string } | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
    const es = new EventSource('/api/live');
    es.addEventListener('update', (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as { loadedAt: string };
        setShown({ at: data.loadedAt });
        router.refresh();
        window.setTimeout(() => setShown(null), 5000);
      } catch { /* ignore */ }
    });
    es.onerror = () => { /* SSE auto-retries */ };
    return () => es.close();
  }, [router]);

  return (
    <div className="fixed bottom-6 end-6 z-[60] pointer-events-none">
      <AnimatePresence>
        {shown && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="pointer-events-auto rounded-2xl glass-strong px-4 py-3 flex items-center gap-3 max-w-sm text-white"
            style={{ boxShadow: '0 0 24px rgba(212,185,106,0.25), 0 8px 32px rgba(0,0,0,0.4)' }}
          >
            <div className="h-9 w-9 rounded-lg bg-nahj-gold/20 flex items-center justify-center" style={{ boxShadow: '0 0 12px rgba(212,185,106,0.4)' }}>
              <Sparkles className="h-4 w-4 text-nahj-gold" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white">{t('live.updated')}</div>
              <div className="text-[11px] text-white/55 tabular-nums">
                {new Date(shown.at).toLocaleTimeString(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
