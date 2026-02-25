import {
  TConversationInputAudioTranscriptionCompletedEvent,
  TConversationInputAudioTranscriptionDeltaEvent,
  TConversationItemAddedEvent,
  TConversationItemDoneEvent,
  TConversationItemRetrievedEvent,
} from '@/types';
import { readString, toPreviewText } from '../utils';
import { buildRenderedEvent } from './common';
import { toneConversation, toneInputAudio } from './tones';
import { TRenderedEvent } from './types';

const getItemText = (event: TConversationItemAddedEvent | TConversationItemDoneEvent) => {
  const content = Array.isArray(event.item?.content) ? event.item.content : [];
  const text = content
    .map((part) => readString(part.text) ?? readString(part.transcript) ?? '')
    .join(' ')
    .trim();
  return text;
};

export const renderConversationItemAdded = (event: TConversationItemAddedEvent): TRenderedEvent => {
  const itemType = readString(event.item?.type) ?? 'unknown';
  const role = readString(event.item?.role);
  const text = getItemText(event);

  return buildRenderedEvent(event, {
    kind: 'Conversation',
    title: 'Item added',
    summary: toPreviewText(text || `${itemType} item`, 'Conversation item added'),
    details: {
      event_id: event.event_id,
      previous_item_id: event.previous_item_id,
      item_id: readString(event.item?.id),
      role,
      item_type: itemType,
      name: readString(event.item?.name),
      call_id: readString(event.item?.call_id),
      status: readString(event.item?.status),
      output: readString(event.item?.output),
    },
    tone: toneConversation,
  });
};

export const renderConversationItemDone = (event: TConversationItemDoneEvent): TRenderedEvent => {
  const itemType = readString(event.item?.type) ?? 'unknown';
  const role = readString(event.item?.role);
  const text = getItemText(event);

  return buildRenderedEvent(event, {
    kind: 'Conversation',
    title: 'Item completed',
    summary: toPreviewText(text || `${itemType} completed`, 'Conversation item completed'),
    details: {
      event_id: event.event_id,
      previous_item_id: event.previous_item_id,
      item_id: readString(event.item?.id),
      role,
      item_type: itemType,
      name: readString(event.item?.name),
      call_id: readString(event.item?.call_id),
      status: readString(event.item?.status),
      output: readString(event.item?.output),
    },
    tone: toneConversation,
  });
};

export const renderConversationItemRetrieved = (event: TConversationItemRetrievedEvent): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: 'Conversation',
    title: 'Item retrieved',
    summary: readString(event.item?.type) ?? 'Conversation item loaded',
    details: {
      event_id: event.event_id,
      item_id: readString(event.item?.id),
      item_type: readString(event.item?.type),
      role: readString(event.item?.role),
      status: readString(event.item?.status),
    },
    tone: toneConversation,
  });
};

export const renderInputAudioTranscriptionDelta = (
  event: TConversationInputAudioTranscriptionDeltaEvent,
): TRenderedEvent => {
  const delta = readString(event.delta) ?? '';
  return buildRenderedEvent(event, {
    kind: 'Input Audio',
    title: 'Transcription delta',
    summary: toPreviewText(delta, 'Incoming speech transcription'),
    details: {
      event_id: event.event_id,
      item_id: event.item_id,
      content_index: event.content_index,
      delta,
    },
    tone: toneInputAudio,
  });
};

export const renderInputAudioTranscriptionCompleted = (
  event: TConversationInputAudioTranscriptionCompletedEvent,
): TRenderedEvent => {
  const transcript = readString(event.transcript) ?? '';
  return buildRenderedEvent(event, {
    kind: 'Input Audio',
    title: 'Transcription completed',
    summary: toPreviewText(transcript, 'Speech transcription completed'),
    details: {
      event_id: event.event_id,
      item_id: event.item_id,
      content_index: event.content_index,
      transcript,
      usage: event.usage,
    },
    tone: toneInputAudio,
  });
};
