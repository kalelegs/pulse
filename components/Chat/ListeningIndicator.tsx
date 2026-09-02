'use client';

import { cn } from '@/lib/utils';

type TListeningIndicatorProps = {
  /** Screen-reader label for what is currently in flight. */
  label: string;
  className?: string;
};

/** Staggered delays so the bars breathe out of phase rather than in lockstep. */
const BAR_DELAYS_MS = [0, 200, 400, 200, 0];

/**
 * Five bars pulsing like a level meter, shown while the user's speech is still being captured. It
 * is not a real level meter — the microphone stream is owned by the transport — but it tells the
 * user their voice is being heard before there is any transcript to show for it. Respects
 * `prefers-reduced-motion` by holding the bars still.
 */
const ListeningIndicator = ({ label, className }: TListeningIndicatorProps) => {
  return (
    <span className={cn('inline-flex h-3.5 items-center gap-0.5', className)} role="status">
      <span className="sr-only">{label}</span>
      {BAR_DELAYS_MS.map((delay, index) => (
        <span
          key={index}
          className="bg-primary/70 animate-sound-bar h-full w-0.5 origin-center rounded-full motion-reduce:animate-none"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
};

export default ListeningIndicator;
