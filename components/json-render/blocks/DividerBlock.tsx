'use client';

import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import type { TBlockComponent } from '@/lib/json-render/blocks';

export const DividerBlock: TBlockComponent<'DividerBlock'> = ({ props, loading }) => {
  if (props.orientation === 'vertical') {
    return <Separator orientation="vertical" className="mx-1 self-stretch" />;
  }

  // An unlabelled rule carries no content, so there is nothing to skeletonise —
  // it renders identically either way.
  if (!props.label) {
    return <Separator className="my-1" />;
  }

  return (
    <div className="my-1 flex items-center gap-3">
      <Separator className="flex-1" />
      {loading ? (
        <Skeleton className="h-3 w-16" />
      ) : (
        <span className="text-muted-foreground text-xs whitespace-nowrap">{props.label}</span>
      )}
      <Separator className="flex-1" />
    </div>
  );
};
