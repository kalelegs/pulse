import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';
import { dataToneEnum } from '@/lib/json-render/blocks/tones';

export const barChartBlockDefinition = defineBlock({
  props: z.object({
    items: z.array(
      z.object({
        label: z.string(),
        /** Numeric value used for the bar length. */
        value: z.number(),
        /** Pre-formatted value shown at the end of the bar, e.g. "$3.1T". Null shows `value`. */
        display: z.string().nullable(),
        tone: dataToneEnum,
      }),
    ),
    orientation: z.enum(['horizontal', 'vertical']).nullable(),
    /** Scale ceiling. Null scales to the largest item. */
    max: z.number().nullable(),
  }),
  slots: [],
  description:
    'Bar chart comparing a handful of categories on one measure — counts, scores, totals per category. Values are numeric so the bars scale; put the human-readable form in `display`. Horizontal is the default and reads best for labels longer than a word.',
  example: {
    items: [
      { label: 'Engineering', value: 30, display: '30 tasks', tone: 'primary' },
      { label: 'Design', value: 12, display: '12 tasks', tone: 'muted' },
    ],
    orientation: 'horizontal',
    max: null,
  },
});
