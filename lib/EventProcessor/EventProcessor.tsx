'use client';

import {
  renderInputAudioBufferCommitted,
  renderInputAudioSpeechStarted,
  renderInputAudioSpeechStopped,
  renderOutputAudioBufferStarted,
  renderOutputAudioBufferStopped,
} from '@/components/Events/renderers/audio';
import {
  renderConversationItemAdded,
  renderConversationItemDone,
  renderConversationItemRetrieved,
  renderInputAudioTranscriptionCompleted,
  renderInputAudioTranscriptionDelta,
} from '@/components/Events/renderers/conversation';
import { renderRateLimitsUpdated } from '@/components/Events/renderers/rateLimits';
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
} from '@/components/Events/renderers/response';
import { renderSessionCreated, renderSessionUpdated } from '@/components/Events/renderers/session';
import {
  TConversationInputAudioTranscriptionCompletedEvent,
  TConversationInputAudioTranscriptionDeltaEvent,
  TConversationItemAddedEvent,
  TConversationItemDoneEvent,
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
  TTransportEventType,
} from '@/types';
import { TAddEventFn, TAddMessageFn, TEventsLogLevel } from '@/types/ChatStore';
import { TransportEvent } from '@openai/agents/realtime';

/**
 * A event processor function that has two jobs
 * Extract message (or partial message) from event stream
 * Transform event stream to RenderedEvents for rendering on screen
 * @param te Incoming TransportEvent
 * @param addMessageFn A function that adds messages to our chatStore (zustand)
 * @param addEventFn A function that adds events to our chatStore (zustand)
 */
export const processEvent = (
  te: TransportEvent,
  addMessageFn: TAddMessageFn,
  addEventFn: TAddEventFn,
  eventsLogLevel: TEventsLogLevel,
) => {
  const type = te.type as TTransportEventType;
  const isAlwaysLoggedEvent =
    type === 'response.output_item.added' ||
    type === 'response.output_item.done' ||
    type === 'response.function_call_arguments.done' ||
    type === 'conversation.item.added' ||
    type === 'conversation.item.done' ||
    type === 'output_audio_buffer.started' ||
    type === 'output_audio_buffer.stopped';

  switch (type) {
    case 'conversation.item.added': {
      const event = te as TConversationItemAddedEvent;
      const renderedEvent = renderConversationItemAdded(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'conversation.item.done': {
      const event = te as TConversationItemDoneEvent;
      const renderedEvent = renderConversationItemDone(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'conversation.item.input_audio_transcription.completed': {
      const event = te as TConversationInputAudioTranscriptionCompletedEvent;
      const renderedEvent = renderInputAudioTranscriptionCompleted(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'conversation.item.input_audio_transcription.delta': {
      const event = te as TConversationInputAudioTranscriptionDeltaEvent;
      const renderedEvent = renderInputAudioTranscriptionDelta(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'conversation.item.retrieved': {
      const event = te as TConversationItemRetrievedEvent;
      const renderedEvent = renderConversationItemRetrieved(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'input_audio_buffer.committed': {
      const event = te as TInputAudioBufferCommittedEvent;
      const renderedEvent = renderInputAudioBufferCommitted(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'input_audio_buffer.speech_started': {
      const event = te as TInputAudioBufferSpeechStartedEvent;
      const renderedEvent = renderInputAudioSpeechStarted(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'input_audio_buffer.speech_stopped': {
      const event = te as TInputAudioBufferSpeechStoppedEvent;
      const renderedEvent = renderInputAudioSpeechStopped(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'output_audio_buffer.started': {
      const event = te as TOutputAudioBufferStartedEvent;
      const renderedEvent = renderOutputAudioBufferStarted(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'output_audio_buffer.stopped': {
      const event = te as TOutputAudioBufferStoppedEvent;
      const renderedEvent = renderOutputAudioBufferStopped(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'rate_limits.updated': {
      const event = te as TRateLimitsUpdatedEvent;
      const renderedEvent = renderRateLimitsUpdated(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'response.content_part.added': {
      const event = te as TResponseContentPartAddedEvent;
      const renderedEvent = renderResponseContentPartAdded(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'response.content_part.done': {
      const event = te as TResponseContentPartDoneEvent;
      const renderedEvent = renderResponseContentPartDone(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'response.created': {
      const event = te as TResponseCreatedEvent;
      const renderedEvent = renderResponseCreated(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'response.done': {
      const event = te as TResponseDoneEvent;
      const renderedEvent = renderResponseDone(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'response.function_call_arguments.delta': {
      const event = te as TResponseFunctionCallArgumentsDeltaEvent;
      const renderedEvent = renderResponseFunctionCallArgumentsDelta(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'response.function_call_arguments.done': {
      const event = te as TResponseFunctionCallArgumentsDoneEvent;
      const renderedEvent = renderResponseFunctionCallArgumentsDone(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'response.output_audio.done': {
      const event = te as TResponseOutputAudioDoneEvent;
      const renderedEvent = renderResponseOutputAudioDone(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'response.output_audio_transcript.delta': {
      const event = te as TResponseOutputAudioTranscriptDeltaEvent;
      const renderedEvent = renderResponseOutputAudioTranscriptDelta(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'response.output_audio_transcript.done': {
      const event = te as TResponseOutputAudioTranscriptDoneEvent;
      const renderedEvent = renderResponseOutputAudioTranscriptDone(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'response.output_item.added': {
      const event = te as TResponseOutputItemAddedEvent;
      const renderedEvent = renderResponseOutputItemAdded(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'response.output_item.done': {
      const event = te as TResponseOutputItemDoneEvent;
      const renderedEvent = renderResponseOutputItemDone(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'session.created': {
      const event = te as TSessionCreatedEvent;
      const renderedEvent = renderSessionCreated(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    case 'session.updated': {
      const event = te as TSessionUpdatedEvent;
      const renderedEvent = renderSessionUpdated(event);
      if (isAlwaysLoggedEvent || eventsLogLevel === 'verbose') {
        addEventFn(renderedEvent);
      }
      break;
    }
    default:
      console.log('unknown event type', te);
      break;
  }
};
