import { z } from 'zod';
import { defineBlock } from '@/components/json-render/blocks/defineBlock';
import { ICON_NAMES } from '@/components/json-render/blocks/iconNames';

export const iconBlockDefinition = defineBlock({
  props: z.object({
    name: z.enum(ICON_NAMES),
    size: z.enum(['sm', 'md', 'lg', 'xl']).nullable(),
    tone: z.enum(['default', 'muted', 'primary', 'success', 'warning', 'destructive']).nullable(),
    label: z.string().nullable(),
  }),
  slots: [],
  description:
    'Standalone pictogram from a fixed icon set. `name` must be one of the listed values — unknown names render nothing. Set `label` when the icon carries meaning on its own, otherwise it is hidden from screen readers.',
  example: { name: 'storm', size: 'lg', tone: 'primary', label: 'Thunderstorms' },
});
