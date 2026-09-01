'use client';

import { RiSparkling2Line } from '@remixicon/react';
import JsonRenderSurface from '@/components/json-render/JsonRenderSurface';
import { Card, CardContent } from '@/components/ui/card';
import TypingIndicator from './TypingIndicator';
import type { TSpecActionHandler } from './specActions';
import { TMessage } from '@/types/ChatStore';

type TAssistantMessageProps = {
  message: TMessage;
  /** True while the transcript for this message is still arriving over the transport. */
  isStreaming?: boolean;
  /** Fired when a block in this message's spec emits an action. See `./specActions`. */
  onSpecAction?: TSpecActionHandler;
};

/**
 * An assistant turn: the spoken transcript, plus the generative-UI spec the agent emitted for it
 * when there is one.
 */
const AssistantMessage = ({
  message,
  isStreaming = false,
  onSpecAction,
}: TAssistantMessageProps) => {
  const hasText = message.content.trim().length > 0;

  return (
    <article className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full"
      >
        <RiSparkling2Line className="size-4" />
      </span>
      <Card size="sm" className="max-w-[85%] min-w-0 rounded-tl-sm">
        <CardContent className="space-y-2">
          <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Pulse
          </p>
          {hasText || isStreaming ? (
            // The live region is only on the streaming bubble: a finalised transcript would be
            // re-announced in full every time the list re-renders. It is rendered while empty too,
            // so the region exists before the first delta lands and that delta is announced.
            <p
              aria-live={isStreaming ? 'polite' : undefined}
              className="text-sm leading-relaxed break-words whitespace-pre-wrap"
            >
              {message.content}
            </p>
          ) : null}
          {isStreaming ? <TypingIndicator label="Pulse is responding" /> : null}
          {message.spec ? (
            // No `loading`: specs are never streamed. A tool builds one from typed data and
            // attaches it whole, so it is complete on arrival. Passing `isStreaming` here showed a
            // finished card as skeleton bars for the rest of the spoken reply.
            <JsonRenderSurface spec={message.spec} onAction={onSpecAction} className="pt-1" />
          ) : null}
        </CardContent>
      </Card>
    </article>
  );
};

export default AssistantMessage;
