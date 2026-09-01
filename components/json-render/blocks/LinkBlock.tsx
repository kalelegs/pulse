'use client';

import type { BaseComponentProps } from '@json-render/react';
import { Skeleton } from '@/components/ui/skeleton';
import BlockIcon from '@/components/json-render/BlockIcon';
import type { TBlockProps } from '@/components/json-render/blocks';
import { isSafeHttpUrl } from '@/components/json-render/blocks/safeUrl';

/**
 * The protocol guard lives here rather than only in the Zod schema because
 * `JsonRenderSurface` deliberately renders the *unvalidated* spec while it is
 * still streaming, so a schema-only check is bypassable. An unsafe href
 * degrades to plain, non-interactive text: the label still reads, but there is
 * nothing to click.
 */
export const LinkBlock = ({ props, loading }: BaseComponentProps<TBlockProps<'LinkBlock'>>) => {
  const content = (
    <>
      {props.text}
      <BlockIcon className="size-3.5 shrink-0" name={props.icon} />
    </>
  );

  // Same reasoning as the unsafe-href branch: a half-streamed `href` is not yet
  // something we should let the user navigate to.
  if (loading) {
    return <Skeleton className="h-3.5 w-32" />;
  }

  if (!isSafeHttpUrl(props.href)) {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1 text-sm">
        {content}
      </span>
    );
  }

  return (
    <a
      className="text-primary inline-flex items-center gap-1 text-sm underline underline-offset-2"
      href={props.href}
      rel={props.newTab ? 'noreferrer noopener' : undefined}
      target={props.newTab ? '_blank' : undefined}
    >
      {content}
    </a>
  );
};
