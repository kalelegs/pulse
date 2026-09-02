import { z } from 'zod';
import { defineBlock } from '@/lib/json-render/blocks/defineBlock';

export const codeBlockDefinition = defineBlock({
  props: z.object({
    code: z.string(),
    /** Shown as a label only; nothing is syntax-highlighted. */
    language: z.string().nullable(),
    caption: z.string().nullable(),
    /** Wrap long lines instead of scrolling horizontally. */
    wrap: z.boolean().nullable(),
  }),
  slots: [],
  description:
    'Preformatted monospace text — a command to run, a snippet, a config excerpt, an identifier, an address to copy. Whitespace and line breaks are preserved exactly. Never use it for prose; that is TextBlock.',
  example: {
    code: 'bun add @json-render/react\nbun run dev',
    language: 'bash',
    caption: 'Run from the project root',
    wrap: false,
  },
});
