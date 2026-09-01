'use client';

import { RiFilterOffLine } from '@remixicon/react';
import { Button } from '@/components/ui/button';

type TEventsEmptyStateProps = {
  /** Events held in the store, whatever the filters say. Zero means nothing has arrived yet. */
  recordedCount: number;
  /** How many category chips are switched off. */
  hiddenCategoryCount: number;
  /** How many recorded events those chips are holding back. */
  hiddenByCategoryCount: number;
  searchQuery: string;
  /** How many events the Settings-level "render tool calls" switch is holding back. */
  hiddenByToolFilterCount: number;
  onReset: () => void;
};

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

/**
 * Explains an empty list instead of leaving it blank, so a filtered-to-nothing panel never reads
 * as a broken one. Every reason it lists is undone by the single reset button.
 */
const EventsEmptyState = ({
  recordedCount,
  hiddenCategoryCount,
  hiddenByCategoryCount,
  searchQuery,
  hiddenByToolFilterCount,
  onReset,
}: TEventsEmptyStateProps) => {
  if (recordedCount === 0) {
    return <p className="text-muted-foreground p-2 text-xs">Waiting for transport events...</p>;
  }

  const reasons: string[] = [];
  if (hiddenCategoryCount > 0) {
    reasons.push(
      `${hiddenCategoryCount} ${plural(hiddenCategoryCount, 'category is', 'categories are')} hidden (${hiddenByCategoryCount} ${plural(hiddenByCategoryCount, 'event', 'events')})`,
    );
  }
  if (searchQuery.trim()) {
    reasons.push(`nothing matches "${searchQuery.trim()}"`);
  }
  if (hiddenByToolFilterCount > 0) {
    reasons.push(
      `${hiddenByToolFilterCount} tool-call ${plural(hiddenByToolFilterCount, 'event is', 'events are')} hidden in Settings`,
    );
  }

  return (
    <div className="text-muted-foreground space-y-2 p-2 text-xs">
      <p className="text-foreground flex items-center gap-1.5 font-medium">
        <RiFilterOffLine className="size-3.5" aria-hidden="true" />
        Nothing to show
      </p>
      <p>
        {recordedCount} {plural(recordedCount, 'event is', 'events are')} recorded, but{' '}
        {reasons.length > 0 ? reasons.join(', and ') : 'the filters exclude all of them'}.
      </p>
      <Button type="button" size="xs" variant="outline" onClick={onReset}>
        Reset filters
      </Button>
    </div>
  );
};

export default EventsEmptyState;
