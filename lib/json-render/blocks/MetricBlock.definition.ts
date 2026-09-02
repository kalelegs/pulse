import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';
import { iconEnum } from '@/lib/json-render/iconNames';

export const metricBlockDefinition = defineBlock({
  props: z.object({
    label: z.string(),
    value: z.string(),
    unit: z.string().nullable(),
    delta: z.string().nullable(),
    trend: z.enum(['up', 'down', 'flat']).nullable(),
    icon: iconEnum,
    size: z.enum(['md', 'lg']).nullable(),
  }),
  slots: [],
  description:
    'Headline number with a caption — a total, a price, a score, a reading. Pre-format `value` as a display string and put the symbol in `unit`. Add `delta` plus `trend` to show change against a baseline.',
  example: {
    label: 'Steps today',
    value: '8,420',
    unit: 'steps',
    delta: '+12% vs last week',
    trend: 'up',
    icon: 'flash',
    size: 'lg',
  },
});
