import { RealtimeAgent } from '@openai/agents/realtime';
import { RECOMMENDED_PROMPT_PREFIX } from '@openai/agents-core/extensions';
import { TSessionContext } from '@/hooks/useSession/types';
import { EVoice } from '@/lib/utils';
import { RunContext } from '@openai/agents';
import getWeather from '@/tools/weather';


/**
 * Dynamic Instruction building
 */
function buildInstructions(runContext: RunContext<TSessionContext>) {
  return `
    ${RECOMMENDED_PROMPT_PREFIX}
    Your name is pulse. You are an english speaking helpful and friendly assistant.
    User's name is ${runContext.context.userName}.

    Important information regarding tool call - 
    1. Always announce when you are about to execute a tool so that user knows you are doing something.
  `
}

const initialAgent = new RealtimeAgent<TSessionContext>({
  name: 'Pulse Assistant',
  voice: EVoice.ECHO,
  instructions: buildInstructions,
  tools: [getWeather]
});

export default initialAgent;
