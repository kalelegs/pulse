import { EEventKind, TRenderTone } from '@/types';

/**
 * Row colouring per badge. Full class strings on purpose: Tailwind only emits classes it can read
 * verbatim from source, so these cannot be built from a colour name at runtime.
 */
export const TONE_BY_KIND: Record<EEventKind, TRenderTone> = {
  [EEventKind.Conversation]: {
    card: 'border-sky-500/30 bg-sky-500/[0.04]',
    badge: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  },
  [EEventKind.InputAudio]: {
    card: 'border-teal-500/30 bg-teal-500/[0.04]',
    badge: 'border-teal-500/40 bg-teal-500/10 text-teal-300',
  },
  [EEventKind.Response]: {
    card: 'border-indigo-500/30 bg-indigo-500/[0.04]',
    badge: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
  },
  [EEventKind.Stream]: {
    card: 'border-cyan-500/30 bg-cyan-500/[0.04]',
    badge: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
  },
  [EEventKind.ToolSelected]: {
    card: 'border-orange-500/30 bg-orange-500/[0.04]',
    badge: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
  },
  [EEventKind.ToolRequest]: {
    card: 'border-amber-500/30 bg-amber-500/[0.04]',
    badge: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  },
  [EEventKind.Tool]: {
    card: 'border-lime-500/30 bg-lime-500/[0.04]',
    badge: 'border-lime-500/40 bg-lime-500/10 text-lime-300',
  },
  [EEventKind.AudioStart]: {
    card: 'border-emerald-500/30 bg-emerald-500/[0.04]',
    badge: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  },
  [EEventKind.AudioDone]: {
    card: 'border-violet-500/30 bg-violet-500/[0.04]',
    badge: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
  },
  [EEventKind.Handoff]: {
    card: 'border-fuchsia-500/30 bg-fuchsia-500/[0.04]',
    badge: 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300',
  },
  [EEventKind.Session]: {
    card: 'border-blue-500/30 bg-blue-500/[0.04]',
    badge: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
  },
  [EEventKind.RateLimit]: {
    card: 'border-pink-500/30 bg-pink-500/[0.04]',
    badge: 'border-pink-500/40 bg-pink-500/10 text-pink-300',
  },
};

/** For rows that carry no kind — history items with no role and no tool. */
export const TONE_UNKNOWN: TRenderTone = {
  card: 'border-border bg-background',
  badge: 'border-border text-foreground',
};

/** History rows reuse the event tones so a user turn looks the same in both tabs. */
export const TONE_BY_ROLE: Record<string, TRenderTone> = {
  user: TONE_BY_KIND[EEventKind.InputAudio],
  assistant: TONE_BY_KIND[EEventKind.Response],
};
