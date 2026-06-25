'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, FileText } from 'lucide-react';
import type { Project } from '@/lib/types';
import { useI18n } from './i18n-provider';
import { cn } from '@/lib/utils';

export function ProjectCharterAccordion({ project }: { project: Project }) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);

  const sections: { label: string; value: string | null }[] = [
    { label: t('project.section.challenge'), value: project.challenge },
    { label: t('project.section.purpose'), value: project.purpose },
    { label: t('project.section.scopeIn'), value: project.scopeIn },
    { label: t('project.section.scopeOut'), value: project.scopeOut },
    { label: t('project.section.outputs'), value: project.outputs },
  ].filter((s) => s.value);

  if (sections.length === 0) return null;

  return (
    <div className="rounded-2xl glass">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-start hover:bg-white/[0.04] transition-colors rounded-2xl group"
      >
        <span className="flex items-center gap-2.5">
          <span className="h-7 w-7 rounded-lg glass flex items-center justify-center">
            <FileText className="h-3.5 w-3.5 text-nahj-gold" />
          </span>
          <span className="text-sm font-medium text-white">
            {open ? t('project.charter.collapse') : t('project.charter.cta')}
          </span>
        </span>
        <ChevronDown className={cn('h-4 w-4 text-white/55 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-white/10">
              {sections.map((s, i) => (
                <div key={i}>
                  <div className="text-[10px] uppercase tracking-wider text-white/45 mb-1.5">{s.label}</div>
                  <p dir="rtl" className="font-arabic text-sm leading-relaxed text-white/85">{s.value}</p>
                </div>
              ))}
              <div className="md:col-span-2 text-[11px] text-white/45 italic">
                {t('project.charter.subtitle')}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
