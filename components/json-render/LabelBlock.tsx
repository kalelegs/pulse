'use client';

import { z } from 'zod';
import { Label } from '@/components/ui/label';
import type { TRenderCtx } from '@/components/json-render/types';

export const labelBlockDefinition = {
  props: z.object({
    text: z.string(),
    subtle: z.boolean().nullable(),
  }),
  slots: [],
  description: 'Generic label text block.',
};

type TLabelBlockProps = z.infer<typeof labelBlockDefinition.props>;

export const LabelBlock = ({ props }: TRenderCtx<TLabelBlockProps>) => (
  <Label className={props.subtle ? 'text-muted-foreground text-xs font-normal' : ''}>
    {props.text}
  </Label>
);
