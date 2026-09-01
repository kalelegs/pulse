import { z } from 'zod';
import { defineBlock } from '@/components/json-render/blocks/defineBlock';
import { ICON_NAMES } from '@/components/json-render/blocks/iconNames';

export const badgeBlockDefinition = defineBlock({
  props: z.object({
    text: z.string(),
    tone: z.enum(['default', 'secondary', 'outline', 'destructive']).nullable(),
    icon: z.enum(ICON_NAMES).nullable(),
  }),
  slots: [],
  description:
    'Small non-interactive status pill — a category, severity or state label. Use SuggestionChip instead when pressing it should do something.',
  example: { text: 'Air quality: good', tone: 'secondary', icon: 'leaf' },
});
