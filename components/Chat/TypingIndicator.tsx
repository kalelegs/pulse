'use client';

import { cn } from '@/lib/utils';

type TTypingIndicatorProps = {
  /** Screen-reader label for what is currently in flight. */
  label: string;
  className?: string;
};

/** Three pulsing dots used while a transcript is still streaming in. */
const TypingIndicator = ({ label, className }: TTypingIndicatorProps) => {
  return (
    <span className={cn('inline-flex items-center gap-1 align-middle', className)} role="status">
      <span className="sr-only">{label}</span>
      <span className="bg-muted-foreground/70 size-1.5 animate-pulse rounded-full" />
      <span className="bg-muted-foreground/70 size-1.5 animate-pulse rounded-full [animation-delay:150ms]" />
      <span className="bg-muted-foreground/70 size-1.5 animate-pulse rounded-full [animation-delay:300ms]" />
    </span>
  );
};

export default TypingIndicator;
