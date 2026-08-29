import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export enum EVoice {
  ALLOY = "alloy",
  ASH = "ash",
  BALLAD = "ballad",
  CORAL = "coral",
  ECHO = "echo",
  SAGE = "sage",
  SHIMMER = "shimmer",
  VERSE = "verse",
  MARIN = "marin",
  CEDAR = "cedar",
}

/**
 * The realtime model id. Used both by the server action that mints the ephemeral
 * client secret and by the client-side RealtimeSession — they must never drift.
 */
export const REALTIME_MODEL = 'gpt-realtime-2.1';
