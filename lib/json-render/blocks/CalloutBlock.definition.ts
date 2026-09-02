import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';
import { iconEnum } from '@/lib/json-render/iconNames';

export const calloutBlockDefinition = defineBlock({
  props: z.object({
    title: z.string().nullable(),
    text: z.string(),
    tone: z.enum(['info', 'success', 'warning', 'destructive', 'muted']).nullable(),
    icon: iconEnum,
  }),
  slots: [],
  description:
    'Short highlighted note set apart from the surrounding content — a caveat, a disclaimer, a tip, a warning. One or two sentences; use TextBlock for ordinary prose.',
  example: {
    title: 'Not financial advice',
    text: 'Figures are delayed market data. Do your own research before trading.',
    tone: 'warning',
    icon: 'warning',
  },
});
