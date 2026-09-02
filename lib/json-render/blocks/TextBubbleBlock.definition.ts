import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';

export const textBubbleBlockDefinition = defineBlock({
  props: z.object({
    text: z.string(),
    speaker: z.string().nullable(),
    align: z.enum(['start', 'end']).nullable(),
    tone: z.enum(['default', 'muted']).nullable(),
  }),
  slots: [],
  description:
    'Chat-transcript speech bubble with an optional speaker label. Use it only when reproducing conversational turns; ordinary explanatory copy belongs in TextBlock.',
  example: {
    text: 'Can you summarise the last meeting?',
    speaker: 'You',
    align: 'end',
    tone: 'default',
  },
});
