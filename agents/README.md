# Agent Definitions

Definitions for every agent. Agents are `RealtimeAgent` instances: a name, a
voice, an instruction builder and a set of tools.

## Instructions are built per run

`instructions` is a function, not a string, so it can read the session context:

```ts
const buildInstructions = (runContext: RunContext<TSessionContext>) => `…`;
```

`runContext.context` is the `TSessionContext` passed when the session is created
— currently the user's name and their preference list, both interpolated by
`initial.ts`.

## Instruction budget

A realtime session sends the instructions **and every tool definition** in its
connect payload, so both come out of the same budget and both add connect
latency. Keep the system prompt to what only it can say — who the agent is, how
it should behave, and _when_ to reach for a tool. Anything that describes a
single tool's inputs belongs in that tool's `description`, where it travels with
the tool if it later moves behind a handoff.

That is why `initial.ts` never inlines `jsonRenderCatalog.prompt()`: at 26,298
characters (~6.7k tokens) it would dominate the prompt, and it teaches a
JSONL-patch protocol that does not apply to specs arriving as tool arguments.
The block vocabulary lives in `render_ui`'s description instead — see
`tools/README.md`.

## Tools

Import `agentTools` from `@/tools`, never individual tool modules, so a tool is
never silently available to one agent and missing from another.
