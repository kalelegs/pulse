const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  INR: '₹',
  CAD: 'CA$',
  AUD: 'A$',
};

/** Display symbol for an ISO 4217 code — "$" for USD, the code itself when unknown. */
export const currencySymbol = (currency: string): string =>
  CURRENCY_SYMBOLS[currency.toUpperCase()] ?? `${currency} `;

/** Fixed-decimal number with thousands separators — "1,234.56". */
export const formatNumber = (value: number, digits = 2): string =>
  Number.isFinite(value)
    ? value.toLocaleString('en-US', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    : '—';

/** "$325.08". Prices under a dollar keep more precision so penny stocks do not read as "$0.00". */
export const formatMoney = (value: number, currency: string): string =>
  `${currencySymbol(currency)}${formatNumber(value, Math.abs(value) < 1 ? 4 : 2)}`;

/** "+$4.12" / "-$0.05" — the sign leads the currency symbol. */
export const formatSignedMoney = (value: number, currency: string): string =>
  `${value < 0 ? '-' : '+'}${formatMoney(Math.abs(value), currency)}`;

/** "+1.3%" when `signed`, "1.3%" otherwise. */
export const formatPercent = (value: number, signed = false, digits = 1): string => {
  if (!Number.isFinite(value)) {
    return '—';
  }

  const sign = signed && value > 0 ? '+' : '';

  return `${sign}${value.toFixed(digits)}%`;
};

const COMPACT_STEPS: [number, string][] = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'K'],
];

/** "$3.1T", "$25.9M", "1.2K" — one decimal, trailing ".0" dropped. */
export const formatCompact = (value: number, currency?: string): string => {
  const prefix = currency ? currencySymbol(currency) : '';
  const step = COMPACT_STEPS.find(([threshold]) => Math.abs(value) >= threshold);

  if (!step) {
    return `${prefix}${formatNumber(value, 0)}`;
  }

  const scaled = (value / step[0]).toFixed(1).replace(/\.0$/, '');

  return `${prefix}${scaled}${step[1]}`;
};

/** ISO `YYYY-MM-DD` for a unix timestamp in the given IANA zone. */
export const toIsoDate = (unixSeconds: number, timeZone: string): string => {
  try {
    // `en-CA` is the locale whose default numeric date order is already ISO.
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(unixSeconds * 1000));
  } catch {
    return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
  }
};

const SHORT_DATE = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

/** "Mar 4" for an ISO date or timestamp. Formats in UTC so a date string never slips a day. */
export const formatDateLabel = (iso: string): string => {
  const parsed = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);

  return Number.isNaN(parsed.getTime()) ? iso : SHORT_DATE.format(parsed);
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * "12m ago", "2h ago", "Yesterday", "3d ago", then "Mar 4" once a week has passed.
 *
 * @param iso Publication timestamp.
 * @param now Reference time; injectable so summaries are reproducible.
 */
export const relativeTime = (iso: string, now: Date = new Date()): string => {
  const elapsed = now.getTime() - new Date(iso).getTime();

  if (!Number.isFinite(elapsed) || elapsed < 0) {
    return formatDateLabel(iso);
  }

  if (elapsed < HOUR_MS) {
    return `${Math.max(1, Math.round(elapsed / 60_000))}m ago`;
  }

  if (elapsed < DAY_MS) {
    return `${Math.round(elapsed / HOUR_MS)}h ago`;
  }

  const days = Math.round(elapsed / DAY_MS);

  if (days === 1) {
    return 'Yesterday';
  }

  return days < 7 ? `${days}d ago` : formatDateLabel(iso);
};
