'use client';

import { z } from 'zod';
import type { ReactNode } from 'react';
import type { TRenderCtx } from '@/components/json-render/types';

export const carouselBlockDefinition = {
  props: z.object({
    title: z.string().nullable(),
  }),
  slots: ['default'],
  description: 'Horizontally scrollable carousel container.',
};

type TCarouselBlockProps = z.infer<typeof carouselBlockDefinition.props>;

const wrapChildrenInSlides = (children: ReactNode) => {
  if (!Array.isArray(children)) {
    return children;
  }

  return children.map((child, index) => (
    <div className="min-w-[240px] snap-start" key={index}>
      {child}
    </div>
  ));
};

export const CarouselBlock = ({ props, children }: TRenderCtx<TCarouselBlockProps>) => (
  <div className="space-y-2">
    {props.title ? <p className="text-sm font-medium">{props.title}</p> : null}
    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
      {wrapChildrenInSlides(children)}
    </div>
  </div>
);
