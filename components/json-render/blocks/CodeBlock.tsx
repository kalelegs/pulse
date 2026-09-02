'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { TBlockComponent } from '@/lib/json-render/blocks';

/**
 * `<pre>` keeps the agent's whitespace exactly; the surrounding `<figure>` ties
 * the optional language label and caption to it. Long lines scroll inside the
 * block (`overflow-x-auto`) rather than widening the panel, unless `wrap` asks
 * for soft wrapping.
 */
export const CodeBlock: TBlockComponent<'CodeBlock'> = ({ props, loading }) => {
  if (loading) {
    return (
      <div className="space-y-1.5 rounded-lg border p-3">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    );
  }

  return (
    <figure className="w-full space-y-1.5">
      <div className="bg-muted/40 overflow-hidden rounded-lg border">
        {props.language ? (
          <div className="text-muted-foreground border-b px-3 py-1 font-mono text-[11px] tracking-wide uppercase">
            {props.language}
          </div>
        ) : null}
        <pre
          className={cn(
            'text-foreground overflow-x-auto p-3 font-mono text-xs leading-relaxed',
            props.wrap ? 'break-words whitespace-pre-wrap' : 'whitespace-pre',
          )}
        >
          <code>{props.code}</code>
        </pre>
      </div>
      {props.caption ? (
        <figcaption className="text-muted-foreground text-xs">{props.caption}</figcaption>
      ) : null}
    </figure>
  );
};
