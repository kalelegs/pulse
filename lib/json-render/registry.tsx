'use client';

import type { ReactNode } from 'react';
import {
  createRenderer,
  type BaseComponentProps,
  type ComponentRenderer,
  type ComponentRenderProps,
} from '@json-render/react';
import { jsonRenderCatalog } from '@/lib/json-render/catalog';
import { blockComponents } from '@/components/json-render/blocks/components';
import type { TBlockName, TBlockProps } from '@/components/json-render/blocks';

/**
 * Why `createRenderer` and not `Renderer` + `defineRegistry`.
 *
 * `Renderer` is spec + registry only: it renders elements but provides none of
 * the surrounding contexts, so `emit()` on an element resolves to nothing and
 * `visible` / `$state` / `repeat` expressions have no store to read from. Wiring
 * those up means hand-assembling StateProvider + VisibilityProvider +
 * ValidationProvider + ActionProvider + ConfirmationDialogManager ourselves.
 *
 * `createRenderer` composes exactly that stack and, crucially, exposes an
 * `onAction(name, params)` prop backed by a Proxy over the handler map — which
 * means every catalog action (plus the built-in setState/pushState/removeState/
 * validateForm) is forwarded to one callback without us registering a handler
 * per action. That
 * is precisely the `JsonRenderSurface.onAction` contract, so it is the one we
 * use. It also accepts `loading` and `fallback` unchanged.
 *
 * The only thing `defineRegistry` gives us that `createRenderer` does not is the
 * ergonomic `BaseComponentProps` shape for block authors (`props` instead of
 * `element.props`). We keep that ergonomics with the tiny `toRenderer` adapter
 * below — the same three lines `defineRegistry` performs internally — rather
 * than giving up `onAction`.
 */
const toRenderer = <TProps,>(
  block: (ctx: BaseComponentProps<TProps>) => ReactNode,
): ComponentRenderer<TProps> => {
  const BlockRenderer = ({
    element,
    children,
    slots,
    emit,
    on,
    bindings,
    loading,
  }: ComponentRenderProps<TProps>) =>
    block({ props: element.props, children, slots, emit, on, bindings, loading });

  return BlockRenderer;
};

type TBlockRenderers = { [TName in TBlockName]: ComponentRenderer<TBlockProps<TName>> };

/**
 * Adapted registry. The cast is confined to this one line: `Object.entries`
 * erases the per-key relationship that `blockComponents` already proved via
 * `TBlockComponents`, so nothing new is being asserted here.
 */
const blockRenderers = Object.fromEntries(
  Object.entries(blockComponents).map(([name, block]) => [
    name,
    toRenderer(block as (ctx: BaseComponentProps<unknown>) => ReactNode),
  ]),
) as TBlockRenderers;

/**
 * The renderer for the pulse json-render catalog.
 *
 * Prefer `components/json-render/JsonRenderSurface.tsx` over using this
 * directly — it adds spec validation, an unknown-block fallback and an error
 * boundary.
 */
export const JsonRenderer = createRenderer(jsonRenderCatalog, blockRenderers);
