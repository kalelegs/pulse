import type { TMessageSink } from '@/types/ChatStore';
import { sameResponse } from './messagePayloads';

/**
 * Bookkeeping for assistant items the user talked over.
 *
 * A barge-in writes what the user already heard into the transcript straight away, because that
 * text is real whatever happens next. What happens next is *not* knowable at that moment:
 *
 * - with `turn_detection.interrupt_response` on (the default), the server cancels the response and
 *   any later transcript `.done` carries text that was never spoken — it must be dropped;
 * - with it off, or with a semantic VAD that does not cancel, the assistant keeps talking straight
 *   through the interjection and the rest of the reply is genuinely spoken — it must be kept.
 *
 * Nothing in this repo configures turn detection, so the mode is whatever the ephemeral-token
 * endpoint hands out. This ledger therefore holds the decision open until `response.done` states
 * the outcome: deltas that keep arriving extend the bubble immediately (they are proof the reply
 * is still being spoken), while a `.done` is stashed and only applied once the response is known
 * not to have been cancelled.
 */
export type TBargeInLedger = {
  /** True while `itemId` is waiting on `response.done` to say whether it was cancelled. */
  has: (itemId: string) => boolean;
  /**
   * Records the text the user heard before interrupting.
   *
   * @param responseId The response the item belongs to. Only that response's `response.done` may
   *   decide the item's fate — see `settle`.
   */
  mark: (itemId: string, spoken: string, responseId: string | undefined) => void;
  /** A delta that arrived after the interruption: the reply is still being spoken. */
  extend: (itemId: string, delta: string) => void;
  /** Holds a post-interruption `.done` until the response outcome is known. */
  stashDone: (itemId: string, authoritative: string) => void;
  /**
   * Closes the interruptions belonging to `responseId` and returns the item ids to seal.
   *
   * Scoped by response because `response.done` states the outcome of *one* response. A later
   * response completing normally says nothing about whether an earlier one was cancelled, and
   * applying its stashed text would re-inflate a barged-in bubble with words the user never heard.
   *
   * @param cancelled `response.done` reported `status: 'cancelled'` — the transcript keeps exactly
   *   what was heard and stashed text is thrown away.
   */
  settle: (responseId: string | undefined, cancelled: boolean) => string[];
  /**
   * Closes interruptions left open by any response other than `responseId`, keeping what was
   * heard. Called on `response.created`: the previous response is over whether or not its
   * `response.done` ever arrived, so its items must not stay open across the new one.
   */
  settleStale: (responseId: string | undefined) => string[];
  clear: () => void;
};

/** An interruption waiting on its response's outcome. */
type TOpenBargeIn = {
  responseId: string | undefined;
  /** Text spoken so far. */
  spoken: string;
  /** Authoritative transcript from a `.done` that has not been applied yet. */
  stashed?: string;
};

export const createBargeInLedger = (sink: TMessageSink): TBargeInLedger => {
  const openByItem = new Map<string, TOpenBargeIn>();

  /** Rewrites an already-finalised bubble in place. */
  const rewrite = (itemId: string, content: string) => {
    const message = sink.getFinalisedMessage(itemId);
    if (!message || !content.trim() || message.content === content) {
      return;
    }
    sink.upsertFinalisedMessage({ ...message, content });
  };

  /** Closes every open interruption matching `predicate`, applying stashed text only if kept. */
  const close = (predicate: (open: TOpenBargeIn) => boolean, applyStashed: boolean): string[] => {
    const itemIds: string[] = [];
    openByItem.forEach((open, itemId) => {
      if (!predicate(open)) {
        return;
      }
      itemIds.push(itemId);
      if (applyStashed && open.stashed !== undefined) {
        rewrite(itemId, open.stashed);
      }
    });
    itemIds.forEach((itemId) => openByItem.delete(itemId));
    return itemIds;
  };

  return {
    has: (itemId) => openByItem.has(itemId),
    mark: (itemId, spoken, responseId) => {
      openByItem.set(itemId, { responseId, spoken });
    },
    extend: (itemId, delta) => {
      const open = openByItem.get(itemId);
      if (!open) {
        return;
      }
      open.spoken += delta;
      rewrite(itemId, open.spoken);
    },
    stashDone: (itemId, authoritative) => {
      const open = openByItem.get(itemId);
      if (open) {
        open.stashed = authoritative;
      }
    },
    settle: (responseId, cancelled) =>
      close((open) => sameResponse(open.responseId, responseId), !cancelled),
    // A response that ended without saying so is treated exactly like a cancellation: keep what
    // the user heard, throw the unconfirmed text away.
    settleStale: (responseId) => close((open) => !sameResponse(open.responseId, responseId), false),
    clear: () => {
      openByItem.clear();
    },
  };
};
