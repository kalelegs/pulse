'use client';

import type { Tool } from '@openai/agents';
import renderUi from '@/tools/renderUi';
import getWeather from '@/tools/weather';

/**
 * Tools the agent should be told about but that are not always worth their
 * budget. `render_ui` carries the whole block vocabulary in its description
 * (~6.9 KB, ~1.7k tokens) and every tool definition is sent up front in the
 * realtime session config, so it is paid for on connect whether or not it is
 * used. Flip this to `false` to run with the typed experiences only.
 */
const ENABLE_GENERATIVE_UI_TOOL = true;

/** Tool names (`tool.name`, the string the model calls) held back from the agent. */
const DISABLED_TOOL_NAMES: string[] = ENABLE_GENERATIVE_UI_TOOL ? [] : ['render_ui'];

/**
 * The tool registry.
 *
 * Adding a tool is one line here, the same way adding a block is one line in
 * `lib/json-render/blocks/index.ts`. Agents import `agentTools` from
 * this barrel rather than reaching for individual modules, so a tool is never
 * silently available to one agent and missing from another.
 */
const tools: Tool[] = [getWeather, renderUi];

/** Every enabled tool, ready to hand to a `RealtimeAgent`. */
export const agentTools: Tool[] = tools.filter(
  (definition) => !DISABLED_TOOL_NAMES.includes(definition.name),
);
