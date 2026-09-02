# Why we don't use `history_updated`

**Decision: the transcript keeps coming from our own extractor.** `RealtimeSession` maintains a
`history: RealtimeItem[]` and emits `history_updated`, and we evaluated replacing
`messageExtractor` with it. We are not doing that, and this note exists so the question does not
get re-opened from first principles.

This is a decision about the **transcript**. History is still worth reading — see
[What history is good for](#what-history-is-good-for).

## The facts that drive it

### 1. History has zero streaming resolution

Replaying the 184 captured transport events in `docs/fixtures/events.log.json` through the SDK's own
`updateRealtimeHistory` produces **19 history mutations, of which only 6 change rendered text**.
All 106 assistant transcript deltas and all 7 user transcription deltas produce **no** history
change at all.

That is not an accident of the capture; the SDK says so in
`node_modules/@openai/agents-realtime/dist/openaiRealtimeBase.mjs:199`, where the delta branch
returns early:

```js
// no support for partial transcripts yet.
return;
```

A transcript built on history could therefore only ever pop in whole messages. Live token-by-token
text is the product, so this alone is disqualifying.

### 2. History's authoritative text arrives _later_ than ours

History fills a message's text from `conversation.item.done`. We fill it from
`response.output_audio_transcript.done`, which is strictly earlier — in the captured log, events
**52 / 99 / 178** against history's **54 / 101 / 180**. Switching sources would make every finished
bubble land later than it does today, on top of losing the streaming that preceded it.

### 3. History is read-only for this app, so it cannot be authoritative

`diffRealtimeHistory` throws a `UserError` on assistant `output_audio` items, which every spoken
reply in a voice session produces. That makes `session.updateHistory()` unusable here: we can read
history, but we can never correct it. A source we cannot write to cannot be the place corrections
live, and corrections are a real part of this transcript (retracted user slots, barge-in fixups).

### 4. The hybrid re-creates the bugs we already fixed

The tempting middle path — stream from our extractor, then "correct" from history — puts two
writers on the same bubble, and both key on the same `itemId`. That is exactly the shape of two
bugs the extractor was fixed for:

- **Cough retraction.** A user turn reserves its slot at `input_audio_buffer.committed` and the
  extractor removes it when no transcript ever arrives. History has its own opinion about that
  item and would write it straight back.
- **Barge-in overwrite.** An interrupted reply is finalised as _heard_, not as generated. History
  records the item the server produced, so a late history write would overwrite the truncated text
  with the full one, under the same id, after the user has already read the correct version.

Neither is a bug in history; they are two sources disagreeing about one id, with no rule for who
wins. Keeping one writer is the fix.

### Not a differentiator: turn ordering

Worth stating plainly because it is easy to over-claim. Turn ordering is **not** a reason to prefer
our extractor. The SDK solves it exactly the way we do — reserve the item's slot when
`conversation.item.added` arrives, then fill it in place by `itemId` — so out-of-order user
transcriptions land correctly in both. The four points above are the whole case.

## What history is good for

A **read-only debug oracle**. The Events panel has an `SDK history` tab
(`components/Events/HistoryPanel.tsx`) that mirrors `session.history` and nothing else: when the
transcript looks wrong, it shows what the server believes the conversation was, next to what we
rendered. It never writes to `finalisedMessages`/`activeMessage`, never feeds the extractor, and
never calls `updateHistory`/`resetHistory`.

Two things in history must never be read as conversation, and the panel labels both rather than
hiding them:

| What                                                               | Why it is there                                                                             |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| The app's priming prompt, as a visible **user** message            | `session.sendMessage(...)` in `RealtimeExperience`. Text-only, so it was typed, not spoken. |
| A `function_call` item frozen at `in_progress` with `output: null` | The SDK never revisits tool-call items. The result did reach the model over the transport.  |

One more sharp edge for any future subscriber: `connect()` clears history and emits
`history_updated` with an empty array, and history carries **no epoch**. "New session" and
"transcript retracted to empty" are indistinguishable from the event alone, which is why the app
stamps the boundary itself (`resetSdkHistory()` in `onConnect`) instead of inferring it.

## Open question — needs a live session

**After a barge-in, does `conversation.item.retrieved` carry the spoken prefix or the full
generated transcript?** The captured log is barge-in-free, so this is unverified. It matters
because it decides whether history could at least serve as a _truncation_ oracle: if it carries the
prefix, history agrees with what the user heard; if it carries the full text, history disagrees
with our transcript by design, and fact 4's overwrite hazard is confirmed rather than merely
predicted. Answering it needs someone to interrupt a reply mid-sentence with the history tab open.

## See also

- [`components/Chat/README.md`](../../components/Chat/README.md) — the transport events the
  extractor is built on, per role, and what each one does to the transcript.
- [`components/Events/README.md`](../../components/Events/README.md) — the debug panel.
