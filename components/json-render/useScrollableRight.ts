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
 * Re-measures on scroll, on the scroller resizing, and on any child resizing
 * (children arrive one at a time while a spec streams).
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

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    for (const child of Array.from(element.children)) {
      observer.observe(child);
    }

    element.addEventListener('scroll', measure, { passive: true });

    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', measure);
    };
  }, [measure]);

  return { ref, canScrollRight };
};
