import type { TJsonRenderSpec } from '@/lib/json-render/types';
import { block, buildSpec, type TSpecNode } from '@/lib/spec-builders/builder';
import {
  chartChip,
  chipRow,
  quoteChip,
  stockHeading,
  stockRootKey,
} from '@/lib/spec-builders/stockParts';
import { relativeTime, type TStockReport } from '@/lib/stocks';

/** The headlines, newest first, each linking out to its source. */
const timeline = (report: TStockReport, now: Date): TSpecNode =>
  block('TimelineBlock', {
    items: report.news.map((item, index) => ({
      title: item.headline,
      description: item.source,
      time: relativeTime(item.publishedAt, now),
      href: item.url,
      icon: 'news' as const,
      tone: index === 0 ? ('primary' as const) : ('muted' as const),
    })),
  });

/** Why the timeline is empty — the missing key, or simply a quiet week. */
const emptyNote = (report: TStockReport, finnhubConfigured: boolean): TSpecNode =>
  finnhubConfigured
    ? block('CalloutBlock', {
        title: 'No recent headlines',
        text: `Nothing about ${report.name} was published in the last seven days.`,
        tone: 'muted',
        icon: 'info',
      })
    : block('CalloutBlock', {
        title: 'News needs an API key',
        text: 'Headlines come from Finnhub. Add FINNHUB_API_KEY to the server environment to turn them on.',
        tone: 'info',
        icon: 'info',
      });

/**
 * The news card: a timeline of the past week's headlines, or a callout that
 * says why there are none.
 *
 * @param report Resolved report; `news` is empty without a Finnhub key.
 * @param finnhubConfigured Whether the server had a key, so the empty state can say the right thing.
 * @param now Reference time for the relative labels; injectable for fixtures.
 */
export const createStockNewsSpec = (
  report: TStockReport,
  finnhubConfigured: boolean,
  now: Date = new Date(),
): TJsonRenderSpec =>
  buildSpec(
    block(
      'CardBlock',
      { title: null, description: null, icon: null, tone: 'default' },
      {
        key: stockRootKey('stock-news', [report]),
        children: [
          stockHeading(report, `${report.symbol} · Past 7 days`, 'news'),
          report.news.length ? timeline(report, now) : emptyNote(report, finnhubConfigured),
          chipRow([quoteChip(report), chartChip(report)]),
        ],
      },
    ),
  );
