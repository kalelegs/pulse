import {
  EEventKind,
  TInputAudioBufferCommittedEvent,
  TInputAudioBufferSpeechStartedEvent,
  TInputAudioBufferSpeechStoppedEvent,
  TOutputAudioBufferStartedEvent,
  TOutputAudioBufferStoppedEvent,
  TRenderedEvent,
} from '@/types';
import { buildRenderedEvent } from '../buildRenderedEvent';

export const renderInputAudioBufferCommitted = (
  event: TInputAudioBufferCommittedEvent,
): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: EEventKind.InputAudio,
    title: 'Input buffer committed',
    summary: 'User speech committed for processing',
  });
};

export const renderInputAudioSpeechStarted = (
  event: TInputAudioBufferSpeechStartedEvent,
): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: EEventKind.InputAudio,
    title: 'Speech started',
    summary: 'Voice activity detected',
  });
};

export const renderInputAudioSpeechStopped = (
  event: TInputAudioBufferSpeechStoppedEvent,
): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: EEventKind.InputAudio,
    title: 'Speech stopped',
    summary: 'Voice activity ended',
  });
};

export const renderOutputAudioBufferStarted = (
  event: TOutputAudioBufferStartedEvent,
): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: EEventKind.AudioStart,
    title: 'Output playback started',
    summary: 'Agent audio output started',
  });
};

export const renderOutputAudioBufferStopped = (
  event: TOutputAudioBufferStoppedEvent,
): TRenderedEvent => {
  return buildRenderedEvent(event, {
    kind: EEventKind.AudioDone,
    title: 'Output playback stopped',
    summary: 'Agent audio output stopped',
  });
};
