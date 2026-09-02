import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';

export const imageBlockDefinition = defineBlock({
  props: z.object({
    src: z.string(),
    alt: z.string().nullable(),
    caption: z.string().nullable(),
    width: z.number().nullable(),
    height: z.number().nullable(),
  }),
  slots: [],
  description:
    'Remote image with an optional caption. `src` must be a fully qualified https URL. Always provide `alt`; broken or blocked URLs degrade to a muted placeholder rather than a broken image.',
  example: {
    src: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?w=800',
    alt: 'Sunlit clouds over a city skyline',
    caption: 'The skyline from the rooftop bar',
    width: 480,
    height: 270,
  },
});
