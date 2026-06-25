'use client';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { useI18n } from './i18n-provider';

const TONE: Record<string, { dot: string }> = {
  green: { dot: 'bg-rag-green' },
  amber: { dot: 'bg-rag-amber' },
  red: { dot: 'bg-rag-red' },
  none: { dot: 'bg-slate-400' },
};

export function RagBadge({ status, size = 'default' }: { status: 'green' | 'amber' | 'red' | 'none'; size?: 'default' | 'sm' }) {
  const { t } = useI18n();
  const variant = status === 'green' ? 'green' : status === 'amber' ? 'amber' : status === 'red' ? 'red' : 'outline';
  return (
    <Badge variant={variant as any} className={cn(size === 'sm' && 'text-[10px] px-2 py-0')}>
      <span className={cn('h-1.5 w-1.5 rounded-full', TONE[status].dot)} aria-hidden />
      {t(`rag.${status}` as any)}
    </Badge>
  );
}

export function RagDot({ status, className }: { status: 'green' | 'amber' | 'red' | 'none'; className?: string }) {
  const { t } = useI18n();
  return <span className={cn('inline-block h-2.5 w-2.5 rounded-full', TONE[status].dot, className)} aria-label={t(`rag.${status}` as any)} />;
}
