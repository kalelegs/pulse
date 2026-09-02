# useSession Hook

Owns one realtime session at a time: the microphone, the `RealtimeSession`, and the callbacks the
app hangs off it.

## Files

| File               | Purpose                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `useSession.ts`    | The hook: connect / disconnect / toggle, `sendMessage`, and the refs that outlive renders |
| `createSession.ts` | Builds and connects a `RealtimeSession` (with a connect timeout), plus `closeSession`     |
| `microphone.ts`    | Acquires the microphone with a permission timeout and precise errors; `stopMediaStream`   |

## Session configuration

`createSession` passes an explicit `config.audio.input.transcription` to `RealtimeSession`, and
`actions/getEphemeralToken` asks the client-secrets endpoint for the same thing. That repetition is
load-bearing: the transport sends a `session.update` as soon as the data channel opens, filling
every `audio.input` field the app left `undefined` from its own
`DEFAULT_OPENAI_REALTIME_SESSION_CONFIG` (`@openai/agents-realtime/dist/openaiRealtimeBase.mjs`),
so configuring only the token would be overwritten before the first word is spoken. Both read the
values from `lib/realtimeConfig.ts`, which also explains why the transcription model is pinned.

## `onHistoryUpdated`

`createSession` also forwards the SDK's `history_updated` to `optionsRef.current.onHistoryUpdated`,
using the same read-through-the-ref rule as `onTransportEvent` so a re-render can replace the
handler, plus a `try/catch` — this feeds a debug view only, and a throwing subscriber would
otherwise surface as a session `error` on a healthy session.

It is strictly observational. The SDK's history is not a transcript source (no partial transcripts,
later than our events, and `updateHistory` throws on assistant audio items), so nothing may write
it back. The reasoning is in [`lib/EventProcessor/SdkHistory.md`](../../lib/EventProcessor/SdkHistory.md);
the only consumer is the Events panel's `SDK history` tab.
