'use client';

import { z } from 'zod';
import type { TJsonRenderSpec } from '@/lib/json-render/types';
import { parseAndValidateSpec } from '@/lib/json-render/validateSpec';

/**
 * A JSON object, or a JSON string encoding one. Models emit both — a chip's
 * `on` binding arrives as a literal object at least as often as a string — and
 * rejecting one shape at the SDK layer produced an opaque "Invalid JSON input
 * for tool" the model could not act on.
 *
 * `z.looseObject({})` rather than `z.record(...)`: the SDK's strict-mode
 * conversion refuses a record (it cannot close it with `additionalProperties:
 * false`) but accepts a loose object, which it serialises as an empty closed
 * object. That branch says nothing except "an object goes here", so the property
 * descriptions carry the real contract; the parser accepts any object
 * regardless. The realtime transport forwards `parameters` verbatim, with no
 * strict grammar, so the description is what the model actually reads.
 */
const jsonObjectOrString = z.union([z.string(), z.looseObject({})]);

/**
 * Tool parameters for a model-authored spec.
 *
 * Hand-written rather than derived from `jsonRenderCatalog.jsonSchema()`: the
 * catalog's Zod-to-JSON-Schema conversion cannot expand `z.record`, so in strict
 * mode `elements` collapses to `{ type: "object", properties: {},
 * additionalProperties: false }` — an opaque blob the model cannot fill in.
 *
 * Two deliberate shape choices make this survive OpenAI's own strict-mode
 * conversion, which rejects open-ended maps for the same reason:
 *
 * - `elements` is a flat **array** carrying its own `key`; models emit flat
 *   arrays more reliably than keyed objects.
 * - `props` and `on` are a **JSON object or a JSON string** of one. Their shape
 *   genuinely varies per block — `TableBlock.rows` is a string matrix,
 *   `GridBlock.columns` a number — and no closed object schema can cover that.
 *
 * Nothing here is trusted: `lib/json-render/validateSpec.ts` normalises both
 * shapes and runs the envelope, per-block props and action-binding checks.
 */
export const uiSpecParameters = z.object({
  root: z.string().describe('Key of the outermost element. Usually a CardBlock or StackBlock.'),
  elements: z
    .array(
      z.object({
        key: z.string().describe('Unique id for this element, referenced by parents.'),
        type: z.string().describe('Block name, exactly as spelled in the block vocabulary.'),
        props: jsonObjectOrString.describe(
          'This block\'s props as a JSON object, e.g. {"text":"Hi","tone":null}. A JSON string of that object is accepted too. Keys you omit are treated as null.',
        ),
        children: z
          .array(z.string())
          .describe('Keys of child elements in render order. Empty array for leaf blocks.'),
        on: jsonObjectOrString
          .nullable()
          .describe(
            'Action bindings as a JSON object, e.g. {"press":{"action":"suggest","params":{"text":"..."}}}. A JSON string of that object is accepted too. Null when the element is not interactive.',
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

/**
 * The thin `render_ui` adapter over `parseAndValidateSpec`: the first few
 * issues, one line each, folded into a single sentence the tool returns.
 *
 * @param input Parsed `render_ui` arguments.
 */
export const toJsonRenderSpec = (input: TUiSpecParameters): TSpecConversionResult => {
  const result = parseAndValidateSpec(input);

  return result.ok
    ? result
    : { ok: false, error: result.issues.slice(0, 8).join('; ') || 'the spec did not validate' };
};
