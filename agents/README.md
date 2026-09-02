# Agent Definitions

Definitions for every agent. Agents are `RealtimeAgent` instances: a name, a
voice, a `handoffDescription`, an instruction builder and a set of tools.

## Layout

```
agents/
  index.ts          the registry — wires handoffs; sessions import `rootAgent` from here
  initial.ts        Pulse Assistant: the root agent (weather, small talk, render_ui)
  stockAnalyst.ts   Stock Analyst: quotes, history, news
  shared.ts         the voice, and prompt lines every agent shares
```

## The registry

`agents/index.ts` is the analogue of `tools/index.ts`. Each specialist module
exports a bare agent that knows nothing about the others; the registry builds
the graph:

```ts
export const specialistAgents = [stockAnalyst];
initialAgent.handoffs = [...specialistAgents]; // root → every specialist
for (const specialist of specialistAgents) {
  specialist.handoffs = [initialAgent]; //           every specialist → root
}
export const rootAgent = initialAgent;
```

The back-edge is assigned after construction on purpose. `handoffs` is a plain
mutable array on `Agent` (see `@openai/agents-core/dist/agent.d.ts`), and the
realtime session reads it lazily — `getEnabledHandoffs()` runs when an agent
becomes current, not when it is constructed — so wiring it here is what avoids
`initial.ts` importing the specialists while each specialist imports
`initial.ts`.

`hooks/useSession/createSession.ts` imports `rootAgent` from `@/agents` and
nothing else.

## Handoffs are described, not prompted

The SDK generates one `transfer_to_<name>` function tool per entry in
`handoffs`, described by the target agent's `handoffDescription`. That text is
all the calling agent ever sees of the target, so it is written for the
orchestrator's tool list — what the specialist covers, in the words a user would
use:

```ts
handoffDescription:
  'Stock prices, market data, price charts, company fundamentals, analyst ratings, recent financial news, and whether a stock looks like a buy.',
```

Because of this, **no agent's prompt names another agent**. `HANDOFF_LINES` in
`shared.ts` says only that transfer tools exist and to use them silently; adding
a specialist never edits the root prompt. The root agent carries a
`handoffDescription` too ("General assistant: weather, small talk, …") so the
back-handoff reads symmetrically.

`RECOMMENDED_PROMPT_PREFIX` from `@openai/agents-core/extensions` opens every
prompt. It tells the model that transfers are handled in the background and
must not be mentioned to the user.

## One voice

A realtime session cannot change voice once an agent has spoken — the SDK fails
a handoff whose target has a different `voice`. Every agent therefore uses
`AGENT_VOICE` from `shared.ts` rather than picking its own.

## Instructions are built per run

`instructions` is a function, not a string, so it can read the session context:

```ts
const buildInstructions = (runContext: RunContext<TSessionContext>): string =>
  [RECOMMENDED_PROMPT_PREFIX, '…', ...preferenceLines(runContext.context.preferences)].join('\n');
```

`runContext.context` is the `TSessionContext` passed when the session is created
— currently the user's name and their preference list. Prompts are assembled
from arrays of lines rather than template literals, so source indentation is
never sent to the model. The lines every agent needs — preferences, screen
awareness, when to hand off — live in `shared.ts` so the agents cannot drift.

## Instruction budget

A realtime session sends the instructions **and every tool definition** of the
current agent in its connect payload, so both come out of the same budget and
both add latency. Keep each system prompt to what only it can say — who the
agent is, how it should behave, and _when_ to reach for a tool. Anything that
describes a single tool's inputs belongs in that tool's `description`, where it
travels with the tool when it moves to a specialist.

That is why `initial.ts` never inlines `jsonRenderCatalog.prompt()`: at 26,298
characters (~6.7k tokens) it would dominate the prompt, and it teaches a
JSONL-patch protocol that does not apply to specs arriving as tool arguments.
The block vocabulary lives in `render_ui`'s description instead — see
`tools/README.md`.

A handoff is also a budget boundary: the stock tools are only in the session
config while the Stock Analyst is current, so the root agent pays nothing for
them.

## Tools

Import a named set (`assistantTools`, `stockAnalystTools`) from `@/tools`, never
individual tool modules, so the global switches in `tools/index.ts` apply to
every agent.

## Adding a specialist

1. Add its tools to a new set in `tools/index.ts`.
2. Create `agents/<name>.ts`: a `RealtimeAgent<TSessionContext>` with
   `voice: AGENT_VOICE`, a `handoffDescription` written for the orchestrator's
   tool list, instructions built from `shared.ts` lines plus its own, and
   `tools: <name>Tools`. Do not import any other agent.
3. Add one entry to `specialistAgents` in `agents/index.ts`. That is the whole
   registration — the root agent's prompt does not change.
