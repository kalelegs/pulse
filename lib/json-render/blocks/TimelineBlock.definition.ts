import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';
import { iconEnum } from '@/lib/json-render/iconNames';
import { dataToneEnum } from '@/lib/json-render/blocks/tones';

export const timelineBlockDefinition = defineBlock({
  props: z.object({
    items: z.array(
      z.object({
        title: z.string(),
        description: z.string().nullable(),
        /** Pre-formatted time or date label, e.g. "2h ago" or "Mar 4". */
        time: z.string().nullable(),
        /** Optional absolute http(s) URL; the title becomes a link. Other schemes render as text. */
        href: z.string().nullable(),
        icon: iconEnum,
        tone: dataToneEnum,
      }),
    ),
  }),
  slots: [],
  description:
    'Vertical sequence of dated entries — news headlines, order history, project milestones, steps that already happened. Newest first unless the story reads better in order. Use ListBlock when the entries have no time dimension.',
  example: {
    items: [
      {
        title: 'Order shipped',
        description: 'Left the warehouse; tracking is live.',
        time: '2h ago',
        href: 'https://example.com/track/1234',
        icon: 'bag',
        tone: 'primary',
      },
      {
        title: 'Order confirmed',
        description: null,
        time: 'Yesterday',
        href: null,
        icon: 'check-circle',
        tone: 'success',
      },
    ],
  },
});
