'use client';

import { createElement } from 'react';
import { resolveIcon } from '@/components/json-render/icons';

export type TBlockIconProps = {
  /** Agent-supplied icon name. Unknown or missing names render nothing. */
  name: string | null | undefined;
  className?: string;
  /** Accessible name. When omitted the icon is treated as decorative. */
  label?: string | null;
};

/**
 * Renders one icon from the curated set.
 *
 * Every block that accepts an `icon` prop goes through this component instead of
 * looking the component up itself: resolving a component into a local variable
 * and rendering it as JSX trips `react-hooks/static-components`, and doing it in
 * one place keeps the decorative-vs-labelled a11y handling consistent.
 */
const BlockIcon = ({ name, className, label }: TBlockIconProps) => {
  const icon = resolveIcon(name);

  if (!icon) {
    return null;
  }

  return createElement(icon, {
    'aria-hidden': label ? undefined : true,
    'aria-label': label ?? undefined,
    className,
    role: label ? 'img' : undefined,
  });
};

export default BlockIcon;
