import {
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
} from '@/types';
import { readString, toPreviewText } from '../utils';
import { buildRenderedEvent } from './common';
import {
  toneAudioDone,
  toneHandoff,
  toneResponse,
  toneStream,
  toneTool,
  toneToolRequest,
  toneToolSelected,
} from './tones';
import { TRenderedEvent } from './types';

export const renderResponseCreated = (event: TResponseCreatedEvent): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: 'Response',
    title: 'Response created',
    summary: readString(event.response?.status) ?? 'Agent started a response',
    details: {
      event_id: event.event_id,
      response_id: readString(event.response?.id),
      status: readString(event.response?.status),
      output_modalities: event.response?.output_modalities,
    },
    tone: toneResponse,
  });
};

export const renderResponseDone = (event: TResponseDoneEvent): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: 'Response',
    title: 'Response completed',
    summary: readString(event.response?.status) ?? 'Agent finished response',
    details: {
      event_id: event.event_id,
      response_id: readString(event.response?.id),
      status: readString(event.response?.status),
      output: event.response?.output,
      usage: event.response?.usage,
    },
    tone: toneResponse,
  });
};

export const renderResponseOutputItemAdded = (event: TResponseOutputItemAddedEvent): TRenderedEvent => {
  const itemType = readString(event.item?.type) ?? 'unknown';
  const name = readString(event.item?.name);
  const isHandoff = itemType === 'function_call' && Boolean(name?.startsWith('transfer_to_'));

  if (isHandoff) {
    const targetAgent = name?.replace('transfer_to_', '');
    return buildRenderedEvent(event, {
      kind: 'Handoff',
      title: 'Agent handoff',
      summary: targetAgent ? `Transfer to ${targetAgent}` : 'Transfer to another agent',
      details: {
        event_id: event.event_id,
        response_id: event.response_id,
        output_index: event.output_index,
        item_id: readString(event.item?.id),
        call_id: readString(event.item?.call_id),
        name,
        status: readString(event.item?.status),
      },
      tone: toneHandoff,
    });
  }

  return buildRenderedEvent(event, {
    kind: itemType === 'function_call' ? 'Tool Selected' : 'Response',
    title: 'Output item added',
    summary: itemType === 'function_call' ? toPreviewText(name ?? '', 'Tool selected') : `${itemType} item`,
    details: {
      event_id: event.event_id,
      response_id: event.response_id,
      output_index: event.output_index,
      item_id: readString(event.item?.id),
      item_type: itemType,
      role: readString(event.item?.role),
      name,
      call_id: readString(event.item?.call_id),
      status: readString(event.item?.status),
    },
    tone: itemType === 'function_call' ? toneToolSelected : toneResponse,
  });
};

export const renderResponseOutputItemDone = (event: TResponseOutputItemDoneEvent): TRenderedEvent => {
  const itemType = readString(event.item?.type) ?? 'unknown';
  return buildRenderedEvent(event, {
    kind: itemType === 'function_call' ? 'Tool' : 'Response',
    title: 'Output item done',
    summary: `${itemType} completed`,
    details: {
      event_id: event.event_id,
      response_id: event.response_id,
      output_index: event.output_index,
      item_id: readString(event.item?.id),
      item_type: itemType,
      role: readString(event.item?.role),
      name: readString(event.item?.name),
      call_id: readString(event.item?.call_id),
      status: readString(event.item?.status),
      arguments: readString(event.item?.arguments),
    },
    tone: itemType === 'function_call' ? toneTool : toneResponse,
  });
};

export const renderResponseContentPartAdded = (event: TResponseContentPartAddedEvent): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: 'Response',
    title: 'Content part added',
    summary: readString(event.part?.type) ?? 'New response content part',
    details: {
      event_id: event.event_id,
      response_id: event.response_id,
      item_id: event.item_id,
      output_index: event.output_index,
      content_index: event.content_index,
      part_type: readString(event.part?.type),
    },
    tone: toneResponse,
  });
};

export const renderResponseContentPartDone = (event: TResponseContentPartDoneEvent): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: 'Response',
    title: 'Content part done',
    summary: readString(event.part?.type) ?? 'Response content part completed',
    details: {
      event_id: event.event_id,
      response_id: event.response_id,
      item_id: event.item_id,
      output_index: event.output_index,
      content_index: event.content_index,
      part_type: readString(event.part?.type),
    },
    tone: toneResponse,
  });
};

export const renderResponseOutputAudioTranscriptDelta = (
  event: TResponseOutputAudioTranscriptDeltaEvent,
): TRenderedEvent => {
  const delta = readString(event.delta) ?? '';
  return buildRenderedEvent(event, {
    kind: 'Stream',
    title: 'Agent transcript delta',
    summary: toPreviewText(delta, 'Streaming agent transcript'),
    details: {
      event_id: event.event_id,
      response_id: event.response_id,
      item_id: event.item_id,
      output_index: event.output_index,
      content_index: event.content_index,
      delta,
    },
    tone: toneStream,
  });
};

export const renderResponseOutputAudioTranscriptDone = (
  event: TResponseOutputAudioTranscriptDoneEvent,
): TRenderedEvent => {
  const transcript = readString(event.transcript) ?? '';
  return buildRenderedEvent(event, {
    kind: 'Stream',
    title: 'Agent transcript done',
    summary: toPreviewText(transcript, 'Final transcript available'),
    details: {
      event_id: event.event_id,
      response_id: event.response_id,
      item_id: event.item_id,
      output_index: event.output_index,
      content_index: event.content_index,
      transcript,
    },
    tone: toneStream,
  });
};

export const renderResponseOutputAudioDone = (event: TResponseOutputAudioDoneEvent): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: 'Audio Done',
    title: 'Output audio completed',
    summary: 'Audio synthesis completed',
    details: {
      event_id: event.event_id,
      response_id: event.response_id,
      item_id: event.item_id,
      output_index: event.output_index,
      content_index: event.content_index,
    },
    tone: toneAudioDone,
  });
};

export const renderResponseFunctionCallArgumentsDelta = (
  event: TResponseFunctionCallArgumentsDeltaEvent,
): TRenderedEvent => {
  const delta = readString(event.delta) ?? '';
  return buildRenderedEvent(event, {
    kind: 'Tool Request',
    title: 'Tool args delta',
    summary: toPreviewText(delta, 'Streaming tool arguments'),
    details: {
      event_id: event.event_id,
      response_id: event.response_id,
      item_id: event.item_id,
      output_index: event.output_index,
      call_id: event.call_id,
      delta,
    },
    tone: toneToolRequest,
  });
};

export const renderResponseFunctionCallArgumentsDone = (
  event: TResponseFunctionCallArgumentsDoneEvent,
): TRenderedEvent => {
  const args = readString(event.arguments) ?? '';
  return buildRenderedEvent(event, {
    kind: 'Tool Request',
    title: 'Tool call request',
    summary: toPreviewText(args, 'Tool arguments completed'),
    details: {
      event_id: event.event_id,
      response_id: event.response_id,
      item_id: event.item_id,
      output_index: event.output_index,
      call_id: event.call_id,
      arguments: args,
    },
    tone: toneToolRequest,
  });
};
