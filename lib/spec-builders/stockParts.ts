import type { TDataTone } from '@/lib/json-render/blocks';
import type { TIconName } from '@/lib/json-render/iconNames';
import { bind, block, type TSpecNode } from '@/lib/spec-builders/builder';
import {
  currencySymbol,
  directionOf,
  formatNumber,
  formatPercent,
  formatSignedMoney,
  periodChangePercent,
  type TStockReport,
} from '@/lib/stocks';

/** "aapl", "brk-b" — a symbol as a key fragment. */
const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'card';

/**
 * Root key for a stock card — `stock-aapl`, `stocks-compare-aapl-amzn`.
 * Legibility only: nothing depends on root keys being unique (see the note on
 * `rootKey` in `lib/spec-builders/weather.ts`).
 */
export const stockRootKey = (prefix: string, reports: TStockReport[]): string =>
  `${prefix}-${reports.map((report) => slug(report.symbol)).join('-')}`;

/** Green for a gain, red for a loss, grey for no move — the market's own colour code. */
export const changeTone = (percent: number): TDataTone => {
  const direction = directionOf(percent);

  if (direction === 'flat') {
    return 'muted';
  }

  return direction === 'up' ? 'success' : 'destructive';
};

/** "AAPL · NasdaqGS", or just the symbol when the exchange is unknown. */
export const listingLine = (report: TStockReport): string =>
  [report.symbol, report.exchange].filter(Boolean).join(' · ');

export const stockHeading = (
  report: TStockReport,
  subtitle: string,
  icon: TIconName = 'stock',
): TSpecNode => block('HeadingBlock', { text: report.name, level: '1', subtitle, icon });

/** The headline price with today's move as its delta. */
export const priceMetric = (report: TStockReport, size: 'md' | 'lg'): TSpecNode =>
  block('MetricBlock', {
    label: 'Last price',
    value: formatNumber(report.price, Math.abs(report.price) < 1 ? 4 : 2),
    unit: currencySymbol(report.currency).trim(),
    delta: `${formatSignedMoney(report.change, report.currency)} (${formatPercent(report.changePercent, true, 2)})`,
    trend: directionOf(report.changePercent),
    icon: null,
    size,
  });

/** Axis-less sparkline of the closes, coloured by the period's direction. */
export const sparkline = (report: TStockReport): TSpecNode =>
  block('LineChartBlock', {
    series: [
      {
        label: report.symbol,
        values: report.history.map((point) => point.close),
        tone: changeTone(periodChangePercent(report) ?? 0),
      },
    ],
    xLabels: null,
    unit: currencySymbol(report.currency).trim(),
    size: 'sm',
    showArea: true,
  });

/** The line every card ends with. Names the providers that actually contributed. */
export const disclaimer = (reports: TStockReport[]): TSpecNode => {
  const sources = [...new Set(reports.flatMap((report) => report.sources))];

  return block('CalloutBlock', {
    title: 'Not financial advice',
    text: `Delayed market data from ${sources.join(' and ')}. Do your own research before trading.`,
    tone: 'muted',
    icon: 'info',
  });
};

/** One tappable follow-up: what the pill says and what it sends. */
export type TChip = { text: string; prompt: string; icon: TIconName };

export const chartChip = (report: TStockReport, range = '6 month'): TChip => ({
  text: `Show ${range} chart`,
  prompt: `Show me the ${range} price chart for ${report.symbol}`,
  icon: 'chart-line',
});

export const newsChip = (report: TStockReport): TChip => ({
  text: 'Latest news',
  prompt: `What is the latest news on ${report.symbol}?`,
  icon: 'news',
});

export const compareChip = (report: TStockReport): TChip => ({
  text: 'Compare with a rival',
  prompt: `Compare ${report.symbol} with its biggest competitor`,
  icon: 'scales',
});

export const quoteChip = (report: TStockReport): TChip => ({
  text: 'Show the quote',
  prompt: `Give me the current quote for ${report.symbol}`,
  icon: 'stock',
});

/** Follow-ups the user can tap instead of speaking, bound to the `suggest` action. */
export const chipRow = (chips: TChip[]): TSpecNode =>
  block(
    'StackBlock',
    { direction: 'row', gap: 'sm', align: 'center', justify: null, wrap: true },
    {
      children: chips.map((chip) =>
        block(
          'SuggestionChipBlock',
          { text: chip.text, hint: null, tone: 'outline', icon: chip.icon },
          { on: { press: bind('suggest', { text: chip.prompt, value: null }) } },
        ),
      ),
    },
  );
