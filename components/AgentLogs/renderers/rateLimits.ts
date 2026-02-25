import { TRateLimitsUpdatedEvent } from '@/types';
import { buildRenderedEvent } from './common';
import { toneRateLimit } from './tones';
import { TRenderedEvent } from './types';

export const renderRateLimitsUpdated = (event: TRateLimitsUpdatedEvent): TRenderedEvent => {
  const tokenLimit = event.rate_limits?.find((limit) => limit.name === 'tokens');
  const remaining = tokenLimit?.remaining;
  return buildRenderedEvent(event, {
    kind: 'Rate Limit',
    title: 'Rate limits updated',
    summary:
      typeof remaining === 'number' ? `${remaining.toLocaleString()} tokens remaining` : 'Rate limit updated',
    details: {
      event_id: event.event_id,
      rate_limits: event.rate_limits,
    },
    tone: toneRateLimit,
  });
};
