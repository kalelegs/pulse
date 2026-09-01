'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

type TJsonRenderErrorBoundaryProps = {
  children: ReactNode;
  /**
   * Reset the boundary whenever this changes. Compared by identity, so pass
   * something that actually identifies the render — the spec object itself is
   * ideal. Do not pass the spec's root key: root keys are not unique (specs
   * conventionally use `"root"`, and `buildSpec` derives them from block type
   * plus a counter), so a corrected spec would never clear a latched error.
   */
  resetKey?: unknown;
};

type TJsonRenderErrorBoundaryState = {
  error: Error | null;
};

/**
 * Contains render failures caused by malformed agent specs.
 *
 * A spec is untrusted input: a block can be handed a value its component does
 * not expect and throw during render, which in React 19 unmounts the entire
 * tree above it. This boundary keeps that blast radius inside the render
 * surface so a bad spec degrades to an inline notice instead of white-screening
 * the app. Must be a class — React has no hook equivalent for error boundaries.
 */
class JsonRenderErrorBoundary extends Component<
  TJsonRenderErrorBoundaryProps,
  TJsonRenderErrorBoundaryState
> {
  state: TJsonRenderErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): TJsonRenderErrorBoundaryState {
    return { error };
  }

  componentDidUpdate(previousProps: TJsonRenderErrorBoundaryProps) {
    if (this.state.error && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[json-render] spec failed to render', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-xs"
          role="alert"
        >
          This generated view could not be displayed.
        </div>
      );
    }

    return this.props.children;
  }
}

export default JsonRenderErrorBoundary;
