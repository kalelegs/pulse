'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tracks whether a horizontally scrolling element still has content past its
 * right edge.
 *
 * Measured rather than assumed on purpose: whether a strip overflows depends on
 * how many children the agent streamed in *and* on the width of whatever the
 * card was placed in, so no static class can express it. The consumer uses the
 * flag to show an edge affordance only while one is warranted — a permanently
 * applied fade would clip the last item of a strip that fits.
 *
 * Re-measures on scroll, on the scroller resizing, and on any child resizing.
 * Children arrive one at a time while a spec streams, so a `MutationObserver`
 * on the child list re-measures and puts each newcomer under the
 * `ResizeObserver` as it lands — observing the children present at mount would
 * miss every later one.
 */
export const useScrollableRight = <TElement extends HTMLElement>() => {
  const ref = useRef<TElement | null>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const measure = useCallback(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    // 1px of slack: fractional layout widths otherwise leave the flag stuck on.
    setCanScrollRight(element.scrollWidth - element.clientWidth - element.scrollLeft > 1);
  }, []);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(element);

    const observeChildren = () => {
      for (const child of Array.from(element.children)) {
        resizeObserver.observe(child);
      }
    };

    observeChildren();

    // `observe` on an already-observed child is a no-op, so re-observing them all is
    // cheaper than diffing; removed children are dropped by the observer itself.
    const mutationObserver = new MutationObserver(() => {
      observeChildren();
      measure();
    });
    mutationObserver.observe(element, { childList: true });

    element.addEventListener('scroll', measure, { passive: true });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      element.removeEventListener('scroll', measure);
    };
  }, [measure]);

  return { ref, canScrollRight };
};
