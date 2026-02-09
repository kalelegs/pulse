import type { Spec } from '@json-render/react';

const createElement = <TProps extends object>(
  key: string,
  type: string,
  parentKey: string,
  props: TProps,
  children: string[] = [],
) => ({
  key,
  type,
  props,
  children,
  parentKey,
});

export const createShowcaseSpec = (): Spec => {
  const rootKey = 'showcase-root';

  return {
    root: rootKey,
    elements: {
      [rootKey]: createElement(
        rootKey,
        'CardBlock',
        '',
        {
          title: 'JSON Render Showcase',
          description: 'Generic building blocks for dynamic UI composition',
        },
        ['label-1', 'chip-1', 'list-1', 'bubble-1', 'carousel-1'],
      ),
      'label-1': createElement('label-1', 'LabelBlock', rootKey, {
        text: 'These components are domain-agnostic and reusable.',
        subtle: true,
      }),
      'chip-1': createElement('chip-1', 'SuggestionChip', rootKey, {
        text: 'Try asking for a dashboard',
        hint: 'Prompt suggestion',
        tone: 'outline',
      }),
      'list-1': createElement(
        'list-1',
        'ListBlock',
        rootKey,
        {
          title: 'Available blocks',
          ordered: false,
        },
        ['item-1', 'item-2', 'item-3'],
      ),
      'item-1': createElement('item-1', 'LabelBlock', 'list-1', {
        text: 'CardBlock',
        subtle: false,
      }),
      'item-2': createElement('item-2', 'LabelBlock', 'list-1', {
        text: 'TextBubble',
        subtle: false,
      }),
      'item-3': createElement('item-3', 'LabelBlock', 'list-1', {
        text: 'CarouselBlock + ImageBlock + LinkBlock',
        subtle: false,
      }),
      'bubble-1': createElement('bubble-1', 'TextBubble', rootKey, {
        text: 'Render whatever structure your agent returns as JSON.',
        speaker: 'System',
        align: 'start',
        tone: 'default',
      }),
      'carousel-1': createElement(
        'carousel-1',
        'CarouselBlock',
        rootKey,
        {
          title: 'Cards in a carousel',
        },
        ['slide-1', 'slide-2'],
      ),
      'slide-1': createElement(
        'slide-1',
        'CardBlock',
        'carousel-1',
        {
          title: 'Visual',
          description: 'Image block example',
        },
        ['image-1'],
      ),
      'image-1': createElement('image-1', 'ImageBlock', 'slide-1', {
        src: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?w=800',
        alt: 'Generic sample',
        caption: 'Dynamic media content',
        width: 480,
        height: 270,
      }),
      'slide-2': createElement(
        'slide-2',
        'CardBlock',
        'carousel-1',
        {
          title: 'Action',
          description: 'Link block example',
        },
        ['link-1'],
      ),
      'link-1': createElement('link-1', 'LinkBlock', 'slide-2', {
        href: 'https://ui.shadcn.com/docs/components',
        text: 'Browse shadcn components',
        newTab: true,
      }),
    },
  };
};
