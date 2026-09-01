# useChatStore

This is the central state of our application. We use zustand for state management.

## Session and response identity

Two fields exist so that work outliving a single event can tell _which_ session and _which_
response it belongs to. Both are read by `tools/attachSpec`, which spans a server round trip.

| Field          | Written by                             | Means                                                                 |
| -------------- | -------------------------------------- | --------------------------------------------------------------------- |
| `sessionEpoch` | `reset()`, on every connect            | how many sessions this store has served — a change means "start over" |
| `responseId`   | `response.created`, via `TMessageSink` | the response producing assistant items right now, `undefined` between |

`sessionEpoch` is the honest "the session changed" signal. An empty transcript is not: a user slot
is retracted when its audio held nothing (a cough, a slammed door), so a live session's transcript
can be emptied without anything ending.

`responseId` is what separates two bubbles of the same response from the bubble of the next one. A
tool call ends one response and the submitted tool output starts another, so "the answer to my
tool call" is precisely "a new bubble from a later response".
