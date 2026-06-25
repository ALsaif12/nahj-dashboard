'use client';
import { Card, CardContent } from './ui/card';
import { useI18n } from './i18n-provider';
import type { ProgramKey } from '@/lib/types';
import type { TranslationKey } from '@/lib/i18n';

export function TeamKpisEmpty({ programKey }: { programKey: ProgramKey }) {
  const { t } = useI18n();
  const programTitle = t(`nav.${programKey}` as TranslationKey);
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <div className="text-sm font-medium text-white mb-1">{t('kpi.noKpisMapped')}</div>
        <div className="text-xs max-w-md mx-auto text-white/55">
          {t('kpi.noKpisMappedDetail', { program: programTitle })}
        </div>
      </CardContent>
    </Card>
  );
}
