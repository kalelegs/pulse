'use client';

import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { TBlockComponent } from '@/lib/json-render/blocks';

export const LabelBlock: TBlockComponent<'LabelBlock'> = ({ props, loading }) => {
  if (loading) {
    return <Skeleton className="h-3.5 w-16" />;
  }

  return (
    <Label className={cn(props.subtle ? 'text-muted-foreground text-xs font-normal' : null)}>
      {props.text}
    </Label>
  );
};
