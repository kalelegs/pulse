import { z } from 'zod';
import { defineBlock } from '@/components/json-render/blocks/defineBlock';
import { ICON_NAMES } from '@/components/json-render/blocks/iconNames';

export const keyValueBlockDefinition = defineBlock({
  props: z.object({
    label: z.string(),
    value: z.string(),
    icon: z.enum(ICON_NAMES).nullable(),
  }),
  slots: [],
  description:
    'One labelled fact rendered as a label/value pair. Stack several inside a StackBlock or GridBlock to build a detail or stats list. Use MetricBlock instead when one number should dominate.',
  example: { label: 'Humidity', value: '62%', icon: 'humidity' },
});
