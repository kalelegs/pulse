'use client';

import type { BaseComponentProps } from '@json-render/react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { TBlockProps } from '@/components/json-render/blocks';

export const TextBubble = ({ props, loading }: BaseComponentProps<TBlockProps<'TextBubble'>>) => {
  if (loading) {
    return (
      <div className={cn('flex', props.align === 'end' ? 'justify-end' : 'justify-start')}>
        <div className="w-[80%] space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex', props.align === 'end' ? 'items-end' : 'items-start')}>
      <div className="max-w-[80%] space-y-1">
        {props.speaker ? <p className="text-muted-foreground text-xs">{props.speaker}</p> : null}
        <div
          className={cn(
            'rounded-xl px-3 py-2 text-sm',
            props.tone === 'muted'
              ? 'bg-muted text-muted-foreground'
              : 'bg-primary/10 text-foreground',
          )}
        >
          {props.text}
        </div>
      </div>
    </div>
  );
};
