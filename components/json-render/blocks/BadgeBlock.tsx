'use client';

import type { BaseComponentProps } from '@json-render/react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import BlockIcon from '@/components/json-render/BlockIcon';
import type { TBlockProps } from '@/components/json-render/blocks';

export const BadgeBlock = ({ props, loading }: BaseComponentProps<TBlockProps<'BadgeBlock'>>) => {
  if (loading) {
    return <Skeleton className="h-5 w-20 rounded-full" />;
  }

  return (
    <Badge variant={props.tone ?? 'secondary'}>
      <BlockIcon name={props.icon} />
      {props.text}
    </Badge>
  );
};
