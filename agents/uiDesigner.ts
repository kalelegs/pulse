import { Agent, run } from '@openai/agents';
import { buildCatalogReference } from '@/lib/json-render/catalogReference';
import { parseAndValidateSpec, type TSpecValidation } from '@/lib/json-render/validateSpec';

/**
 * Server-only. Not a realtime agent and not in the handoff registry: the realtime agent calls it
 * through the `design_ui` tool → `actions/designUi.ts`, the "agent as a tool" pattern. A realtime
 * handoff would keep the realtime model; this runs a text model chosen for composing UI.
 *
 * `UI_DESIGN_MODEL` picks the model; unset, the Agents SDK default applies.
 */
const MODEL = process.env.UI_DESIGN_MODEL;

/** One correction round: the validator's issues go back to the model with the original brief. */
const MAX_ATTEMPTS = 2;

const instructions = (): string =>
  [
    'You design screen panels for a conversational assistant. You receive a brief in plain words',
    'and reply with ONE JSON object and nothing else — no prose, no code fence.',
    '',
    'Shape: {"root": "<key>", "elements": [{"key", "type", "props", "children", "on"}]}.',
    '`props` and `on` are JSON objects (not strings). `children` lists child keys; leaf blocks use [].',
    'Every prop key of a block appears in `props`, with null when unused. Use only the blocks,',
    'icons and actions below, and follow the composition guidance exactly.',
    'Show every fact the brief gives you and invent none; if the brief lacks a number, leave it out.',
    '',
    buildCatalogReference(),
  ].join('\n');

const uiDesigner = new Agent({
  name: 'UI Designer',
  ...(MODEL && { model: MODEL }),
  instructions: instructions(),
});

/** Strips an accidental code fence and returns the first `{ … }` the model produced. */
const extractJson = (text: string): unknown => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) {
    return undefined;
  }
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return undefined;
  }
};

/**
 * Turns a brief into a validated spec, correcting once when the first attempt fails validation.
 *
 * @param brief What the panel is for and every fact it must show, in the realtime agent's words.
 */
export const designSpec = async (brief: string): Promise<TSpecValidation> => {
  let prompt = brief;
  let result: TSpecValidation = { ok: false, issues: ['no attempt made'] };

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const output = await run(uiDesigner, prompt);
    const text = typeof output.finalOutput === 'string' ? output.finalOutput : '';
    result = parseAndValidateSpec(extractJson(text) ?? text);
    if (result.ok) {
      return result;
    }
    prompt = [
      brief,
      '',
      'Your previous spec was rejected for these reasons; return a corrected spec:',
      ...result.issues.map((issue) => `- ${issue}`),
    ].join('\n');
  }

  return result;
};
