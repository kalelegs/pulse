/**
 * Scale arithmetic shared by the line and bar charts.
 *
 * Every input is agent-supplied and reaches a component before validation
 * while a spec streams, so `NaN`, `Infinity`, negatives and non-arrays are all
 * live values here. Each helper clamps rather than throws: a bad number is a
 * missing point, never a white screen.
 */

/** Inclusive numeric range shared by every series drawn on one chart. */
export type TChartRange = { min: number; max: number };

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** Keeps only finite numbers, so a `null` or string point is dropped rather than plotted at 0. */
export const finiteValues = (values: unknown): number[] =>
  Array.isArray(values) ? values.filter(isFiniteNumber) : [];

/**
 * The range spanning every value of every series. A flat series (or one point)
 * is widened around its value so it draws mid-chart instead of dividing by zero.
 */
export const rangeOf = (series: number[][]): TChartRange => {
  const all = series.flat();

  if (all.length === 0) {
    return { min: 0, max: 1 };
  }

  const min = all.reduce((lowest, value) => Math.min(lowest, value), Infinity);
  const max = all.reduce((highest, value) => Math.max(highest, value), -Infinity);

  if (min === max) {
    const pad = Math.abs(min) || 1;
    return { min: min - pad, max: max + pad };
  }

  return { min, max };
};

/** 0 at `range.min`, 1 at `range.max`. */
export const normalise = (value: number, range: TChartRange): number =>
  range.max === range.min ? 0.5 : (value - range.min) / (range.max - range.min);

/** A bar length: `NaN`, negatives and non-numbers all become 0. */
export const clampMagnitude = (value: unknown): number =>
  isFiniteNumber(value) && value > 0 ? value : 0;

/**
 * The ceiling bars are scaled against: the caller's `max` when it is a usable
 * positive number, else the largest value, else 1 so an all-zero chart still
 * has a finite scale.
 */
export const barScale = (values: number[], max: unknown): number => {
  if (isFiniteNumber(max) && max > 0) {
    return max;
  }

  const largest = values.reduce((highest, value) => Math.max(highest, value), 0);

  return largest > 0 ? largest : 1;
};

/** `value` as a percentage of `scale`, capped at 100 so an over-`max` bar fills its track rather than overflowing it. */
export const percentOf = (value: number, scale: number): number =>
  Math.min(100, Math.max(0, (value / scale) * 100));
