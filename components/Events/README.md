# Events panel

The realtime debug column. It has two tabs, owned by `EventsPanel.tsx`:

| Tab           | Shows                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------- |
| `Events`      | The transport log. `lib/EventProcessor` renders each `TransportEvent` into `useChatStore.events`. |
| `SDK history` | A read-only mirror of the SDK's own `session.history`, for comparison against the transcript.     |

They are tabs rather than one list because they answer different questions and do not share a
timeline: history is always later than the events that produced it.

Everything in this folder is a **view**. Nothing here writes to the transcript.

## Recorded vs displayed

Two different things decide whether you see an event, and they are deliberately not the same
control:

| Control                             | Where               | Effect                                                                   |
| ----------------------------------- | ------------------- | ------------------------------------------------------------------------ |
| `eventsLogLevel` (`info`/`verbose`) | Settings dialog     | **Recording.** `info` never writes non-structural events into the store. |
| Category chips + search box         | Events panel header | **Display.** Nothing is dropped; hidden events stay in the store.        |
| `renderToolCalls`                   | Settings dialog     | Display filter for tool-call events, applied before the chips.           |

The header reads `shown / retained` so the gap is always visible. Switching a category back on
reveals its history — filters never rewrite the log, which is why they are not wired into
`EventProcessor`'s recording gate.

There is a third, non-negotiable limit underneath both: `events` is a ring buffer of the most
recent `EVENT_LOG_LIMIT` (2000) entries, defined in `hooks/useChatStore/useChatStore.tsx`. Nothing
else ever shortens it — `reset()` deliberately spares the log on reconnect and `clearEvents()` only
runs when you press Clear — so without a cap a tab left open across sessions grows without bound at
~90 verbose events per turn, each holding its full `rawEvent` and a cached search haystack. 2000 is
roughly ten long sessions and sits well above the 920-event measurement below.

## Categories

Defined once in [`categories.ts`](./categories.ts). Every transport event type belongs to exactly
one category, so the chips partition the log rather than overlap.

| Category       | Covers                                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `Session`      | `session.created`, `session.updated`                                                                                                    |
| `Conversation` | `conversation.item.added` / `.done` / `.retrieved`                                                                                      |
| `Response`     | `response.created` / `.done`, `response.output_item.*`, `response.content_part.*`                                                       |
| `Transcript`   | `response.output_audio_transcript.done`, `conversation.item.input_audio_transcription.completed`                                        |
| `Delta`        | `response.output_audio_transcript.delta`, `conversation.item.input_audio_transcription.delta`, `response.function_call_arguments.delta` |
| `Audio`        | `input_audio_buffer.*`, `output_audio_buffer.*`, `response.output_audio.done`                                                           |
| `Tool`         | `response.function_call_arguments.done`                                                                                                 |
| `RateLimit`    | `rate_limits.updated`                                                                                                                   |

`Delta` is its own category rather than living inside `Transcript` because the streaming chunks —
not the finished transcripts — are what drowns a turn: a captured session logged 126 deltas against
58 of everything else. It is the one category hidden by default (`DEFAULT_HIDDEN_CATEGORIES`), so a
turn opens as a readable handful while the finished transcript, which is the most useful single
line in the log, stays on screen.

There is no `Error` category: the transport union carries no error event type, and
`EventProcessor` drops unknown types before they reach the store, so the chip could only ever
read `0`.

## The `SDK history` tab

`RealtimeSession` keeps a server-authoritative `history: RealtimeItem[]` and emits
`history_updated`. We do **not** build the transcript from it — the reasoning is written up once in
[`lib/EventProcessor/SdkHistory.md`](../../lib/EventProcessor/SdkHistory.md) — but it is a useful
oracle when the transcript looks wrong, so the panel shows it verbatim.

The path is deliberately one-way: `useSession` forwards `history_updated` to
`useChatStore.sdkHistory`, `HistoryPanel` reads it, and that is the end. It never reaches
`finalisedMessages`/`activeMessage`, never feeds the extractor, and is never written back to the
session (`updateHistory` throws on assistant audio items anyway).

Two items in a normal session look like transcript bugs and are not, so `historyItems.ts` labels
them in place instead of filtering them out:

- **`app-injected`** — a text-only user message. In a voice session that means the app sent it
  through `session.sendMessage()`; the greeting primer lands here.
- **`frozen at in_progress`** — the SDK records a `function_call` with `output: null` and never
  revisits it. The result still reached the model.

## Adding a new event type

1. Add the string to `TRANSPORT_EVENT_TYPES` and its payload type to `TTransportEvent`
   (`types/TransportEvents.ts`).
2. `bunx tsc --noEmit` now fails in **two** places, both mapped types over `TTransportEventType`:
   - `rendererMap` in [`renderers/index.ts`](./renderers/index.ts) — write the renderer.
   - `EVENT_CATEGORY_BY_TYPE` in [`categories.ts`](./categories.ts) — pick the category.

That is the whole safety net: neither map has a fallback branch, so an event type can neither
render as "unknown" nor fall outside every chip without the build stopping first.

## Files

| File                   | Responsibility                                                        |
| ---------------------- | --------------------------------------------------------------------- |
| `EventsPanel.tsx`      | The column shell and the `Events` / `SDK history` tab switch          |
| `EventList.tsx`        | Events tab: header, search box, scroll container, row list            |
| `EventFilterBar.tsx`   | Category chips with live counts, solo (alt-click), All / None         |
| `EventsEmptyState.tsx` | Explains an empty list and offers a one-click reset                   |
| `EventCard.tsx`        | One row. `memo`d, and the list hands it stable callbacks              |
| `useEventFilters.ts`   | One memoised pass producing the visible list and every chip count     |
| `categories.ts`        | The taxonomy and its exhaustiveness check                             |
| `renderers/`           | Per-event-type `TransportEvent → TRenderedEvent`                      |
| `HistoryPanel.tsx`     | SDK history tab: the inline explanation and the empty states          |
| `HistoryItemCard.tsx`  | One `RealtimeItem` row                                                |
| `historyItems.ts`      | `RealtimeItem → printable row`, plus the two "expected oddity" labels |

## Performance

No windowing. Measured in headless Chrome with the real renderers: at 920 events (five long
sessions' worth) a full re-filter and list re-render takes ~35 ms unthrottled and ~125 ms under a
4× CPU throttle, and the hot path — one event appended to that list — stays inside a single frame
because rows are `memo`d behind stable callbacks. `useEventFilters` also caches each event's
search haystack in a `WeakMap`, so `JSON.stringify` runs once per event rather than once per
keystroke. Revisit windowing only if a session routinely exceeds a few thousand events.
