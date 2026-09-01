import { z } from 'zod';
import { defineBlock } from '@/components/json-render/blocks/defineBlock';

export const labelBlockDefinition = defineBlock({
  props: z.object({
    text: z.string(),
    subtle: z.boolean().nullable(),
  }),
  slots: [],
  description:
    'Short caption or field label — a few words, never a sentence. Set `subtle` for de-emphasised helper text. Use TextBlock for prose and HeadingBlock for section titles.',
  example: { text: 'Wind', subtle: true },
});
