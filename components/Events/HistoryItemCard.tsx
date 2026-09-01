'use client';

import { memo } from 'react';
import { RiInformationLine } from '@remixicon/react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TDescribedHistoryItem } from './historyItems';
import { TRenderTone } from './renderers/types';
import { toneInputAudio, toneResponse, toneTool, toneUnknown } from './renderers/tones';

const TONE_BY_ROLE: Record<string, TRenderTone> = {
  user: toneInputAudio,
  assistant: toneResponse,
};

type THistoryItemCardProps = {
  item: TDescribedHistoryItem;
  /** Position in `session.history`, so a reader can talk about "item 3" without an id. */
  index: number;
};

/**
 * One row of the SDK's history.
 *
 * Deliberately dumber than `EventCard`: no expand, no copy, no filtering. This view exists to be
 * compared against the transcript, so everything the SDK reports is on screen at once.
 */
const HistoryItemCard = ({ item, index }: THistoryItemCardProps) => {
  const tone = TONE_BY_ROLE[item.role] ?? (item.itemType === 'message' ? toneUnknown : toneTool);

  return (
    <article className={cn('shrink-0 rounded-xl border p-3 shadow-sm', tone.card)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-[10px] tabular-nums">#{index + 1}</span>
        <Badge variant="outline" className={cn('text-[11px]', tone.badge)}>
          {item.role === '—' ? item.itemType : item.role}
        </Badge>
        <span className="text-muted-foreground text-[11px]">{item.status}</span>
        {item.note ? (
          <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300">
            {item.note.label}
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-sm leading-snug break-words whitespace-pre-wrap">
        {item.text || <span className="text-muted-foreground italic">(no text in history)</span>}
      </p>

      {item.note ? (
        <p className="text-muted-foreground mt-2 flex gap-1.5 text-[11px] leading-relaxed">
          <RiInformationLine className="mt-px size-3 shrink-0" aria-hidden="true" />
          <span>{item.note.detail}</span>
        </p>
      ) : null}

      <div className="mt-2 flex items-center justify-between gap-2">
        <code className="text-muted-foreground truncate rounded bg-black/20 px-1.5 py-0.5 text-[10px]">
          {item.itemId}
        </code>
        <span className="text-muted-foreground shrink-0 text-[10px]">{item.itemType}</span>
      </div>
    </article>
  );
};

export default memo(HistoryItemCard);
