import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';

export const carouselBlockDefinition = defineBlock({
  props: z.object({
    title: z.string().nullable(),
    itemWidth: z.enum(['sm', 'md', 'lg']).nullable(),
  }),
  slots: ['default'],
  description:
    'Horizontally scrolling strip with snap points. Use it for a row of peer items that will not fit across the surface — day-by-day cells, product tiles, option cards. Any block can be a slide, including CardBlock. Use `sm` itemWidth for compact cells.',
  example: { title: 'Nearby options', itemWidth: 'md' },
});
