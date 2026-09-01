'use client';

import type { BaseComponentProps } from '@json-render/react';
import { cn } from '@/lib/utils';
import type { TBlockProps } from '@/components/json-render/blocks';

const GAP = { none: 'gap-0', sm: 'gap-2', md: 'gap-3', lg: 'gap-6' } as const;
const ALIGN = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
} as const;
const JUSTIFY = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
} as const;

export const StackBlock = ({ props, children }: BaseComponentProps<TBlockProps<'StackBlock'>>) => (
  <div
    className={cn(
      'flex',
      props.direction === 'row' ? 'flex-row' : 'flex-col',
      GAP[props.gap ?? 'md'],
      ALIGN[props.align ?? (props.direction === 'row' ? 'center' : 'stretch')],
      JUSTIFY[props.justify ?? 'start'],
      props.wrap ? 'flex-wrap' : null,
    )}
  >
    {children}
  </div>
);
