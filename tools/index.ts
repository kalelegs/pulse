'use client';

import type { Tool } from '@openai/agents';
import designUi from '@/tools/designUi';
import renderUi from '@/tools/renderUi';
import getStockHistory from '@/tools/stockHistory';
import getStockNews from '@/tools/stockNews';
import getStockQuote from '@/tools/stockQuote';
import getWeather from '@/tools/weather';

/**
 * Tools the agent should be told about but that are not always worth their
 * budget. `render_ui` carries the whole block vocabulary in its description
 * (~15 KB, ~3.7k tokens) and every tool definition is sent up front in the
 * realtime session config, so it is paid for on connect whether or not it is
 * used. Flip this to `false` to run with the typed experiences only.
 */
/**
 * Which generative-UI tool the agents carry.
 *
 * `design_ui` sends a plain-words brief to the server-side UI designer
 * (`agents/uiDesigner.ts`, a text model) and costs the realtime session a few
 * hundred characters. `render_ui` has the realtime model write the spec itself
 * and carries the whole block vocabulary in its description (~15 KB, ~3.7k
 * tokens, paid on every connect). `none` runs with the typed experiences only.
 */
const GENERATIVE_UI_TOOL: 'design_ui' | 'render_ui' | 'none' = 'render_ui';

const generativeUiTools: Tool[] = { design_ui: [designUi], render_ui: [renderUi], none: [] }[
  GENERATIVE_UI_TOOL
];

/** Every agent's tool set is its own tools plus the shared generative-UI tool, if any. */
const withGenerativeUi = (definitions: Tool[]): Tool[] => [...definitions, ...generativeUiTools];

export const assistantTools: Tool[] = withGenerativeUi([getWeather]);

/** The stock analyst: quotes, history, news and the generative-UI escape hatch. */
export const stockAnalystTools: Tool[] = withGenerativeUi([
  getStockQuote,
  getStockHistory,
  getStockNews,
]);
