'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import BlockIcon from '@/components/json-render/BlockIcon';
import type { TBlockComponent } from '@/lib/json-render/blocks';

const TRENDS = {
  up: 'text-emerald-500',
  down: 'text-destructive',
  flat: 'text-muted-foreground',
} as const;

export const MetricBlock: TBlockComponent<'MetricBlock'> = ({ props, loading }) => {
  const isLarge = props.size !== 'md';

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className={isLarge ? 'h-9 w-28' : 'h-6 w-20'} />
        <Skeleton className="h-3 w-24" />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <BlockIcon
        className={cn('text-block-accent shrink-0', isLarge ? 'size-8' : 'size-5')}
        name={props.icon}
      />
      <div className="min-w-0 space-y-0.5">
        {/* Value and unit are one indivisible reading — never let them wrap apart. */}
        <div className="flex items-baseline gap-1 whitespace-nowrap">
          <span
            className={cn(
              'text-foreground font-semibold tabular-nums',
              isLarge ? 'text-3xl' : 'text-xl',
            )}
          >
            {props.value}
          </span>
          {props.unit ? (
            <span className="text-muted-foreground text-sm font-medium">{props.unit}</span>
          ) : null}
        </div>
        <p className="text-muted-foreground text-xs">{props.label}</p>
        {props.delta ? (
          <p className={cn('text-xs font-medium', TRENDS[props.trend ?? 'flat'])}>{props.delta}</p>
        ) : null}
      </div>
    </div>
  );
};
