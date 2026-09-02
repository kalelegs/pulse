'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatWithUnit } from '@/components/json-render/blocks/chartFormat';
import { LegendItem } from '@/components/json-render/blocks/chartParts';
import { clampMagnitude } from '@/components/json-render/blocks/chartScale';
import { resolveDataTone } from '@/components/json-render/blocks/dataTones';
import type { TBlockComponent } from '@/lib/json-render/blocks';

type TSegment = { label: string; value: number; toneClassName: string };

/** Segments are distinct parts of one whole, so untoned neighbours cycle the auto palette. */
const toSegments = (segments: unknown): TSegment[] =>
  Array.isArray(segments)
    ? segments.map((segment, index) => ({
        label: typeof segment?.label === 'string' ? segment.label : '',
        value: clampMagnitude(segment?.value),
        toneClassName: resolveDataTone(segment?.tone, index).bg,
      }))
    : [];

export const SegmentedBarBlock: TBlockComponent<'SegmentedBarBlock'> = ({ props, loading }) => {
  const segments = toSegments(props.segments);
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const showLegend = props.showLegend !== false;

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-3 w-full rounded-full" />
        {showLegend ? <Skeleton className="h-3 w-40" /> : null}
      </div>
    );
  }

  if (segments.length === 0) {
    return null;
  }

  const reading = (segment: TSegment) =>
    props.format === 'value'
      ? formatWithUnit(segment.value, props.unit)
      : `${total > 0 ? Math.round((segment.value / total) * 100) : 0}%`;

  return (
    <div className="w-full space-y-2">
      {/* A zero total leaves the track empty and muted — nothing to apportion, so nothing is drawn. */}
      <div className="bg-muted flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
        {total > 0
          ? segments.map((segment, index) =>
              segment.value > 0 ? (
                <div
                  className={cn('h-full', segment.toneClassName)}
                  key={`${segment.label}-${index}`}
                  style={{ width: `${(segment.value / total) * 100}%` }}
                  title={`${segment.label}: ${reading(segment)}`}
                />
              ) : null,
            )
          : null}
      </div>
      {showLegend ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {segments.map((segment, index) => (
            <LegendItem
              key={`${segment.label}-${index}`}
              label={segment.label}
              swatchClassName={segment.toneClassName}
              value={reading(segment)}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
};
