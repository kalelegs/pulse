'use client';

import { blockActions, blockDefinitions, ICON_NAMES } from '@/lib/json-render/blocks';

/** `container` blocks accept children; `leaf` blocks never do. */
const kindOf = (slots: string[]): string => (slots.length ? 'container' : 'leaf');

const componentLines = (): string =>
  Object.entries(blockDefinitions)
    .map(
      ([name, definition]) =>
        `- ${name} (${kindOf(definition.slots)}) — ${definition.description}\n  props: ${JSON.stringify(definition.example)}`,
    )
    .join('\n');

const actionLines = (): string =>
  Object.entries(blockActions)
    .map(
      ([name, action]) =>
        `- ${name}({ ${Object.keys(action.params.shape).join(', ')} }) — ${action.description}`,
    )
    .join('\n');

/**
 * A compact, purpose-written description of the block vocabulary for the
 * `render_ui` tool.
 *
 * Deliberately **not** `jsonRenderCatalog.prompt()`. That prompt is 26 KB
 * (~6.5k tokens) and teaches a different protocol entirely — it instructs the
 * model to stream RFC-6902 JSONL patches and to invent realistic sample data,
 * neither of which applies when a spec arrives as tool arguments. It also
 * inlines the 55-value icon enum once per icon-bearing block. This version
 * states the icon set once, keeps every block's own LLM-authored description and
 * example, and is generated from `blockDefinitions`, so it cannot drift when a
 * block is added.
 */
export const buildCatalogReference = (): string =>
  [
    'BLOCK VOCABULARY',
    'Every element is { key, type, props, children, on }. `type` must be one of the blocks below.',
    "`props` is a JSON object string with EVERY key from that block's props shown in its example — use null for the ones you do not need.",
    '`children` is an array of the keys of child elements; leaf blocks use [].',
    'Write literal values into props. There is no state model here, so $state, $item, $bindState and repeat do nothing.',
    '',
    'COMPONENTS',
    componentLines(),
    '',
    `ICONS — every prop named "icon" or "name" takes exactly one of: ${ICON_NAMES.join(', ')}.`,
    '',
    'ACTIONS — put these on the element, never inside props, as a JSON object string in `on`:',
    '{"press":{"action":"suggest","params":{"text":"Show the hourly forecast","value":null}}}',
    actionLines(),
  ].join('\n');
