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
 * The bubble is created as soon as the user's audio buffer is committed, which is why it can be
 * empty: input transcription only starts once that buffer is committed, and then arrives a word at
 * a time. So there are three states, and `message.isPending` — not emptiness — is what separates
 * them: nothing yet ("Transcribing" plus dots), partial text (the words so far, dots still going),
 * and the resolved transcript (text alone). The dots are the same element throughout, so the
 * hand-off from the placeholder to the first word neither restarts the animation nor moves the
 * bubble.
 *
 * Deliberately **not** an `aria-live` region, unlike the assistant's streaming text. These are the
 * user's own words, read back to them a fragment at a time; a polite region would queue up seven
 * announcements of a sentence they just said. The `role="status"` on the indicator announces
 * "Transcribing your message" once, which is the part a screen-reader user does not already know.
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
