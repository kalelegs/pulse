'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import BlockIcon from '@/components/json-render/BlockIcon';
import { resolveDataTone } from '@/components/json-render/blocks/dataTones';
import { resolveIcon } from '@/components/json-render/icons';
import type { TBlockComponent } from '@/lib/json-render/blocks';
import { isSafeHttpUrl } from '@/lib/json-render/blocks/safeUrl';

/**
 * The rail is built per row — a marker column with the dot/icon and, on every
 * row but the last, a flexible hairline beneath it — rather than one absolutely
 * positioned line, so it never has to know the height of the text beside it.
 *
 * Same href rule as `LinkBlock`: specs render before they validate, so the
 * protocol check lives here and an unsafe href degrades to plain text.
 */
export const TimelineBlock: TBlockComponent<'TimelineBlock'> = ({ props, loading }) => {
  const items = Array.isArray(props.items) ? props.items : [];

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <ol className="w-full">
      {items.map((item, index) => {
        const tone = resolveDataTone(item?.tone);
        const isLast = index === items.length - 1;
        const hasIcon = Boolean(resolveIcon(item?.icon));

        return (
          <li
            className="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-3"
            key={`${item?.title ?? ''}-${index}`}
          >
            <div className="flex flex-col items-center">
              {hasIcon ? (
                <BlockIcon className={cn('size-4 shrink-0', tone.text)} name={item.icon} />
              ) : (
                <span aria-hidden className={cn('mt-1 size-2 shrink-0 rounded-full', tone.bg)} />
              )}
              {!isLast ? <span aria-hidden className="bg-border my-1 w-px flex-1" /> : null}
            </div>
            <div className={cn('min-w-0 space-y-0.5', !isLast && 'pb-4')}>
              {item?.time ? (
                <p className="text-muted-foreground text-[11px] leading-none">{item.time}</p>
              ) : null}
              {isSafeHttpUrl(item?.href) ? (
                <a
                  className="text-foreground block text-sm font-medium underline-offset-2 hover:underline"
                  href={item.href ?? undefined}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  {item.title}
                </a>
              ) : (
                <p className="text-foreground text-sm font-medium">{item?.title}</p>
              )}
              {item?.description ? (
                <p className="text-muted-foreground text-xs">{item.description}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
