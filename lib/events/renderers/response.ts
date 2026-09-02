import {
  EEventKind,
  TRenderedEvent,
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
} from '@/types';
import { buildRenderedEvent } from '../buildRenderedEvent';
import { readString, toPreviewText } from '../fields';

export const renderResponseCreated = (event: TResponseCreatedEvent): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: EEventKind.Response,
    title: 'Response created',
    summary: readString(event.response?.status) ?? 'Agent started a response',
  });
};

export const renderResponseDone = (event: TResponseDoneEvent): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: EEventKind.Response,
    title: 'Response completed',
    summary: readString(event.response?.status) ?? 'Agent finished response',
  });
};

export const renderResponseOutputItemAdded = (
  event: TResponseOutputItemAddedEvent,
): TRenderedEvent => {
  const itemType = event.item?.type ?? 'unknown';
  const name = event.item?.name;
  const isHandoff = itemType === 'function_call' && Boolean(name?.startsWith('transfer_to_'));

  if (isHandoff) {
    const targetAgent = name?.replace('transfer_to_', '');
    return buildRenderedEvent(event, {
      kind: EEventKind.Handoff,
      title: 'Agent handoff',
      summary: targetAgent ? `Transfer to ${targetAgent}` : 'Transfer to another agent',
    });
  }

  return buildRenderedEvent(event, {
    kind: itemType === 'function_call' ? EEventKind.ToolSelected : EEventKind.Response,
    title: 'Output item added',
    summary:
      itemType === 'function_call'
        ? toPreviewText(name ?? '', 'Tool selected')
        : `${itemType} item`,
  });
};

export const renderResponseOutputItemDone = (
  event: TResponseOutputItemDoneEvent,
): TRenderedEvent => {
  const itemType = event.item?.type ?? 'unknown';
  return buildRenderedEvent(event, {
    kind: itemType === 'function_call' ? EEventKind.Tool : EEventKind.Response,
    title: 'Output item done',
    summary: `${itemType} completed`,
  });
};

export const renderResponseContentPartAdded = (
  event: TResponseContentPartAddedEvent,
): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: EEventKind.Response,
    title: 'Content part added',
    summary: readString(event.part?.type) ?? 'New response content part',
  });
};

export const renderResponseContentPartDone = (
  event: TResponseContentPartDoneEvent,
): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: EEventKind.Response,
    title: 'Content part done',
    summary: readString(event.part?.type) ?? 'Response content part completed',
  });
};

export const renderResponseOutputAudioTranscriptDelta = (
  event: TResponseOutputAudioTranscriptDeltaEvent,
): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: EEventKind.Stream,
    title: 'Agent transcript delta',
    summary: toPreviewText(event.delta ?? '', 'Streaming agent transcript'),
  });
};

export const renderResponseOutputAudioTranscriptDone = (
  event: TResponseOutputAudioTranscriptDoneEvent,
): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: EEventKind.Stream,
    title: 'Agent transcript done',
    summary: toPreviewText(event.transcript ?? '', 'Final transcript available'),
  });
};

export const renderResponseOutputTextDelta = (
  event: TResponseOutputTextDeltaEvent,
): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: EEventKind.Stream,
    title: 'Agent text delta',
    summary: toPreviewText(event.delta ?? '', 'Streaming agent text'),
  });
};

export const renderResponseOutputTextDone = (
  event: TResponseOutputTextDoneEvent,
): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: EEventKind.Stream,
    title: 'Agent text done',
    summary: toPreviewText(event.text ?? '', 'Final text available'),
  });
};

export const renderResponseOutputAudioDone = (
  event: TResponseOutputAudioDoneEvent,
): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: EEventKind.AudioDone,
    title: 'Output audio completed',
    summary: 'Audio synthesis completed',
  });
};

export const renderResponseFunctionCallArgumentsDelta = (
  event: TResponseFunctionCallArgumentsDeltaEvent,
): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: EEventKind.ToolRequest,
    title: 'Tool args delta',
    summary: toPreviewText(event.delta ?? '', 'Streaming tool arguments'),
  });
};

export const renderResponseFunctionCallArgumentsDone = (
  event: TResponseFunctionCallArgumentsDoneEvent,
): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: EEventKind.ToolRequest,
    title: 'Tool call request',
    summary: toPreviewText(event.arguments ?? '', 'Tool arguments completed'),
  });
};
