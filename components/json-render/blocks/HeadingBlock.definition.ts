import { z } from 'zod';
import { defineBlock } from '@/components/json-render/blocks/defineBlock';
import { ICON_NAMES } from '@/components/json-render/blocks/iconNames';

export const headingBlockDefinition = defineBlock({
  props: z.object({
    text: z.string(),
    level: z.enum(['1', '2', '3']).nullable(),
    subtitle: z.string().nullable(),
    icon: z.enum(ICON_NAMES).nullable(),
  }),
  slots: [],
  description:
    'Section title with an optional subtitle and leading icon. Level 1 is the title of a whole surface, 2 is a section, 3 is a sub-section. Do not use it for body copy.',
  example: {
    text: 'San Francisco',
    level: '1',
    subtitle: 'Updated 2 minutes ago',
    icon: 'location',
  },
});
