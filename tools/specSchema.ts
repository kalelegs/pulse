'use client';

import { z } from 'zod';
import { jsonRenderCatalog } from '@/lib/json-render/catalog';
import type { TJsonRenderSpec } from '@/lib/json-render/types';

/**
 * Tool parameters for a model-authored spec.
 *
 * Hand-written rather than derived from `jsonRenderCatalog.jsonSchema()`: the
 * catalog's Zod-to-JSON-Schema conversion cannot expand `z.record`, so in strict
 * mode `elements` collapses to `{ type: "object", properties: {},
 * additionalProperties: false }` — an opaque blob the model cannot fill in.
 *
 * Two deliberate shape changes make this survive OpenAI's own strict-mode
 * conversion, which rejects open-ended maps for the same reason:
 *
 * - `elements` is a flat **array** carrying its own `key`, converted to the map
 *   form in `toJsonRenderSpec`. Models also emit flat arrays more reliably than
 *   they emit keyed objects.
 * - `props` and `on` are **JSON strings**. Their shape genuinely varies per
 *   block — `TableBlock.rows` is a string matrix, `GridBlock.columns` a number —
 *   and no closed object schema can cover that. The strings are parsed and then
 *   checked against the real catalog schema, so nothing is trusted on the way in.
 */
export const uiSpecParameters = z.object({
  root: z.string().describe('Key of the outermost element. Usually a CardBlock or StackBlock.'),
  elements: z
    .array(
      z.object({
        key: z.string().describe('Unique id for this element, referenced by parents.'),
        type: z.string().describe('Block name, exactly as spelled in the block vocabulary.'),
        props: z
          .string()
          .describe('JSON object of this block\'s props, e.g. {"text":"Hi","tone":null}.'),
        children: z
          .array(z.string())
          .describe('Keys of child elements in render order. Empty array for leaf blocks.'),
        on: z
          .string()
          .nullable()
          .describe(
            'JSON action bindings, e.g. {"press":{"action":"suggest","params":{"text":"...","value":null}}}. Null when the element is not interactive.',
          ),
      }),
    )
    .describe('Every element in the tree, in any order, each with a unique key.'),
});

/** The shape `render_ui` receives once `@openai/agents` has parsed its arguments. */
export type TUiSpecParameters = z.infer<typeof uiSpecParameters>;

/** Conversion outcome. `error` is written for the model to read and retry from. */
export type TSpecConversionResult =
  { ok: true; spec: TJsonRenderSpec } | { ok: false; error: string };

const parseJsonObject = (value: string, label: string): Record<string, unknown> => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object.`);
  }

  return parsed as Record<string, unknown>;
};

/** Renders the first few Zod issues as one line each, so the model can act on them. */
const describeIssues = (error: z.ZodError | undefined): string =>
  (error?.issues ?? [])
    .slice(0, 8)
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ') || 'the spec did not match the block schemas';

/**
 * Turns the flat array the model emitted into a validated `TJsonRenderSpec`.
 *
 * Every failure returns prose aimed at the model rather than throwing, because
 * the model's next move is to fix the spec and call the tool again.
 *
 * @param input Parsed `render_ui` arguments.
 */
export const toJsonRenderSpec = (input: TUiSpecParameters): TSpecConversionResult => {
  const elements: Record<string, unknown> = {};

  for (const element of input.elements) {
    if (elements[element.key]) {
      return { ok: false, error: `Duplicate element key "${element.key}".` };
    }

    try {
      elements[element.key] = {
        type: element.type,
        props: parseJsonObject(element.props, `props of "${element.key}"`),
        children: element.children,
        ...(element.on ? { on: parseJsonObject(element.on, `on of "${element.key}"`) } : {}),
      };
    } catch (error) {
      return { ok: false, error: `The ${(error as Error).message}` };
    }
  }

  if (!elements[input.root]) {
    return { ok: false, error: `Root key "${input.root}" is not one of the elements.` };
  }

  const missing = input.elements.flatMap((element) =>
    element.children.filter((child) => !elements[child]),
  );

  if (missing.length) {
    return { ok: false, error: `These child keys have no element: ${missing.join(', ')}.` };
  }

  const spec = { root: input.root, elements } as TJsonRenderSpec;
  const validation = jsonRenderCatalog.validate(spec);

  if (!validation.success) {
    return { ok: false, error: describeIssues(validation.error) };
  }

  return { ok: true, spec };
};
