'use client';

import { z } from 'zod';
import type { TRenderCtx } from '@/components/json-render/types';

export const textBubbleDefinition = {
  props: z.object({
    text: z.string(),
    speaker: z.string().nullable(),
    align: z.enum(['start', 'end']).nullable(),
    tone: z.enum(['default', 'muted']).nullable(),
  }),
  slots: [],
  description: 'Chat-like text bubble with optional speaker label.',
};

type TTextBubbleProps = z.infer<typeof textBubbleDefinition.props>;

export const TextBubble = ({ props }: TRenderCtx<TTextBubbleProps>) => {
  const align = props.align === 'end' ? 'items-end' : 'items-start';
  const toneClass =
    props.tone === 'muted' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-foreground';

  return (
    <div className={`flex ${align}`}>
      <div className="max-w-[80%] space-y-1">
        {props.speaker ? <p className="text-muted-foreground text-xs">{props.speaker}</p> : null}
        <div className={`rounded-xl px-3 py-2 text-sm ${toneClass}`}>{props.text}</div>
      </div>
    </div>
  );
};
