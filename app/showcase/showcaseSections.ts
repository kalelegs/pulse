import { bind, block, type TSpecNode } from '@/lib/spec-builders/builder';

/** Headings, prose, labels, badges, icons and links. */
export const contentSection = (): TSpecNode[] => [
  block('HeadingBlock', {
    text: 'Content primitives',
    level: '2',
    subtitle: 'Headings, prose, labels and links',
    icon: 'file',
  }),
  block('TextBlock', {
    text: 'Blocks are domain-agnostic. Compose them with StackBlock and GridBlock to build whatever the answer needs.',
    tone: 'muted',
    size: 'sm',
    align: null,
  }),
  block(
    'StackBlock',
    { direction: 'row', gap: 'md', align: 'center', justify: 'start', wrap: true },
    {
      children: [
        block('LabelBlock', { text: 'Status', subtle: true }),
        block('BadgeBlock', { text: 'Operational', tone: 'secondary', icon: 'check' }),
        block('IconBlock', { name: 'flash', size: 'md', tone: 'primary', label: null }),
        block('LinkBlock', {
          href: 'https://ui.shadcn.com/docs/components',
          text: 'shadcn components',
          newTab: true,
          icon: 'external-link',
        }),
      ],
    },
  ),
];

/**
 * Metrics, key/value rows, progress and tables.
 *
 * Both metric sizes are still covered, but on separate rows: an `lg` metric next
 * to two `md` ones in a single grid row sets three numbers at three different
 * heights, which reads as a layout bug rather than as size coverage. Giving the
 * `lg` metric its own row is also how an agent should use it — one headline
 * number, with the supporting ones beneath.
 */
export const dataSection = (): TSpecNode[] => [
  block('MetricBlock', {
    label: 'Active sessions',
    value: '128',
    unit: null,
    delta: '+12 today',
    trend: 'up',
    icon: 'team',
    size: 'lg',
  }),
  block(
    'GridBlock',
    { columns: 2, gap: 'md' },
    {
      children: [
        block('MetricBlock', {
          label: 'Median latency',
          value: '240',
          unit: 'ms',
          delta: '-30ms',
          trend: 'down',
          icon: 'flash',
          size: 'md',
        }),
        block('MetricBlock', {
          label: 'Error rate',
          value: '0.4',
          unit: '%',
          delta: null,
          trend: 'flat',
          icon: 'alert',
          size: 'md',
        }),
      ],
    },
  ),
  block(
    'StackBlock',
    { direction: 'column', gap: 'sm', align: null, justify: null, wrap: null },
    {
      children: [
        block('KeyValueBlock', { label: 'Region', value: 'us-west-2', icon: 'globe' }),
        block('KeyValueBlock', { label: 'Uptime', value: '99.98%', icon: 'check-circle' }),
        block('ProgressBlock', {
          value: 72,
          label: 'Monthly quota',
          valueLabel: '72 of 100',
          tone: 'warning',
        }),
      ],
    },
  ),
  block('TableBlock', {
    columns: ['Service', 'Status', 'p95'],
    rows: [
      ['Realtime', 'Healthy', '180ms'],
      ['Renderer', 'Healthy', '12ms'],
      ['Tools', 'Degraded', '940ms'],
    ],
    caption: 'Last 15 minutes',
  }),
];

const listItem = (text: string): TSpecNode =>
  block('TextBlock', { text, tone: null, size: 'sm', align: null });

/** Lists, carousels, media and chat bubbles. */
export const collectionSection = (): TSpecNode[] => [
  block(
    'ListBlock',
    { title: 'When to reach for what', ordered: false },
    {
      children: [
        listItem('StackBlock for anything that flows in one direction.'),
        listItem('GridBlock for evenly sized tiles.'),
        listItem('CarouselBlock when a row will not fit.'),
      ],
    },
  ),
  block(
    'CarouselBlock',
    { title: 'Media and cards', itemWidth: 'md' },
    {
      children: [
        block(
          'CardBlock',
          { title: 'Visual', description: null, icon: 'image', tone: 'muted' },
          {
            children: [
              block('ImageBlock', {
                src: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?w=800',
                alt: 'Clouds over a city skyline',
                caption: 'ImageBlock degrades gracefully on load failure',
                width: 480,
                height: 270,
              }),
            ],
          },
        ),
        block(
          'CardBlock',
          { title: 'Transcript', description: null, icon: 'chat', tone: 'muted' },
          {
            children: [
              block('TextBubbleBlock', {
                text: 'Render whatever structure your agent returns as JSON.',
                speaker: 'Assistant',
                align: 'start',
                tone: 'default',
              }),
            ],
          },
        ),
      ],
    },
  ),
];

/** Bound and unbound suggestion chips. */
export const followUpSection = (): TSpecNode[] => [
  block(
    'StackBlock',
    { direction: 'row', gap: 'sm', align: 'center', justify: null, wrap: true },
    {
      children: [
        block(
          'SuggestionChipBlock',
          {
            text: 'Show the weather in San Francisco',
            hint: 'Sends this as your next message',
            tone: 'outline',
            icon: 'sun',
          },
          {
            on: {
              press: bind('suggest', { text: 'Show the weather in San Francisco', value: null }),
            },
          },
        ),
        block('SuggestionChipBlock', {
          text: 'Unbound chip stays static',
          hint: null,
          tone: 'secondary',
          icon: null,
        }),
      ],
    },
  ),
];
