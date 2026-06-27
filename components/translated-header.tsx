'use client';

import { PageHeader } from './page-header';
import { useI18n } from './i18n-provider';
import type { TranslationKey } from '@/lib/i18n';

/** PageHeader whose title/description come from i18n keys (for server pages
 * that can't call useI18n directly). */
export function TranslatedHeader({
  titleKey, descriptionKey,
}: {
  titleKey: TranslationKey;
  descriptionKey?: TranslationKey;
}) {
  const { t } = useI18n();
  return <PageHeader title={t(titleKey)} description={descriptionKey ? t(descriptionKey) : undefined} />;
}
