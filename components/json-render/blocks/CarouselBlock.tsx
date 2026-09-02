'use client';

import { Children, isValidElement, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useScrollableRight } from '@/components/json-render/useScrollableRight';
import type { TBlockComponent } from '@/lib/json-render/blocks';

const ITEM_WIDTHS = { sm: 'min-w-28', md: 'min-w-60', lg: 'min-w-80' } as const;

/**
 * Wraps each rendered child in a snap target. Keys come from the child element's
 * own React key (which the renderer derives from the stable spec element key),
 * never from the array index — index keys would remount slides whenever the
 * agent streams in a new element ahead of an existing one.
 *
 * `[&>*]:h-full` pushes the row's stretched track height down into the block the
 * agent actually authored; without it the wrapper stretches but its card does
 * not, so a strip of uneven cards ends in a ragged bottom edge.
 */
const wrapChildrenInSlides = (children: ReactNode, widthClass: string) =>
  Children.toArray(children).map((child, index) => (
    <div
      className={cn('snap-start [&>*]:h-full', widthClass)}
      key={isValidElement(child) && child.key ? child.key : `slide-${index}`}
    >
      {child}
    </div>
  ));

export const CarouselBlock: TBlockComponent<'CarouselBlock'> = ({ props, children, loading }) => {
  const { ref, canScrollRight } = useScrollableRight<HTMLDivElement>();

  return (
    <div className="space-y-2">
      {props.title ? (
        loading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <p className="text-sm font-medium">{props.title}</p>
        )
      ) : null}
      {/*
        macOS overlay scrollbars are invisible at rest, so an overflowing strip
        otherwise reads as a card that clipped its own content. The mask fades
        the true right edge instead of painting a gradient in a guessed
        background colour, and is applied only while there is genuinely more to
        scroll to — at rest it is absent, so nothing is clipped.
      */}
      <div
        className={cn(
          'flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto pb-1',
          canScrollRight && '[mask-image:linear-gradient(to_right,#000_calc(100%-3rem),#0000)]',
        )}
        ref={ref}
      >
        {wrapChildrenInSlides(children, ITEM_WIDTHS[props.itemWidth ?? 'md'])}
      </div>
    </div>
  );
};
