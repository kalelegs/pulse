'use client';

import type { Tool } from '@openai/agents';
import renderUi from '@/tools/renderUi';
import getWeather from '@/tools/weather';

/**
 * The tool registry.
 *
 * Adding a tool is one line here, the same way adding a block is one line in
 * `components/json-render/blocks/index.ts`. Agents import from this barrel
 * rather than reaching for individual modules, so a tool is never silently
 * available to one agent and missing from another.
 */
const toolRegistry = {
  get_weather_for_city: getWeather,
  render_ui: renderUi,
} satisfies Record<string, Tool>;

/** Name of every tool in the registry. */
export type TToolName = keyof typeof toolRegistry;

/**
 * Tools the agent should be told about but that are not always worth their
 * budget. `render_ui` carries the whole block vocabulary in its description
 * (~6.9 KB, ~1.7k tokens) and every tool definition is sent up front in the
 * realtime session config, so it is paid for on connect whether or not it is
 * used. Flip this to `false` to run with the typed experiences only.
 */
const ENABLE_GENERATIVE_UI_TOOL = true;

const DISABLED: TToolName[] = ENABLE_GENERATIVE_UI_TOOL ? [] : ['render_ui'];

/** Every enabled tool, ready to hand to a `RealtimeAgent`. */
export const agentTools: Tool[] = Object.entries(toolRegistry)
  .filter(([name]) => !DISABLED.includes(name as TToolName))
  .map(([, definition]) => definition);

export { default as getWeather } from '@/tools/weather';
export { default as renderUi } from '@/tools/renderUi';
