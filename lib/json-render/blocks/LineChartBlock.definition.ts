import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';
import { dataToneEnum } from '@/lib/json-render/blocks/tones';

export const lineChartBlockDefinition = defineBlock({
  props: z.object({
    series: z.array(
      z.object({
        label: z.string(),
        values: z.array(z.number()),
        tone: dataToneEnum,
      }),
    ),
    /** One label per point, aligned with `values`; use "" for points that get no label. */
    xLabels: z.array(z.string()).nullable(),
    /** Display unit for the y axis, e.g. "$" or "%". Prefix when it is a currency symbol. */
    unit: z.string().nullable(),
    size: z.enum(['sm', 'md', 'lg']).nullable(),
    showArea: z.boolean().nullable(),
  }),
  slots: [],
  description:
    'Line chart of one or more numeric series over an ordered axis — a value over time, readings by hour, any trend. `sm` is an axis-less sparkline to sit beside a MetricBlock; `md` and `lg` add min/max and first/last labels. Every series should have the same number of values.',
  example: {
    series: [{ label: 'Visitors', values: [820, 940, 910, 1180, 1260], tone: 'primary' }],
    xLabels: ['Mon', '', 'Wed', '', 'Fri'],
    unit: null,
    size: 'md',
    showArea: true,
  },
});
