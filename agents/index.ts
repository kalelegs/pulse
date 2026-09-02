'use client';

import type { RealtimeAgent } from '@openai/agents/realtime';
import initialAgent from '@/agents/initial';
import stockAnalyst from '@/agents/stockAnalyst';
import type { TSessionContext } from '@/types';

/**
 * The agent registry — the analogue of `tools/index.ts`.
 *
 * Each specialist module exports a bare agent that knows nothing about the
 * others. This file wires the graph: the root agent can hand off to every
 * specialist, and every specialist can hand back to the root. Adding a
 * specialist is one import and one entry in `specialistAgents`; no other
 * agent's prompt changes, because the SDK derives each `transfer_to_<name>`
 * tool from the target's `handoffDescription`.
 *
 * The back-edge is assigned after construction on purpose. `handoffs` is a
 * plain mutable array on `Agent` (`@openai/agents-core/dist/agent.d.ts`), and
 * wiring it here — rather than having `initial.ts` import the specialists and
 * each specialist import `initial.ts` — is what avoids a circular import.
 */
export const specialistAgents: RealtimeAgent<TSessionContext>[] = [stockAnalyst];

initialAgent.handoffs = [...specialistAgents];

for (const specialist of specialistAgents) {
  specialist.handoffs = [initialAgent];
}

/** The agent a session starts on. `hooks/useSession/createSession.ts` imports this and nothing else. */
export const rootAgent: RealtimeAgent<TSessionContext> = initialAgent;
