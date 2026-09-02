import { TRenderedEvent, TTransportEvent, TTransportEventType } from '@/types';
import {
  renderInputAudioBufferCommitted,
  renderInputAudioSpeechStarted,
  renderInputAudioSpeechStopped,
  renderOutputAudioBufferStarted,
  renderOutputAudioBufferStopped,
} from './renderers/audio';
import {
  renderConversationItemAdded,
  renderConversationItemDone,
  renderConversationItemRetrieved,
  renderConversationItemTruncated,
  renderInputAudioTranscriptionCompleted,
  renderInputAudioTranscriptionDelta,
  renderInputAudioTranscriptionFailed,
} from './renderers/conversation';
import { renderRateLimitsUpdated } from './renderers/rateLimits';
import {
  renderResponseContentPartAdded,
  renderResponseContentPartDone,
  renderResponseCreated,
  renderResponseDone,
  renderResponseFunctionCallArgumentsDelta,
  renderResponseFunctionCallArgumentsDone,
  renderResponseOutputAudioDone,
  renderResponseOutputAudioTranscriptDelta,
  renderResponseOutputAudioTranscriptDone,
  renderResponseOutputItemAdded,
  renderResponseOutputItemDone,
  renderResponseOutputTextDelta,
  renderResponseOutputTextDone,
} from './renderers/response';
import { renderSessionCreated, renderSessionUpdated } from './renderers/session';

/**
 * One renderer per transport event type, each typed to exactly its own event. Mapped over
 * `TTransportEventType` so a type added to `TRANSPORT_EVENT_TYPES` without a renderer fails `tsc`;
 * there is no fallback renderer on purpose.
 */
type TRendererMap = {
  [K in TTransportEventType]: (event: Extract<TTransportEvent, { type: K }>) => TRenderedEvent;
};

const RENDERER_BY_TYPE: TRendererMap = {
  'session.created': renderSessionCreated,
  'session.updated': renderSessionUpdated,
  'conversation.item.added': renderConversationItemAdded,
  'conversation.item.done': renderConversationItemDone,
  'conversation.item.retrieved': renderConversationItemRetrieved,
  'conversation.item.truncated': renderConversationItemTruncated,
  'conversation.item.input_audio_transcription.delta': renderInputAudioTranscriptionDelta,
  'conversation.item.input_audio_transcription.completed': renderInputAudioTranscriptionCompleted,
  'conversation.item.input_audio_transcription.failed': renderInputAudioTranscriptionFailed,
  'input_audio_buffer.committed': renderInputAudioBufferCommitted,
  'input_audio_buffer.speech_started': renderInputAudioSpeechStarted,
  'input_audio_buffer.speech_stopped': renderInputAudioSpeechStopped,
  'output_audio_buffer.started': renderOutputAudioBufferStarted,
  'output_audio_buffer.stopped': renderOutputAudioBufferStopped,
  'rate_limits.updated': renderRateLimitsUpdated,
  'response.created': renderResponseCreated,
  'response.done': renderResponseDone,
  'response.output_item.added': renderResponseOutputItemAdded,
  'response.output_item.done': renderResponseOutputItemDone,
  'response.content_part.added': renderResponseContentPartAdded,
  'response.content_part.done': renderResponseContentPartDone,
  'response.output_audio_transcript.delta': renderResponseOutputAudioTranscriptDelta,
  'response.output_audio_transcript.done': renderResponseOutputAudioTranscriptDone,
  'response.output_text.delta': renderResponseOutputTextDelta,
  'response.output_text.done': renderResponseOutputTextDone,
  'response.output_audio.done': renderResponseOutputAudioDone,
  'response.function_call_arguments.delta': renderResponseFunctionCallArgumentsDelta,
  'response.function_call_arguments.done': renderResponseFunctionCallArgumentsDone,
};

/** Renders a known transport event. Total over the union — every `type` has an entry above. */
export const renderTypedEvent = (event: TTransportEvent): TRenderedEvent => {
  // TypeScript cannot correlate `event` with the entry picked by `event.type` (the classic
  // "correlated union" limitation), so the one cast lives here rather than in every renderer.
  return RENDERER_BY_TYPE[event.type](event as never);
};
