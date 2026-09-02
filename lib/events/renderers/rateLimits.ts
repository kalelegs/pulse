import { EEventKind, TRateLimitsUpdatedEvent, TRenderedEvent } from '@/types';
import { buildRenderedEvent } from '../buildRenderedEvent';

export const renderRateLimitsUpdated = (event: TRateLimitsUpdatedEvent): TRenderedEvent => {
  const tokenLimit = event.rate_limits?.find((limit) => limit.name === 'tokens');
  const remaining = tokenLimit?.remaining;
  return buildRenderedEvent(event, {
    kind: EEventKind.RateLimit,
    title: 'Rate limits updated',
    summary:
      typeof remaining === 'number'
        ? `${remaining.toLocaleString()} tokens remaining`
        : 'Rate limit updated',
  });
};
