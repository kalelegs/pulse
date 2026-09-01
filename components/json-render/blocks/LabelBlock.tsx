'use client';

import type { BaseComponentProps } from '@json-render/react';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { TBlockProps } from '@/components/json-render/blocks';

export const LabelBlock = ({ props, loading }: BaseComponentProps<TBlockProps<'LabelBlock'>>) => {
  if (loading) {
    return <Skeleton className="h-3.5 w-16" />;
  }

  return (
    <Label className={cn(props.subtle ? 'text-muted-foreground text-xs font-normal' : null)}>
      {props.text}
    </Label>
  );
};
