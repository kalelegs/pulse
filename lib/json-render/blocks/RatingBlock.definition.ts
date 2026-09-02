import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';

export const ratingBlockDefinition = defineBlock({
  props: z.object({
    /** Filled symbols out of `max`; fractions render as partial fills. */
    value: z.number().min(0),
    max: z.number().int().min(1).max(10).nullable(),
    label: z.string().nullable(),
    /** Pre-formatted figure shown beside the symbols, e.g. "4.6 (1,203 reviews)". */
    valueLabel: z.string().nullable(),
    size: z.enum(['sm', 'md']).nullable(),
  }),
  slots: [],
  description:
    'Score drawn as filled symbols out of `max` (default 5) — a review rating, a priority, a difficulty, a confidence level. `value` may be fractional. Use ProgressBlock for a percentage and MetricBlock for a bare number.',
  example: {
    value: 4.5,
    max: 5,
    label: 'Guest rating',
    valueLabel: '4.5 (312 reviews)',
    size: 'md',
  },
});
