import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors backdrop-blur',
  {
    variants: {
      variant: {
        default: 'bg-white/10 text-white border border-white/15',
        outline: 'border border-white/20 text-white/85 bg-white/[0.03]',
        gold: 'border border-nahj-gold/40 bg-nahj-gold/15 text-nahj-gold-soft',
        green: 'border border-rag-green/40 bg-rag-green/15 text-emerald-300',
        amber: 'border border-rag-amber/40 bg-rag-amber/15 text-amber-300',
        red: 'border border-rag-red/40 bg-rag-red/15 text-red-300',
        teal: 'border border-nahj-teal/40 bg-nahj-teal/15 text-cyan-200',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
