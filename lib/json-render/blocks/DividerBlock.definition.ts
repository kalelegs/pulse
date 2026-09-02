import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';

export const dividerBlockDefinition = defineBlock({
  props: z.object({
    label: z.string().nullable(),
    orientation: z.enum(['horizontal', 'vertical']).nullable(),
  }),
  slots: [],
  description:
    'Thin rule that separates sections, with an optional centered label. Use sparingly — prefer spacing via StackBlock gaps for ordinary grouping.',
  example: { label: 'Today', orientation: 'horizontal' },
});
