import { block, type TSpecNode } from '@/lib/spec-builders/builder';

/**
 * Line, bar and segmented charts.
 *
 * Deliberately covers the awkward inputs as well as the pretty ones: the
 * sparkline is placed beside a metric in a two-column grid (its intended
 * home), the two-series chart shares one y range, the vertical bars carry no
 * tones (so the auto palette is exercised), and the last segmented bar totals
 * zero and must render an empty track rather than divide by zero.
 */
export const chartSection = (): TSpecNode[] => [
  block(
    'GridBlock',
    { columns: 2, gap: 'md' },
    {
      children: [
        block('MetricBlock', {
          label: 'AAPL · close',
          value: '191.00',
          unit: '$',
          delta: '+4.9% this week',
          trend: 'up',
          icon: 'stock',
          size: 'md',
        }),
        block('LineChartBlock', {
          series: [
            { label: 'Close', values: [182.1, 185.4, 183.9, 188.2, 191.0], tone: 'success' },
          ],
          xLabels: null,
          unit: '$',
          size: 'sm',
          showArea: true,
        }),
      ],
    },
  ),
  block('LineChartBlock', {
    series: [
      { label: 'AAPL', values: [0, 1.2, 0.8, 2.6, 3.1, 2.4, 4.9], tone: 'primary' },
      { label: 'MSFT', values: [0, -0.4, 0.3, 1.1, 0.6, 1.8, 2.2], tone: 'muted' },
    ],
    xLabels: ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'],
    unit: '%',
    size: 'md',
    showArea: true,
  }),
  block('BarChartBlock', {
    items: [
      { label: 'Apple', value: 3100, display: '$3.1T', tone: 'primary' },
      { label: 'Microsoft', value: 2900, display: '$2.9T', tone: 'muted' },
      { label: 'Nvidia', value: 2700, display: '$2.7T', tone: 'muted' },
      { label: 'Amazon', value: 2000, display: '$2.0T', tone: 'muted' },
    ],
    orientation: 'horizontal',
    max: null,
  }),
  block('BarChartBlock', {
    items: [
      { label: 'Q1', value: 119.6, display: '$119.6B', tone: null },
      { label: 'Q2', value: 90.8, display: '$90.8B', tone: null },
      { label: 'Q3', value: 85.8, display: '$85.8B', tone: null },
      { label: 'Q4', value: 94.9, display: '$94.9B', tone: 'success' },
    ],
    orientation: 'vertical',
    max: 125,
  }),
  block('SegmentedBarBlock', {
    segments: [
      { label: 'Buy', value: 24, tone: 'success' },
      { label: 'Hold', value: 9, tone: 'warning' },
      { label: 'Sell', value: 2, tone: 'destructive' },
    ],
    showLegend: true,
    format: 'value',
    unit: null,
  }),
  block('SegmentedBarBlock', {
    segments: [
      { label: 'Equities', value: 60, tone: null },
      { label: 'Bonds', value: 30, tone: null },
      { label: 'Cash', value: 10, tone: null },
    ],
    showLegend: true,
    format: 'percent',
    unit: null,
  }),
  block('SegmentedBarBlock', {
    segments: [
      { label: 'Used', value: 0, tone: 'primary' },
      { label: 'Free', value: 0, tone: 'muted' },
    ],
    showLegend: true,
    format: 'value',
    unit: 'GB',
  }),
];

/**
 * Callouts, a timeline and a quote.
 *
 * The timeline's second entry carries a `javascript:` href on purpose: it must
 * render as plain text, exactly as `LinkBlock` would treat it.
 */
export const narrativeSection = (): TSpecNode[] => [
  block('CalloutBlock', {
    title: 'Not financial advice',
    text: 'Figures are delayed market data. Do your own research before trading.',
    tone: 'warning',
    icon: 'warning',
  }),
  block('CalloutBlock', {
    title: null,
    text: 'Prices refresh every fifteen minutes during market hours.',
    tone: 'info',
    icon: 'info',
  }),
  block('TimelineBlock', {
    items: [
      {
        title: 'Apple unveils new MacBook line',
        description: 'Shares rose 2% after the announcement.',
        time: '2h ago',
        href: 'https://www.apple.com/newsroom/',
        icon: 'news',
        tone: 'primary',
      },
      {
        title: 'Unsafe href renders as plain text',
        description: 'javascript: URLs never become links.',
        time: 'Yesterday',
        href: 'javascript:alert(1)',
        icon: null,
        tone: 'warning',
      },
      {
        title: 'Q2 earnings beat estimates',
        description: null,
        time: null,
        href: null,
        icon: 'chart-line',
        tone: 'success',
      },
    ],
  }),
  block('QuoteBlock', {
    text: 'Services growth continues to offset softer hardware demand.',
    attribution: 'Morgan Stanley analyst note',
    source: 'Reuters',
    href: 'https://www.reuters.com/',
  }),
];
