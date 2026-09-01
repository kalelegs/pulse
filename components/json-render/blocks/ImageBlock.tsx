'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { BaseComponentProps } from '@json-render/react';
import { Skeleton } from '@/components/ui/skeleton';
import type { TBlockProps } from '@/components/json-render/blocks';

export const ImageBlock = ({ props, loading }: BaseComponentProps<TBlockProps<'ImageBlock'>>) => {
  const [failed, setFailed] = useState(false);
  const width = props.width ?? 640;
  const height = props.height ?? 360;
  /*
    The declared dimensions are the *shape contract*, not just a hint: without an
    explicit aspect-ratio the box takes the container's width and the source
    file's intrinsic ratio, so a spec declaring 16:9 could render 4:3. Both
    numbers are agent-supplied and unvalidated while a spec streams, so zero,
    negative and non-finite values all fall back to 16:9 rather than producing a
    collapsed or infinite box.
  */
  const ratio =
    width > 0 && height > 0 && Number.isFinite(width / height) ? width / height : 16 / 9;

  if (loading) {
    return <Skeleton className="aspect-video w-full" />;
  }

  if (failed || !props.src) {
    return (
      <div
        className="bg-muted text-muted-foreground flex aspect-video w-full items-center justify-center rounded-md border text-xs"
        role="img"
        aria-label={props.alt ?? 'Image unavailable'}
      >
        Image unavailable
      </div>
    );
  }

  return (
    <figure className="space-y-2">
      {/*
        `unoptimized` is deliberate: `src` is agent-supplied and arbitrary, so it
        can never be whitelisted in `next.config` remotePatterns. Routing it
        through the Next image optimizer would either 400 on an unconfigured host
        or turn our server into an open image proxy. We take the raw <img> path
        and handle failures below instead.
      */}
      <Image
        alt={props.alt ?? ''}
        className="w-full rounded-md border object-cover"
        height={height}
        onError={() => setFailed(true)}
        src={props.src}
        style={{ aspectRatio: ratio }}
        unoptimized
        width={width}
      />
      {props.caption ? (
        <figcaption className="text-muted-foreground text-xs">{props.caption}</figcaption>
      ) : null}
    </figure>
  );
};
