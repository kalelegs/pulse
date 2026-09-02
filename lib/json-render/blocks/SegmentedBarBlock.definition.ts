import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';
import { dataToneEnum } from '@/lib/json-render/blocks/tones';

export const segmentedBarBlockDefinition = defineBlock({
  props: z.object({
    segments: z.array(
      z.object({
        label: z.string(),
        value: z.number(),
        tone: dataToneEnum,
      }),
    ),
    showLegend: z.boolean().nullable(),
    /** What the legend prints next to each label: the segment's share, or its raw value. */
    format: z.enum(['percent', 'value']).nullable(),
    unit: z.string().nullable(),
  }),
  slots: [],
  description:
    'Single stacked bar showing how a whole splits into parts — votes by option, a budget by category, storage used against free, survey answers. Segment widths are proportional to `value`; the legend lists each part.',
  example: {
    segments: [
      { label: 'Yes', value: 24, tone: 'success' },
      { label: 'Undecided', value: 9, tone: 'warning' },
      { label: 'No', value: 2, tone: 'destructive' },
    ],
    showLegend: true,
    format: 'value',
    unit: null,
  },
});
