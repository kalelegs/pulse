import type { z } from 'zod';

/**
 * Catalog-side description of a single json-render block.
 *
 * This mirrors the component entry shape required by `@json-render/react`'s
 * `schema` (`{ props, slots, description, example }`). It is intentionally
 * React-free so the catalog can be imported from server code, agent
 * instructions and tool definitions without pulling in the component tree.
 */
export type TBlockDefinition<TProps extends z.ZodObject = z.ZodObject> = {
  /** Zod schema for the block props. Optionals MUST use `.nullable()`, never `.optional()`. */
  props: TProps;
  /** `['default']` when the block renders children, `[]` for leaf blocks, or named slots. */
  slots: string[];
  /** One or two sentences written for an LLM: what the block is and when to reach for it. */
  description: string;
  /** Realistic prop values. Feeds `catalog.prompt()` few-shot examples, so keep it plausible. */
  example: z.infer<TProps>;
};

/**
 * Identity helper that pins a block definition to the exact catalog entry shape
 * while preserving the concrete Zod type, so `z.infer` still works downstream.
 */
export const defineBlock = <TProps extends z.ZodObject>(
  definition: TBlockDefinition<TProps>,
): TBlockDefinition<TProps> => definition;
