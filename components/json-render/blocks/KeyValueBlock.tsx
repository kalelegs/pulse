'use client';

import { Skeleton } from '@/components/ui/skeleton';
import BlockIcon from '@/components/json-render/BlockIcon';
import type { TBlockComponent } from '@/lib/json-render/blocks';

/**
 * Label and value are both agent-supplied and unbounded, so neither side may be
 * allowed to reflow the row: a value that wrapped to a second line would double
 * the row's height and break the baseline of any grid it sits in. Both sides are
 * `min-w-0` flex items that truncate instead, with the label yielding space
 * first (`flex-1`) because the value is the payload. `title` keeps the full
 * string reachable when either end is clipped.
 */
export const KeyValueBlock: TBlockComponent<'KeyValueBlock'> = ({ props, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-between gap-4 py-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-12" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-muted-foreground flex min-w-0 flex-1 items-center gap-1.5 text-xs">
        <BlockIcon className="size-3.5 shrink-0" name={props.icon} />
        <span className="truncate" title={props.label}>
          {props.label}
        </span>
      </span>
      <span
        className="text-foreground min-w-0 truncate text-sm font-medium whitespace-nowrap tabular-nums"
        title={props.value}
      >
        {props.value}
      </span>
    </div>
  );
};
