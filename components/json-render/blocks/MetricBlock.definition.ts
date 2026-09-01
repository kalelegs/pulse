import { z } from 'zod';
import { defineBlock } from '@/components/json-render/blocks/defineBlock';
import { ICON_NAMES } from '@/components/json-render/blocks/iconNames';

export const metricBlockDefinition = defineBlock({
  props: z.object({
    label: z.string(),
    value: z.string(),
    unit: z.string().nullable(),
    delta: z.string().nullable(),
    trend: z.enum(['up', 'down', 'flat']).nullable(),
    icon: z.enum(ICON_NAMES).nullable(),
    size: z.enum(['md', 'lg']).nullable(),
  }),
  slots: [],
  description:
    'Headline number with a caption — temperature, price, score, count. Pre-format `value` as a display string and put the symbol in `unit`. Add `delta` plus `trend` to show change against a baseline.',
  example: {
    label: 'Feels like 66°',
    value: '68',
    unit: '°F',
    delta: '+4° vs yesterday',
    trend: 'up',
    icon: 'sun',
    size: 'lg',
  },
});
