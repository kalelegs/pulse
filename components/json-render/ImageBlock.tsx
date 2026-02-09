'use client';

import Image from 'next/image';
import { z } from 'zod';
import type { TRenderCtx } from '@/components/json-render/types';

export const imageBlockDefinition = {
  props: z.object({
    src: z.string(),
    alt: z.string().nullable(),
    caption: z.string().nullable(),
    width: z.number().nullable(),
    height: z.number().nullable(),
  }),
  slots: [],
  description: 'Generic image block with optional caption.',
};

type TImageBlockProps = z.infer<typeof imageBlockDefinition.props>;

export const ImageBlock = ({ props }: TRenderCtx<TImageBlockProps>) => {
  const width = props.width ?? 640;
  const height = props.height ?? 360;

  return (
    <figure className="space-y-2">
      <Image
        alt={props.alt ?? 'image'}
        className="rounded-md border object-cover"
        height={height}
        src={props.src}
        unoptimized
        width={width}
      />
      {props.caption ? (
        <figcaption className="text-muted-foreground text-xs">{props.caption}</figcaption>
      ) : null}
    </figure>
  );
};
