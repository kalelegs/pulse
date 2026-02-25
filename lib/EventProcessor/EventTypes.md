# Event Types

Let's talk about how event types translate into messages and sub section of messages.

This is mostly written from perspective of rendering assistant messages in real time (i.e. stream)

## Hierarchy of components

- item (has role)
  - content => created output of n deltas

## Order of concerned events for user message

### Streamed messages (audio in)

- `conversation.item.input_audio_transcription.delta`
  - record `textStart`
  - Text data starts flowing in
- `conversation.item.input_audio_transcription.completed`
  - that's it

## Order of concerned events for assistant reply

- `response.output_item.added`
  - an item is added in response
- `response.output_audio_transcript.delta`
  - record `textStart`
  - Text data starts flowing in
- `output_audio_buffer.started`
  - Audio starts playing out
  - Record `audioStart`
- `response.output_audio_transcript.done`
  - Text streaming finished.
  - Record `textEnd`
- `response.output_item.done` (type is message)
  - An Item is done
- **Tool Call** (Optional)
  - Please note: text item has finished.
  - `response.output_item.added` (type: function call)
  - `response.function_call_arguments.done`
    - Tells us input arguments
  - `conversation.item.done`
    - tool call request from agent
  - `conversation.item.added` (type function_call_output)
  - `conversation.item.done`(type function call output)
- `response.output_item.added`
- `response.output_audio_transcript.delta`
- `response.output_item.done`
- `output_audio_buffer.stopped`
  - Audio streaming finished
  - Record `audioEnd`
- `response.done`
  - has token usage if ever needed

Important Notes :

1. test item starts finishes
2. Audio starts but doesn't finish
3. then tool starts finishes.
4. text starts and finishes
5. finally audio finishes

audio is not tied to an item (but rather session)
