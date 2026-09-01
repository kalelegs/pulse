'use client';

import { useMemo } from 'react';
import type { ComponentRenderProps } from '@json-render/react';
import { cn } from '@/lib/utils';
import { jsonRenderCatalog } from '@/lib/json-render/catalog';
import { JsonRenderer } from '@/lib/json-render/registry';
import JsonRenderErrorBoundary from '@/components/json-render/JsonRenderErrorBoundary';
import type { TJsonRenderAction, TJsonRenderSpec } from '@/lib/json-render/types';

export type TJsonRenderSurfaceProps = {
  /** Spec to render; renders nothing when null/invalid. */
  spec: TJsonRenderSpec | null | undefined;
  /** Show skeleton/loading affordance while the spec streams in. */
  loading?: boolean;
  /** Fired when an interactive block emits an action (e.g. a suggestion chip press). */
  onAction?: TJsonRenderAction;
  className?: string;
};

/**
 * Rendered in place of any element whose `type` is not in the catalog, so a
 * hallucinated block name leaves a visible, debuggable marker instead of a
 * silent hole in the layout.
 */
const UnsupportedBlock = ({ element }: ComponentRenderProps) => (
  <span className="text-muted-foreground bg-muted/50 inline-flex rounded-md border px-2 py-0.5 text-xs">
    Unsupported block: {element.type}
  </span>
);

/**
 * The single entry point for rendering an agent-generated json-render spec.
 *
 * Layers three safety nets over the raw renderer:
 * 1. `jsonRenderCatalog.validate()` rejects structurally invalid specs before
 *    they reach React. While `loading` is true the spec is still streaming and
 *    is expected to be incomplete, so validation is advisory only.
 * 2. An `UnsupportedBlock` fallback for unknown component types.
 * 3. An error boundary, so a block that throws cannot take down the app.
 *
 * Note that the *original* spec is rendered, never `validate().data` — the
 * catalog's Zod schema does not model the `on` and `state` fields, so parsing
 * through it would silently strip every action binding and seeded state value.
 */
const JsonRenderSurface = ({ spec, loading, onAction, className }: TJsonRenderSurfaceProps) => {
  const isValid = useMemo(() => {
    if (!spec || typeof spec !== 'object' || !spec.root || !spec.elements) {
      return false;
    }

    const result = jsonRenderCatalog.validate(spec);

    if (!result.success) {
      console.warn('[json-render] invalid spec', result.error?.issues ?? result.error);
    }

    return result.success;
  }, [spec]);

  if (!spec || (!isValid && !loading)) {
    return null;
  }

  return (
    <div className={cn('w-full', className)}>
      {/*
        Reset on the spec object identity, not `spec.root`: root keys repeat
        across specs (`"root"` by convention, `card-1` from `buildSpec`), so a
        key-based reset would latch the error state forever once one bad spec
        failed. Every re-render with a new spec is a new object reference.
      */}
      <JsonRenderErrorBoundary resetKey={spec}>
        <JsonRenderer
          fallback={UnsupportedBlock}
          loading={loading}
          onAction={onAction}
          spec={spec}
          state={spec.state}
        />
      </JsonRenderErrorBoundary>
    </div>
  );
};

export default JsonRenderSurface;
