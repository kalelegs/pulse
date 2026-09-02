import type { z } from 'zod';
import { blockActions, blockDefinitions, type TBlockName } from '@/lib/json-render/blocks';

/** One element of a model-authored spec, after `props` and `on` have been normalised to objects. */
export type TDraftElement = {
  type: string;
  props: Record<string, unknown>;
  children: string[];
  on?: Record<string, unknown>;
};

const ACTION_NAMES = Object.keys(blockActions).join(', ');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/** `path: message` lines from a Zod error, each prefixed with where in the spec it happened. */
const zodIssues = (prefix: string, error: z.ZodError): string[] =>
  error.issues.map((issue) => `${[prefix, ...issue.path.map(String)].join('.')}: ${issue.message}`);

/**
 * Every optional prop and action param is `.nullable()` — a required key that
 * accepts null — because the catalog's strict JSON schema cannot express
 * `.optional()`. A model that simply leaves `align` out would otherwise be
 * told "expected string, received undefined" for a key it never needed. Absent
 * keys whose schema accepts null are filled with null; a missing key that does
 * *not* accept null still fails, so the strictness that matters is unchanged.
 */
const withNullDefaults = (
  schema: z.ZodObject,
  value: Record<string, unknown>,
): Record<string, unknown> => {
  const filled = { ...value };

  for (const [key, field] of Object.entries(schema.shape)) {
    if (!Object.hasOwn(filled, key) && field.safeParse(null).success) {
      filled[key] = null;
    }
  }

  return filled;
};

/**
 * `z.object` strips keys it does not know, so a misnamed prop (`text` on a
 * KeyValueBlock) would vanish silently and render as a blank. Naming it is more
 * useful to a model that gets one retry than dropping it.
 */
const unknownKeyIssues = (
  prefix: string,
  schema: z.ZodObject,
  value: Record<string, unknown>,
): string[] =>
  Object.keys(value)
    .filter((key) => !Object.hasOwn(schema.shape, key))
    .map(
      (key) =>
        `${prefix}.${key}: unknown key; allowed keys are ${Object.keys(schema.shape).join(', ')}.`,
    );

/**
 * A wrong value in a key that accepts null is degraded to null — the block's
 * default — instead of failing the whole panel: an icon that is not in the
 * list, a tone that does not exist, a size that was guessed. Only top-level
 * keys are treated this way, and only when null is legal there; a wrong value
 * in a required key is still an error. Each degradation is logged so it can be
 * seen while tuning prompts, but the model is not asked to retry over cosmetics.
 */
const withNullForInvalid = (
  prefix: string,
  schema: z.ZodObject,
  value: Record<string, unknown>,
  error: z.ZodError,
): Record<string, unknown> => {
  const degraded = { ...value };

  for (const issue of error.issues) {
    const key = issue.path.length === 1 ? String(issue.path[0]) : undefined;
    const field = key === undefined ? undefined : schema.shape[key];
    if (key && field && degraded[key] !== null && field.safeParse(null).success) {
      console.warn(`[json-render] ${prefix}.${key}: ${issue.message}; using the default instead.`);
      degraded[key] = null;
    }
  }

  return degraded;
};

/** Fill, degrade, then check against one `z.object`; the result object is returned for the caller. */
const checkObject = (
  prefix: string,
  schema: z.ZodObject,
  value: Record<string, unknown>,
): { filled: Record<string, unknown>; issues: string[] } => {
  let filled = withNullDefaults(schema, value);
  let result = schema.safeParse(filled);

  if (!result.success) {
    filled = withNullForInvalid(prefix, schema, filled, result.error);
    result = schema.safeParse(filled);
  }

  return {
    filled,
    issues: [
      ...unknownKeyIssues(prefix, schema, filled),
      ...(result.success ? [] : zodIssues(prefix, result.error)),
    ],
  };
};

/**
 * Runs the block's own Zod props schema over the element's props — the check
 * `jsonRenderCatalog.validate()` does not perform. The catalog's schema types
 * `props` loosely, so without this a `TableBlock.columns` of `"Day,High"`
 * reaches the component and throws inside the error boundary after the model
 * has already been told the panel is on screen.
 *
 * Writes the null-filled props back onto the element, so the rendered spec
 * carries the same shape the schema accepted.
 *
 * @param key The element's key, used to prefix every issue.
 */
export const propIssues = (key: string, element: TDraftElement): string[] => {
  if (!Object.hasOwn(blockDefinitions, element.type)) {
    return [`${key}.type: "${element.type}" is not a block in the vocabulary.`];
  }

  const schema = blockDefinitions[element.type as TBlockName].props;
  const { filled, issues } = checkObject(`${key}.props`, schema, element.props);
  element.props = filled;

  return issues;
};

const bindingIssue = (path: string, binding: unknown): string[] => {
  if (!isRecord(binding) || typeof binding.action !== 'string') {
    return [`${path}: must be an object with a string "action".`];
  }

  if (!Object.hasOwn(blockActions, binding.action)) {
    return [`${path}.action: "${binding.action}" is not an action; use one of ${ACTION_NAMES}.`];
  }

  const { params } = blockActions[binding.action as keyof typeof blockActions];
  const { filled, issues } = checkObject(
    `${path}.params`,
    params,
    isRecord(binding.params) ? binding.params : {},
  );
  binding.params = filled;

  return issues;
};

/**
 * Checks every `on.<event>` binding names a catalog action and carries the
 * params that action declares. A binding may be one object or an array of them,
 * as json-render allows. Omitted nullable params are filled with null in place.
 *
 * @param key The element's key, used to prefix every issue.
 */
export const bindingIssues = (key: string, on: Record<string, unknown> | undefined): string[] =>
  Object.entries(on ?? {}).flatMap(([event, binding]) =>
    Array.isArray(binding)
      ? binding.flatMap((entry, index) => bindingIssue(`${key}.on.${event}.${index}`, entry))
      : bindingIssue(`${key}.on.${event}`, binding),
  );
