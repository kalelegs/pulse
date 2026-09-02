'use client';

import { Children, isValidElement, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { TBlockComponent } from '@/lib/json-render/blocks';

/**
 * `<ul>`/`<ol>` may only contain `<li>`, but the renderer hands us arbitrary
 * block elements — so every child is wrapped here. Keys reuse the child's own
 * React key (derived from the stable spec element key) where available.
 */
const wrapChildrenInItems = (children: ReactNode) =>
  Children.toArray(children).map((child, index) => (
    <li key={isValidElement(child) && child.key ? child.key : `item-${index}`}>{child}</li>
  ));

/** The plain-text form: `items` reach here unvalidated while streaming, so non-strings are skipped. */
const textItems = (items: unknown, loading: boolean | undefined) =>
  (Array.isArray(items) ? items : [])
    .filter((item): item is string => typeof item === 'string')
    .map((item, index) => (
      <li key={`text-${index}`}>
        {loading ? <Skeleton className="h-3 w-2/3" /> : <span className="text-sm">{item}</span>}
      </li>
    ));

export const ListBlock: TBlockComponent<'ListBlock'> = ({ props, children, loading }) => {
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
        {textItems(props.items, loading)}
        {wrapChildrenInItems(children)}
      </ListTag>
    </div>
  );
};
