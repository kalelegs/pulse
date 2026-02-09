import type { ReactNode } from 'react';

export type TRenderCtx<TProps> = {
  props: TProps;
  children?: ReactNode;
  onAction?: (action: { name: string; params?: Record<string, unknown> }) => void;
  loading?: boolean;
};
