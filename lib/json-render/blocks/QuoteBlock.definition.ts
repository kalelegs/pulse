import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';

export const quoteBlockDefinition = defineBlock({
  props: z.object({
    text: z.string(),
    /** Who said it. */
    attribution: z.string().nullable(),
    /** Where it was said or published, e.g. a publication or an event. */
    source: z.string().nullable(),
    /** Optional absolute http(s) URL for the source. */
    href: z.string().nullable(),
  }),
  slots: [],
  description:
    'Pull quote or excerpt with attribution — an analyst comment, a review, a line from an article, a testimonial. Use it for words someone else said; use CalloutBlock for your own notes.',
  example: {
    text: 'Services growth continues to offset softer hardware demand.',
    attribution: 'Morgan Stanley analyst note',
    source: 'Reuters',
    href: 'https://www.reuters.com/',
  },
});
