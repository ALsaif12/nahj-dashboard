'use client';

import * as React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';

interface Props {
  /** Text body (already translated). */
  body: string;
  className?: string;
  size?: 'sm' | 'md';
}

/** A small info icon (ⓘ) that explains a non-obvious term. Body is pre-translated. */
export function InfoTooltip({ body, className, size = 'sm' }: Props) {
  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn('inline-flex items-center justify-center text-muted-foreground hover:text-nahj-teal transition-colors', className)}
            tabIndex={0}
            aria-label="More info"
          >
            <Info className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="text-xs leading-snug">{body}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
