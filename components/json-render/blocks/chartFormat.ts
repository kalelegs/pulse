/**
 * Number formatting shared by the chart blocks' axis labels and legends.
 *
 * Blocks that carry a pre-formatted `display` string never come through here;
 * this is only for the numbers the chart has to print itself.
 */
const CURRENCY_SYMBOLS = new Set(['$', '€', '£', '¥', '₹', '₩', '₿']);

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export const formatNumber = (value: number): string => numberFormat.format(value);

/**
 * `"$1,234.5"` for a currency symbol, `"12.5%"` / `"-4°C"` for a short symbolic
 * unit, `"240 ms"` for a worded one. A negative currency reads `-$5`, not `$-5`.
 */
export const formatWithUnit = (value: number, unit: string | null | undefined): string => {
  if (!unit) {
    return formatNumber(value);
  }

  if (CURRENCY_SYMBOLS.has(unit)) {
    return value < 0 ? `-${unit}${formatNumber(-value)}` : `${unit}${formatNumber(value)}`;
  }

  const tight = unit.length <= 2 && !/^\p{L}/u.test(unit);

  return tight ? `${formatNumber(value)}${unit}` : `${formatNumber(value)} ${unit}`;
};
