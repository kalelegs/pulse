'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import BlockIcon from '@/components/json-render/BlockIcon';
import type { TBlockComponent } from '@/lib/json-render/blocks';

/** Catalog variant -> shadcn button variant. `primary` is the library's name for the default look. */
const VARIANTS = {
  primary: 'default',
  secondary: 'secondary',
  outline: 'outline',
  ghost: 'ghost',
  destructive: 'destructive',
} as const;

export const ButtonBlock: TBlockComponent<'ButtonBlock'> = ({ props, on, loading }) => {
  const press = on('press');

  // Same rule as SuggestionChipBlock: a control from a half-streamed spec must
  // not be pressable, because its label and its bound params may not agree yet.
  if (loading) {
    return <Skeleton className="h-8 w-28 rounded-lg" />;
  }

  return (
    <Button
      // An unbound button would look pressable and do nothing; disabling it
      // makes the missing binding visible instead of silent.
      disabled={!press.bound}
      onClick={(event) => {
        if (press.shouldPreventDefault) {
          event.preventDefault();
        }
        press.emit();
      }}
      size={props.size === 'sm' ? 'sm' : 'default'}
      type="button"
      variant={VARIANTS[props.variant ?? 'primary']}
    >
      <BlockIcon name={props.icon} />
      {props.text}
    </Button>
  );
};
