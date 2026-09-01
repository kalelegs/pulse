'use client';

import { MouseEvent } from 'react';
import { RiFilter3Line } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EEventCategory, EVENT_CATEGORIES, TEventCategoryMeta } from './categories';

const ALL_CATEGORY_IDS = EVENT_CATEGORIES.map((category) => category.id);

type TEventFilterBarProps = {
  /** Categories currently held back from the list. */
  hiddenCategories: EEventCategory[];
  /** Tallies over everything the other filters let through, keyed by category. */
  countsByCategory: Record<EEventCategory, number>;
  /** Receives the complete new hidden set. */
  onChange: (values: EEventCategory[]) => void;
};

type TCategoryChipProps = {
  category: TEventCategoryMeta;
  count: number;
  shown: boolean;
  soloed: boolean;
  onToggle: (category: EEventCategory, solo: boolean) => void;
};

const CategoryChip = ({ category, count, shown, soloed, onToggle }: TCategoryChipProps) => {
  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    // Alt (or Cmd/Ctrl) turns the click into "only this one", and repeating it restores the rest —
    // the fastest way to read a single category without switching seven chips off by hand.
    onToggle(category.id, event.altKey || event.metaKey || event.ctrlKey);
  };

  return (
    <Button
      type="button"
      size="xs"
      variant={shown ? 'secondary' : 'ghost'}
      aria-pressed={shown}
      title={`${category.hint}\nClick to ${shown ? 'hide' : 'show'}. Alt-click to ${
        soloed ? 'show all' : 'show only this'
      }.`}
      onClick={onClick}
      className={cn('font-normal', shown ? '' : 'text-muted-foreground line-through opacity-60')}
    >
      {category.label}
      <span className="tabular-nums opacity-60">{count}</span>
    </Button>
  );
};

/**
 * The category chip row: one multi-select toggle per category with a live count, plus solo and
 * reset. Display-only — it never touches what the transport records.
 */
const EventFilterBar = ({ hiddenCategories, countsByCategory, onChange }: TEventFilterBarProps) => {
  const hidden = new Set(hiddenCategories);
  const shownIds = ALL_CATEGORY_IDS.filter((id) => !hidden.has(id));
  const soloedId = shownIds.length === 1 ? shownIds[0] : undefined;

  const onToggle = (category: EEventCategory, solo: boolean) => {
    if (solo) {
      onChange(soloedId === category ? [] : ALL_CATEGORY_IDS.filter((id) => id !== category));
      return;
    }
    onChange(
      hidden.has(category)
        ? hiddenCategories.filter((id) => id !== category)
        : [...hiddenCategories, category],
    );
  };

  return (
    <div className="mt-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
          <RiFilter3Line className="size-3" aria-hidden="true" />
          Show categories
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="xs"
            variant="ghost"
            className="text-muted-foreground font-normal"
            disabled={hiddenCategories.length === 0}
            onClick={() => onChange([])}
          >
            All
          </Button>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            className="text-muted-foreground font-normal"
            disabled={shownIds.length === 0}
            onClick={() => onChange([...ALL_CATEGORY_IDS])}
          >
            None
          </Button>
        </div>
      </div>
      <div role="group" aria-label="Event categories" className="flex flex-wrap gap-1">
        {EVENT_CATEGORIES.map((category) => (
          <CategoryChip
            key={category.id}
            category={category}
            count={countsByCategory[category.id]}
            shown={!hidden.has(category.id)}
            soloed={soloedId === category.id}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
};

export default EventFilterBar;
