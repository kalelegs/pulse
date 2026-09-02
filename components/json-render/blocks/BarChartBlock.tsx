'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/components/json-render/blocks/chartFormat';
import { ChartEmpty } from '@/components/json-render/blocks/chartParts';
import { barScale, clampMagnitude, percentOf } from '@/components/json-render/blocks/chartScale';
import { resolveDataTone } from '@/components/json-render/blocks/dataTones';
import type { TBlockComponent } from '@/lib/json-render/blocks';

type TBar = { label: string; value: number; display: string; toneClassName: string };

/**
 * Bars compare one measure across items, so an untoned item gets the first
 * auto colour every time (no index) — a rainbow of quarters would suggest a
 * meaning that is not there. Distinct tones are the agent's call.
 */
const toBars = (items: unknown): TBar[] =>
  Array.isArray(items)
    ? items.map((item) => {
        const value = clampMagnitude(item?.value);

        return {
          label: typeof item?.label === 'string' ? item.label : '',
          value,
          display:
            typeof item?.display === 'string' && item.display ? item.display : formatNumber(value),
          toneClassName: resolveDataTone(item?.tone).bg,
        };
      })
    : [];

export const BarChartBlock: TBlockComponent<'BarChartBlock'> = ({ props, loading }) => {
  const bars = toBars(props.items);
  const scale = barScale(
    bars.map((bar) => bar.value),
    props.max,
  );

  if (loading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (bars.length === 0) {
    return <ChartEmpty className="h-24" />;
  }

  if (props.orientation === 'vertical') {
    return (
      <ul className="flex w-full items-end gap-2">
        {bars.map((bar, index) => (
          <li
            className="flex min-w-0 flex-1 flex-col items-center gap-1 text-[10px] leading-none"
            key={`${bar.label}-${index}`}
          >
            <span className="text-foreground font-medium tabular-nums">{bar.display}</span>
            <div className="bg-muted flex h-24 w-full items-end overflow-hidden rounded-md">
              <div
                className={cn('w-full rounded-md', bar.toneClassName)}
                style={{ height: `${percentOf(bar.value, scale)}%` }}
              />
            </div>
            <span className="text-muted-foreground w-full truncate text-center" title={bar.label}>
              {bar.label}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="w-full space-y-2">
      {bars.map((bar, index) => (
        <li
          className="grid grid-cols-[minmax(0,6rem)_minmax(0,1fr)_auto] items-center gap-2 text-xs"
          key={`${bar.label}-${index}`}
        >
          <span className="text-muted-foreground truncate" title={bar.label}>
            {bar.label}
          </span>
          <div className="bg-muted h-2.5 overflow-hidden rounded-full">
            <div
              className={cn('h-full rounded-full', bar.toneClassName)}
              style={{ width: `${percentOf(bar.value, scale)}%` }}
            />
          </div>
          <span className="text-foreground font-medium tabular-nums">{bar.display}</span>
        </li>
      ))}
    </ul>
  );
};
