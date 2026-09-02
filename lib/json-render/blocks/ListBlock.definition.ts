import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';

export const listBlockDefinition = defineBlock({
  props: z.object({
    title: z.string().nullable(),
    ordered: z.boolean().nullable(),
    /** Plain-text items. The cheap form: one string per bullet, no child elements needed. */
    items: z.array(z.string()).nullable(),
  }),
  slots: ['default'],
  description:
    'Bulleted or numbered list. Put plain one-line items in `items`; use child elements only when a bullet needs a block of its own (a KeyValueBlock, a LinkBlock). Items render first, then children, one bullet each. Set `ordered` when sequence matters.',
  example: {
    title: 'What to bring',
    ordered: false,
    items: ['Photo ID', 'Printed confirmation', 'A charged phone'],
  },
});
