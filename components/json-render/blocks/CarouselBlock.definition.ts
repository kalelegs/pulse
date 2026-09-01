import { z } from 'zod';
import { defineBlock } from '@/components/json-render/blocks/defineBlock';

export const carouselBlockDefinition = defineBlock({
  props: z.object({
    title: z.string().nullable(),
    itemWidth: z.enum(['sm', 'md', 'lg']).nullable(),
  }),
  slots: ['default'],
  description:
    'Horizontally scrolling strip with snap points. Use it for a row of peer items that will not fit across the surface — hourly or daily forecast cells, product tiles, option cards. Use `sm` itemWidth for compact cells.',
  example: { title: 'Next 7 days', itemWidth: 'sm' },
});
