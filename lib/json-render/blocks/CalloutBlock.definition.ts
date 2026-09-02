import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';
import { iconEnum } from '@/lib/json-render/iconNames';

export const calloutBlockDefinition = defineBlock({
  props: z.object({
    title: z.string().nullable(),
    text: z.string(),
    tone: z.enum(['info', 'success', 'warning', 'destructive', 'muted']).nullable(),
    icon: iconEnum,
  }),
  slots: ['default'],
  description:
    'Short highlighted note set apart from the surrounding content — a caveat, a disclaimer, a tip, a warning. One or two sentences; use TextBlock for ordinary prose. Children (usually none) render beneath the text, so a caveat can carry a LinkBlock or a SuggestionChipBlock.',
  example: {
    title: 'Heads up',
    text: 'Availability was checked a few minutes ago and can change before you book.',
    tone: 'warning',
    icon: 'warning',
  },
});
