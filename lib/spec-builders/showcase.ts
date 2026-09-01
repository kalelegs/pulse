import { block, buildSpec } from '@/lib/spec-builders/builder';
import {
  collectionSection,
  contentSection,
  dataSection,
  followUpSection,
} from '@/lib/spec-builders/showcaseSections';
import type { TJsonRenderSpec } from '@/lib/json-render/types';

const divider = (label: string) => block('DividerBlock', { label, orientation: 'horizontal' });

/**
 * Visual smoke test: a spec that uses every block in the catalog exactly as an
 * agent would. If a block regresses, it shows up here first — so add a section
 * entry here whenever a block is added to the catalog.
 */
export const createShowcaseSpec = (): TJsonRenderSpec =>
  buildSpec(
    block(
      'CardBlock',
      {
        title: 'JSON Render Showcase',
        description: 'Every block in the catalog, composed the way an agent would compose them.',
        icon: 'sparkles',
        tone: 'default',
      },
      {
        key: 'showcase-root',
        children: [
          ...contentSection(),
          divider('Numbers'),
          ...dataSection(),
          divider('Collections'),
          ...collectionSection(),
          divider('Follow ups'),
          ...followUpSection(),
        ],
      },
    ),
  );
