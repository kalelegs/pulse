'use client';

import { tool } from '@openai/agents';
import { attachSpecToReply } from '@/tools/attachSpec';
import { buildCatalogReference } from '@/tools/catalogReference';
import { toJsonRenderSpec, uiSpecParameters } from '@/tools/specSchema';

const USAGE = [
  'Render a custom UI panel into the conversation for the answer you are about to give.',
  'Use it when the answer is a comparison, a list of options, a set of steps, a small table or a summary with several figures — anything the user would rather look at than listen to.',
  'Do not use it for a one-sentence reply, and do not use it when a dedicated tool already renders its own card (weather does).',
  'Keep the panel small: one CardBlock at the root, a handful of children, no invented data.',
  'After it succeeds, say one short sentence about what is on screen — never read the panel out field by field.',
  'On failure it returns what was wrong with the spec; fix it and call the tool again at most once.',
].join(' ');

/**
 * The escape hatch: the agent's own generative UI.
 *
 * The typed builders (`lib/spec-builders/`) cover the experiences the app ships
 * deliberately; this covers everything else. The block vocabulary travels in
 * this tool's description rather than in the agent's system instructions, so the
 * cost of teaching it moves with the tool — hand `render_ui` to a specialist
 * agent later and the instruction budget follows it there.
 */
const renderUi = tool({
  name: 'render_ui',
  description: `${USAGE}\n\n${buildCatalogReference()}`,
  parameters: uiSpecParameters,
  async execute(input) {
    const result = toJsonRenderSpec(input);

    if (!result.ok) {
      return `The panel was not rendered. ${result.error}`;
    }

    attachSpecToReply(result.spec);

    return 'The panel is on screen. Say one short sentence introducing it; do not describe its contents element by element.';
  },
});

export default renderUi;
