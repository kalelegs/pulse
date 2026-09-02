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
    'Bar chart comparing a handful of categories on one measure — market caps, scores, counts. Values are numeric so the bars scale; put the human-readable form in `display`. Horizontal is the default and reads best for labels longer than a word.',
  example: {
    items: [
      { label: 'Apple', value: 3100, display: '$3.1T', tone: 'primary' },
      { label: 'Amazon', value: 2000, display: '$2.0T', tone: 'muted' },
    ],
    orientation: 'horizontal',
    max: null,
  },
});
