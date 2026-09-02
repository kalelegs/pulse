'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import BlockIcon from '@/components/json-render/BlockIcon';
import type { TBlockComponent } from '@/lib/json-render/blocks';

export const BadgeBlock: TBlockComponent<'BadgeBlock'> = ({ props, loading }) => {
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
