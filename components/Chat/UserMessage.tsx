'use client';

import { RiUser3Line } from '@remixicon/react';
import TypingIndicator from './TypingIndicator';
import { TMessage } from '@/types/ChatStore';

type TUserMessageProps = {
  message: TMessage;
};

/**
 * A user turn. Rendered right aligned and tinted with the primary colour so it reads as "you"
 * against the neutral assistant cards.
 *
 * `message.isPending` — not emptiness — picks between its three states (placeholder plus dots,
 * partial text plus dots, text alone); see `./README.md`, "User". Deliberately not an `aria-live`
 * region: these are the user's own words, and `TypingIndicator`'s `role="status"` already announces
 * once that transcription is happening.
 */
const UserMessage = ({ message }: TUserMessageProps) => {
  const hasText = message.content.trim().length > 0;

  return (
    <article className="flex items-start justify-end gap-3">
      <div className="bg-primary/10 border-primary/20 max-w-[85%] min-w-0 rounded-xl rounded-tr-sm border px-3.5 py-2.5">
        <p className="text-muted-foreground mb-1 text-[11px] font-medium tracking-wide uppercase">
          You
        </p>
        {hasText ? (
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
            {message.content}
          </p>
        ) : null}
        {message.isPending ? (
          <span className="text-muted-foreground flex items-center gap-2 text-sm italic">
            {hasText ? null : 'Transcribing'}
            <TypingIndicator label="Transcribing your message" />
          </span>
        ) : null}
      </div>
      <span
        aria-hidden="true"
        className="bg-primary/15 text-primary flex size-7 shrink-0 items-center justify-center rounded-full"
      >
        <RiUser3Line className="size-4" />
      </span>
    </article>
  );
};

export default UserMessage;
