import type { TJsonRenderSpec } from '@/lib/json-render/types';
import { block, buildSpec, type TSpecNode } from '@/lib/spec-builders/builder';
import {
  chartChip,
  chipRow,
  compareChip,
  disclaimer,
  listingLine,
  newsChip,
  priceMetric,
  sparkline,
  stockHeading,
  stockRootKey,
} from '@/lib/spec-builders/stockParts';
import {
  consensusCounts,
  formatCompact,
  formatMoney,
  formatNumber,
  formatPercent,
  type TStockReport,
} from '@/lib/stocks';

/** A labelled fact for the stats grid, or nothing when the figure is unavailable. */
const stat = (label: string, value: string | null): TSpecNode[] =>
  value === null ? [] : [block('KeyValueBlock', { label, value, icon: null })];

const optional = (value: number | null, render: (value: number) => string): string | null =>
  value === null ? null : render(value);

/**
 * The supporting figures. Nulls are omitted rather than shown as "—", so a
 * keyless report renders a shorter grid instead of a grid full of gaps.
 */
const statsGrid = (report: TStockReport): TSpecNode => {
  const { currency } = report;

  return block(
    'GridBlock',
    { columns: 2, gap: 'sm' },
    {
      children: [
        ...stat(
          'Day range',
          `${formatMoney(report.dayLow, currency)} – ${formatMoney(report.dayHigh, currency)}`,
        ),
        ...stat(
          '52-week range',
          `${formatMoney(report.week52Low, currency)} – ${formatMoney(report.week52High, currency)}`,
        ),
        ...stat('Volume', formatCompact(report.volume)),
        ...stat(
          'Market cap',
          optional(report.marketCap, (cap) => formatCompact(cap, currency)),
        ),
        ...stat(
          'P/E ratio',
          optional(report.peRatio, (pe) => formatNumber(pe, 1)),
        ),
        ...stat(
          'EPS',
          optional(report.eps, (eps) => formatMoney(eps, currency)),
        ),
        ...stat(
          'Dividend yield',
          optional(report.dividendYield, (dy) => formatPercent(dy, false, 2)),
        ),
        ...stat(
          'Beta',
          optional(report.beta, (beta) => formatNumber(beta, 2)),
        ),
      ],
    },
  );
};

/** Analyst consensus as one stacked bar, present only when a rating exists. */
const recommendationBar = (report: TStockReport): TSpecNode[] => {
  if (!report.recommendation) {
    return [];
  }

  const { buy, hold, sell, total } = consensusCounts(report.recommendation);

  if (total === 0) {
    return [];
  }

  return [
    block('DividerBlock', { label: `${total} analyst ratings`, orientation: 'horizontal' }),
    block('SegmentedBarBlock', {
      segments: [
        { label: 'Buy', value: buy, tone: 'success' as const },
        { label: 'Hold', value: hold, tone: 'warning' as const },
        { label: 'Sell', value: sell, tone: 'destructive' as const },
      ].filter((segment) => segment.value > 0),
      showLegend: true,
      format: 'value',
      unit: null,
    }),
  ];
};

/**
 * The single-listing quote card: name and listing, the price beside a
 * sparkline, the supporting figures, the analyst bar when there is one, the
 * disclaimer and three follow-ups. Composed from catalog blocks only.
 *
 * @param report Resolved report from `actions/getStockReports`.
 */
export const createStockQuoteSpec = (report: TStockReport): TJsonRenderSpec =>
  buildSpec(
    block(
      'CardBlock',
      { title: null, description: null, icon: null, tone: 'default' },
      {
        key: stockRootKey('stock', [report]),
        children: [
          stockHeading(report, listingLine(report)),
          block(
            'GridBlock',
            { columns: 2, gap: 'md' },
            { children: [priceMetric(report, 'lg'), sparkline(report)] },
          ),
          statsGrid(report),
          ...recommendationBar(report),
          disclaimer([report]),
          chipRow([chartChip(report), newsChip(report), compareChip(report)]),
        ],
      },
    ),
  );
