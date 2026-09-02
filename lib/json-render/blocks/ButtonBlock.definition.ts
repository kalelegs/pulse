import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';
import { iconEnum } from '@/lib/json-render/iconNames';

export const buttonBlockDefinition = defineBlock({
  props: z.object({
    text: z.string(),
    variant: z.enum(['primary', 'secondary', 'outline', 'ghost', 'destructive']).nullable(),
    size: z.enum(['sm', 'md']).nullable(),
    icon: iconEnum,
  }),
  slots: [],
  description:
    'Generic pressable control that fires whatever action is bound on the ELEMENT with on.press — `select` to pick one option out of several, `suggest` to send a follow-up prompt. Use SuggestionChipBlock for conversational follow-ups and ButtonBlock for an explicit choice or a primary action. Without a binding it renders disabled.',
  example: { text: 'Choose this plan', variant: 'primary', size: 'md', icon: 'check' },
});
