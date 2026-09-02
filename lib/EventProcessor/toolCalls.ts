import type { TMessageSink } from '@/types';
import type { TransportEvent } from '@openai/agents/realtime';
import { asPayload, type TOutputItemPayload } from './transportPayloads';

export type TToolCallTracker = {
  /** `response.output_item.done` — a completed `function_call` item means the tool is now running. */
  handleOutputItemDone: (event: TransportEvent) => void;
  /** `conversation.item.added` — a `function_call_output` item means the tool has returned. */
  handleItemAdded: (event: TransportEvent) => void;
  reset: () => void;
};

/**
 * Tracks the gap between a tool being requested and its output being submitted.
 *
 * Nothing else covers that gap: the response that requested the call has already completed, the
 * next one has not been created, and no message item exists to hang a streaming cue on. For a
 * slow fetch that is several seconds of nothing, which in text mode reads as a hang. Transfers are
 * skipped — the prompts promise never to tell the user which agent they are talking to.
 */
export const createToolCallTracker = (sink: TMessageSink): TToolCallTracker => {
  let pendingName: string | undefined;

  const publish = (name: string | undefined) => {
    pendingName = name;
    sink.setPendingToolName(name);
  };

  return {
    handleOutputItemDone: (event) => {
      const { item } = asPayload<TOutputItemPayload>(event);
      if (item?.type !== 'function_call' || !item.name || item.name.startsWith('transfer_to_')) {
        return;
      }
      publish(item.name);
    },
    handleItemAdded: (event) => {
      const { item } = asPayload<TOutputItemPayload>(event);
      if (item?.type === 'function_call_output' && pendingName !== undefined) {
        publish(undefined);
      }
    },
    reset: () => {
      if (pendingName !== undefined) {
        publish(undefined);
      }
    },
  };
};
