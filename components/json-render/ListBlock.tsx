'use client';

import { z } from 'zod';
import type { TRenderCtx } from '@/components/json-render/types';

export const listBlockDefinition = {
  props: z.object({
    title: z.string().nullable(),
    ordered: z.boolean().nullable(),
  }),
  slots: ['default'],
  description: 'Generic ordered or unordered list container.',
};

type TListBlockProps = z.infer<typeof listBlockDefinition.props>;

export const ListBlock = ({ props, children }: TRenderCtx<TListBlockProps>) => {
  const isOrdered = props.ordered === true;
  const ListTag = isOrdered ? 'ol' : 'ul';

  return (
    <div className="space-y-2">
      {props.title ? <p className="text-sm font-medium">{props.title}</p> : null}
      <ListTag className="ml-5 space-y-2 text-sm">{children}</ListTag>
    </div>
  );
};
