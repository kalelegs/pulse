'use client';

import { KeyboardEvent, memo } from 'react';
import { RiArrowDownSLine, RiCheckLine, RiFileCopyLine } from '@remixicon/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getEventCategory } from '@/lib/events/categories';
import { cn } from '@/lib/utils';
import { TRenderedEvent } from '@/types';
import { EVENT_CATEGORIES } from './categoryMeta';
import { TONE_BY_KIND } from './tones';

const CATEGORY_LABELS = new Map(EVENT_CATEGORIES.map((category) => [category.id, category.label]));

type TEventCardProps = {
  event: TRenderedEvent;
  copied: boolean;
  expanded: boolean;
  /** Takes the event id so the handler stays stable and every other row can skip re-rendering. */
  onToggleExpand: (eventId: string) => void;
  onCopy: (event: TRenderedEvent) => void;
};

const EventCard = ({ copied, expanded, onToggleExpand, onCopy, event }: TEventCardProps) => {
  const toggleExpand = () => onToggleExpand(event.id);
  const categoryLabel = CATEGORY_LABELS.get(getEventCategory(event));
  const tone = TONE_BY_KIND[event.kind];

  const onCardKeyDown = (keyEvent: KeyboardEvent<HTMLElement>) => {
    if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
      keyEvent.preventDefault();
      toggleExpand();
    }
  };

  return (
    <article
      className={cn(
        'relative min-h-[88px] shrink-0 overflow-hidden rounded-xl border p-4 shadow-sm transition-colors',
        expanded ? 'bg-background/80' : 'hover:bg-background/80',
        tone.card,
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={toggleExpand}
        onKeyDown={onCardKeyDown}
        aria-expanded={expanded}
        className="flex cursor-pointer items-start justify-between gap-3"
      >
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2.5">
            <Badge variant="outline" className={cn('text-[11px]', tone.badge)}>
              {event.kind}
            </Badge>
            <span className="text-muted-foreground text-[11px]">{event.timestamp}</span>
          </div>
          <p className="text-sm leading-tight font-medium">{event.title}</p>
          <p
            className={cn(
              'text-muted-foreground text-xs leading-relaxed',
              expanded ? 'line-clamp-none' : 'line-clamp-1',
            )}
          >
            {event.summary}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={copied ? 'Copied event' : 'Copy event'}
            title={copied ? 'Copied' : 'Copy event JSON'}
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              onCopy(event);
            }}
          >
            {copied ? (
              <RiCheckLine className="size-3.5" aria-hidden="true" />
            ) : (
              <RiFileCopyLine className="size-3.5" aria-hidden="true" />
            )}
          </Button>
          <RiArrowDownSLine
            className={cn(
              'text-muted-foreground size-3.5 transition-transform',
              expanded ? 'rotate-180' : '',
            )}
            aria-hidden="true"
          />
          <span className="text-muted-foreground text-[10px]">
            {expanded ? 'Collapse' : 'Expand'}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <code className="text-muted-foreground truncate rounded bg-black/20 px-1.5 py-0.5 text-[10px]">
          {event.rawEvent.type}
        </code>
        <span className="text-muted-foreground shrink-0 text-[10px]">{categoryLabel}</span>
      </div>
      {expanded ? (
        <div className="mt-3 rounded-md border border-white/10 bg-black/20 p-2.5">
          <pre className="text-muted-foreground overflow-auto text-[11px] whitespace-pre-wrap">
            {JSON.stringify(event.rawEvent, null, 2)}
          </pre>
        </div>
      ) : null}
    </article>
  );
};

/**
 * Rows are pure in their props, and the list hands down stable callbacks, so a long log only
 * re-renders the row whose `expanded`/`copied` actually changed.
 */
export default memo(EventCard);
