'use client';

import { cn } from '@/lib/utils';

export type TChartEmptyProps = {
  /** Height class matching the chart it stands in for, so an empty result does not collapse the layout. */
  className?: string;
};

/** Muted placeholder rendered when a chart receives no plottable data. */
export const ChartEmpty = ({ className }: TChartEmptyProps) => (
  <div
    className={cn(
      'bg-muted/40 text-muted-foreground flex w-full items-center justify-center rounded-md text-xs',
      className,
    )}
  >
    No data
  </div>
);

export type TLegendItemProps = {
  /** A `bg-*` class from `dataTones.ts`. */
  swatchClassName: string;
  label: string;
  /** Optional reading printed after the label — a share, a value, a total. */
  value?: string | null;
};

/** One swatch + label entry; every chart legend is a `<ul>` of these. */
export const LegendItem = ({ swatchClassName, label, value }: TLegendItemProps) => (
  <li className="flex min-w-0 items-center gap-1.5 text-xs">
    <span aria-hidden className={cn('size-2 shrink-0 rounded-full', swatchClassName)} />
    <span className="text-muted-foreground truncate" title={label}>
      {label}
    </span>
    {value ? <span className="text-foreground font-medium tabular-nums">{value}</span> : null}
  </li>
);
