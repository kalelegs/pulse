import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react/schema';
import { blockActions, blockDefinitions } from '@/lib/json-render/blocks';

/**
 * The json-render catalog: the machine-readable description of every block and
 * action an agent may emit.
 *
 * **This module must never import React components.** It exists so that
 * `jsonRenderCatalog.validate()` and the block vocabulary behind it stay
 * importable from server code and plain Node contexts: `tools/specSchema.ts`
 * validates model-authored specs with it and `JsonRenderSurface` re-checks
 * every spec before rendering. Keeping it free of `next/image`, shadcn and
 * `'use client'` is what makes that possible.
 *
 * Neither `prompt()` nor `jsonSchema()` is used. The prompt is ~26 KB and
 * teaches a JSONL-patch protocol that does not apply here, and the JSON schema
 * cannot express the `elements` map under strict mode — `tools/README.md` and
 * `agents/README.md` explain what is used instead.
 *
 * That is also why `schema` comes from the `@json-render/react/schema` subpath
 * rather than the package barrel: the barrel evaluates `createContext()` at
 * module scope, and React's `react-server` build has no `createContext`, so
 * importing it would break this module in every RSC context.
 *
 * The React half lives in `components/json-render/renderer.tsx`.
 */
export const jsonRenderCatalog = defineCatalog(schema, {
  components: blockDefinitions,
  actions: blockActions,
});
