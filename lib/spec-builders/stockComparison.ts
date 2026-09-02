import type { TDataTone } from '@/lib/json-render/blocks';
import type { TJsonRenderSpec } from '@/lib/json-render/types';
import { block, buildSpec, type TSpecNode } from '@/lib/spec-builders/builder';
import {
  changeTone,
  chipRow,
  disclaimer,
  newsChip,
  stockRootKey,
  type TChip,
} from '@/lib/spec-builders/stockParts';
import {
  formatCompact,
  formatMoney,
  formatNumber,
  formatPercent,
  RANGE_LABELS,
  rangePosition,
  type TStockReport,
} from '@/lib/stocks';

/** One distinct series colour per listing, in the order the user named them. */
const SERIES_TONES: TDataTone[] = ['primary', 'success', 'warning', 'destructive'];

const dash = (value: string | null): string => value ?? '—';

const tableRow = (report: TStockReport): string[] => {
  const position = rangePosition(report);

  return [
    report.symbol,
    formatMoney(report.price, report.currency),
    formatPercent(report.changePercent, true, 2),
    dash(position === null ? null : `${position}%`),
    dash(report.peRatio === null ? null : formatNumber(report.peRatio, 1)),
    dash(report.marketCap === null ? null : formatCompact(report.marketCap, report.currency)),
  ];
};

/**
 * Market caps side by side when every listing has one; otherwise today's move,
 * which the keyless provider always knows. Bars scale on the magnitude and the
 * tone carries the sign, so a loss reads as a red bar rather than a bar that
 * points left.
 */
const comparisonBars = (reports: TStockReport[]): TSpecNode[] => {
  const byCap = reports.every((report) => report.marketCap !== null);

  return [
    block('DividerBlock', {
      label: byCap ? 'Market cap' : 'Change today',
      orientation: 'horizontal',
    }),
    block('BarChartBlock', {
      items: reports.map((report) =>
        byCap
          ? {
              label: report.symbol,
              value: report.marketCap ?? 0,
              display: formatCompact(report.marketCap ?? 0, report.currency),
              tone: 'primary' as const,
            }
          : {
              label: report.symbol,
              value: Math.abs(report.changePercent),
              display: formatPercent(report.changePercent, true, 2),
              tone: changeTone(report.changePercent),
            },
      ),
      orientation: 'horizontal',
      max: null,
    }),
  ];
};

/**
 * Every history rebased to percent change from its first close, trimmed to the
 * shortest series from the *end* so the lines end on the same day. A $300
 * stock and a $30 stock then share one axis and the eye compares slopes.
 */
const normalisedLines = (reports: TStockReport[]): TSpecNode[] => {
  const length = Math.min(...reports.map((report) => report.history.length));

  if (!Number.isFinite(length) || length < 2) {
    return [];
  }

  return [
    block('DividerBlock', {
      label: `Change over the ${RANGE_LABELS[reports[0].range]}`,
      orientation: 'horizontal',
    }),
    block('LineChartBlock', {
      series: reports.map((report, index) => {
        const closes = report.history.slice(-length).map((point) => point.close);
        const base = closes[0];

        return {
          label: report.symbol,
          values: closes.map((close) => Number((((close - base) / base) * 100).toFixed(2))),
          tone: SERIES_TONES[index % SERIES_TONES.length],
        };
      }),
      xLabels: null,
      unit: '%',
      size: 'sm',
      showArea: false,
    }),
  ];
};

const comparisonChips = (reports: TStockReport[]): TChip[] => {
  const symbols = reports.map((report) => report.symbol);

  return [
    {
      text: 'Which is the better buy?',
      prompt: `Which of ${symbols.join(' and ')} looks like the better buy right now?`,
      icon: 'scales',
    },
    newsChip(reports[0]),
  ];
};

/**
 * The comparison card for two to four listings: a table of the headline
 * figures, one bar chart on a shared measure, one rebased line chart, the
 * disclaimer and follow-ups.
 *
 * @param reports Resolved reports, in the order the user named them.
 */
export const createStockComparisonSpec = (reports: TStockReport[]): TJsonRenderSpec =>
  buildSpec(
    block(
      'CardBlock',
      { title: null, description: null, icon: null, tone: 'default' },
      {
        key: stockRootKey('stocks-compare', reports),
        children: [
          block('HeadingBlock', {
            text: reports.map((report) => report.symbol).join(' vs '),
            level: '1',
            subtitle: reports.map((report) => report.name).join(' · '),
            icon: 'scales',
          }),
          block('TableBlock', {
            columns: ['Symbol', 'Price', 'Today', '52w pos.', 'P/E', 'Mkt cap'],
            rows: reports.map(tableRow),
            caption: null,
          }),
          ...comparisonBars(reports),
          ...normalisedLines(reports),
          disclaimer(reports),
          chipRow(comparisonChips(reports)),
        ],
      },
    ),
  );
