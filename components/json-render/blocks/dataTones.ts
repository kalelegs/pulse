import type { TDataTone } from '@/lib/json-render/blocks';

/**
 * Tailwind classes for one data tone. `text` colours text and, through
 * `currentColor`, SVG strokes and fills; `bg` paints a div (bar, segment, dot).
 */
export type TDataToneClasses = { text: string; bg: string };

/**
 * The one place `dataToneEnum` becomes colour. Every data block — line and bar
 * charts, the segmented bar, timeline dots — resolves its tones here, so
 * "success" cannot drift into emerald in one block and green-600 in another.
 * `default` is the foreground (as in `IconBlock`); success/warning reuse the
 * palette `MetricBlock` and `ProgressBlock` already draw with.
 */
export const DATA_TONES: Record<TDataTone, TDataToneClasses> = {
  default: { text: 'text-foreground', bg: 'bg-foreground' },
  primary: { text: 'text-block-accent', bg: 'bg-block-accent' },
  success: { text: 'text-emerald-500', bg: 'bg-emerald-500' },
  warning: { text: 'text-amber-500', bg: 'bg-amber-500' },
  destructive: { text: 'text-destructive', bg: 'bg-destructive' },
  muted: { text: 'text-muted-foreground', bg: 'bg-muted-foreground' },
};

/**
 * Colours handed out when a tone is null — or unknown, since specs render
 * before they validate. The theme's chart tokens, ordered so neighbours
 * contrast instead of shading into one another; callers that draw several
 * distinct categories (line series, bar segments) pass their index so untoned
 * neighbours still tell apart, while a chart comparing one measure across
 * items leaves it at 0 for a single colour.
 */
const AUTO_TONES: TDataToneClasses[] = [
  { text: 'text-chart-2', bg: 'bg-chart-2' },
  { text: 'text-chart-1', bg: 'bg-chart-1' },
  { text: 'text-chart-4', bg: 'bg-chart-4' },
  { text: 'text-chart-3', bg: 'bg-chart-3' },
  { text: 'text-chart-5', bg: 'bg-chart-5' },
];

const isDataTone = (tone: unknown): tone is TDataTone =>
  typeof tone === 'string' && tone in DATA_TONES;

/** Resolve an agent-supplied tone; anything not in the enum falls back to the auto palette. */
export const resolveDataTone = (tone: unknown, index = 0): TDataToneClasses =>
  isDataTone(tone)
    ? DATA_TONES[tone]
    : AUTO_TONES[(Number.isFinite(index) ? Math.max(0, index) : 0) % AUTO_TONES.length];
