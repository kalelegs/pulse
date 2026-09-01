# Chat Components

The chat transcript UI, plus the message lifecycle that feeds it.

## Pipeline

```
RealtimeSession ──transport_event──▶ RealtimeExperience.onTransportEvent
                                        │
                     ┌──────────────────┴──────────────────┐
                     ▼                                     ▼
   lib/EventProcessor/EventProcessor      lib/EventProcessor/messageExtractor
   (debug panel, components/Events)       (chat messages)
                                                  │ TMessageSink
                                                  ▼
                                        hooks/useChatStore (zustand)
                                          finalisedMessages / activeMessage
                                                  │
                                                  ▼
                                        components/Chat/MessageList
                                                  │
                                    ┌─────────────┴─────────────┐
                                    ▼                           ▼
                              UserMessage                AssistantMessage
                                                                │ message.spec
                                                                ▼
                                            components/json-render/JsonRenderSurface
```

`RealtimeExperience` hands every transport event to both consumers. They share nothing: removing
one does not affect the other.

## Message extraction

`createMessageExtractor(sink)` (`lib/EventProcessor/messageExtractor.tsx`) holds the per-turn
bookkeeping; all message state lives in the sink (`chatMessageSink`, the zustand store). One
message per conversation item, keyed by the transport `item_id`.

### Assistant

| Event                                                                   | Effect                                                       |
| ----------------------------------------------------------------------- | ------------------------------------------------------------ |
| `response.created`                                                      | starts the turn clock                                        |
| `response.output_item.added` (`item.type === 'message'`)                | `setActiveMessage` — empty bubble with a typing indicator    |
| `response.output_audio_transcript.delta` / `response.output_text.delta` | `appendContentToActiveMessage`, records `duration.textStart` |
| `output_audio_buffer.started` / `.stopped`                              | records `duration.audioStart` / `audioEnd`                   |
| `response.output_audio_transcript.done` / `response.output_text.done`   | finalises with the authoritative full transcript             |
| `response.done`                                                         | finalises anything still streaming; resolves a barge-in      |

`response.created` also stamps the response id every item that follows belongs to
(`lib/EventProcessor/responseTracker.tsx`). A tool call ends one response and the submitted output
starts another, and the two overlap on the wire — `response.done` for the first can arrive after
the second is already streaming. Every response-scoped decision is therefore checked against that
id: the `response.done` safety-net finalise only fires for the response that is current (otherwise
it would seal the item the _next_ response is still writing and drop every delta after it), and a
barge-in is settled only by its own response's `response.done`. Anything still open when a new
`response.created` arrives is closed as heard.

Timing lives in `lib/EventProcessor/turnDurations.tsx`. Three of the four numbers are measured
while the message is still streaming, but `audioEnd` cannot be: audio finishes _playing_ after the
transcript `.done` that finalises the message — `output_audio_buffer.stopped` lands after
`response.output_audio_transcript.done` in every turn of `events.log.json` — so it is upserted onto
the finalised message instead. `output_audio_buffer.*` carries a `response_id` and no `item_id`, so
`output_audio_buffer.started` remembers both the item **and** the response clock its playback is
timed against.

Remembering the clock matters because playback can outlive its response: the log has three
`started` against two `stopped`, so a `stopped` may arrive after `response.created` has restarted
the clock for the next response, or never arrive at all. `audioEnd` is therefore measured against
the epoch captured at `started` and written **only** to that item's finalised message — never to
the duration of the item streaming now. A response whose buffer never stops keeps `audioEnd: 0`,
including when the next `started` arrives with the previous one still open.

Deltas are only ever additive, so the `.done` payload wins over the accumulated deltas — a lost or
duplicated delta cannot corrupt a finalised message. Finalised item ids are sealed, so a repeated
`.done`, or a late delta, is ignored. A `.done` for an item that never became active still produces
a message (its payload carries the whole text), and a turn that produced no text at all is
discarded instead of rendered as an empty bubble.

Because a tool call splits an assistant turn into two items, one turn can produce two bubbles —
matching what the user actually hears.

### User

Input transcription is asynchronous and normally lands _after_ the assistant has started replying,
so appending on `completed` would put the user's bubble below the reply. Instead:

| Event                                                   | Effect                                                                                      | `isPending` |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------- |
| `input_audio_buffer.committed`                          | `upsertFinalisedMessage` with empty content — reserves the slot in turn order               | `true`      |
| `conversation.item.input_audio_transcription.delta`     | upserts the growing transcript in place, one word at a time                                 | `true`      |
| `conversation.item.input_audio_transcription.completed` | upserts the authoritative transcript, or **retracts the slot** when the transcript is empty | `false`     |
| `conversation.item.input_audio_transcription.failed`    | upserts `[transcription unavailable]`, keeping any partial text that did arrive             | `false`     |
| 15s timeout after the commit                            | resolves an unfilled — or half-filled — slot the same way `failed` does                     | `false`     |
| `reset()` (disconnect)                                  | resolves every slot still open, because the timers that would have done it are about to go  | `false`     |

`isPending` is the flag on `TMessage`, and it is what `UserMessage` renders the streaming cue from.
Emptiness cannot stand in for it: a half-transcribed bubble has text and is still arriving, and a
resolved one may legitimately hold the placeholder. The three states it produces are "Transcribing"
plus dots, partial text plus dots, and text alone.

A reserved slot must always resolve, because an unresolved one shows a streaming cue forever. The
ways it used to hang:

- **an empty `completed`** — a cough or a slammed door trips server VAD, the service transcribes
  silence and reports success with `transcript: ""`. Falling back to the (also empty) accumulated
  content re-committed an empty bubble. A non-event now leaves no trace: the slot is retracted.
- **transcription that never arrives** — it runs on the committed audio buffer, off to the side of
  the response, so a healthy conversation does not guarantee it. The timeout resolves the slot to
  the unavailable placeholder rather than leaving it spinning. Deltas deliberately do **not** clear
  that timeout: a stream that produces three words and then stops is as unfilled as one that never
  started, and the timeout is the only thing left to notice.
- **a disconnect mid-transcription** — `reset()` drops the timers, so anything still open had to be
  resolved first or it would stream for the rest of the tab's life.

`failed` keeps the placeholder rather than retracting, because there _was_ speech the service could
not read and the assistant may well have replied to it.

The bubble cannot appear before the end of the utterance, and no amount of client code changes
that: transcription starts on `input_audio_buffer.committed`, which _is_ end-of-speech. What the
deltas buy is a bubble that fills in progressively instead of in one jump — how visible that is
depends on how fast the transcription model returns, and for a short sentence it can be a single
frame. The model is pinned rather than inherited (`TRANSCRIPTION_MODEL` in `lib/utils.ts`) so it
cannot silently become one that returns the whole transcript at once.

Text turns injected by the app (`session.sendMessage`, e.g. the hidden greeting prompt on connect)
are intentionally **not** rendered — they are instructions to the model, not user speech. The one
exception is a tapped suggestion chip, which echoes itself into the transcript; see below.

### Interruption / barge-in

`input_audio_buffer.speech_started` is the user starting to talk, and the only event that starts the
speech clock. `conversation.item.truncated` is the server acknowledging that the _assistant's_
audio was cut (payload: `item_id`, `audio_end_ms`, `content_index`); it also counts as an
interruption but must not touch the clock, or every user duration is understated by the barge-in
latency.

While an assistant message is streaming:

- **no text yet** → left untouched, so a false-positive VAD trigger cannot destroy a reply that is
  about to arrive.
- **has text already** → finalise it as-is, so the transcript holds exactly what the user heard —
  but do **not** seal the item. Whether the reply actually stops depends on turn detection, which
  this app never configures: with `interrupt_response: false`, or a semantic VAD that does not
  cancel, the assistant talks straight through the interjection. `lib/EventProcessor/bargeIn.tsx`
  holds the item open until **its own** `response.done` reports the outcome — deltas that keep
  arriving extend the bubble in place, a `.done` is stashed and applied only if the response was
  **not** cancelled, and `status: 'cancelled'` seals the item at what was heard. The ledger is
  keyed by response id: a later response completing normally says nothing about whether an earlier
  one was cancelled, and using its verdict would re-inflate the barged-in bubble with words the
  user never heard.

### Session lifecycle

`messageExtractor.reset()` runs from `useSession`'s `onDisconnect`: it finalises the half-spoken
reply as heard (rather than stranding it in `activeMessage` behind a permanent typing indicator)
and drops the per-session maps that would otherwise grow for the lifetime of the tab.

`onConnect` then clears the transcript with `useChatStore.reset()` before the first turn. A realtime
session starts with no server-side history, so **each connect starts a fresh transcript** —
carrying the old one over would show the model remembering things it was never told. Clearing on
connect rather than on disconnect means a hung-up conversation stays readable until the next one
begins.

`reset()` also increments `sessionEpoch`. That counter, not an empty transcript, is what work
outliving a single event checks to decide the session changed: a user slot can be retracted down to
an empty transcript in a perfectly live session (a cough, a slammed door), so emptiness proves
nothing. `tools/attachSpec` captures the epoch and gives up the moment it moves.

Because the transcript survives a disconnect, its interactive parts must not. `RealtimeExperience`
drops `onSpecAction` while disconnected, so suggestion chips on the old transcript are inert rather
than firing into a closed session.

## Generative UI

`TMessage.spec` carries an optional `TJsonRenderSpec`. `useChatStore.attachSpecToMessage(spec, id?)`
attaches one; omitting `id` targets `activeMessage`, i.e. "here is a spec for the message being
spoken right now" — the entry point for an agent tool emitting a spec mid-turn. Because
finalisation copies the store's active message, a spec attached mid-turn survives it.

`AssistantMessage` renders the spec through `JsonRenderSurface` and does **not** pass `loading`:
specs are never streamed, so one is complete the moment it arrives. Passing the transcript's
streaming flag showed a finished card as skeleton bars for the rest of the spoken reply.

`onAction` is wired in `./specActions`. `suggest` sends the chip's `text` to the agent as a user
turn and, **once the send has succeeded**, echoes it into the transcript as a user bubble —
`sendMessage` injects a conversation item the extractor deliberately does not render, so without
the echo the reply would appear with nothing prompting it. `sendMessage` returns `false` when there
is no live session; echoing before checking would show the user saying something the model has no
record of, with no reply ever coming. `select` is a documented no-op: no shipped block binds it and
there is no form state for a choice to land in.

## Scrolling

The chat column in `RealtimeExperience` is the scroller. `useChatAutoScroll` finds it by walking up
the DOM, sticks to the bottom as content grows, and stops as soon as the user scrolls away —
offering a "Jump to latest" button instead.

Growth is detected with a `ResizeObserver` on the list, not from a render-derived signal. A signal
can only encode the height changes someone thought to put in it, and the ones that matter most here
are invisible to render props — message count and streaming text are both unchanged while:

- **a barge-in rewrites an already-finalised bubble** (`bargeIn.rewrite`): the assistant talked
  through the interjection, so the bubble the user is reading grows a line at a time after it was
  finalised.
- **`audioEnd` is upserted onto a finalised message** (`turnDurations.recordAudioEnd`): playback
  stops after the transcript `.done`, and the duration line it fills in changes the bubble's
  height.
- an image finishes loading after paint, or a font swaps in.

The same observer covers the user bubble filling in word by word: each delta is an upsert, the
bubble reflows, and the list's height changes — which is a resize, not a signal anyone had to
remember to publish.

## Announcements

Only one live region exists, and it is on the **assistant's** streaming text (`aria-live="polite"`,
rendered only while `isStreaming`; a finalised transcript in a live region would be re-announced in
full on every re-render).

The user's own transcript deliberately has none. Those are words the person just said out loud, and
they arrive a fragment at a time — a polite region would queue up an announcement per delta to read
a sentence back to its author. What is worth announcing is that transcription is happening at all,
and `TypingIndicator`'s `role="status"` already does that once, from its `sr-only` label. It stays
mounted across the hand-off from placeholder to partial text, so it announces once rather than on
every state change.
