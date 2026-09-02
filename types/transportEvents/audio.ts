import type { TTransportEventBase } from './names';

export type TInputAudioBufferCommittedEvent = TTransportEventBase & {
  type: 'input_audio_buffer.committed';
  item_id?: string;
  previous_item_id?: string | null;
};

export type TInputAudioBufferSpeechStartedEvent = TTransportEventBase & {
  type: 'input_audio_buffer.speech_started';
  item_id?: string;
  audio_start_ms?: number;
};

export type TInputAudioBufferSpeechStoppedEvent = TTransportEventBase & {
  type: 'input_audio_buffer.speech_stopped';
  item_id?: string;
  audio_end_ms?: number;
};

export type TOutputAudioBufferStartedEvent = TTransportEventBase & {
  type: 'output_audio_buffer.started';
  response_id?: string;
};

export type TOutputAudioBufferStoppedEvent = TTransportEventBase & {
  type: 'output_audio_buffer.stopped';
  response_id?: string;
};
