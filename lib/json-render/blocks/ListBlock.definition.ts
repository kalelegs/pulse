import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';

export const listBlockDefinition = defineBlock({
  props: z.object({
    title: z.string().nullable(),
    ordered: z.boolean().nullable(),
  }),
  slots: ['default'],
  description:
    'Bulleted or numbered list. Each child element becomes one list item, so give it several children rather than one child containing newlines. Set `ordered` when sequence matters.',
  example: { title: 'What to pack', ordered: false },
});
