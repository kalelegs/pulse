import type { TMessageSink } from '@/types/ChatStore';
import type { TransportEvent } from '@openai/agents/realtime';
import type { TBargeInLedger } from './bargeIn';
import {
  asPayload,
  sameResponse,
  type TResponseCreatedPayload,
  type TResponseDonePayload,
} from './messagePayloads';

/** Closes items the transcript may not change again. */
export type TSealFn = (itemIds: string[]) => void;

export type TResponseTracker = {
  /** The response every assistant item added from now on belongs to. */
  current: () => string | undefined;
  /** `response.created` — adopts the new id and closes what the previous response left open. */
  handleCreated: (event: TransportEvent) => void;
  /** `response.done` — closes the turn and resolves the barge-ins of *this* response. */
  handleDone: (event: TransportEvent) => void;
  reset: () => void;
};

/**
 * Who owns the items arriving right now.
 *
 * A realtime turn is not one response: a tool call ends one and the submitted output starts
 * another, and the two overlap on the wire — `response.done` for the first can arrive after the
 * second has already started streaming. Without an identity to check against, that late `.done`
 * truncates the *current* item permanently and settles the *previous* response's barge-in with the
 * wrong verdict. Every response-scoped decision therefore goes through the id from
 * `response.created`, and anything unmatched when a new response opens is closed as heard.
 *
 * The id is also published to the sink, because consumers outside the extractor need it:
 * `tools/attachSpec` waits for a bubble from a *later* response than the one its tool ran in.
 */
export const createResponseTracker = (
  sink: TMessageSink,
  bargeIn: TBargeInLedger,
  finalise: () => void,
  seal: TSealFn,
): TResponseTracker => {
  let currentResponseId: string | undefined;

  const adopt = (responseId: string | undefined) => {
    currentResponseId = responseId;
    sink.setResponseId(responseId);
  };

  return {
    current: () => currentResponseId,
    handleCreated: (event) => {
      const { response } = asPayload<TResponseCreatedPayload>(event);
      seal(bargeIn.settleStale(response?.id));
      adopt(response?.id);
    },
    handleDone: (event) => {
      const { response } = asPayload<TResponseDonePayload>(event);
      if (sameResponse(response?.id, currentResponseId)) {
        // Safety net: a text-less response never emits a transcript `.done`. Skipped for a
        // response that is not the current one — finalising here would seal the item another
        // response is still streaming and drop every delta after it.
        finalise();
      }
      seal(bargeIn.settle(response?.id, response?.status === 'cancelled'));
    },
    reset: () => {
      adopt(undefined);
    },
  };
};
