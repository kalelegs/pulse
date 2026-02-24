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