import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';
import { iconEnum } from '@/lib/json-render/iconNames';

export const badgeBlockDefinition = defineBlock({
  props: z.object({
    text: z.string(),
    tone: z.enum(['default', 'secondary', 'outline', 'destructive']).nullable(),
    icon: iconEnum,
  }),
  slots: [],
  description:
    'Small non-interactive status pill — a category, severity or state label. Use SuggestionChipBlock instead when pressing it should do something.',
  example: { text: 'Air quality: good', tone: 'secondary', icon: 'leaf' },
});
