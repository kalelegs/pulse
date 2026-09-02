# Chat Components

The chat transcript UI, plus the message lifecycle that feeds it.

## Pipeline

```
RealtimeSession ──transport_event──▶ RealtimeExperience.onTransportEvent
                                        │
                     ┌──────────────────┴──────────────────┐
                     ▼                                     ▼
   lib/events/logTransportEvent           lib/EventProcessor/messageExtractor
   (debug panel, components/Events)       (chat messages)
              │                                   │ TMessageSink
              ▼                                   ▼
   hooks/useEventLogStore               hooks/useChatStore (zustand)
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

`RealtimeExperience` hands every transport event to both consumers; they share nothing.

## Message extraction

`createMessageExtractor(sink)` (`lib/EventProcessor/messageExtractor.ts`) holds the per-turn
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
(`lib/EventProcessor/responseTracker.ts`). A tool call ends one response and the submitted output
starts another, and the two overlap on the wire — `response.done` for the first can arrive after
the second is already streaming. Every response-scoped decision is therefore checked against that
id: the `response.done` safety-net finalise only fires for the response that is current (otherwise
it would seal the item the _next_ response is still writing and drop every delta after it), and a
barge-in is settled only by its own response's `response.done`. Anything still open when a new
`response.created` arrives is closed as heard.

Timing lives in `lib/EventProcessor/turnDurations.ts`. Three of the four numbers are measured
while the message is still streaming, but `audioEnd` cannot be: audio finishes _playing_ after the
transcript `.done` that finalises the message — `output_audio_buffer.stopped` lands after
`response.output_audio_transcript.done` in every turn of `docs/fixtures/events.log.json` — so it is
upserted onto the finalised message instead. `output_audio_buffer.*` carries a `response_id` and no
`item_id`, so `output_audio_buffer.started` remembers both the item **and** the response clock its
playback is timed against.

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
discarded instead of rendered as an empty bubble. Because a tool call splits an assistant turn
into two items, one turn can produce two bubbles — matching what the user actually hears.

### User

Input transcription is asynchronous and normally lands _after_ the assistant has started replying,
so appending on `completed` would put the user's bubble below the reply. Instead:

| Event                                                   | Effect                                                                                      | `pending`      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------- |
| `input_audio_buffer.speech_started`                     | `upsertFinalisedMessage` with empty content — reserves the slot in turn order               | `listening`    |
| `input_audio_buffer.committed`                          | end of speech; arms the transcription timeout (and reserves the slot if nothing did)        | `transcribing` |
| `conversation.item.input_audio_transcription.delta`     | upserts the growing transcript in place, one word at a time                                 | `transcribing` |
| `conversation.item.input_audio_transcription.completed` | upserts the authoritative transcript, or **retracts the slot** when the transcript is empty | `undefined`    |
| `conversation.item.input_audio_transcription.failed`    | upserts `[transcription unavailable]`, keeping any partial text that did arrive             | `undefined`    |
| 15s timeout after the commit                            | resolves an unfilled — or half-filled — slot the same way `failed` does                     | `undefined`    |
| `reset()` (connect / disconnect)                        | resolves every slot still open, because the timers that would have done it are about to go  | `undefined`    |

`pending` is the stage on `TMessage`, and it is what `UserMessage` renders its cue from. Emptiness
cannot stand in for it: a half-transcribed bubble has text and is still arriving, and a resolved one
may legitimately hold the placeholder. Its states are listening bars (`ListeningIndicator`) while
the microphone is still capturing, "Transcribing" plus dots once the audio is committed, partial
text plus dots, and text alone — one dots element from commit onwards, so the first word neither
restarts the animation nor moves the bubble.

A reserved slot must always resolve, because an unresolved one shows a streaming cue forever. The
ways a slot can be left hanging, and what closes each:

- **an empty `completed`** — a cough or a slammed door trips server VAD, the service transcribes
  silence and reports success with `transcript: ""`. A non-event leaves no trace: the slot is
  retracted rather than re-committed from the (also empty) accumulated content.
- **transcription that never arrives** — it runs off to the side of the response, so a healthy
  conversation does not guarantee it. The timeout resolves the slot to the placeholder. Deltas do
  **not** clear it: three words then silence is as unfilled as nothing, and only the timeout notices.
- **a disconnect mid-transcription** — `reset()` resolves everything still open before its timers go.

`failed` keeps the placeholder rather than retracting: there _was_ speech, and the assistant may
well have replied to it.

The bubble appears the moment the user starts talking — `speech_started` already carries the
`item_id` the turn will become — but its _text_ cannot arrive before the end of the utterance:
transcription starts on `input_audio_buffer.committed`, which _is_ end-of-speech, and how long the
server takes to decide that is turn detection's call (the SDK defaults to `semantic_vad`). What
the deltas buy is a bubble that fills in progressively instead of in one jump — for a short
sentence that can be a single frame. The model is pinned rather than inherited (`TRANSCRIPTION_MODEL` in `lib/realtimeConfig.ts`)
so it cannot silently become one that returns the whole transcript at once.

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
  cancel, the assistant talks straight through the interjection. `lib/EventProcessor/bargeIn.ts`
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

`onConnect` runs it again, then clears the transcript with `useChatStore.reset()`: a realtime
session starts with no server-side history, so **each connect starts a fresh transcript** — the old
one would show the model remembering things it was never told. Clearing on connect rather than on
disconnect keeps a hung-up conversation readable until the next one begins.

`reset()` also increments `sessionEpoch`. That counter, not an empty transcript, is what work
outliving a single event checks to decide the session changed: a user slot can be retracted down to
an empty transcript in a perfectly live session (a cough, a slammed door), so emptiness proves
nothing. `tools/attachSpec` captures the epoch and gives up the moment it moves.

Because the transcript survives a disconnect, its interactive parts must not. `RealtimeExperience`
drops `onSpecAction` while disconnected, so suggestion chips on the old transcript are inert rather
than firing into a closed session.

## Generative UI

`TMessage.spec` carries an optional `TJsonRenderSpec`. `useChatStore.attachSpecToMessage(spec, id?)`
attaches one; omitting `id` targets `activeMessage` — the entry point for an agent tool emitting a
spec mid-turn. Because finalisation copies the store's active message, such a spec survives it.

`AssistantMessage` renders the spec through `JsonRenderSurface` and does **not** pass `loading`:
specs are never streamed, so one is complete the moment it arrives. Passing the transcript's
streaming flag showed a finished card as skeleton bars for the rest of the spoken reply.

`onAction` is wired in `./specActions.ts`. `suggest` sends the chip's `text` to the agent as a user
turn and, **once the send has succeeded**, echoes it into the transcript as a user bubble —
`sendMessage` injects a conversation item the extractor deliberately does not render, so without
the echo the reply would appear with nothing prompting it. `sendMessage` returns `false` when there
is no live session; echoing before checking would show the user saying something the model has no
record of, with no reply ever coming. `select` is a documented no-op: no shipped block binds it and
there is no form state for a choice to land in.

## Scrolling

`MessageList` sticks to the bottom through `hooks/useAutoScroll`, which finds the scroller in the
DOM and stops following as soon as the user scrolls away. Why growth is detected with a
`ResizeObserver` rather than a render-derived signal is explained on the hook itself.

## Announcements

Only one live region exists, on the **assistant's** streaming text; the user's own transcript has
none, and `TypingIndicator`'s `role="status"` announces once that transcription is in flight. The
reasoning is on the code: the `aria-live` comment in `AssistantMessage.tsx` and `UserMessage.tsx`.
