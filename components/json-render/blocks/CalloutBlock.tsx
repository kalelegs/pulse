'use client';

import { Children } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import BlockIcon from '@/components/json-render/BlockIcon';
import type { TBlockComponent } from '@/lib/json-render/blocks';

/**
 * Tint and border at low alpha over `--card`, so the same classes read in both
 * themes; only the icon carries the full-strength colour, lifted a step in dark
 * mode where the 500 shades sink into the surface.
 */
const TONES = {
  info: { box: 'border-sky-500/30 bg-sky-500/10', icon: 'text-sky-600 dark:text-sky-400' },
  success: {
    box: 'border-emerald-500/30 bg-emerald-500/10',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    box: 'border-amber-500/30 bg-amber-500/10',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  destructive: { box: 'border-destructive/30 bg-destructive/10', icon: 'text-destructive' },
  muted: { box: 'border-border bg-muted/40', icon: 'text-muted-foreground' },
} as const;

type TTone = keyof typeof TONES;

const resolveTone = (tone: unknown): TTone =>
  typeof tone === 'string' && tone in TONES ? (tone as TTone) : 'info';

export const CalloutBlock: TBlockComponent<'CalloutBlock'> = ({ props, children, loading }) => {
  const tone = TONES[resolveTone(props.tone)];
  // Children are optional; only reserve space beneath the text when there are any.
  const hasChildren = Children.toArray(children).length > 0;

  if (loading) {
    return <Skeleton className="h-14 w-full" />;
  }

  return (
    <div className={cn('flex w-full gap-3 rounded-lg border p-3 text-sm', tone.box)} role="note">
      <BlockIcon className={cn('mt-0.5 size-4 shrink-0', tone.icon)} name={props.icon} />
      <div className="min-w-0 flex-1 space-y-0.5">
        {props.title ? <p className="text-foreground font-medium">{props.title}</p> : null}
        <p className={props.title ? 'text-muted-foreground' : 'text-foreground'}>{props.text}</p>
        {hasChildren ? <div className="space-y-2 pt-2">{children}</div> : null}
      </div>
    </div>
  );
};
