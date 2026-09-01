# useSession Hook

This hook creates a new session

## Files

| File          | Purpose                                           |
| ------------- | ------------------------------------------------- |
| useSession.ts | Creates a new session                             |
| fns.ts        | Contains utility functions for session management |

## Session configuration

`createSession` passes an explicit `config.audio.input.transcription` to `RealtimeSession`, and
`actions/getEphemeralToken` asks the client-secrets endpoint for the same thing. That repetition is
load-bearing, not an oversight: the transport sends a `session.update` as soon as the data channel
opens, and it fills every `audio.input` field the app left `undefined` from its own
`DEFAULT_OPENAI_REALTIME_SESSION_CONFIG` (`@openai/agents-realtime/dist/openaiRealtimeBase.mjs`).
Configuring only the token would therefore be overwritten before the first word is spoken, and
configuring only the session would leave the minted session briefly disagreeing with it. Both read
`TRANSCRIPTION_MODEL` / `TRANSCRIPTION_LANGUAGE` from `lib/utils`, so they cannot drift — the same
reason `REALTIME_MODEL` lives there.

## `onHistoryUpdated`

`createSession` also forwards the SDK's `history_updated` to `optionsRef.current.onHistoryUpdated`,
using the same read-through-the-ref rule as `onTransportEvent` so a re-render can replace the
handler, plus a `try/catch` — this feeds a debug view only, and a throwing subscriber would
otherwise surface as a session `error` on a healthy session.

It is strictly observational. The SDK's history is not a transcript source (no partial transcripts,
later than our events, and `updateHistory` throws on assistant audio items), so nothing may write
it back. The reasoning is in [`lib/EventProcessor/SdkHistory.md`](../../lib/EventProcessor/SdkHistory.md);
the only consumer is the Events panel's `SDK history` tab.
