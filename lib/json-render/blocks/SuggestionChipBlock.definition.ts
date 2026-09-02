import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';
import { iconEnum } from '@/lib/json-render/iconNames';

export const suggestionChipBlockDefinition = defineBlock({
  props: z.object({
    text: z.string(),
    hint: z.string().nullable(),
    tone: z.enum(['default', 'secondary', 'outline']).nullable(),
    icon: iconEnum,
  }),
  slots: [],
  description:
    'Pressable pill offering the user a follow-up. Bind it on the ELEMENT (not in props) with on.press, e.g. "on": { "press": { "action": "suggest", "params": { "text": "Compare the other two" } } }. Without an on.press binding it renders as a static pill.',
  example: {
    text: 'Compare the other two',
    hint: 'Sends this as your next message',
    tone: 'outline',
    icon: 'sparkles',
  },
});
