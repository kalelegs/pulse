import type { ReactNode } from 'react';
import type { z } from 'zod';
import type { BaseComponentProps } from '@json-render/react';
import { badgeBlockDefinition } from '@/components/json-render/blocks/BadgeBlock.definition';
import { cardBlockDefinition } from '@/components/json-render/blocks/CardBlock.definition';
import { carouselBlockDefinition } from '@/components/json-render/blocks/CarouselBlock.definition';
import { dividerBlockDefinition } from '@/components/json-render/blocks/DividerBlock.definition';
import { gridBlockDefinition } from '@/components/json-render/blocks/GridBlock.definition';
import { headingBlockDefinition } from '@/components/json-render/blocks/HeadingBlock.definition';
import { iconBlockDefinition } from '@/components/json-render/blocks/IconBlock.definition';
import { imageBlockDefinition } from '@/components/json-render/blocks/ImageBlock.definition';
import { keyValueBlockDefinition } from '@/components/json-render/blocks/KeyValueBlock.definition';
import { labelBlockDefinition } from '@/components/json-render/blocks/LabelBlock.definition';
import { linkBlockDefinition } from '@/components/json-render/blocks/LinkBlock.definition';
import { listBlockDefinition } from '@/components/json-render/blocks/ListBlock.definition';
import { metricBlockDefinition } from '@/components/json-render/blocks/MetricBlock.definition';
import { progressBlockDefinition } from '@/components/json-render/blocks/ProgressBlock.definition';
import { stackBlockDefinition } from '@/components/json-render/blocks/StackBlock.definition';
import { suggestionChipDefinition } from '@/components/json-render/blocks/SuggestionChip.definition';
import { tableBlockDefinition } from '@/components/json-render/blocks/TableBlock.definition';
import { textBlockDefinition } from '@/components/json-render/blocks/TextBlock.definition';
import { textBubbleDefinition } from '@/components/json-render/blocks/TextBubble.definition';

/**
 * The single source of truth for the block vocabulary.
 *
 * This module is deliberately React-free (every import above is a `.definition`
 * file, and the React types are `import type` only, so nothing survives to
 * runtime). That lets `lib/json-render/catalog.ts` — and therefore agent
 * instructions and tool definitions — import it from the server without pulling
 * in `next/image`, shadcn or the rest of the component tree.
 *
 * Adding a block: create `<Name>.definition.ts` + `<Name>.tsx`, add one line
 * here and one line in `./components.ts`. The `TBlockComponents` type below
 * makes the two maps impossible to drift apart — a missing, extra or
 * wrongly-typed entry in `./components.ts` is a compile error.
 */
export const blockDefinitions = {
  BadgeBlock: badgeBlockDefinition,
  CardBlock: cardBlockDefinition,
  CarouselBlock: carouselBlockDefinition,
  DividerBlock: dividerBlockDefinition,
  GridBlock: gridBlockDefinition,
  HeadingBlock: headingBlockDefinition,
  IconBlock: iconBlockDefinition,
  ImageBlock: imageBlockDefinition,
  KeyValueBlock: keyValueBlockDefinition,
  LabelBlock: labelBlockDefinition,
  LinkBlock: linkBlockDefinition,
  ListBlock: listBlockDefinition,
  MetricBlock: metricBlockDefinition,
  ProgressBlock: progressBlockDefinition,
  StackBlock: stackBlockDefinition,
  SuggestionChip: suggestionChipDefinition,
  TableBlock: tableBlockDefinition,
  TextBlock: textBlockDefinition,
  TextBubble: textBubbleDefinition,
};

/** Union of every block `type` string an agent may emit. */
export type TBlockName = keyof typeof blockDefinitions;

/** Resolved props object for a given block name. */
export type TBlockProps<TName extends TBlockName> = z.infer<
  (typeof blockDefinitions)[TName]['props']
>;

/**
 * Exhaustive map of block name -> React render function.
 *
 * Implemented by `./components.ts`. It catches three kinds of drift at compile
 * time: a block registered here but missing there, a block registered there but
 * missing here, and a component that *demands* props its `.definition.ts` does
 * not declare (parameter contravariance under `strictFunctionTypes`).
 *
 * It does **not** catch a component that under-declares. `BaseComponentProps<{}>`,
 * or a component that ignores `props` entirely, assigns cleanly — `{ text: string }`
 * is assignable to `{}`. So a block that quietly stopped reading a prop the
 * catalog still advertises to the model will type-check happily while the LLM
 * keeps emitting a value nothing renders. Reviewing a block's props is still a
 * manual step; the type only guarantees the two maps have the same keys and that
 * no component asks for more than it is given.
 */
export type TBlockComponents = {
  [TName in TBlockName]: (ctx: BaseComponentProps<TBlockProps<TName>>) => ReactNode;
};

export { blockActions } from '@/components/json-render/blocks/actions';
export { ICON_NAMES, type TIconName } from '@/components/json-render/blocks/iconNames';
export { defineBlock, type TBlockDefinition } from '@/components/json-render/blocks/defineBlock';
