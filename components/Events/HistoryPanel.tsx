'use client';

import { useMemo } from 'react';
import { RiEyeLine, RiPlugLine } from '@remixicon/react';
import { useEventLogStore } from '@/hooks';
import HistoryItemCard from './HistoryItemCard';
import { describeHistoryItem } from './historyItems';

type THistoryPanelProps = {
  /** Whether a session is live right now. Decides "not connected yet" from "last known". */
  isConnected: boolean;
};

/** The standing explanation of what this view is, so nobody reads it as a second transcript. */
const Note = () => (
  <p className="text-muted-foreground mt-2 flex gap-1.5 text-[11px] leading-relaxed">
    <RiEyeLine className="mt-px size-3 shrink-0" aria-hidden="true" />
    <span>
      Read-only mirror of <code>session.history</code>, the SDK&apos;s server-side view. It carries
      no partial transcripts by design, so text appears only once an item completes — later than the
      chat, and never mid-stream. Shown for comparison; nothing here feeds the transcript.
    </span>
  </p>
);

/**
 * The SDK history tab: a debug oracle for the transcript.
 *
 * Purely a display of what `history_updated` reported. It never writes to the chat store's
 * messages, never drives the extractor, and never calls `updateHistory`/`resetHistory` — if this
 * view broke, the conversation would be unaffected.
 */
const HistoryPanel = ({ isConnected }: THistoryPanelProps) => {
  const history = useEventLogStore((state) => state.sdkHistory);
  const updates = useEventLogStore((state) => state.sdkHistoryUpdates);

  const items = useMemo(() => history.map(describeHistoryItem), [history]);
  const flagged = items.filter((item) => item.note !== undefined).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b px-4 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">SDK history</h3>
          <span
            className="text-muted-foreground text-xs tabular-nums"
            title="Items currently in session.history, and how many history_updated emissions this session has produced."
          >
            {items.length} {items.length === 1 ? 'item' : 'items'} · {updates}{' '}
            {updates === 1 ? 'update' : 'updates'}
          </span>
        </div>
        <Note />
        {flagged > 0 ? (
          <p className="text-muted-foreground mt-2 text-[11px]">
            {flagged} {flagged === 1 ? 'item is' : 'items are'} labelled below. Those labels mark
            expected SDK behaviour, not transcript bugs.
          </p>
        ) : null}
      </div>

      <div className="bg-muted/20 flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4">
        {items.length === 0 ? (
          <div className="text-muted-foreground space-y-2 p-2 text-xs">
            <p className="text-foreground flex items-center gap-1.5 font-medium">
              <RiPlugLine className="size-3.5" aria-hidden="true" />
              {isConnected ? 'History is empty' : 'No session'}
            </p>
            <p>
              {isConnected
                ? 'The session is connected but the server has not reported a conversation item yet. A realtime session starts with an empty history, and the first item lands when the first turn completes.'
                : updates > 0
                  ? 'The last session reported an empty history before it ended.'
                  : 'Connect a session to see what the server thinks the conversation was.'}
            </p>
          </div>
        ) : (
          <>
            {!isConnected ? (
              <p className="text-muted-foreground rounded-md border border-dashed px-3 py-2 text-[11px]">
                Session disconnected. This is the last history the SDK reported, kept on screen for
                reading; it will be replaced when the next session connects.
              </p>
            ) : null}
            {items.map((item, index) => (
              <HistoryItemCard key={item.itemId} item={item} index={index} />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
