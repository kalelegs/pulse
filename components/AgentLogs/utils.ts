export const toPreviewText = (value: string, fallback: string) => {
  const compact = value.replace(/\s+/g, ' ').trim();
  if (!compact) {
    return fallback;
  }
  return compact.length > 120 ? `${compact.slice(0, 120)}...` : compact;
};

export const readString = (value: unknown): string | undefined => {
  return typeof value === 'string' ? value : undefined;
};

export const readNumber = (value: unknown): number | undefined => {
  return typeof value === 'number' ? value : undefined;
};

export const formatTimestamp = (date: Date) => {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
};
