'use client';

import type { BaseComponentProps } from '@json-render/react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { TBlockProps } from '@/components/json-render/blocks';

const TONES = {
  default: '[&_[data-slot=progress-indicator]]:bg-primary',
  success: '[&_[data-slot=progress-indicator]]:bg-emerald-500',
  warning: '[&_[data-slot=progress-indicator]]:bg-amber-500',
  destructive: '[&_[data-slot=progress-indicator]]:bg-destructive',
} as const;

export const ProgressBlock = ({
  props,
  loading,
}: BaseComponentProps<TBlockProps<'ProgressBlock'>>) => {
  const value = Math.min(100, Math.max(0, props.value ?? 0));

  if (loading) {
    return <Skeleton className="h-4 w-full" />;
  }

  return (
    <div className="w-full space-y-1.5">
      {props.label || props.valueLabel ? (
        <div className="flex items-center justify-between gap-2">
          {props.label ? (
            <span className="text-muted-foreground text-xs">{props.label}</span>
          ) : null}
          {props.valueLabel ? (
            <span className="text-foreground text-xs font-medium tabular-nums">
              {props.valueLabel}
            </span>
          ) : null}
        </div>
      ) : null}
      <Progress className={cn('w-full', TONES[props.tone ?? 'default'])} value={value} />
    </div>
  );
};
