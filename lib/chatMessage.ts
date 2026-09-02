import type { TDuration, TMessage } from '@/types/ChatStore';

/** A duration with nothing measured yet. Every field is milliseconds since the turn started. */
export const createDuration = (): TDuration => ({
  textStart: 0,
  textEnd: 0,
  audioStart: 0,
  audioEnd: 0,
});

/** Builds a renderable text message. Specs are attached later, via `attachSpecToMessage`. */
export const createTextMessage = (
  id: string,
  role: TMessage['role'],
  content: string,
  duration: TDuration,
): TMessage => ({
  id,
  role,
  mime: 'text/plain',
  content,
  duration,
  spec: null,
});
