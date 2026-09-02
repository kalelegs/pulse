import type { TEventRecord, TTransportEventBase } from './names';

export type TSessionCreatedEvent = TTransportEventBase & {
  type: 'session.created';
  session?: TEventRecord;
};

export type TSessionUpdatedEvent = TTransportEventBase & {
  type: 'session.updated';
  session?: TEventRecord;
};

export type TRateLimit = {
  name?: string;
  limit?: number;
  remaining?: number;
  reset_seconds?: number;
  [key: string]: unknown;
};

export type TRateLimitsUpdatedEvent = TTransportEventBase & {
  type: 'rate_limits.updated';
  rate_limits?: TRateLimit[];
};
