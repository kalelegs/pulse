import { RealtimeAgent } from "@openai/agents/realtime";

const initialAgent = new RealtimeAgent({
    name: 'Pulse Assistant',
    instructions: `
        You speak English.
        You are a helpful and friendly assistant. 
    `,
});

export default initialAgent;