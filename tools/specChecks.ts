'use client';

import type { z } from 'zod';
import { blockActions, blockDefinitions, type TBlockName } from '@/lib/json-render/blocks';

/** One element of a model-authored spec, after its JSON strings have been parsed. */
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
 * Runs the block's own Zod props schema over the element's props — the check
 * `jsonRenderCatalog.validate()` does not perform. The catalog's schema types
 * `props` loosely, so without this a `TableBlock.columns` of `"Day,High"`
 * reaches the component and throws inside the error boundary after the model
 * has already been told the panel is on screen.
 *
 * @param key The element's key, used to prefix every issue.
 */
export const propIssues = (key: string, element: TDraftElement): string[] => {
  if (!Object.hasOwn(blockDefinitions, element.type)) {
    return [`${key}.type: "${element.type}" is not a block in the vocabulary.`];
  }

  const result = blockDefinitions[element.type as TBlockName].props.safeParse(element.props);

  return result.success ? [] : zodIssues(`${key}.props`, result.error);
};

const bindingIssue = (path: string, binding: unknown): string[] => {
  if (!isRecord(binding) || typeof binding.action !== 'string') {
    return [`${path}: must be an object with a string "action".`];
  }

  if (!Object.hasOwn(blockActions, binding.action)) {
    return [`${path}.action: "${binding.action}" is not an action; use one of ${ACTION_NAMES}.`];
  }

  const { params } = blockActions[binding.action as keyof typeof blockActions];
  const result = params.safeParse(binding.params ?? {});

  return result.success ? [] : zodIssues(`${path}.params`, result.error);
};

/**
 * Checks every `on.<event>` binding names a catalog action and carries the
 * params that action declares. A binding may be one object or an array of them,
 * as json-render allows.
 *
 * @param key The element's key, used to prefix every issue.
 */
export const bindingIssues = (key: string, on: Record<string, unknown> | undefined): string[] =>
  Object.entries(on ?? {}).flatMap(([event, binding]) =>
    Array.isArray(binding)
      ? binding.flatMap((entry, index) => bindingIssue(`${key}.on.${event}.${index}`, entry))
      : bindingIssue(`${key}.on.${event}`, binding),
  );
