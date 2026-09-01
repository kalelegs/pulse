'use client';

import type { BaseComponentProps } from '@json-render/react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { TBlockProps } from '@/components/json-render/blocks';

const SIZES = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' } as const;
const ALIGN = { start: 'text-left', center: 'text-center', end: 'text-right' } as const;

export const TextBlock = ({ props, loading }: BaseComponentProps<TBlockProps<'TextBlock'>>) => {
  if (loading) {
    return (
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    );
  }

  return (
    <p
      className={cn(
        'leading-relaxed',
        SIZES[props.size ?? 'md'],
        ALIGN[props.align ?? 'start'],
        props.tone === 'muted' ? 'text-muted-foreground' : 'text-foreground',
      )}
    >
      {props.text}
    </p>
  );
};
