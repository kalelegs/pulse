import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';
import { iconEnum } from '@/lib/json-render/iconNames';

export const headingBlockDefinition = defineBlock({
  props: z.object({
    text: z.string(),
    level: z.enum(['1', '2', '3']).nullable(),
    subtitle: z.string().nullable(),
    icon: iconEnum,
  }),
  slots: [],
  description:
    'Section title with an optional subtitle and leading icon. Level 1 is the title of a whole surface, 2 is a section, 3 is a sub-section. Do not use it for body copy.',
  example: {
    text: 'Your options',
    level: '2',
    subtitle: 'Three ways to get there',
    icon: 'compass',
  },
});
