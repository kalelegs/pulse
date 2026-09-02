'use client';

import { BadgeBlock } from '@/components/json-render/blocks/BadgeBlock';
import { CardBlock } from '@/components/json-render/blocks/CardBlock';
import { CarouselBlock } from '@/components/json-render/blocks/CarouselBlock';
import { DividerBlock } from '@/components/json-render/blocks/DividerBlock';
import { GridBlock } from '@/components/json-render/blocks/GridBlock';
import { HeadingBlock } from '@/components/json-render/blocks/HeadingBlock';
import { IconBlock } from '@/components/json-render/blocks/IconBlock';
import { ImageBlock } from '@/components/json-render/blocks/ImageBlock';
import { KeyValueBlock } from '@/components/json-render/blocks/KeyValueBlock';
import { LabelBlock } from '@/components/json-render/blocks/LabelBlock';
import { LinkBlock } from '@/components/json-render/blocks/LinkBlock';
import { ListBlock } from '@/components/json-render/blocks/ListBlock';
import { MetricBlock } from '@/components/json-render/blocks/MetricBlock';
import { ProgressBlock } from '@/components/json-render/blocks/ProgressBlock';
import { StackBlock } from '@/components/json-render/blocks/StackBlock';
import { SuggestionChipBlock } from '@/components/json-render/blocks/SuggestionChipBlock';
import { TableBlock } from '@/components/json-render/blocks/TableBlock';
import { TextBlock } from '@/components/json-render/blocks/TextBlock';
import { TextBubbleBlock } from '@/components/json-render/blocks/TextBubbleBlock';
import type { TBlockComponents } from '@/lib/json-render/blocks';

/**
 * The React half of the block vocabulary: block name -> React component.
 *
 * Kept apart from `lib/json-render/blocks/index.ts` because of the
 * server/client boundary — the catalog must stay React-free, and `lib/` never
 * imports from `components/`. The `TBlockComponents` annotation keeps the two
 * halves honest: a name present in `blockDefinitions` but missing here (or vice
 * versa), or a component demanding a prop its definition does not declare,
 * fails type-checking. See the `TBlockComponents` docblock in
 * `lib/json-render/blocks/index.ts` for the one case it cannot see — a
 * component that under-declares its props.
 */
export const blockComponents: TBlockComponents = {
  BadgeBlock,
  CardBlock,
  CarouselBlock,
  DividerBlock,
  GridBlock,
  HeadingBlock,
  IconBlock,
  ImageBlock,
  KeyValueBlock,
  LabelBlock,
  LinkBlock,
  ListBlock,
  MetricBlock,
  ProgressBlock,
  StackBlock,
  SuggestionChipBlock,
  TableBlock,
  TextBlock,
  TextBubbleBlock,
};
