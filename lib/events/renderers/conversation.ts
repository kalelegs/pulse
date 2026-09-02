import {
  EEventKind,
  TConversationInputAudioTranscriptionCompletedEvent,
  TConversationInputAudioTranscriptionDeltaEvent,
  TConversationInputAudioTranscriptionFailedEvent,
  TConversationItemAddedEvent,
  TConversationItemDoneEvent,
  TConversationItemRetrievedEvent,
  TConversationItemTruncatedEvent,
  TRenderedEvent,
} from '@/types';
import { buildRenderedEvent } from '../buildRenderedEvent';
import { toPreviewText } from '../fields';

const getItemText = (event: TConversationItemAddedEvent | TConversationItemDoneEvent) => {
  const content = Array.isArray(event.item?.content) ? event.item.content : [];
  return content
    .map((part) => part.text ?? part.transcript ?? '')
    .join(' ')
    .trim();
};

export const renderConversationItemAdded = (event: TConversationItemAddedEvent): TRenderedEvent => {
  const itemType = event.item?.type ?? 'unknown';
  const text = getItemText(event);

  return buildRenderedEvent(event, {
    kind: EEventKind.Conversation,
    title: 'Item added',
    summary: toPreviewText(text || `${itemType} item`, 'Conversation item added'),
  });
};

export const renderConversationItemDone = (event: TConversationItemDoneEvent): TRenderedEvent => {
  const itemType = event.item?.type ?? 'unknown';
  const text = getItemText(event);

  return buildRenderedEvent(event, {
    kind: EEventKind.Conversation,
    title: 'Item completed',
    summary: toPreviewText(text || `${itemType} completed`, 'Conversation item completed'),
  });
};

export const renderConversationItemRetrieved = (
  event: TConversationItemRetrievedEvent,
): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: EEventKind.Conversation,
    title: 'Item retrieved',
    summary: event.item?.type ?? 'Conversation item loaded',
  });
};

export const renderConversationItemTruncated = (
  event: TConversationItemTruncatedEvent,
): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: EEventKind.Conversation,
    title: 'Item truncated',
    summary:
      event.audio_end_ms === undefined
        ? 'Assistant audio cut short by the user'
        : `Assistant audio cut short at ${event.audio_end_ms} ms`,
  });
};

export const renderInputAudioTranscriptionDelta = (
  event: TConversationInputAudioTranscriptionDeltaEvent,
): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: EEventKind.InputAudio,
    title: 'Transcription delta',
    summary: toPreviewText(event.delta ?? '', 'Incoming speech transcription'),
  });
};

export const renderInputAudioTranscriptionCompleted = (
  event: TConversationInputAudioTranscriptionCompletedEvent,
): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: EEventKind.InputAudio,
    title: 'Transcription completed',
    summary: toPreviewText(event.transcript ?? '', 'Speech transcription completed'),
  });
};

export const renderInputAudioTranscriptionFailed = (
  event: TConversationInputAudioTranscriptionFailedEvent,
): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: EEventKind.InputAudio,
    title: 'Transcription failed',
    summary: toPreviewText(event.error?.message ?? '', 'Speech could not be transcribed'),
  });
};
