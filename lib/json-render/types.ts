import type { Spec } from '@json-render/react';

/**
 * A json-render UI spec: a flat, key-addressed element map produced by an agent.
 *
 * ```jsonc
 * {
 *   "root": "root",
 *   "elements": {
 *     "root":  { "type": "CardBlock", "props": { "title": "Hi" }, "children": ["t1"] },
 *     "t1":    { "type": "TextBlock", "props": { "text": "Hello" }, "children": [] }
 *   },
 *   "state": {}
 * }
 * ```
 *
 * This module is type-only and free of React and of `'use client'`, so it can be
 * imported from anywhere — stores, server code, tool definitions.
 */
export type TJsonRenderSpec = Spec;

export type {
  TBlockComponents,
  TBlockDefinition,
  TBlockName,
  TBlockProps,
  TIconName,
} from '@/components/json-render/blocks';

/**
 * Payload handed to `JsonRenderSurface`'s `onAction` when a block fires an
 * action such as a suggestion chip press.
 */
export type TJsonRenderAction = (actionName: string, params?: Record<string, unknown>) => void;
