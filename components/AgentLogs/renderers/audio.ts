import {
  TInputAudioBufferCommittedEvent,
  TInputAudioBufferSpeechStartedEvent,
  TInputAudioBufferSpeechStoppedEvent,
  TOutputAudioBufferStartedEvent,
  TOutputAudioBufferStoppedEvent,
} from '@/types';
import { readNumber } from '../utils';
import { buildRenderedEvent } from './common';
import { toneAudioDone, toneAudioStart, toneInputAudio } from './tones';
import { TRenderedEvent } from './types';

export const renderInputAudioBufferCommitted = (event: TInputAudioBufferCommittedEvent): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: 'Input Audio',
    title: 'Input buffer committed',
    summary: 'User speech committed for processing',
    details: {
      event_id: event.event_id,
      item_id: event.item_id,
      previous_item_id: event.previous_item_id,
    },
    tone: toneInputAudio,
  });
};

export const renderInputAudioSpeechStarted = (event: TInputAudioBufferSpeechStartedEvent): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: 'Input Audio',
    title: 'Speech started',
    summary: 'Voice activity detected',
    details: {
      event_id: event.event_id,
      item_id: event.item_id,
      audio_start_ms: readNumber(event.audio_start_ms),
    },
    tone: toneInputAudio,
  });
};

export const renderInputAudioSpeechStopped = (event: TInputAudioBufferSpeechStoppedEvent): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: 'Input Audio',
    title: 'Speech stopped',
    summary: 'Voice activity ended',
    details: {
      event_id: event.event_id,
      item_id: event.item_id,
      audio_end_ms: readNumber(event.audio_end_ms),
    },
    tone: toneInputAudio,
  });
};

export const renderOutputAudioBufferStarted = (event: TOutputAudioBufferStartedEvent): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: 'Audio Start',
    title: 'Output playback started',
    summary: 'Agent audio output started',
    details: {
      event_id: event.event_id,
      response_id: event.response_id,
    },
    tone: toneAudioStart,
  });
};

export const renderOutputAudioBufferStopped = (event: TOutputAudioBufferStoppedEvent): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: 'Audio Done',
    title: 'Output playback stopped',
    summary: 'Agent audio output stopped',
    details: {
      event_id: event.event_id,
      response_id: event.response_id,
    },
    tone: toneAudioDone,
  });
};
