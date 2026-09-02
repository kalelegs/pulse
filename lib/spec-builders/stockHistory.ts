import type { TJsonRenderSpec } from '@/lib/json-render/types';
import { block, buildSpec, type TSpecNode } from '@/lib/spec-builders/builder';
import {
  changeTone,
  chartChip,
  chipRow,
  newsChip,
  quoteChip,
  stockHeading,
  stockRootKey,
} from '@/lib/spec-builders/stockParts';
import {
  currencySymbol,
  directionOf,
  formatDateLabel,
  formatMoney,
  formatNumber,
  formatPercent,
  periodChangePercent,
  periodEndpoints,
  periodExtremes,
  RANGE_LABELS,
  type TStockReport,
} from '@/lib/stocks';

/** How many dates the x axis names. The rest are "" so the axis stays sparse. */
const AXIS_LABEL_COUNT = 5;

/** One label per point, populated only at evenly spaced positions. */
const sparseLabels = (dates: string[]): string[] => {
  const last = dates.length - 1;
  const marked = new Set(
    Array.from({ length: AXIS_LABEL_COUNT }, (_, index) =>
      Math.round((index * last) / (AXIS_LABEL_COUNT - 1)),
    ),
  );

  return dates.map((date, index) => (marked.has(index) ? formatDateLabel(date) : ''));
};

const historyChart = (report: TStockReport): TSpecNode =>
  block('LineChartBlock', {
    series: [
      {
        label: report.symbol,
        values: report.history.map((point) => point.close),
        tone: changeTone(periodChangePercent(report) ?? 0),
      },
    ],
    xLabels: sparseLabels(report.history.map((point) => point.date)),
    unit: currencySymbol(report.currency).trim(),
    size: 'lg',
    showArea: true,
  });

/** Period change, high and low as three metrics, or nothing without history. */
const periodMetrics = (report: TStockReport): TSpecNode[] => {
  const endpoints = periodEndpoints(report);
  const extremes = periodExtremes(report);
  const change = periodChangePercent(report);

  if (!endpoints || !extremes || change === null) {
    return [];
  }

  const { currency } = report;
  const metric = (
    label: string,
    value: string,
    delta: string,
    icon: 'arrow-up' | 'arrow-down' | null,
  ) =>
    block('MetricBlock', {
      label,
      value,
      unit: null,
      delta,
      trend: icon === null ? directionOf(change) : null,
      icon,
      size: 'md',
    });

  return [
    block(
      'GridBlock',
      { columns: 3, gap: 'sm' },
      {
        children: [
          metric(
            RANGE_LABELS[report.range],
            formatPercent(change, true),
            `${formatMoney(endpoints.first, currency)} → ${formatMoney(endpoints.last, currency)}`,
            null,
          ),
          metric(
            'High',
            `${currencySymbol(currency).trim()}${formatNumber(extremes.high.close)}`,
            formatDateLabel(extremes.high.date),
            'arrow-up',
          ),
          metric(
            'Low',
            `${currencySymbol(currency).trim()}${formatNumber(extremes.low.close)}`,
            formatDateLabel(extremes.low.date),
            'arrow-down',
          ),
        ],
      },
    ),
  ];
};

/**
 * The chart-led history card: a large area chart with a sparse dated axis, the
 * period change beside its high and low, and follow-ups to widen the range.
 *
 * @param report Resolved report whose `history` spans the requested range.
 */
export const createStockHistorySpec = (report: TStockReport): TJsonRenderSpec =>
  buildSpec(
    block(
      'CardBlock',
      { title: null, description: null, icon: null, tone: 'default' },
      {
        key: stockRootKey('stock-history', [report]),
        children: [
          stockHeading(report, `${report.symbol} · ${RANGE_LABELS[report.range]}`, 'chart-line'),
          historyChart(report),
          ...periodMetrics(report),
          chipRow([
            chartChip(report, report.range === '1y' ? '1 month' : '1 year'),
            newsChip(report),
            quoteChip(report),
          ]),
        ],
      },
    ),
  );
