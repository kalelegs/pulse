'use client';

import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import type { TRenderCtx } from '@/components/json-render/types';

export const suggestionChipDefinition = {
  props: z.object({
    text: z.string(),
    hint: z.string().nullable(),
    tone: z.enum(['default', 'secondary', 'outline']).nullable(),
  }),
  slots: [],
  description: 'Pill style suggestion chip with optional tooltip.',
};

type TSuggestionChipProps = z.infer<typeof suggestionChipDefinition.props>;

export const SuggestionChip = ({ props }: TRenderCtx<TSuggestionChipProps>) => {
  const variant = props.tone ?? 'secondary';
  return (
    <Badge title={props.hint ?? undefined} variant={variant}>
      {props.text}
    </Badge>
  );
};
