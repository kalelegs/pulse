import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react/schema';
import { blockActions, blockDefinitions } from '@/components/json-render/blocks';

/**
 * The json-render catalog: the machine-readable description of every block and
 * action an agent may emit.
 *
 * **This module must never import React components.** It is the contract shared
 * with the model — agent instructions call `jsonRenderCatalog.prompt()`, tool
 * definitions call `jsonRenderCatalog.jsonSchema({ strict: true })`, and tool
 * handlers call `jsonRenderCatalog.validate()`. Keeping it free of `next/image`,
 * shadcn and `'use client'` means it can be imported from server code and from
 * plain Node contexts.
 *
 * That is also why `schema` comes from the `@json-render/react/schema` subpath
 * rather than the package barrel: the barrel evaluates `createContext()` at
 * module scope, and React's `react-server` build has no `createContext`, so
 * importing it would break this module in every RSC context.
 *
 * The React half lives in `lib/json-render/registry.tsx`.
 */
export const jsonRenderCatalog = defineCatalog(schema, {
  components: blockDefinitions,
  actions: blockActions,
});

/** Name of every block in the catalog, as emitted in `element.type`. */
export const jsonRenderComponentNames = jsonRenderCatalog.componentNames;

/** Name of every action in the catalog, as emitted in `element.on.<event>.action`. */
export const jsonRenderActionNames = jsonRenderCatalog.actionNames;
