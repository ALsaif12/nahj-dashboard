import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: string;
  sublabel?: string;
  tone?: 'default' | 'gold' | 'teal' | 'navy';
  icon?: React.ReactNode;
  trend?: { delta: number; label?: string } | null;
}

export function StatTile({ label, value, sublabel, tone = 'default', icon, trend }: Props) {
  return (
    <div className={cn(
      'rounded-xl border p-4 transition-all',
      tone === 'gold' && 'bg-gradient-to-br from-nahj-gold/15 to-nahj-gold/5 border-nahj-gold/30',
      tone === 'teal' && 'bg-gradient-to-br from-nahj-teal/15 to-nahj-teal/5 border-nahj-teal/30',
      tone === 'navy' && 'bg-nahj-navy text-nahj-ivory border-nahj-navy',
      tone === 'default' && 'bg-white border-border'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className={cn('text-[10px] font-medium uppercase tracking-wider', tone === 'navy' ? 'text-nahj-ivory/70' : 'text-muted-foreground')}>
          {label}
        </div>
        {icon && <div className={cn(tone === 'navy' ? 'text-nahj-gold' : 'text-nahj-teal')}>{icon}</div>}
      </div>
      <div className={cn('mt-2 font-serif text-3xl font-medium tabular-nums', tone === 'navy' ? 'text-nahj-ivory' : 'text-nahj-navy')}>
        {value}
      </div>
      {(sublabel || trend) && (
        <div className={cn('mt-1.5 flex items-center justify-between text-xs', tone === 'navy' ? 'text-nahj-ivory/70' : 'text-muted-foreground')}>
          {sublabel && <span>{sublabel}</span>}
          {trend && (
            <span className={cn(trend.delta >= 0 ? 'text-rag-green' : 'text-rag-red', 'font-medium')}>
              {trend.delta >= 0 ? '↑' : '↓'} {Math.abs(trend.delta)}{trend.label && ` ${trend.label}`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
