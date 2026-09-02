import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';
import { iconEnum } from '@/lib/json-render/iconNames';
import { isSafeHttpUrl } from '@/lib/json-render/blocks/safeUrl';

export const linkBlockDefinition = defineBlock({
  props: z.object({
    /**
     * Defence in depth only — `LinkBlock` re-checks at render time, because
     * unvalidated specs are rendered while streaming. `.refine` keeps the Zod
     * type name `string`, so the generated tool JSON Schema is unchanged.
     */
    href: z.string().refine(isSafeHttpUrl, {
      message: 'href must be an absolute http:// or https:// URL',
    }),
    text: z.string(),
    newTab: z.boolean().nullable(),
    icon: iconEnum,
  }),
  slots: [],
  description:
    'Hyperlink out to an external URL. `href` must be an absolute http:// or https:// URL; any other scheme renders as plain text. Use it only for real navigable destinations; to offer the user a follow-up prompt inside the conversation use SuggestionChipBlock instead.',
  example: {
    href: 'https://example.com/guide',
    text: 'Read the full guide',
    newTab: true,
    icon: 'external-link',
  },
});
