'use client';

import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TRenderCtx } from '@/components/json-render/types';

export const cardBlockDefinition = {
  props: z.object({
    title: z.string().nullable(),
    description: z.string().nullable(),
  }),
  slots: ['default'],
  description: 'Generic card container with optional title and description.',
};

type TCardBlockProps = z.infer<typeof cardBlockDefinition.props>;

export const CardBlock = ({ props, children }: TRenderCtx<TCardBlockProps>) => (
  <Card>
    {props.title || props.description ? (
      <CardHeader>
        {props.title ? <CardTitle>{props.title}</CardTitle> : null}
        {props.description ? <CardDescription>{props.description}</CardDescription> : null}
      </CardHeader>
    ) : null}
    <CardContent className="space-y-2">{children}</CardContent>
  </Card>
);
