'use client';

import { RiStarFill } from '@remixicon/react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { TBlockComponent } from '@/lib/json-render/blocks';

const SIZES = { sm: 'size-3.5', md: 'size-5' } as const;

/**
 * `max` and `value` are agent-supplied and reach here unvalidated while a spec
 * streams, so both are clamped to something drawable: `max` to 1–10 symbols,
 * `value` to `[0, max]`, and anything non-finite to zero.
 */
const clamp = (value: unknown, low: number, high: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(high, Math.max(low, value)) : low;

/**
 * One symbol: a muted outline with a filled accent copy clipped to `fill`
 * (0–1), so a fractional value shows a partial star without a half-star glyph.
 */
const Symbol = ({ fill, sizeClass }: { fill: number; sizeClass: string }) => (
  <span className={cn('relative inline-block shrink-0', sizeClass)}>
    <RiStarFill className={cn('text-muted-foreground/30 absolute inset-0', sizeClass)} />
    <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
      <RiStarFill className={cn('text-amber-500', sizeClass)} />
    </span>
  </span>
);

export const RatingBlock: TBlockComponent<'RatingBlock'> = ({ props, loading }) => {
  const max = Math.round(clamp(props.max ?? 5, 1, 10));
  const value = clamp(props.value, 0, max);
  const sizeClass = SIZES[props.size ?? 'md'];

  if (loading) {
    return <Skeleton className="h-5 w-32" />;
  }

  return (
    <div className="space-y-0.5">
      {props.label ? <p className="text-muted-foreground text-xs">{props.label}</p> : null}
      <div className="flex items-center gap-2">
        <div aria-label={`${value} out of ${max}`} className="flex items-center gap-0.5" role="img">
          {Array.from({ length: max }, (_, index) => (
            <Symbol fill={clamp(value - index, 0, 1)} key={index} sizeClass={sizeClass} />
          ))}
        </div>
        {props.valueLabel ? (
          <span className="text-foreground text-sm font-medium tabular-nums">
            {props.valueLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
};
