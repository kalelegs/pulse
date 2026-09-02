import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';

export const gridBlockDefinition = defineBlock({
  props: z.object({
    columns: z.number().int().min(1).max(6).nullable(),
    gap: z.enum(['none', 'sm', 'md', 'lg']).nullable(),
  }),
  slots: ['default'],
  description:
    'Equal-width column grid for evenly sized tiles such as stat cards or option cards. Use StackBlock instead when children have different widths or should simply flow.',
  example: { columns: 3, gap: 'md' },
});
