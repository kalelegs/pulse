import type {
  TInputAudioBufferCommittedEvent,
  TInputAudioBufferSpeechStartedEvent,
  TInputAudioBufferSpeechStoppedEvent,
  TOutputAudioBufferStartedEvent,
  TOutputAudioBufferStoppedEvent,
} from './audio';
import type {
  TConversationInputAudioTranscriptionCompletedEvent,
  TConversationInputAudioTranscriptionDeltaEvent,
  TConversationInputAudioTranscriptionFailedEvent,
  TConversationItemAddedEvent,
  TConversationItemDoneEvent,
  TConversationItemRetrievedEvent,
  TConversationItemTruncatedEvent,
} from './conversation';
import type {
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
  TResponseOutputTextDeltaEvent,
  TResponseOutputTextDoneEvent,
} from './response';
import type {
  TRateLimitsUpdatedEvent,
  TSessionCreatedEvent,
  TSessionUpdatedEvent,
} from './session';

export * from './audio';
export * from './conversation';
export * from './names';
export * from './response';
export * from './session';

/** Every transport event the app models, discriminated on `type`. */
export type TTransportEvent =
  | TConversationItemAddedEvent
  | TConversationItemDoneEvent
  | TConversationInputAudioTranscriptionCompletedEvent
  | TConversationInputAudioTranscriptionDeltaEvent
  | TConversationInputAudioTranscriptionFailedEvent
  | TConversationItemRetrievedEvent
  | TConversationItemTruncatedEvent
  | TInputAudioBufferCommittedEvent
  | TInputAudioBufferSpeechStartedEvent
  | TInputAudioBufferSpeechStoppedEvent
  | TOutputAudioBufferStartedEvent
  | TOutputAudioBufferStoppedEvent
  | TRateLimitsUpdatedEvent
  | TResponseContentPartAddedEvent
  | TResponseContentPartDoneEvent
  | TResponseCreatedEvent
  | TResponseDoneEvent
  | TResponseFunctionCallArgumentsDeltaEvent
  | TResponseFunctionCallArgumentsDoneEvent
  | TResponseOutputAudioDoneEvent
  | TResponseOutputAudioTranscriptDeltaEvent
  | TResponseOutputAudioTranscriptDoneEvent
  | TResponseOutputItemAddedEvent
  | TResponseOutputItemDoneEvent
  | TResponseOutputTextDeltaEvent
  | TResponseOutputTextDoneEvent
  | TSessionCreatedEvent
  | TSessionUpdatedEvent;
