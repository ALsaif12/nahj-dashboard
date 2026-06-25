'use client';
import { CardTitle, CardDescription } from './ui/card';
import { useI18n } from './i18n-provider';
import type { Project } from '@/lib/types';

export function TeamTimelineHeader({ project }: { project: Project }) {
  const { t, locale } = useI18n();
  const programLabel = locale === 'ar' ? project.arabicName : project.englishName;
  const packages = new Set(project.milestones.map((m) => m.group)).size;
  return (
    <>
      <CardTitle>{t('tabs.gantt')} · {programLabel}</CardTitle>
      <CardDescription>{t('project.milestones.count', { count: project.milestones.length, packages })}</CardDescription>
    </>
  );
}
