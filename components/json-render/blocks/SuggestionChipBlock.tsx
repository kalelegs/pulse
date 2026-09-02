'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import BlockIcon from '@/components/json-render/BlockIcon';
import type { TBlockComponent } from '@/lib/json-render/blocks';

export const SuggestionChipBlock: TBlockComponent<'SuggestionChipBlock'> = ({
  props,
  on,
  loading,
}) => {
  const press = on('press');
  const variant = props.tone ?? 'secondary';
  const content = (
    <>
      <BlockIcon name={props.icon} />
      {props.text}
    </>
  );

  // A half-streamed spec must not be actionable: the label the user reads and the
  // params bound behind it may not agree yet, so pressing one could send a
  // follow-up the card never actually offered. Rendering the skeleton removes the
  // control entirely rather than merely disabling it.
  if (loading) {
    return <Skeleton className="h-6 w-32 rounded-full" />;
  }

  // Only render an interactive control when the spec actually bound `on.press` —
  // an unbound chip would otherwise look pressable but do nothing.
  if (!press.bound) {
    return (
      <Badge title={props.hint ?? undefined} variant={variant}>
        {content}
      </Badge>
    );
  }

  return (
    <Badge
      className="cursor-pointer transition-opacity hover:opacity-80"
      render={
        <button
          onClick={(event) => {
            if (press.shouldPreventDefault) {
              event.preventDefault();
            }
            press.emit();
          }}
          title={props.hint ?? undefined}
          type="button"
        />
      }
      variant={variant}
    >
      {content}
    </Badge>
  );
};
