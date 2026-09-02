'use client';

import { useState, type FormEvent } from 'react';
import { RiSendPlaneFill } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type TChatComposerProps = {
  /**
   * Sends the trimmed text as a user turn. Returns whether it reached a live session; the draft is
   * cleared only on `true`, so a message that had nowhere to go is not lost.
   */
  onSend: (text: string) => boolean;
  /** Nothing is connected: the field is inert and says so in its placeholder. */
  disabled: boolean;
};

/**
 * A single-line text input pinned under the transcript, for turns the user would rather type than
 * say. Enter submits (through the form, so the send button and the key share one path) and there
 * is no multi-line mode, so Shift+Enter has nothing to insert and is simply ignored.
 *
 * Deliberately not an `aria-live` region: the echo lands in the transcript as the user's own
 * words, which `UserMessage` already declines to announce.
 */
const ChatComposer = ({ onSend, disabled }: TChatComposerProps) => {
  const [draft, setDraft] = useState('');
  const text = draft.trim();
  const canSend = !disabled && text.length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    // Handled here rather than navigating; focus stays in the input either way.
    event.preventDefault();
    if (!canSend) {
      return;
    }
    if (onSend(text)) {
      setDraft('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex shrink-0 items-center gap-2 border-t pt-3">
      <Input
        type="text"
        name="message"
        aria-label="Message"
        autoComplete="off"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        disabled={disabled}
        placeholder={disabled ? 'Connect to start typing' : 'Type a message'}
      />
      <Button type="submit" size="icon" aria-label="Send message" disabled={!canSend}>
        <RiSendPlaneFill aria-hidden="true" />
      </Button>
    </form>
  );
};

export default ChatComposer;
