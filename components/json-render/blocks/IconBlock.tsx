'use client';

import { cn } from '@/lib/utils';
import BlockIcon from '@/components/json-render/BlockIcon';
import type { TBlockComponent } from '@/lib/json-render/blocks';

const SIZES = { sm: 'size-4', md: 'size-5', lg: 'size-8', xl: 'size-12' } as const;

const TONES = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-block-accent',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  destructive: 'text-destructive',
} as const;

export const IconBlock: TBlockComponent<'IconBlock'> = ({ props }) => (
  <BlockIcon
    className={cn('shrink-0', SIZES[props.size ?? 'md'], TONES[props.tone ?? 'default'])}
    label={props.label}
    name={props.name}
  />
);
