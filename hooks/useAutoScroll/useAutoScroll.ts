'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** How close to the bottom still counts as "following the conversation". */
const PINNED_THRESHOLD_PX = 48;

/** A scroll this soon after an input event on the scroller was the user's doing. */
const USER_SCROLL_WINDOW_MS = 500;

/** The ways a person scrolls a box: wheel, touch, keyboard, or dragging its scrollbar. */
const USER_INPUT_EVENTS = ['wheel', 'touchstart', 'touchmove', 'keydown', 'pointerdown'] as const;

/** Walks up the DOM for the element that actually scrolls the list. */
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
 * Keeps the newest entry of a growing list in view without fighting the user.
 *
 * The scroller is discovered from the DOM rather than owned here, so each consumer keeps its own
 * layout: the chat column (`components/Chat/MessageList`, scrolled by the `overflow-auto` section
 * in `RealtimeExperience`) and the Events panel's transport log (`components/Events/EventList`) —
 * a debug log that yanks you back down mid-read is as unusable as a chat that does.
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
export const useAutoScroll = () => {
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

    // Scroll anchoring is the browser keeping the content under the reader still when something
    // above it changes height. Here it fired a scroll event on its own — no user, no code — that
    // left the list 61px from the bottom the instant a reply arrived, which read as "the user
    // scrolled away" and unpinned the list for good. Only the user and `scrollToBottom` may move it.
    const previousAnchor = scroller.style.overflowAnchor;
    scroller.style.overflowAnchor = 'none';

    // An absolutely positioned descendant — every `sr-only` label in the streaming cues — is laid
    // out against the nearest *positioned* ancestor. If the scroller is not one, those labels
    // escape it and stretch the document by the list's overflow, which is where the page-level
    // scrollbar during a reply came from. Making the scroller the containing block keeps them in.
    const previousPosition = scroller.style.position;
    if (window.getComputedStyle(scroller).position === 'static') {
      scroller.style.position = 'relative';
    }

    // Only the user may unpin. A scroll event also fires for our own `scrollTop` writes and for
    // the browser clamping after a shrink, and by the time it is handled the list may have grown
    // again — so neither "not at the bottom" nor "scrollTop went down" proves the reader left. An
    // input event just before the scroll does. Anything else that leaves a pinned list off the
    // bottom is content outrunning our scroll, and the list simply follows it once more.
    let lastInputAt = 0;
    const markInput = () => {
      lastInputAt = performance.now();
    };
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scroller;
      const distanceToBottom = scrollHeight - scrollTop - clientHeight;
      if (distanceToBottom <= PINNED_THRESHOLD_PX) {
        setPinned(true);
      } else if (performance.now() - lastInputAt < USER_SCROLL_WINDOW_MS) {
        setPinned(false);
      } else if (isPinnedRef.current) {
        scroller.scrollTop = scrollHeight;
      }
    };

    // Any size change, of the list or of the scroller itself (a composer appearing, a window
    // resize), moves the bottom; while pinned the list follows it every time.
    const observer = new ResizeObserver(() => {
      if (isPinnedRef.current) {
        scroller.scrollTop = scroller.scrollHeight;
      }
    });

    scroller.addEventListener('scroll', onScroll, { passive: true });
    USER_INPUT_EVENTS.forEach((type) =>
      scroller.addEventListener(type, markInput, { passive: true }),
    );
    observer.observe(list);
    observer.observe(scroller);

    return () => {
      scroller.style.overflowAnchor = previousAnchor;
      scroller.style.position = previousPosition;
      scroller.removeEventListener('scroll', onScroll);
      USER_INPUT_EVENTS.forEach((type) => scroller.removeEventListener(type, markInput));
      observer.disconnect();
    };
  }, [setPinned]);

  return { listRef, isPinned, scrollToBottom };
};
