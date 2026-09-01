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
import { SuggestionChip } from '@/components/json-render/blocks/SuggestionChip';
import { TableBlock } from '@/components/json-render/blocks/TableBlock';
import { TextBlock } from '@/components/json-render/blocks/TextBlock';
import { TextBubble } from '@/components/json-render/blocks/TextBubble';
import type { TBlockComponents } from '@/components/json-render/blocks';

/**
 * The client-side half of the block barrel: block name -> React component.
 *
 * Kept separate from `./index.ts` purely because of the server/client boundary —
 * the catalog must stay React-free. The `TBlockComponents` annotation keeps the
 * two halves honest: a name present in `blockDefinitions` but missing here (or
 * vice versa), or a component demanding a prop its definition does not declare,
 * fails type-checking. See the `TBlockComponents` docblock in `./index.ts` for
 * the one case it cannot see — a component that under-declares its props.
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
  SuggestionChip,
  TableBlock,
  TextBlock,
  TextBubble,
};
