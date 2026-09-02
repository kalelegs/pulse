# Events panel

The realtime debug column. It has two tabs, owned by `EventsPanel.tsx`:

| Tab           | Shows                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| `Events`      | The transport log. `lib/events/logTransportEvent` renders each `TransportEvent` into `useEventLogStore.events`. |
| `SDK history` | A read-only mirror of the SDK's own `session.history`, for comparison against the transcript.                   |

They are tabs rather than one list because they answer different questions and do not share a
timeline: history is always later than the events that produced it.

Everything in this folder is a **view**. Nothing here writes to the transcript.

## Where the pieces live

Import direction is `components → hooks → lib → types`; nothing in `lib/` or `types/` reaches back
into `components/`.

| Layer                          | Holds                                                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `types/transportEvents/`       | `TRANSPORT_EVENT_TYPES`, one payload type per event, the `TTransportEvent` union                                        |
| `types/events.ts`              | `EEventCategory` (the chips), `EEventKind` (the badges), `TRenderedEvent`, `TRenderTone`                                |
| `types/EventLogStore.ts`       | `TEventLogStore` — everything the panel owns                                                                            |
| `lib/events/categories.ts`     | `EVENT_CATEGORY_BY_TYPE`, `getEventCategory`, `isToolCallEvent`                                                         |
| `lib/events/renderers/`        | Per-event-type `TransportEvent → TRenderedEvent`, grouped by event family                                               |
| `lib/events/renderEvent.ts`    | The renderer map and `renderTypedEvent`                                                                                 |
| `lib/events/logTransportEvent` | The panel's ingest: applies the log level, renders, appends to the store                                                |
| `hooks/useEventLogStore/`      | The zustand store: `events` ring buffer, hidden categories, `renderToolCalls`, `eventsLogLevel`, the SDK history mirror |
| `components/Events/`           | The views below, plus `categoryMeta.ts` (chip labels and hints) and `tones.ts` (`EEventKind → TRenderTone`)             |

## Recorded vs displayed

Two different things decide whether you see an event, and they are deliberately not the same
control:

| Control                             | Where               | Effect                                                                   |
| ----------------------------------- | ------------------- | ------------------------------------------------------------------------ |
| `eventsLogLevel` (`info`/`verbose`) | Settings dialog     | **Recording.** `info` never writes non-structural events into the store. |
| Category chips + search box         | Events panel header | **Display.** Nothing is dropped; hidden events stay in the store.        |
| `renderToolCalls`                   | Settings dialog     | Display filter for `isToolCallEvent` rows, applied before the chips.     |

The header reads `shown / retained` so the gap is always visible. Switching a category back on
reveals its history — filters never rewrite the log, which is why they are not wired into
`logTransportEvent`'s recording gate.

There is a third, non-negotiable limit underneath both: `events` is a ring buffer of the most
recent `EVENT_LOG_LIMIT` (2000) entries, defined in `hooks/useEventLogStore/useEventLogStore.ts`.
Nothing else ever shortens it — the chat store's `reset()` does not touch this store, so a
reconnect spares the log, and `clearEvents()` only runs when you press Clear — so without a cap a
tab left open across sessions grows without bound at ~90 verbose events per turn, each holding its
full `rawEvent` and a cached search haystack. 2000 is roughly ten long sessions and sits well
above the 920-event measurement below.

## Categories

`EEventCategory` is declared in `types/events.ts`; the type-to-category map is
`EVENT_CATEGORY_BY_TYPE` in [`lib/events/categories.ts`](../../lib/events/categories.ts), and the
chip labels and hints are in [`categoryMeta.ts`](./categoryMeta.ts). Every transport event type
belongs to exactly one category, so the chips partition the log rather than overlap.

`Delta` is its own category rather than living inside `Transcript` because the streaming chunks —
not the finished transcripts — are what drowns a turn: a captured session logged 126 deltas against
58 of everything else. It is the one category hidden by default (the store's initial
`hiddenEventCategories`), so a turn opens as a readable handful while the finished transcript, which
is the most useful single line in the log, stays on screen.

"Tool call" has one definition, `isToolCallEvent` in `lib/events/categories.ts`, and it is wider
than the `Tools` chip: the chip partitions by event type and so holds only completed
function-call arguments, while the Settings switch also hides argument deltas and the
`function_call` / `function_call_output` items that sit under `Conversation` and `Response`.

There is no `Error` category: the transport union carries no error event type, and
`logTransportEvent` drops unknown types before they reach the store, so the chip could only ever
read `0`.

## The `SDK history` tab

`RealtimeSession` keeps a server-authoritative `history: RealtimeItem[]` and emits
`history_updated`. We do **not** build the transcript from it — the reasoning is written up once in
[`lib/EventProcessor/SdkHistory.md`](../../lib/EventProcessor/SdkHistory.md) — but it is a useful
oracle when the transcript looks wrong, so the panel shows it verbatim.

The path is deliberately one-way: `useSession` forwards `history_updated` to
`useEventLogStore.sdkHistory`, `HistoryPanel` reads it, and that is the end. It never reaches
`finalisedMessages`/`activeMessage`, never feeds the extractor, and is never written back to the
session (`updateHistory` throws on assistant audio items anyway).

Two items in a normal session look like transcript bugs and are not, so `historyItems.ts` labels
them in place instead of filtering them out:

- **`app-injected`** — a text-only user message. In a voice session that means the app sent it
  through `session.sendMessage()`; the greeting primer lands here.
- **`frozen at in_progress`** — the SDK records a `function_call` with `output: null` and never
  revisits it. The result still reached the model.

## Adding a new event type

1. Add the string to `TRANSPORT_EVENT_TYPES` (`types/transportEvents/names.ts`), its payload type
   to the matching family file, and the payload to the `TTransportEvent` union
   (`types/transportEvents/index.ts`).
2. `bunx tsc --noEmit` now fails in **two** places, both mapped types over `TTransportEventType`:
   - `RENDERER_BY_TYPE` in [`lib/events/renderEvent.ts`](../../lib/events/renderEvent.ts) — write
     the renderer, picking an `EEventKind` for its badge.
   - `EVENT_CATEGORY_BY_TYPE` in [`lib/events/categories.ts`](../../lib/events/categories.ts) —
     pick the category.

That is the whole safety net: neither map has a fallback branch, so an event type can neither
render as "unknown" nor fall outside every chip without the build stopping first. A new
`EEventKind` additionally needs a tone in `tones.ts`, which `Record<EEventKind, …>` enforces.

## Files

| File                   | Responsibility                                                        |
| ---------------------- | --------------------------------------------------------------------- |
| `EventsPanel.tsx`      | The column shell and the `Events` / `SDK history` tab switch          |
| `EventList.tsx`        | Events tab: header, search box, scroll container, row list            |
| `EventFilterBar.tsx`   | Category chips with live counts, solo (alt-click), All / None         |
| `EventsEmptyState.tsx` | Explains an empty list and offers a one-click reset                   |
| `EventCard.tsx`        | One row. `memo`d, and the list hands it stable callbacks              |
| `useEventFilters.ts`   | One memoised pass producing the visible list and every chip count     |
| `categoryMeta.ts`      | Chip labels and hints, in chip order                                  |
| `tones.ts`             | Row and badge colours per `EEventKind`, plus the history role tones   |
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
