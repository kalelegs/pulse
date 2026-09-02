/**
 * Stock domain layer — the client-safe half.
 *
 * Everything outside `lib/stocks` imports from this barrel and nothing deeper.
 * Unlike `lib/weather`, the provider is **not** exported here: it needs a
 * secret and a custom `User-Agent`, so it runs only inside
 * `actions/getStockReports.ts`, which imports `@/lib/stocks/provider` directly.
 * What this barrel exposes — types, formatting, derived figures and the speech
 * summaries — is pure and safe to bundle for the browser, where the tools and
 * spec builders use it on the reports the server action hands back.
 */
export {
  consensusCounts,
  consensusPhrase,
  directionOf,
  periodChangePercent,
  periodEndpoints,
  periodExtremes,
  rangePosition,
  type TDirection,
} from '@/lib/stocks/derive';
export {
  currencySymbol,
  formatCompact,
  formatDateLabel,
  formatMoney,
  formatNumber,
  formatPercent,
  formatSignedMoney,
  relativeTime,
} from '@/lib/stocks/format';
export { compareReports, describeReport, summariseFailure } from '@/lib/stocks/summary';
export { describeHistory, describeNews } from '@/lib/stocks/summaryExtras';
export { DEFAULT_RANGE, EStockErrorCode, RANGE_LABELS } from '@/lib/stocks/types';
export type {
  TStockHistoryPoint,
  TStockNewsItem,
  TStockQuery,
  TStockRange,
  TStockRecommendation,
  TStockReport,
  TStockResult,
  TStockSource,
} from '@/lib/stocks/types';
