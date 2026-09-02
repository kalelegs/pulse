'use client';

import type { Tool } from '@openai/agents';
import renderUi from '@/tools/renderUi';
import getStockHistory from '@/tools/stockHistory';
import getStockNews from '@/tools/stockNews';
import getStockQuote from '@/tools/stockQuote';
import getWeather from '@/tools/weather';

/**
 * Tools the agent should be told about but that are not always worth their
 * budget. `render_ui` carries the whole block vocabulary in its description
 * (~6.9 KB, ~1.7k tokens) and every tool definition is sent up front in the
 * realtime session config, so it is paid for on connect whether or not it is
 * used. Flip this to `false` to run with the typed experiences only.
 */
const ENABLE_GENERATIVE_UI_TOOL = true;

/** Tool names (`tool.name`, the string the model calls) held back from every agent. */
const DISABLED_TOOL_NAMES: string[] = ENABLE_GENERATIVE_UI_TOOL ? [] : ['render_ui'];

/** Applies the global switches to one agent's tool set. Every set below goes through it. */
const enabled = (definitions: Tool[]): Tool[] =>
  definitions.filter((definition) => !DISABLED_TOOL_NAMES.includes(definition.name));

/**
 * The tool registry: one named set per agent.
 *
 * Adding a tool is one line in the right set, the same way adding a block is
 * one line in `lib/json-render/blocks/index.ts`. Agents import their set from
 * this barrel rather than reaching for individual modules, so the global
 * switches above apply everywhere and a tool is never silently available to one
 * agent and missing from another that should share it.
 *
 * Each set is what one agent's realtime session config carries, so a
 * specialist's set is also its instruction budget: `render_ui` is in every set
 * because its cost is worth paying wherever the model may need a custom panel.
 */

/** The general assistant: weather and the generative-UI escape hatch. */
export const assistantTools: Tool[] = enabled([getWeather, renderUi]);

/** The stock analyst: quotes, history, news and the generative-UI escape hatch. */
export const stockAnalystTools: Tool[] = enabled([
  getStockQuote,
  getStockHistory,
  getStockNews,
  renderUi,
]);
