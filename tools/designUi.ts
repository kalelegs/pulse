'use client';

import { tool } from '@openai/agents';
import { z } from 'zod';
import { designUi as designUiAction } from '@/actions/designUi';
import { attachSpecToReply } from '@/tools/attachSpec';

/**
 * Generative UI by delegation: the "agent as a tool" pattern.
 *
 * `render_ui` makes the realtime model write the whole spec itself, which
 * costs it the entire block vocabulary on every connect and a long, error-prone
 * JSON argument at reply time. This tool asks for a plain-words *brief* instead
 * and hands it to `agents/uiDesigner.ts`, a text model that composes and
 * validates the spec on the server. The realtime side stays cheap, and the
 * model best at laying out a panel is the one laying it out.
 */
const designUi = tool({
  name: 'design_ui',
  description: [
    'Ask the UI designer to draw a panel into the conversation for the answer you are about to give.',
    'Use it when the answer is a comparison, a list of options, a set of steps, a small table or a summary with several figures — anything the user would rather look at than listen to.',
    'Do not use it for a one-sentence reply, and not when a dedicated tool already renders its own card (weather and stocks do).',
    'The designer knows nothing but your brief: state what the panel is for, every fact and number to show, how items relate (side by side, ranked, over time), and up to three follow-up questions to offer as chips.',
    'After it succeeds, say one short sentence about what is on screen — never read the panel out field by field.',
  ].join(' '),
  parameters: z.object({
    brief: z
      .string()
      .describe(
        'Plain-words description of the panel: purpose, every fact to show with its value, the layout relationship, and follow-up chip texts. Two to eight sentences.',
      ),
  }),
  async execute({ brief }) {
    const result = await designUiAction(brief);

    if (!result.ok) {
      return `The panel could not be drawn: ${result.issues.join(' ')} Answer in words instead.`;
    }

    attachSpecToReply(result.spec);

    return 'The panel is on screen. Say one short sentence introducing it; do not describe its contents element by element.';
  },
});

export default designUi;
