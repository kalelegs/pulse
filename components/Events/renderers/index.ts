import {
  TTransportEvent,
  TTransportEventType,
  TConversationItemAddedEvent,
  TConversationItemDoneEvent,
  TConversationInputAudioTranscriptionCompletedEvent,
  TConversationInputAudioTranscriptionDeltaEvent,
  TConversationItemRetrievedEvent,
  TInputAudioBufferCommittedEvent,
  TInputAudioBufferSpeechStartedEvent,
  TInputAudioBufferSpeechStoppedEvent,
  TOutputAudioBufferStartedEvent,
  TOutputAudioBufferStoppedEvent,
  TRateLimitsUpdatedEvent,
  TResponseContentPartAddedEvent,
  TResponseContentPartDoneEvent,
  TResponseCreatedEvent,
  TResponseDoneEvent,
  TResponseFunctionCallArgumentsDeltaEvent,
  TResponseFunctionCallArgumentsDoneEvent,
  TResponseOutputAudioDoneEvent,
  TResponseOutputAudioTranscriptDeltaEvent,
  TResponseOutputAudioTranscriptDoneEvent,
  TResponseOutputItemAddedEvent,
  TResponseOutputItemDoneEvent,
  TSessionCreatedEvent,
  TSessionUpdatedEvent,
} from '@/types';
import {
  renderInputAudioBufferCommitted,
  renderInputAudioSpeechStarted,
  renderInputAudioSpeechStopped,
  renderOutputAudioBufferStarted,
  renderOutputAudioBufferStopped,
} from './audio';
import {
  renderConversationItemAdded,
  renderConversationItemDone,
  renderConversationItemRetrieved,
  renderInputAudioTranscriptionCompleted,
  renderInputAudioTranscriptionDelta,
} from './conversation';
import { renderRateLimitsUpdated } from './rateLimits';
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
} from './response';
import { renderSessionCreated, renderSessionUpdated } from './session';
import { TRenderedEvent } from './types';

type TRendererMap = {
  [K in TTransportEventType]: (event: Extract<TTransportEvent, { type: K }>) => TRenderedEvent;
};

const rendererMap: TRendererMap = {
  'session.created': (event) => renderSessionCreated(event as TSessionCreatedEvent),
  'session.updated': (event) => renderSessionUpdated(event as TSessionUpdatedEvent),
  'conversation.item.added': (event) => renderConversationItemAdded(event as TConversationItemAddedEvent),
  'conversation.item.done': (event) => renderConversationItemDone(event as TConversationItemDoneEvent),
  'conversation.item.retrieved': (event) => renderConversationItemRetrieved(event as TConversationItemRetrievedEvent),
  'conversation.item.input_audio_transcription.delta': (event) =>
    renderInputAudioTranscriptionDelta(event as TConversationInputAudioTranscriptionDeltaEvent),
  'conversation.item.input_audio_transcription.completed': (event) =>
    renderInputAudioTranscriptionCompleted(event as TConversationInputAudioTranscriptionCompletedEvent),
  'input_audio_buffer.committed': (event) => renderInputAudioBufferCommitted(event as TInputAudioBufferCommittedEvent),
  'input_audio_buffer.speech_started': (event) =>
    renderInputAudioSpeechStarted(event as TInputAudioBufferSpeechStartedEvent),
  'input_audio_buffer.speech_stopped': (event) =>
    renderInputAudioSpeechStopped(event as TInputAudioBufferSpeechStoppedEvent),
  'output_audio_buffer.started': (event) => renderOutputAudioBufferStarted(event as TOutputAudioBufferStartedEvent),
  'output_audio_buffer.stopped': (event) => renderOutputAudioBufferStopped(event as TOutputAudioBufferStoppedEvent),
  'rate_limits.updated': (event) => renderRateLimitsUpdated(event as TRateLimitsUpdatedEvent),
  'response.created': (event) => renderResponseCreated(event as TResponseCreatedEvent),
  'response.done': (event) => renderResponseDone(event as TResponseDoneEvent),
  'response.output_item.added': (event) => renderResponseOutputItemAdded(event as TResponseOutputItemAddedEvent),
  'response.output_item.done': (event) => renderResponseOutputItemDone(event as TResponseOutputItemDoneEvent),
  'response.content_part.added': (event) => renderResponseContentPartAdded(event as TResponseContentPartAddedEvent),
  'response.content_part.done': (event) => renderResponseContentPartDone(event as TResponseContentPartDoneEvent),
  'response.output_audio_transcript.delta': (event) =>
    renderResponseOutputAudioTranscriptDelta(event as TResponseOutputAudioTranscriptDeltaEvent),
  'response.output_audio_transcript.done': (event) =>
    renderResponseOutputAudioTranscriptDone(event as TResponseOutputAudioTranscriptDoneEvent),
  'response.output_audio.done': (event) => renderResponseOutputAudioDone(event as TResponseOutputAudioDoneEvent),
  'response.function_call_arguments.delta': (event) =>
    renderResponseFunctionCallArgumentsDelta(event as TResponseFunctionCallArgumentsDeltaEvent),
  'response.function_call_arguments.done': (event) =>
    renderResponseFunctionCallArgumentsDone(event as TResponseFunctionCallArgumentsDoneEvent),
};

export const renderTypedEvent = (event: TTransportEvent): TRenderedEvent => {
  return rendererMap[event.type](event as never);
};