import { z } from 'zod';

/**
 * Curated icon vocabulary exposed to agents.
 *
 * Kept as a plain string tuple (no React imports) under `lib/` so block
 * definitions, the server-safe catalog and `lib/weather` can all build on it
 * without reaching into the component tree. The name -> component map lives in
 * `components/json-render/icons.ts`; the two are kept in sync by type.
 */
export const ICON_NAMES = [
  'sun',
  'moon',
  'cloud',
  'cloudy',
  'rain',
  'snow',
  'storm',
  'wind',
  'hot',
  'cold',
  'humidity',
  'visibility',
  'compass',
  'location',
  'calendar',
  'clock',
  'globe',
  'arrow-up',
  'arrow-down',
  'arrow-right',
  'minus',
  'check',
  'check-circle',
  'close',
  'warning',
  'info',
  'alert',
  'star',
  'heart',
  'sparkles',
  'idea',
  'search',
  'user',
  'team',
  'settings',
  'bag',
  'tag',
  'wallet',
  'chart-line',
  'chart-bar',
  'chart-pie',
  'file',
  'image',
  'external-link',
  'play',
  'pause',
  'refresh',
  'mail',
  'phone',
  'chat',
  'bell',
  'flash',
  'fire',
  'leaf',
  'home',
] as const;

/** Every icon name an agent may reference from any block that takes an `icon` prop. */
export type TIconName = (typeof ICON_NAMES)[number];

/** The optional `icon` prop shared by every icon-bearing block definition. */
export const iconEnum = z.enum(ICON_NAMES).nullable();
