'use client';

import { KeyboardEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TRenderedEvent } from './renderers/types';

type TLogCardProps = {
  incomingEvent: TRenderedEvent;
  copied: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onCopy: () => void;
};

const EventCard = ({ copied, expanded, onToggleExpand, onCopy, incomingEvent }: TLogCardProps) => {
  const onCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggleExpand();
    }
  };

  return (
    <article
      className={cn(
        'relative min-h-[88px] shrink-0 overflow-hidden rounded-xl border p-4 shadow-sm transition-colors',
        expanded ? 'bg-background/80' : 'hover:bg-background/80',
        incomingEvent.tone.card,
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={onCardKeyDown}
        aria-expanded={expanded}
        className="flex cursor-pointer items-start justify-between gap-3"
      >
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2.5">
            <Badge variant="outline" className={cn('text-[11px]', incomingEvent.tone.badge)}>
              {incomingEvent.kind}
            </Badge>
            <span className="text-muted-foreground text-[11px]">{incomingEvent.timestamp}</span>
          </div>
          <p className="text-sm leading-tight font-medium">{incomingEvent.title}</p>
          <p
            className={cn(
              'text-muted-foreground text-xs leading-relaxed',
              expanded ? 'line-clamp-none' : 'line-clamp-1',
            )}
          >
            {incomingEvent.summary}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={copied ? 'Copied event' : 'Copy event'}
            title={copied ? 'Copied' : 'Copy event JSON'}
            onClick={(event) => {
              event.stopPropagation();
              onCopy();
            }}
          >
            {copied ? (
              <svg
                viewBox="0 0 24 24"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </Button>
          <svg
            viewBox="0 0 24 24"
            className={cn(
              'text-muted-foreground size-3.5 transition-transform',
              expanded ? 'rotate-180' : '',
            )}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          <span className="text-muted-foreground text-[10px]">
            {expanded ? 'Collapse' : 'Expand'}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <code className="text-muted-foreground truncate rounded bg-black/20 px-1.5 py-0.5 text-[10px]">
          {incomingEvent.kind}
        </code>
      </div>
      {expanded ? (
        <div className="mt-3 rounded-md border border-white/10 bg-black/20 p-2.5">
          <pre className="text-muted-foreground overflow-auto text-[11px] whitespace-pre-wrap">
            {JSON.stringify(incomingEvent.rawEvent, null, 2)}
          </pre>
        </div>
      ) : null}
    </article>
  );
};

export default EventCard;
