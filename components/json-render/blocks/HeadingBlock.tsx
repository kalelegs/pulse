'use client';

import type { BaseComponentProps } from '@json-render/react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import BlockIcon from '@/components/json-render/BlockIcon';
import type { TBlockProps } from '@/components/json-render/blocks';

const SIZES = {
  '1': 'text-xl font-semibold',
  '2': 'text-base font-semibold',
  '3': 'text-sm font-medium',
} as const;

export const HeadingBlock = ({
  props,
  loading,
}: BaseComponentProps<TBlockProps<'HeadingBlock'>>) => {
  if (loading) {
    return <Skeleton className="h-5 w-40" />;
  }

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        <BlockIcon className="text-muted-foreground size-4 shrink-0" name={props.icon} />
        <span className={cn('text-foreground', SIZES[props.level ?? '2'])}>{props.text}</span>
      </div>
      {props.subtitle ? <p className="text-muted-foreground text-xs">{props.subtitle}</p> : null}
    </div>
  );
};
