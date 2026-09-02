import type { ReactNode } from 'react';
import type { z } from 'zod';
import type { BaseComponentProps } from '@json-render/react';
import { badgeBlockDefinition } from '@/lib/json-render/blocks/BadgeBlock.definition';
import { barChartBlockDefinition } from '@/lib/json-render/blocks/BarChartBlock.definition';
import { buttonBlockDefinition } from '@/lib/json-render/blocks/ButtonBlock.definition';
import { calloutBlockDefinition } from '@/lib/json-render/blocks/CalloutBlock.definition';
import { cardBlockDefinition } from '@/lib/json-render/blocks/CardBlock.definition';
import { carouselBlockDefinition } from '@/lib/json-render/blocks/CarouselBlock.definition';
import { codeBlockDefinition } from '@/lib/json-render/blocks/CodeBlock.definition';
import { dividerBlockDefinition } from '@/lib/json-render/blocks/DividerBlock.definition';
import { gridBlockDefinition } from '@/lib/json-render/blocks/GridBlock.definition';
import { headingBlockDefinition } from '@/lib/json-render/blocks/HeadingBlock.definition';
import { iconBlockDefinition } from '@/lib/json-render/blocks/IconBlock.definition';
import { imageBlockDefinition } from '@/lib/json-render/blocks/ImageBlock.definition';
import { keyValueBlockDefinition } from '@/lib/json-render/blocks/KeyValueBlock.definition';
import { labelBlockDefinition } from '@/lib/json-render/blocks/LabelBlock.definition';
import { lineChartBlockDefinition } from '@/lib/json-render/blocks/LineChartBlock.definition';
import { linkBlockDefinition } from '@/lib/json-render/blocks/LinkBlock.definition';
import { listBlockDefinition } from '@/lib/json-render/blocks/ListBlock.definition';
import { metricBlockDefinition } from '@/lib/json-render/blocks/MetricBlock.definition';
import { progressBlockDefinition } from '@/lib/json-render/blocks/ProgressBlock.definition';
import { quoteBlockDefinition } from '@/lib/json-render/blocks/QuoteBlock.definition';
import { ratingBlockDefinition } from '@/lib/json-render/blocks/RatingBlock.definition';
import { segmentedBarBlockDefinition } from '@/lib/json-render/blocks/SegmentedBarBlock.definition';
import { stackBlockDefinition } from '@/lib/json-render/blocks/StackBlock.definition';
import { stepperBlockDefinition } from '@/lib/json-render/blocks/StepperBlock.definition';
import { suggestionChipBlockDefinition } from '@/lib/json-render/blocks/SuggestionChipBlock.definition';
import { tableBlockDefinition } from '@/lib/json-render/blocks/TableBlock.definition';
import { textBlockDefinition } from '@/lib/json-render/blocks/TextBlock.definition';
import { textBubbleBlockDefinition } from '@/lib/json-render/blocks/TextBubbleBlock.definition';
import { timelineBlockDefinition } from '@/lib/json-render/blocks/TimelineBlock.definition';

/**
 * The single source of truth for the block vocabulary.
 *
 * This module lives under `lib/` and is deliberately React-free: every import
 * above is a `.definition` file, and the React types are `import type` only,
 * so nothing survives to runtime. That lets `lib/json-render/catalog.ts` — and
 * therefore `lib/json-render/validateSpec.ts` — import it from the server without pulling
 * in `next/image`, shadcn or the rest of the component tree. Nothing under
 * `lib/` imports from `components/`; the React half depends on this barrel,
 * never the other way round.
 *
 * Adding a block: create `<Name>.definition.ts` here and `<Name>.tsx` under
 * `components/json-render/blocks/`, then add one line to this map and one to
 * `components/json-render/blocks/components.ts`. The `TBlockComponents` type
 * below makes the two maps impossible to drift apart — a missing, extra or
 * wrongly-typed entry there is a compile error.
 */
export const blockDefinitions = {
  BadgeBlock: badgeBlockDefinition,
  BarChartBlock: barChartBlockDefinition,
  ButtonBlock: buttonBlockDefinition,
  CalloutBlock: calloutBlockDefinition,
  CardBlock: cardBlockDefinition,
  CarouselBlock: carouselBlockDefinition,
  CodeBlock: codeBlockDefinition,
  DividerBlock: dividerBlockDefinition,
  GridBlock: gridBlockDefinition,
  HeadingBlock: headingBlockDefinition,
  IconBlock: iconBlockDefinition,
  ImageBlock: imageBlockDefinition,
  KeyValueBlock: keyValueBlockDefinition,
  LabelBlock: labelBlockDefinition,
  LineChartBlock: lineChartBlockDefinition,
  LinkBlock: linkBlockDefinition,
  ListBlock: listBlockDefinition,
  MetricBlock: metricBlockDefinition,
  ProgressBlock: progressBlockDefinition,
  QuoteBlock: quoteBlockDefinition,
  RatingBlock: ratingBlockDefinition,
  SegmentedBarBlock: segmentedBarBlockDefinition,
  StackBlock: stackBlockDefinition,
  StepperBlock: stepperBlockDefinition,
  SuggestionChipBlock: suggestionChipBlockDefinition,
  TableBlock: tableBlockDefinition,
  TextBlock: textBlockDefinition,
  TextBubbleBlock: textBubbleBlockDefinition,
  TimelineBlock: timelineBlockDefinition,
};

/** Union of every block `type` string an agent may emit. */
export type TBlockName = keyof typeof blockDefinitions;

/** Resolved props object for a given block name. */
export type TBlockProps<TName extends TBlockName> = z.infer<
  (typeof blockDefinitions)[TName]['props']
>;

/**
 * The render function for one block: `props` is that block's own inferred
 * props type, plus the json-render context (`children`, `on`, `emit`,
 * `loading`, …). Every `<Name>.tsx` is annotated with this, so a component
 * that demands a prop its `.definition.ts` does not declare fails at its own
 * declaration site.
 */
export type TBlockComponent<TName extends TBlockName> = (
  ctx: BaseComponentProps<TBlockProps<TName>>,
) => ReactNode;

/**
 * Exhaustive map of block name -> React render function.
 *
 * Implemented by `components/json-render/blocks/components.ts`. It catches
 * three kinds of drift at compile time: a block registered here but missing
 * there, a block registered there but missing here, and a component that
 * *demands* props its `.definition.ts` does not declare (parameter
 * contravariance under `strictFunctionTypes`).
 *
 * It does **not** catch a component that under-declares. `BaseComponentProps<{}>`,
 * or a component that ignores `props` entirely, assigns cleanly — `{ text: string }`
 * is assignable to `{}`. So a block that quietly stopped reading a prop the
 * catalog still advertises to the model will type-check happily while the LLM
 * keeps emitting a value nothing renders. Reviewing a block's props is still a
 * manual step; the type only guarantees the two maps have the same keys and that
 * no component asks for more than it is given.
 */
export type TBlockComponents = { [TName in TBlockName]: TBlockComponent<TName> };

export { blockActions } from '@/lib/json-render/blocks/actions';
export { ICON_NAMES, type TIconName } from '@/lib/json-render/iconNames';
export { dataToneEnum, type TDataTone } from '@/lib/json-render/blocks/tones';
export { defineBlock, type TBlockDefinition } from '@/lib/json-render/blocks/defineBlock';
