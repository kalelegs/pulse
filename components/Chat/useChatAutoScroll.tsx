'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** How close to the bottom still counts as "following the conversation". */
const PINNED_THRESHOLD_PX = 48;

/** Walks up the DOM for the element that actually scrolls the chat column. */
const findScrollParent = (node: HTMLElement | null): HTMLElement | null => {
  let current = node?.parentElement ?? null;
  while (current) {
    const { overflowY } = window.getComputedStyle(current);
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return current;
    }
    current = current.parentElement;
  }
  return null;
};

/**
 * Keeps the newest message in view without fighting the user.
 *
 * The scroller is discovered from the DOM rather than owned here, so the chat column keeps its
 * layout (the `overflow-auto` section in `RealtimeExperience`) and this hook stays reusable — the
 * Events panel's transport log (`components/Events/EventList`) uses it too, for exactly the same
 * reason: a debug log that yanks you back down mid-read is unusable during a turn.
 * As soon as the user scrolls away from the bottom, auto-scrolling stops until they come back
 * (or press the returned `scrollToBottom`).
 *
 * Growth is detected with a `ResizeObserver` on the list rather than from a render-derived signal.
 * A signal can only encode the height changes someone thought to put in it, and the ones that
 * matter most here are invisible to render props — message count and streaming text are both
 * unchanged while a barge-in rewrites an already-finalised bubble (`bargeIn.rewrite`, when the
 * assistant talks through the interjection), while `audioEnd` is upserted onto a message that was
 * finalised before playback stopped (`turnDurations.recordAudioEnd`), or while an image finishes
 * loading after paint. The observer catches every source of height change, including those.
 */
export const useChatAutoScroll = () => {
  const listRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLElement | null>(null);
  const [isPinned, setIsPinned] = useState(true);
  // The ref is what the observer reads: it is set up once and must not be torn down and rebuilt
  // every time the user scrolls. The state is only there to render the "Jump to latest" button.
  const isPinnedRef = useRef(true);

  const setPinned = useCallback((value: boolean) => {
    isPinnedRef.current = value;
    setIsPinned(value);
  }, []);

  const scrollToBottom = useCallback(() => {
    const scroller = scrollerRef.current;
    if (scroller) {
      scroller.scrollTop = scroller.scrollHeight;
    }
    setPinned(true);
  }, [setPinned]);

  useEffect(() => {
    const list = listRef.current;
    const scroller = findScrollParent(list);
    scrollerRef.current = scroller;
    if (!list || !scroller) {
      return;
    }

    const onScroll = () => {
      const distanceToBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
      setPinned(distanceToBottom <= PINNED_THRESHOLD_PX);
    };

    let lastHeight = list.getBoundingClientRect().height;
    const observer = new ResizeObserver(() => {
      const height = list.getBoundingClientRect().height;
      const hasGrown = height > lastHeight;
      lastHeight = height;
      if (hasGrown && isPinnedRef.current) {
        scroller.scrollTop = scroller.scrollHeight;
      }
    });

    scroller.addEventListener('scroll', onScroll, { passive: true });
    observer.observe(list);

    return () => {
      scroller.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, [setPinned]);

  return { listRef, isPinned, scrollToBottom };
};
