import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export enum EVoice {
  ALLOY = 'alloy',
  ASH = 'ash',
  BALLAD = 'ballad',
  CORAL = 'coral',
  ECHO = 'echo',
  SAGE = 'sage',
  SHIMMER = 'shimmer',
  VERSE = 'verse',
  MARIN = 'marin',
  CEDAR = 'cedar',
}

/**
 * The realtime model id. Used both by the server action that mints the ephemeral
 * client secret and by the client-side RealtimeSession — they must never drift.
 */
export const REALTIME_MODEL = 'gpt-realtime-2.1';

/**
 * The model that transcribes the user's microphone audio.
 *
 * Pinned rather than inherited, because *which* model runs decides whether the user's bubble can
 * fill in progressively: `whisper-1` returns one result, the `gpt-4o-*-transcribe` family emits
 * `conversation.item.input_audio_transcription.delta` word by word. Two places would otherwise
 * decide this for us — the client-secrets endpoint (which defaults to `transcription: null`, i.e.
 * no transcription at all) and `@openai/agents-realtime`, whose
 * `DEFAULT_OPENAI_REALTIME_SESSION_CONFIG` overwrites the minted session on connect. Both are
 * given this value so they cannot disagree.
 */
export const TRANSCRIPTION_MODEL = 'gpt-4o-mini-transcribe';

/**
 * The language hint handed to the transcription model. The agent is English-speaking
 * (`agents/initial.ts`), so pinning it skips per-utterance language detection instead of letting a
 * short "yes" be read as another language.
 */
export const TRANSCRIPTION_LANGUAGE = 'en';
