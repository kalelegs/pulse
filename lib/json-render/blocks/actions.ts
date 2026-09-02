import { z } from 'zod';

/**
 * Catalog action vocabulary.
 *
 * Actions are declared here (React-free) and dispatched at runtime by
 * `JsonRenderSurface`, which forwards every fired action to its `onAction`
 * prop. Elements bind them with a top-level `on` field, e.g.
 * `"on": { "press": { "action": "suggest", "params": { "text": "..." } } }`.
 */
export const blockActions = {
  suggest: {
    params: z.object({
      text: z.string(),
      value: z.string().nullable(),
    }),
    description:
      'The user picked a follow-up suggestion. `text` is the prompt to send back to the assistant on their behalf. Bind this to on.press of a SuggestionChip.',
  },
  select: {
    params: z.object({
      value: z.string(),
      label: z.string().nullable(),
    }),
    description:
      'The user chose one option out of several. `value` is the machine-readable identifier of the choice, `label` its display text.',
  },
};
