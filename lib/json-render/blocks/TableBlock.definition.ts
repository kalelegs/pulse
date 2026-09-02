import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';

export const tableBlockDefinition = defineBlock({
  props: z.object({
    columns: z.array(z.string()),
    rows: z.array(z.array(z.string())),
    caption: z.string().nullable(),
  }),
  slots: [],
  description:
    'Compact data table of pre-formatted strings. Every row must have the same length as `columns`; extra cells are dropped and missing ones render blank. Prefer KeyValueBlock for fewer than three facts.',
  example: {
    columns: ['Plan', 'Price', 'Seats'],
    rows: [
      ['Starter', '$9/mo', '1'],
      ['Team', '$29/mo', '10'],
    ],
    caption: 'Billed monthly',
  },
});
