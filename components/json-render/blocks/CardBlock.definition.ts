import { z } from 'zod';
import { defineBlock } from '@/components/json-render/blocks/defineBlock';
import { ICON_NAMES } from '@/components/json-render/blocks/iconNames';

export const cardBlockDefinition = defineBlock({
  props: z.object({
    title: z.string().nullable(),
    description: z.string().nullable(),
    icon: z.enum(ICON_NAMES).nullable(),
    tone: z.enum(['default', 'muted', 'accent']).nullable(),
  }),
  slots: ['default'],
  description:
    'Bordered surface that groups related content under an optional title, description and icon. This is the top-level container for most standalone answers; nest StackBlock/GridBlock inside it for layout.',
  example: {
    title: 'San Francisco',
    description: 'Partly cloudy · Updated just now',
    icon: 'cloudy',
    tone: 'default',
  },
});
