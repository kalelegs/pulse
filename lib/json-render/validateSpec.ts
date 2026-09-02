import type { z } from 'zod';
import { jsonRenderCatalog } from '@/lib/json-render/catalog';
import { bindingIssues, propIssues, type TDraftElement } from '@/lib/json-render/specChecks';
import type { TJsonRenderSpec } from '@/lib/json-render/types';

/** Outcome of `parseAndValidateSpec`. `issues` are `key.path: message` lines a model can act on. */
export type TSpecValidation = { ok: true; spec: TJsonRenderSpec } | { ok: false; issues: string[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const fail = (...issues: string[]): TSpecValidation => ({ ok: false, issues });

/**
 * `props` and `on` arrive as a JSON object or a JSON string of one — models
 * emit both. A string that is not JSON, or JSON that is not an object, is an
 * issue the model can act on rather than an exception.
 */
const toPlainObject = (
  value: unknown,
  label: string,
): { object?: Record<string, unknown>; issue?: string } => {
  let parsed: unknown = value;

  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return { issue: `${label}: not valid JSON. Pass a JSON object or a JSON string of one.` };
    }
  }

  if (!isRecord(parsed)) {
    return {
      issue: `${label}: must be a JSON object, not ${Array.isArray(parsed) ? 'an array' : typeof parsed}.`,
    };
  }

  return { object: parsed };
};

/** Catalog issues in the same `path: message` shape as the per-element checks. */
const catalogIssues = (error: z.ZodError | undefined): string[] =>
  (error?.issues ?? []).map(
    (issue) => `${issue.path.map(String).join('.') || '(root)'}: ${issue.message}`,
  );

/**
 * One raw element — from the tool's flat array (`key` inside the entry) or from
 * a built spec's map (`key` is the map key) — normalised into a draft. Returns
 * issues instead of a draft when the envelope itself is wrong.
 */
const toDraft = (
  key: string,
  raw: Record<string, unknown>,
): { draft?: TDraftElement; issues: string[] } => {
  const issues: string[] = [];

  if (typeof raw.type !== 'string') {
    issues.push(`${key}.type: must be a block name.`);
  }

  const children = Array.isArray(raw.children) ? raw.children : raw.children == null ? [] : null;

  if (!children || children.some((child) => typeof child !== 'string')) {
    issues.push(`${key}.children: must be an array of element keys.`);
  }

  const props = toPlainObject(raw.props ?? {}, `${key}.props`);
  const on = raw.on == null ? {} : toPlainObject(raw.on, `${key}.on`);

  issues.push(...[props.issue, on.issue].filter((issue): issue is string => !!issue));

  if (issues.length || !props.object || !children) {
    return { issues };
  }

  return {
    issues,
    draft: {
      type: raw.type as string,
      props: props.object,
      children: children as string[],
      ...(on.object ? { on: on.object } : {}),
    },
  };
};

/**
 * Collects the elements into a null-prototype map. Keys are model-chosen, so
 * every lookup goes through `Object.hasOwn` — a key such as `"constructor"`
 * would otherwise hit `Object.prototype` and read as a duplicate.
 */
const collectElements = (
  raw: unknown,
): { elements: Record<string, TDraftElement>; issues: string[] } => {
  const elements: Record<string, TDraftElement> = Object.create(null);
  const issues: string[] = [];
  const entries: [string, unknown][] = Array.isArray(raw)
    ? raw.map((entry, index) => [
        isRecord(entry) && typeof entry.key === 'string' ? entry.key : `elements.${index}`,
        entry,
      ])
    : isRecord(raw)
      ? Object.entries(raw)
      : [];

  if (!Array.isArray(raw) && !isRecord(raw)) {
    return {
      elements,
      issues: ['elements: must be an array of elements or a key -> element map.'],
    };
  }

  for (const [key, entry] of entries) {
    if (!isRecord(entry)) {
      issues.push(`${key}: must be an object.`);
    } else if (Array.isArray(raw) && typeof entry.key !== 'string') {
      issues.push(`${key}.key: every element needs a string key.`);
    } else if (Object.hasOwn(elements, key)) {
      issues.push(`${key}: duplicate element key.`);
    } else {
      const { draft, issues: draftIssues } = toDraft(key, entry);
      issues.push(...draftIssues);

      if (draft) {
        elements[key] = draft;
      }
    }
  }

  return { elements, issues };
};

/**
 * Parses, normalises and validates a spec from either shape a spec arrives in:
 * the `render_ui` tool arguments (`elements` as a flat array with per-element
 * `key`, `props`/`on` as JSON objects or strings) or an already-built
 * `{ root, elements: {...}, state }` spec object.
 *
 * React-free and free of `'use client'`, so it is importable from a Server
 * Action as well as from the client-side tool. Every failure is a list of
 * `key.path: message` lines aimed at the model, never an exception.
 *
 * Checks, in order: element envelopes, root and child references,
 * `jsonRenderCatalog.validate()`, then each block's own props schema (omitted
 * nullable keys filled with null, unknown keys named, wrong types reported)
 * and every `on` binding against `blockActions`.
 */
export const parseAndValidateSpec = (input: unknown): TSpecValidation => {
  if (!isRecord(input)) {
    return fail('(root): must be an object with `root` and `elements`.');
  }

  if (typeof input.root !== 'string') {
    return fail('root: must be the key of the outermost element.');
  }

  const { elements, issues } = collectElements(input.elements);

  if (issues.length) {
    return fail(...issues);
  }

  if (!Object.hasOwn(elements, input.root)) {
    return fail(`root: "${input.root}" is not one of the element keys.`);
  }

  const missing = Object.values(elements).flatMap((element) =>
    element.children.filter((child) => !Object.hasOwn(elements, child)),
  );

  if (missing.length) {
    return fail(`children: these keys have no element: ${missing.join(', ')}.`);
  }

  const spec = {
    root: input.root,
    elements,
    ...(isRecord(input.state) ? { state: input.state } : {}),
  } as TJsonRenderSpec;
  const validation = jsonRenderCatalog.validate(spec);

  if (!validation.success) {
    return fail(...catalogIssues(validation.error));
  }

  const elementIssues = Object.entries(elements).flatMap(([key, element]) => [
    ...propIssues(key, element),
    ...bindingIssues(key, element.on),
  ]);

  return elementIssues.length ? fail(...elementIssues) : { ok: true, spec };
};
