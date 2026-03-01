import { TTransportEvent } from "@/types";

/**
 * Represents rendering tones for the event
 */
export type TRenderTone = {
  card: string;
  badge: string;
  accent: string;
};

/**
 * This type represents a rendering friendly representation of TransportEvent
 */
export type TRenderedEvent = {
  id: string;
  kind: string;
  title: string;
  summary: string;
  details: Record<string, unknown>;
  tone: TRenderTone;
  rawEvent: TTransportEvent;
  timestamp: string;
};
