'use client';

import type { BaseComponentProps } from '@json-render/react';
import { cn } from '@/lib/utils';
import type { TBlockProps } from '@/components/json-render/blocks';

/** Explicit classes so Tailwind can statically extract them. */
const COLUMNS = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-5',
  6: 'grid-cols-3 sm:grid-cols-6',
} as const;

const GAP = { none: 'gap-0', sm: 'gap-2', md: 'gap-3', lg: 'gap-6' } as const;

/**
 * `columns` is agent-supplied and reaches here unvalidated while a spec streams,
 * so `NaN` and `Infinity` are both live inputs. `Math.min`/`Math.max` propagate
 * `NaN` rather than clamping it, which would index `COLUMNS` to `undefined` and
 * leave the grid with no column class — hence the explicit finite check.
 */
const clampColumns = (columns: number | null): keyof typeof COLUMNS =>
  typeof columns === 'number' && Number.isFinite(columns)
    ? (Math.min(6, Math.max(1, Math.round(columns))) as keyof typeof COLUMNS)
    : 2;

export const GridBlock = ({ props, children }: BaseComponentProps<TBlockProps<'GridBlock'>>) => (
  <div className={cn('grid', COLUMNS[clampColumns(props.columns)], GAP[props.gap ?? 'md'])}>
    {children}
  </div>
);
