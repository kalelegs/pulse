import { RealtimeAgent } from '@openai/agents/realtime';
import { RECOMMENDED_PROMPT_PREFIX } from '@openai/agents-core/extensions';

const initialAgent = new RealtimeAgent({
  name: 'Pulse Assistant',
  instructions: `
    ${RECOMMENDED_PROMPT_PREFIX}
    You are an english speaking helpful and friendly assistant.
  `,
});

export default initialAgent;
