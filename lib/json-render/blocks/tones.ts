import { z } from 'zod';

/**
 * Colour intent shared by the data blocks (chart series, bar segments, timeline dots).
 *
 * One vocabulary rather than one enum per block, so an agent that has learned "success" for a bar
 * can use it for a line without checking. Semantic, not literal: the palette is the theme's.
 */
export const dataToneEnum = z
  .enum(['default', 'primary', 'success', 'warning', 'destructive', 'muted'])
  .nullable();

export type TDataTone = NonNullable<z.infer<typeof dataToneEnum>>;
