import type { ActionBinding, UIElement, VisibilityCondition } from '@json-render/core';
import type { z } from 'zod';
import { blockActions, type TBlockName, type TBlockProps } from '@/components/json-render/blocks';
import type { TJsonRenderSpec } from '@/lib/json-render/types';

/** A node in the readable, nested form used while authoring a spec. */
export type TSpecNode = {
  /** Optional stable key. Auto-derived from the block type when omitted. */
  key?: string;
  type: TBlockName;
  props: Record<string, unknown>;
  children?: TSpecNode[];
  slots?: Record<string, TSpecNode[]>;
  visible?: VisibilityCondition;
  on?: Record<string, ActionBinding | ActionBinding[]>;
  repeat?: UIElement['repeat'];
};

/** Everything on an element other than `type` and `props`. */
export type TSpecNodeOptions = Omit<TSpecNode, 'type' | 'props'>;

/** Names of the catalog actions a builder may bind. */
export type TActionName = keyof typeof blockActions;

type TActionParams<TName extends TActionName> = z.infer<(typeof blockActions)[TName]['params']>;

/**
 * Declare one element. Props are checked against the block's own Zod schema, so
 * a typo in a prop name or an unknown block type fails to compile.
 *
 * @example
 * block('MetricBlock', { label: 'Now', value: '68', unit: '°F', ... })
 */
export const block = <TName extends TBlockName>(
  type: TName,
  props: TBlockProps<TName>,
  options: TSpecNodeOptions = {},
): TSpecNode => ({ type, props: props as Record<string, unknown>, ...options });

/**
 * Build a type-checked action binding for an element's `on` map.
 *
 * @example
 * block('SuggestionChip', { ... }, { on: { press: bind('suggest', { text: '…', value: null }) } })
 */
export const bind = <TName extends TActionName>(
  name: TName,
  params: TActionParams<TName>,
): ActionBinding => ({ action: name, params: params as ActionBinding['params'] });

const toKeyPrefix = (type: string) => type.replace(/Block$/, '').toLowerCase();

/**
 * Flatten a nested node tree into the map-based `Spec` the renderer expects.
 *
 * Written by hand rather than via `flatToTree` from `@json-render/react`:
 * `flatToTree` rebuilds each element from scratch and keeps only `type`,
 * `props`, `children` and `visible`, silently dropping `on`, `slots` and
 * `repeat` — which would make every action binding in a hand-built spec vanish.
 * It also requires callers to pre-assign `key`/`parentKey` on a flat array,
 * which is exactly the error-prone bookkeeping this builder exists to remove.
 */
export const buildSpec = (root: TSpecNode, state?: Record<string, unknown>): TJsonRenderSpec => {
  const elements: Record<string, UIElement> = {};
  const counters = new Map<string, number>();

  const nextKey = (node: TSpecNode) => {
    if (node.key) {
      return node.key;
    }

    const prefix = toKeyPrefix(node.type);
    const next = (counters.get(prefix) ?? 0) + 1;
    counters.set(prefix, next);

    return `${prefix}-${next}`;
  };

  const visit = (node: TSpecNode): string => {
    const key = nextKey(node);

    // `children` is required by the catalog schema, so always emit an array.
    const element: UIElement = {
      type: node.type,
      props: node.props,
      children: (node.children ?? []).map(visit),
    };

    if (node.slots) {
      element.slots = Object.fromEntries(
        Object.entries(node.slots).map(([slot, nodes]) => [slot, nodes.map(visit)]),
      );
    }

    if (node.visible !== undefined) {
      element.visible = node.visible;
    }

    if (node.on) {
      element.on = node.on;
    }

    if (node.repeat) {
      element.repeat = node.repeat;
    }

    elements[key] = element;

    return key;
  };

  const rootKey = visit(root);

  return state ? { root: rootKey, elements, state } : { root: rootKey, elements };
};
