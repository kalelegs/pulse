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
    columns: ['Day', 'High', 'Low'],
    rows: [
      ['Mon', '71°', '55°'],
      ['Tue', '68°', '54°'],
    ],
    caption: 'Next two days',
  },
});
