import { RealtimeAgent } from '@openai/agents/realtime';
import { RECOMMENDED_PROMPT_PREFIX } from '@openai/agents-core/extensions';
import { EVoice } from '@/lib/utils';
import { RunContext } from '@openai/agents';
import getWeather from '@/tools/weather';
import { TSessionContext } from '@/types';


/**
 * Dynamic Instruction building
 */
function buildInstructions(runContext: RunContext<TSessionContext>) {
  return `
    ${RECOMMENDED_PROMPT_PREFIX}
    Your name is pulse. You are an english speaking helpful and friendly assistant.
    User's name is ${runContext.context.userName}.

    Remember: If you decide to make a tool call, then you must announce it to the user.
  `
}

const initialAgent = new RealtimeAgent<TSessionContext>({
  name: 'Pulse Assistant',
  voice: EVoice.ECHO,
  instructions: buildInstructions,
  tools: [getWeather]
});

export default initialAgent;
