import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';

export const stepperBlockDefinition = defineBlock({
  props: z.object({
    steps: z.array(
      z.object({
        title: z.string(),
        description: z.string().nullable(),
        status: z.enum(['done', 'current', 'upcoming', 'blocked']).nullable(),
      }),
    ),
    orientation: z.enum(['vertical', 'horizontal']).nullable(),
  }),
  slots: [],
  description:
    'Ordered steps of a process, each with a status — an onboarding flow, an order being fulfilled, a task with stages, instructions to follow. Vertical is the default and carries descriptions; horizontal fits three to five short titles in a row. Use TimelineBlock for dated history and ListBlock when nothing is in progress.',
  example: {
    steps: [
      { title: 'Account created', description: null, status: 'done' },
      { title: 'Verify email', description: 'Check your inbox for the link.', status: 'current' },
      { title: 'Invite your team', description: null, status: 'upcoming' },
    ],
    orientation: 'vertical',
  },
});
