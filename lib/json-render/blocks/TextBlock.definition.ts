import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';

export const textBlockDefinition = defineBlock({
  props: z.object({
    text: z.string(),
    tone: z.enum(['default', 'muted']).nullable(),
    size: z.enum(['sm', 'md', 'lg']).nullable(),
    align: z.enum(['start', 'center', 'end']).nullable(),
  }),
  slots: [],
  description:
    'Plain paragraph of prose. This is the default choice for body copy inside a panel; use TextBubbleBlock only for chat transcript styling.',
  example: {
    text: 'Both routes take about the same time; the second avoids tolls.',
    tone: 'muted',
    size: 'sm',
    align: null,
  },
});
