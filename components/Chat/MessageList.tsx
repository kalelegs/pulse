'use client';

import { memo } from 'react';
import { RiArrowDownLine, RiChat3Line } from '@remixicon/react';
import AssistantMessage from './AssistantMessage';
import PendingToolRow from './PendingToolRow';
import UserMessage from './UserMessage';
import type { TSpecActionHandler } from './specActions';
import { useAutoScroll } from '@/hooks';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/hooks';
import { TMessage } from '@/types/ChatStore';

type TMessageRowProps = {
  message: TMessage;
  isStreaming?: boolean;
  onSpecAction?: TSpecActionHandler;
};

/**
 * One transcript row.
 *
 * `memo`d for the same reason `Events/EventCard` is: the list above re-renders on every
 * `appendContentToActiveMessage` — roughly forty times per spoken reply — and without this every
 * finalised bubble re-renders with it, including the whole json-render tree of any attached card
 * (~30 elements for a weather card). Rows are pure in their props and every prop is stable:
 * finalised messages are replaced by identity only when they actually change, and `onSpecAction`
 * is memoised at its source (`components/RealtimeExperience`), so the only row that re-renders per
 * delta is the streaming one, which genuinely changed.
 */
const MessageRow = memo(({ message, isStreaming, onSpecAction }: TMessageRowProps) =>
  message.role === 'user' ? (
    <UserMessage message={message} />
  ) : (
    <AssistantMessage message={message} isStreaming={isStreaming} onSpecAction={onSpecAction} />
  ),
);
MessageRow.displayName = 'MessageRow';

/** Placeholder shown before the first turn of a session lands. */
const EmptyState = () => (
  <div className="text-muted-foreground flex flex-col items-center gap-2 py-16 text-center">
    <RiChat3Line className="size-6" aria-hidden="true" />
    <p className="text-sm">No messages yet.</p>
    <p className="text-xs">Connect and start talking — the transcript shows up here.</p>
  </div>
);

type TMessageListProps = {
  /** Handles actions fired by generative-UI blocks. Built in `RealtimeExperience` so it can reach
   *  the live session; see `./specActions`. */
  onSpecAction?: TSpecActionHandler;
};

/**
 * The chat transcript: every finalised message plus the assistant message that is still
 * streaming. Scrolling is delegated to the surrounding column (see `hooks/useAutoScroll`).
 */
const MessageList = ({ onSpecAction }: TMessageListProps) => {
  const finalisedMessages = useChatStore((state) => state.finalisedMessages);
  const activeMessage = useChatStore((state) => state.activeMessage);
  const pendingToolName = useChatStore((state) => state.pendingToolName);
  const { listRef, isPinned, scrollToBottom } = useAutoScroll();
  const hasMessages = finalisedMessages.length > 0 || Boolean(activeMessage);

  return (
    <div ref={listRef} className="flex flex-col gap-4">
      {hasMessages ? null : <EmptyState />}
      {finalisedMessages.map((message) => (
        <MessageRow key={message.id} message={message} onSpecAction={onSpecAction} />
      ))}
      {activeMessage ? (
        <MessageRow message={activeMessage} isStreaming onSpecAction={onSpecAction} />
      ) : null}
      {pendingToolName && !activeMessage ? <PendingToolRow toolName={pendingToolName} /> : null}
      {hasMessages && !isPinned ? (
        <div className="pointer-events-none sticky bottom-0 flex justify-center pt-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="pointer-events-auto shadow-sm"
            onClick={scrollToBottom}
          >
            <RiArrowDownLine className="size-4" aria-hidden="true" />
            Jump to latest
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default MessageList;
