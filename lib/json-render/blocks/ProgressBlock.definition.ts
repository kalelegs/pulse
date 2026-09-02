import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';

export const progressBlockDefinition = defineBlock({
  props: z.object({
    value: z.number().min(0).max(100),
    label: z.string().nullable(),
    valueLabel: z.string().nullable(),
    tone: z.enum(['default', 'success', 'warning', 'destructive']).nullable(),
  }),
  slots: [],
  description:
    'Horizontal progress/level bar. `value` is a percentage from 0 to 100; use `valueLabel` to show the real-world figure (e.g. "6 of 10", "UV 6").',
  example: { value: 60, label: 'UV index', valueLabel: '6 of 10', tone: 'warning' },
});
