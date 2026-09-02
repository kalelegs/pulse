'use client';

import { RiCheckLine, RiCloseLine } from '@remixicon/react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { TBlockComponent, TBlockProps } from '@/lib/json-render/blocks';

type TStep = TBlockProps<'StepperBlock'>['steps'][number];
type TStatus = NonNullable<TStep['status']>;

/** Marker circle per status; `current` is the only one that draws attention. */
const MARKERS: Record<TStatus, string> = {
  done: 'bg-block-accent text-primary-foreground border-block-accent',
  current: 'border-block-accent text-block-accent ring-block-accent/25 bg-background ring-4',
  upcoming: 'border-border text-muted-foreground bg-background',
  blocked: 'border-destructive text-destructive bg-destructive/10',
};

const resolveStatus = (status: unknown): TStatus =>
  typeof status === 'string' && status in MARKERS ? (status as TStatus) : 'upcoming';

const Marker = ({ status, index }: { status: TStatus; index: number }) => (
  <span
    className={cn(
      'flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums',
      MARKERS[status],
    )}
  >
    {status === 'done' ? (
      <RiCheckLine className="size-3.5" />
    ) : status === 'blocked' ? (
      <RiCloseLine className="size-3.5" />
    ) : (
      index + 1
    )}
  </span>
);

const Title = ({ step, status }: { step: TStep; status: TStatus }) => (
  <p
    className={cn(
      'text-sm leading-6',
      status === 'current' ? 'text-foreground font-medium' : 'text-foreground',
      status === 'upcoming' && 'text-muted-foreground',
    )}
  >
    {step.title}
  </p>
);

export const StepperBlock: TBlockComponent<'StepperBlock'> = ({ props, loading }) => {
  const steps = Array.isArray(props.steps) ? props.steps : [];

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <div className="flex items-center gap-3" key={index}>
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>
    );
  }

  if (props.orientation === 'horizontal') {
    return (
      <ol className="flex w-full items-start gap-2 overflow-x-auto">
        {steps.map((step, index) => {
          const status = resolveStatus(step.status);

          return (
            <li className="flex min-w-0 flex-1 items-start gap-2" key={`${index}-${step.title}`}>
              <div className="flex min-w-0 flex-col items-center gap-1 text-center">
                <Marker index={index} status={status} />
                <span className="text-muted-foreground line-clamp-2 text-xs">{step.title}</span>
              </div>
              {index < steps.length - 1 ? (
                <span className="bg-border mt-3 h-px min-w-4 flex-1" aria-hidden="true" />
              ) : null}
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className="space-y-0">
      {steps.map((step, index) => {
        const status = resolveStatus(step.status);
        const isLast = index === steps.length - 1;

        return (
          <li className="flex gap-3" key={`${index}-${step.title}`}>
            <div className="flex flex-col items-center">
              <Marker index={index} status={status} />
              {!isLast ? <span className="bg-border my-1 w-px flex-1" aria-hidden="true" /> : null}
            </div>
            <div className={cn('min-w-0', !isLast && 'pb-4')}>
              <Title status={status} step={step} />
              {step.description ? (
                <p className="text-muted-foreground text-xs">{step.description}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
