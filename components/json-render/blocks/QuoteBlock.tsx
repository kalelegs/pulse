'use client';

import { Skeleton } from '@/components/ui/skeleton';
import type { TBlockComponent } from '@/lib/json-render/blocks';
import { isSafeHttpUrl } from '@/lib/json-render/blocks/safeUrl';

/**
 * `<figure>` + `<blockquote>` + `<figcaption>` is the HTML that associates a
 * quotation with its attribution. The source becomes a link only for an
 * absolute http(s) href — the same rule as `LinkBlock`, applied here because
 * unvalidated specs still render.
 */
export const QuoteBlock: TBlockComponent<'QuoteBlock'> = ({ props, loading }) => {
  const hasCaption = Boolean(props.attribution || props.source);

  if (loading) {
    return (
      <div className="space-y-2 border-l-2 pl-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-32" />
      </div>
    );
  }

  return (
    <figure className="border-block-accent/40 w-full space-y-2 border-l-2 pl-4">
      <blockquote className="text-foreground text-sm italic">{props.text}</blockquote>
      {hasCaption ? (
        <figcaption className="text-muted-foreground text-xs">
          {props.attribution ? (
            <span className="text-foreground/80">— {props.attribution}</span>
          ) : null}
          {props.attribution && props.source ? ', ' : null}
          {props.source ? (
            isSafeHttpUrl(props.href) ? (
              <a
                className="text-primary underline underline-offset-2"
                href={props.href ?? undefined}
                rel="noreferrer noopener"
                target="_blank"
              >
                {props.source}
              </a>
            ) : (
              <span>{props.source}</span>
            )
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
};
