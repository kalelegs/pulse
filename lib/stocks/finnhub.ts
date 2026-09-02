import { fetchJson } from '@/lib/stocks/fetchJson';
import type { TStockNewsItem, TStockRecommendation } from '@/lib/stocks/types';

const BASE_URL = 'https://finnhub.io/api/v1';

/** How far back the headline window reaches. */
const NEWS_WINDOW_DAYS = 7;

/** How many headlines a report carries — enough for a timeline, few enough to speak about. */
const NEWS_LIMIT = 5;

type TProfilePayload = {
  name?: string;
  /** In millions of the listing currency. */
  marketCapitalization?: number;
  finnhubIndustry?: string;
};

type TMetricPayload = {
  metric?: {
    peNormalizedAnnual?: number | null;
    peTTM?: number | null;
    epsTTM?: number | null;
    dividendYieldIndicatedAnnual?: number | null;
    beta?: number | null;
  };
};

type TRecommendationPayload = {
  strongBuy?: number;
  buy?: number;
  hold?: number;
  sell?: number;
  strongSell?: number;
  period?: string;
}[];

type TNewsPayload = {
  headline?: string;
  source?: string;
  url?: string;
  /** Unix seconds. */
  datetime?: number;
}[];

/**
 * The keyed half of a report. Every field is nullable or empty because every
 * call may fail independently — and all of them do when there is no key.
 */
export type TFinnhubExtras = {
  marketCap: number | null;
  peRatio: number | null;
  eps: number | null;
  dividendYield: number | null;
  beta: number | null;
  industry: string | null;
  recommendation: TStockRecommendation | null;
  news: TStockNewsItem[];
  /** True when at least one call succeeded, so the card can credit the source. */
  contributed: boolean;
};

const EMPTY_EXTRAS: TFinnhubExtras = {
  marketCap: null,
  peRatio: null,
  eps: null,
  dividendYield: null,
  beta: null,
  industry: null,
  recommendation: null,
  news: [],
  contributed: false,
};

/** Whether the keyed provider is configured. Read at call time so a `.env` edit needs no rebuild. */
export const isFinnhubConfigured = (): boolean => Boolean(process.env.FINNHUB_API_KEY);

const finite = (value: number | null | undefined): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const isoDay = (date: Date): string => date.toISOString().slice(0, 10);

const newsWindow = (): { from: string; to: string } => {
  const to = new Date();
  const from = new Date(to.getTime() - NEWS_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  return { from: isoDay(from), to: isoDay(to) };
};

const toNews = (payload: TNewsPayload): TStockNewsItem[] =>
  payload
    .filter((item) => item.headline && item.url && typeof item.datetime === 'number')
    .sort((a, b) => (b.datetime ?? 0) - (a.datetime ?? 0))
    .slice(0, NEWS_LIMIT)
    .map((item) => ({
      headline: item.headline as string,
      source: item.source ?? 'Unknown source',
      url: item.url as string,
      publishedAt: new Date((item.datetime as number) * 1000).toISOString(),
    }));

const toRecommendation = (payload: TRecommendationPayload): TStockRecommendation | null => {
  const latest = payload[0];

  return latest?.period
    ? {
        strongBuy: latest.strongBuy ?? 0,
        buy: latest.buy ?? 0,
        hold: latest.hold ?? 0,
        sell: latest.sell ?? 0,
        strongSell: latest.strongSell ?? 0,
        period: latest.period,
      }
    : null;
};

/**
 * Fetches fundamentals, analyst consensus and recent headlines from Finnhub.
 *
 * The four calls run in parallel and are settled independently: a failed
 * profile call costs the market cap and nothing else. Without
 * `FINNHUB_API_KEY` nothing is requested and the empty extras come back at
 * once, which is what keeps the app fully usable keyless.
 *
 * @param symbol Exchange ticker, already upper-cased.
 */
export const fetchFinnhubExtras = async (symbol: string): Promise<TFinnhubExtras> => {
  const token = process.env.FINNHUB_API_KEY;

  if (!token) {
    return EMPTY_EXTRAS;
  }

  const headers = { 'X-Finnhub-Token': token };
  const get = <TPayload>(path: string, params: Record<string, string>) =>
    fetchJson<TPayload>(
      `${BASE_URL}${path}?${new URLSearchParams({ symbol, ...params })}`,
      headers,
    );

  const [profile, metric, recommendation, news] = await Promise.allSettled([
    get<TProfilePayload>('/stock/profile2', {}),
    get<TMetricPayload>('/stock/metric', { metric: 'all' }),
    get<TRecommendationPayload>('/stock/recommendation', {}),
    get<TNewsPayload>('/company-news', newsWindow()),
  ]);

  const value = <TPayload>(
    settled: PromiseSettledResult<Awaited<ReturnType<typeof get<TPayload>>>>,
  ): TPayload | null =>
    settled.status === 'fulfilled' && settled.value.ok ? settled.value.data : null;

  const profileData = value<TProfilePayload>(profile);
  const metrics = value<TMetricPayload>(metric)?.metric;
  const recommendations = value<TRecommendationPayload>(recommendation);
  const headlines = value<TNewsPayload>(news);
  const marketCapMillions = finite(profileData?.marketCapitalization);

  return {
    marketCap: marketCapMillions === null ? null : marketCapMillions * 1e6,
    peRatio: finite(metrics?.peNormalizedAnnual) ?? finite(metrics?.peTTM),
    eps: finite(metrics?.epsTTM),
    dividendYield: finite(metrics?.dividendYieldIndicatedAnnual),
    beta: finite(metrics?.beta),
    industry: profileData?.finnhubIndustry ?? null,
    recommendation: Array.isArray(recommendations) ? toRecommendation(recommendations) : null,
    news: Array.isArray(headlines) ? toNews(headlines) : [],
    contributed: [profileData, metrics, recommendations, headlines].some(Boolean),
  };
};
