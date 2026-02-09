'use client';

import { defineCatalog } from '@json-render/core';
import { defineRegistry, schema, type Spec } from '@json-render/react';
import { cardBlockDefinition, CardBlock } from '@/components/json-render/CardBlock';
import { carouselBlockDefinition, CarouselBlock } from '@/components/json-render/CarouselBlock';
import { imageBlockDefinition, ImageBlock } from '@/components/json-render/ImageBlock';
import { labelBlockDefinition, LabelBlock } from '@/components/json-render/LabelBlock';
import { linkBlockDefinition, LinkBlock } from '@/components/json-render/LinkBlock';
import { listBlockDefinition, ListBlock } from '@/components/json-render/ListBlock';
import { suggestionChipDefinition, SuggestionChip } from '@/components/json-render/SuggestionChip';
import { textBubbleDefinition, TextBubble } from '@/components/json-render/TextBubble';

export const jsonRenderCatalog = defineCatalog(schema, {
  components: {
    CardBlock: cardBlockDefinition,
    CarouselBlock: carouselBlockDefinition,
    ListBlock: listBlockDefinition,
    SuggestionChip: suggestionChipDefinition,
    TextBubble: textBubbleDefinition,
    LabelBlock: labelBlockDefinition,
    ImageBlock: imageBlockDefinition,
    LinkBlock: linkBlockDefinition,
  },
  actions: {},
});

export const { registry: jsonRenderRegistry } = defineRegistry(jsonRenderCatalog, {
  components: {
    CardBlock,
    CarouselBlock,
    ListBlock,
    SuggestionChip,
    TextBubble,
    LabelBlock,
    ImageBlock,
    LinkBlock,
  },
});

export type TJsonRenderSpec = Spec;
