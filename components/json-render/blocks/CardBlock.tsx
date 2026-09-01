'use client';

import type { BaseComponentProps } from '@json-render/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import BlockIcon from '@/components/json-render/BlockIcon';
import type { TBlockProps } from '@/components/json-render/blocks';

const TONES = {
  default: 'bg-card',
  muted: 'bg-muted/40',
  accent: 'bg-primary/10 border-primary/20',
} as const;

export const CardBlock = ({ props, children }: BaseComponentProps<TBlockProps<'CardBlock'>>) => {
  const hasHeader = Boolean(props.title || props.description || props.icon);

  return (
    <Card className={cn(TONES[props.tone ?? 'default'])}>
      {hasHeader ? (
        <CardHeader>
          <div className="flex items-start gap-2">
            <BlockIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" name={props.icon} />
            <div className="space-y-1">
              {props.title ? <CardTitle>{props.title}</CardTitle> : null}
              {props.description ? <CardDescription>{props.description}</CardDescription> : null}
            </div>
          </div>
        </CardHeader>
      ) : null}
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
};
