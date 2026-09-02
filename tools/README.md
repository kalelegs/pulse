# Tools

Every functional tool the agents can call. Tools run **in the browser**, inside
the realtime session, which is what lets them touch application state directly —
a tool can fetch data, update the chat store and draw on the screen in the same
call.

## Layout

```
tools/
  index.ts             the registry — one named tool set per agent
  weather.ts           get_weather_for_city  (typed experience)
  stockQuote.ts        get_stock_quote       (typed experience: quote or comparison card)
  stockHistory.ts      get_stock_history     (typed experience: chart card)
  stockNews.ts         get_stock_news        (typed experience: timeline card)
  stockReports.ts      calls the stock server action and splits its results
  renderUi.ts          render_ui             (model-authored experience)
  attachSpec.ts        puts a spec on the assistant's reply bubble
  catalogReference.ts  compact block vocabulary for render_ui's description
  specSchema.ts        strict-mode-safe parameters for a model-authored spec
  specChecks.ts        per-block props + action binding checks for that spec
```

## Per-agent tool sets

`index.ts` exports one array per agent — `assistantTools` (weather +
`render_ui`) and `stockAnalystTools` (the three stock tools + `render_ui`) —
each passed through the same `enabled()` filter, so a global switch such as
`ENABLE_GENERATIVE_UI_TOOL` applies everywhere at once. A realtime session only
carries the _current_ agent's tools, so a set is also that agent's tool budget:
the root agent never pays for the stock tools, and `render_ui` is in every set
because its cost is worth paying wherever a custom panel may be needed.

## Tools that need the server

Tools run in the browser, but the stock tools cannot fetch their data there:
Yahoo Finance wants a browser-like `User-Agent` a page cannot set, and Finnhub
wants a key that must never reach the client. They call the
`actions/getStockReports.ts` server action instead, which runs `lib/stocks`
on the server and returns typed `TStockResult`s. The tool is still the one that
builds the spec, attaches it and returns the summary — only the fetch moved.

## The contract: speak a summary, render a spec

A tool that has something visual to show does **both** halves:

1. `attachSpecToReply(spec)` — puts the UI on screen.
2. `return` a short **natural-language summary** — this is what the model says
   out loud.

The returned string is the only thing the model sees, so it is also where the
"do not read the card out field by field" instruction lives. Speech gets the
headline; the eyes get the detail. A voice assistant that reads a table aloud is
worse than one that never rendered it.

Specs are built by typed TypeScript (`lib/spec-builders/`), not generated token
by token, so the card is complete and schema-valid the moment the tool resolves —
no partial layout is ever shown, and the model cannot hallucinate a broken one.

## Which message the card lands on

`attachSpecToReply` exists because `attachSpecToMessage(spec)` with no message id
does **not** work from a tool. A tool call splits one assistant turn into two
conversation items: the announcement ("let me check that") is finalised and
cleared from `activeMessage` _before_ the `function_call` item is delivered, so
at `execute` time there is no active message and the no-id path is a silent
no-op. The answer bubble does not exist yet either — `execute` has to return
before the SDK submits the output that creates it.

`attachSpecToReply` returns immediately and finishes from a chat-store
subscription: it claims the answer bubble and attaches with an explicit id the
moment that bubble opens — on the `setActiveMessage` behind
`response.output_item.added`, roughly one round trip after `execute` returns and
before the first transcript delta. Replaying `docs/fixtures/events.log.json` through
`createMessageExtractor` puts that at event 126, against 177 for the older
attach-on-finalisation behaviour: the card is on screen for the whole spoken
answer instead of appearing after it.

It attaches early because nothing renders a spec as a skeleton —
`AssistantMessage` does not pass `loading` to the render surface — and the card
survives what follows because both `appendContentToActiveMessage` and
`assistantTurn.finalise` copy the active message.

Identifying the answer bubble takes two conditions, because "new" is not enough
on its own:

- **not seen at `execute` time** — the announcement bubble, active or already
  finalised, is excluded.
- **from a later response** — `execute` runs _inside_ the response that made the
  `function_call`, and that response may legally emit another message item
  afterwards. The tool captures `useChatStore.responseId` (stamped from
  `response.created`) and waits for a bubble from a different one, so a late
  "one moment…" in the same response cannot take the card. A transport that does
  not label its responses leaves `responseId` `undefined` and the claim falls
  back to "the next new bubble".

A 10 second window bounds the wait: if the reply bubble never opens (the
response was cancelled, the session dropped) the subscription is dropped rather
than left to claim a later, unrelated turn. A pending attach can never cross
into the next session either: `useChatStore.reset()` increments `sessionEpoch`,
and a change to the epoch captured at `execute` time abandons the attach
immediately. The signal is the epoch and not an empty transcript, because
`userTurn` retracts a slot whose audio held nothing — a cough on the first turn
empties a perfectly live transcript, and inferring "the session ended" from that
used to throw the weather card away.

Two tools in one turn both claim the same answer bubble. A message holds one
spec, so the last to resolve wins and the overwrite is logged with
`console.warn`.

## Adding a tool

1. Create `tools/myTool.ts` (tools contain no JSX, so `.ts`):

   ```ts
   'use client';

   import { tool } from '@openai/agents';
   import { z } from 'zod';
   import { attachSpecToReply } from '@/tools/attachSpec';

   const myTool = tool({
     name: 'my_tool',
     description: 'What it does, and that it renders its own card.',
     // Strict mode is always on: optionals MUST be `.nullable()`, never `.optional()`.
     parameters: z.object({ query: z.string().describe('…') }),
     async execute({ query }) {
       const spec = createMySpec(await load(query));
       attachSpecToReply(spec);
       return 'One sentence for the model to say. Do not read the card aloud.';
     },
   });

   export default myTool;
   ```

2. Add one line to the right set in `tools/index.ts`. That is the whole
   registration — the agent already consumes its set.

Keep the data layer out of the tool. `tools/weather.ts` is ~55 lines because
fetching lives in `lib/weather/` behind `TWeatherProvider` and the card lives in
`lib/spec-builders/weather.ts`; the tool only wires the three together. The
stock tools follow the same split with `lib/stocks/` and
`lib/spec-builders/stock*.ts`, plus `tools/stockReports.ts` for the server hop.

## `render_ui`, the escape hatch

`render_ui` lets the model author its own spec for requests the typed builders do
not cover. Two things about it are load-bearing:

- **Its parameters are hand-written, not `jsonRenderCatalog.jsonSchema()`.** That
  export cannot expand `z.record`, so under `strict: true` the `elements` map
  degenerates to an opaque empty object. `tools/specSchema.ts` instead takes
  `elements` as a flat **array** with per-element `key`, and `props`/`on` as JSON
  **strings** — both shapes survive OpenAI's strict-mode conversion, which
  rejects open-ended maps for the same reason, and models emit flat arrays more
  reliably than keyed objects.
- **Everything is validated before it is shown.** `toJsonRenderSpec` parses the
  JSON, checks key and child references, runs `jsonRenderCatalog.validate()`
  for the element envelope, then (`tools/specChecks.ts`, reading `lib/json-render/blocks`) runs each block's own
  Zod props schema over its `props` and checks every `on.<event>` binding names
  a `blockActions` action with the params it declares. The catalog check alone
  is not enough — it types `props` loosely, so a `TableBlock.columns` of
  `"Day,High"` would pass it and throw on screen after the model had been told
  the panel was up. An invalid spec never reaches the render surface; the model
  gets `key.path: message` lines describing what was wrong and can retry.

## Instruction budget

Realtime sessions send instructions _and_ every tool definition on connect, so
both come out of the same budget. `jsonRenderCatalog.prompt()` is 26,298
characters (~6.7k tokens) and, worse, describes a different protocol — it tells
the model to stream RFC-6902 JSONL patches and invent sample data, neither of
which applies to a spec arriving as tool arguments. `tools/catalogReference.ts`
generates a 7,118-character (~1.7k token) equivalent from `blockDefinitions`
instead, states the 55-name icon set once rather than once per icon-bearing
block, and cannot drift when a block is added. It lives in `render_ui`'s
description so the cost travels with the tool; `ENABLE_GENERATIVE_UI_TOOL` in
`tools/index.ts` turns it off entirely.
