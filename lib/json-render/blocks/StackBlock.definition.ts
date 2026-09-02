import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';

export const stackBlockDefinition = defineBlock({
  props: z.object({
    direction: z.enum(['row', 'column']).nullable(),
    gap: z.enum(['none', 'sm', 'md', 'lg']).nullable(),
    align: z.enum(['start', 'center', 'end', 'stretch']).nullable(),
    justify: z.enum(['start', 'center', 'end', 'between']).nullable(),
    wrap: z.boolean().nullable(),
  }),
  slots: ['default'],
  description:
    'Primary layout primitive: arranges its children in a row or column with a gap. Use it for almost all grouping — toolbars, stat rows, vertical sections. Defaults to a column with medium gap.',
  example: {
    direction: 'row',
    gap: 'md',
    align: 'center',
    justify: 'between',
    wrap: null,
  },
});
