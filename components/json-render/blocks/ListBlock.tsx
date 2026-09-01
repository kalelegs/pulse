'use client';

import { Children, isValidElement, type ReactNode } from 'react';
import type { BaseComponentProps } from '@json-render/react';
import { Skeleton } from '@/components/ui/skeleton';
import type { TBlockProps } from '@/components/json-render/blocks';

/**
 * `<ul>`/`<ol>` may only contain `<li>`, but the renderer hands us arbitrary
 * block elements — so every child is wrapped here. Keys reuse the child's own
 * React key (derived from the stable spec element key) where available.
 */
const wrapChildrenInItems = (children: ReactNode) =>
  Children.toArray(children).map((child, index) => (
    <li key={isValidElement(child) && child.key ? child.key : `item-${index}`}>{child}</li>
  ));

export const ListBlock = ({
  props,
  children,
  loading,
}: BaseComponentProps<TBlockProps<'ListBlock'>>) => {
  const ListTag = props.ordered === true ? 'ol' : 'ul';

  return (
    <div className="space-y-2">
      {props.title ? (
        // The children skeletonise themselves; the title must match or the list
        // reads as half-loaded.
        loading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <p className="text-sm font-medium">{props.title}</p>
        )
      ) : null}
      <ListTag
        className={
          props.ordered === true
            ? 'ml-5 list-decimal space-y-2 text-sm'
            : 'ml-5 list-disc space-y-2 text-sm'
        }
      >
        {wrapChildrenInItems(children)}
      </ListTag>
    </div>
  );
};
