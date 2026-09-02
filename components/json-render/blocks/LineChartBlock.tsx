'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatWithUnit } from '@/components/json-render/blocks/chartFormat';
import { ChartEmpty, LegendItem } from '@/components/json-render/blocks/chartParts';
import {
  finiteValues,
  normalise,
  rangeOf,
  type TChartRange,
} from '@/components/json-render/blocks/chartScale';
import { resolveDataTone } from '@/components/json-render/blocks/dataTones';
import type { TBlockComponent } from '@/lib/json-render/blocks';

/**
 * Fixed drawing box, stretched to the block's width by `preserveAspectRatio="none"`.
 * Strokes use `vector-effect: non-scaling-stroke` so the stretch does not fatten
 * them, and no text is ever drawn inside the SVG — labels live in HTML around it.
 */
const VIEW_W = 100;
const VIEW_H = 40;
/** Inset so a stroke sitting on the extreme values is not clipped by the SVG edge. */
const INSET = 1;

const HEIGHTS = { sm: 'h-10', md: 'h-28', lg: 'h-44' } as const;

type TSize = keyof typeof HEIGHTS;

const resolveSize = (size: unknown): TSize =>
  typeof size === 'string' && size in HEIGHTS ? (size as TSize) : 'md';

/**
 * Plots a series on the shared x axis (`length` = the longest series, so a
 * shorter one ends early rather than being stretched) and the shared y range.
 * A lone value is doubled so it draws as a flat stub instead of nothing.
 */
const toPoints = (values: number[], length: number, range: TChartRange) =>
  (values.length === 1 ? [values[0], values[0]] : values).map((value, index) => ({
    x: (index / (length - 1)) * VIEW_W,
    y: VIEW_H - INSET - normalise(value, range) * (VIEW_H - 2 * INSET),
  }));

const toAttr = (points: { x: number; y: number }[]) =>
  points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');

/** First and last non-empty labels; a single label is shown once, on the left. */
const edgeLabels = (labels: unknown): [string, string] | null => {
  const named = Array.isArray(labels)
    ? labels.filter((label): label is string => typeof label === 'string' && label.trim() !== '')
    : [];

  return named.length > 0 ? [named[0], named.length > 1 ? named[named.length - 1] : ''] : null;
};

export const LineChartBlock: TBlockComponent<'LineChartBlock'> = ({ props, loading }) => {
  const size = resolveSize(props.size);
  const isSparkline = size === 'sm';
  const series = (Array.isArray(props.series) ? props.series : [])
    .map((entry, index) => ({
      label: typeof entry?.label === 'string' ? entry.label : `Series ${index + 1}`,
      values: finiteValues(entry?.values),
      tone: resolveDataTone(entry?.tone, index),
    }))
    .filter((entry) => entry.values.length > 0);

  if (loading) {
    return <Skeleton className={cn('w-full', HEIGHTS[size])} />;
  }

  if (series.length === 0) {
    return <ChartEmpty className={HEIGHTS[size]} />;
  }

  const length = Math.max(2, ...series.map((entry) => entry.values.length));
  const range = rangeOf(series.map((entry) => entry.values));
  const plotted = series.map((entry) => ({
    ...entry,
    points: toPoints(entry.values, length, range),
  }));
  const first = plotted[0];
  const area =
    props.showArea === true
      ? `${toAttr(first.points)} ${first.points[first.points.length - 1].x.toFixed(2)},${VIEW_H} 0,${VIEW_H}`
      : null;
  const labels = isSparkline ? null : edgeLabels(props.xLabels);
  const summary = series
    .map(
      (entry) =>
        `${entry.label}: ${formatWithUnit(entry.values[0], props.unit)} to ${formatWithUnit(entry.values[entry.values.length - 1], props.unit)}`,
    )
    .join('; ');

  return (
    <div className="w-full min-w-0 space-y-1.5">
      {!isSparkline && series.length > 1 ? (
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {series.map((entry, index) => (
            <LegendItem
              key={`${entry.label}-${index}`}
              label={entry.label}
              swatchClassName={entry.tone.bg}
            />
          ))}
        </ul>
      ) : null}
      <div
        className={cn(
          'grid gap-x-2 gap-y-1',
          isSparkline ? 'grid-cols-1' : 'grid-cols-[auto_minmax(0,1fr)]',
        )}
      >
        {!isSparkline ? (
          <div className="text-muted-foreground flex flex-col justify-between text-right text-[10px] leading-none tabular-nums">
            <span>{formatWithUnit(range.max, props.unit)}</span>
            <span>{formatWithUnit(range.min, props.unit)}</span>
          </div>
        ) : null}
        <svg
          aria-label={summary}
          className={cn('w-full', HEIGHTS[size])}
          preserveAspectRatio="none"
          role="img"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        >
          {area ? (
            <polygon
              className={first.tone.text}
              fill="currentColor"
              fillOpacity={0.12}
              points={area}
            />
          ) : null}
          {plotted.map((entry, index) => (
            <polyline
              className={entry.tone.text}
              fill="none"
              key={`${entry.label}-${index}`}
              points={toAttr(entry.points)}
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={isSparkline ? 1.5 : 2}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        {labels ? (
          <div className="text-muted-foreground col-start-2 flex justify-between gap-2 text-[10px] leading-none">
            <span className="truncate">{labels[0]}</span>
            <span className="truncate">{labels[1]}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};
