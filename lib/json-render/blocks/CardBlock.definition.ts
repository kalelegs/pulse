import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';
import { iconEnum } from '@/lib/json-render/iconNames';

export const cardBlockDefinition = defineBlock({
  props: z.object({
    title: z.string().nullable(),
    description: z.string().nullable(),
    icon: iconEnum,
    tone: z.enum(['default', 'muted', 'accent']).nullable(),
  }),
  slots: ['default'],
  description:
    'Bordered surface that groups related content under an optional title, description and icon. This is the top-level container for most standalone answers; nest StackBlock/GridBlock inside it for layout.',
  example: {
    title: 'Trip summary',
    description: '3 nights · 2 travellers',
    icon: 'calendar',
    tone: 'default',
  },
});
