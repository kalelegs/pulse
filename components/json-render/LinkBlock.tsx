'use client';

import { z } from 'zod';
import type { TRenderCtx } from '@/components/json-render/types';

export const linkBlockDefinition = {
  props: z.object({
    href: z.string(),
    text: z.string(),
    newTab: z.boolean().nullable(),
  }),
  slots: [],
  description: 'Generic text link.',
};

type TLinkBlockProps = z.infer<typeof linkBlockDefinition.props>;

export const LinkBlock = ({ props }: TRenderCtx<TLinkBlockProps>) => (
  <a
    className="text-primary text-sm underline underline-offset-2"
    href={props.href}
    rel={props.newTab ? 'noreferrer' : undefined}
    target={props.newTab ? '_blank' : undefined}
  >
    {props.text}
  </a>
);
