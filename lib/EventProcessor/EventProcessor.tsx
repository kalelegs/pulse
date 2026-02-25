'use client';

import {
  renderInputAudioBufferCommitted,
  renderInputAudioSpeechStarted,
  renderInputAudioSpeechStopped,
  renderOutputAudioBufferStarted,
  renderOutputAudioBufferStopped,
} from '@/components/AgentLogs/renderers/audio';
import {
  renderConversationItemAdded,
  renderConversationItemDone,
  renderConversationItemRetrieved,
  renderInputAudioTranscriptionCompleted,
  renderInputAudioTranscriptionDelta,
} from '@/components/AgentLogs/renderers/conversation';
import { renderRateLimitsUpdated } from '@/components/AgentLogs/renderers/rateLimits';
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
} from '@/components/AgentLogs/renderers/response';
import {
  renderSessionCreated,
  renderSessionUpdated,
} from '@/components/AgentLogs/renderers/session';
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
import { TAddEventFn, TAddMessageFn } from '@/types/ChatStore';
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
) => {
  const type = te.type as TTransportEventType;

  switch (type) {
    case 'conversation.item.added': {
      const event = te as TConversationItemAddedEvent;
      const renderedEvent = renderConversationItemAdded(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'conversation.item.done': {
      const event = te as TConversationItemDoneEvent;
      const renderedEvent = renderConversationItemDone(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'conversation.item.input_audio_transcription.completed': {
      const event = te as TConversationInputAudioTranscriptionCompletedEvent;
      const renderedEvent = renderInputAudioTranscriptionCompleted(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'conversation.item.input_audio_transcription.delta': {
      const event = te as TConversationInputAudioTranscriptionDeltaEvent;
      const renderedEvent = renderInputAudioTranscriptionDelta(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'conversation.item.retrieved': {
      const event = te as TConversationItemRetrievedEvent;
      const renderedEvent = renderConversationItemRetrieved(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'input_audio_buffer.committed': {
      const event = te as TInputAudioBufferCommittedEvent;
      const renderedEvent = renderInputAudioBufferCommitted(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'input_audio_buffer.speech_started': {
      const event = te as TInputAudioBufferSpeechStartedEvent;
      const renderedEvent = renderInputAudioSpeechStarted(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'input_audio_buffer.speech_stopped': {
      const event = te as TInputAudioBufferSpeechStoppedEvent;
      const renderedEvent = renderInputAudioSpeechStopped(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'output_audio_buffer.started': {
      const event = te as TOutputAudioBufferStartedEvent;
      const renderedEvent = renderOutputAudioBufferStarted(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'output_audio_buffer.stopped': {
      const event = te as TOutputAudioBufferStoppedEvent;
      const renderedEvent = renderOutputAudioBufferStopped(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'rate_limits.updated': {
      const event = te as TRateLimitsUpdatedEvent;
      const renderedEvent = renderRateLimitsUpdated(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'response.content_part.added': {
      const event = te as TResponseContentPartAddedEvent;
      const renderedEvent = renderResponseContentPartAdded(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'response.content_part.done': {
      const event = te as TResponseContentPartDoneEvent;
      const renderedEvent = renderResponseContentPartDone(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'response.created': {
      const event = te as TResponseCreatedEvent;
      const renderedEvent = renderResponseCreated(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'response.done': {
      const event = te as TResponseDoneEvent;
      const renderedEvent = renderResponseDone(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'response.function_call_arguments.delta': {
      const event = te as TResponseFunctionCallArgumentsDeltaEvent;
      const renderedEvent = renderResponseFunctionCallArgumentsDelta(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'response.function_call_arguments.done': {
      const event = te as TResponseFunctionCallArgumentsDoneEvent;
      const renderedEvent = renderResponseFunctionCallArgumentsDone(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'response.output_audio.done': {
      const event = te as TResponseOutputAudioDoneEvent;
      const renderedEvent = renderResponseOutputAudioDone(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'response.output_audio_transcript.delta': {
      const event = te as TResponseOutputAudioTranscriptDeltaEvent;
      const renderedEvent = renderResponseOutputAudioTranscriptDelta(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'response.output_audio_transcript.done': {
      const event = te as TResponseOutputAudioTranscriptDoneEvent;
      const renderedEvent = renderResponseOutputAudioTranscriptDone(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'response.output_item.added': {
      const event = te as TResponseOutputItemAddedEvent;
      const renderedEvent = renderResponseOutputItemAdded(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'response.output_item.done': {
      const event = te as TResponseOutputItemDoneEvent;
      const renderedEvent = renderResponseOutputItemDone(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'session.created': {
      const event = te as TSessionCreatedEvent;
      const renderedEvent = renderSessionCreated(event);
      addEventFn(renderedEvent);
      break;
    }
    case 'session.updated': {
      const event = te as TSessionUpdatedEvent;
      const renderedEvent = renderSessionUpdated(event);
      addEventFn(renderedEvent);
      break;
    }
    default:
      console.log('unknown event type', te);
      break;
  }
};
