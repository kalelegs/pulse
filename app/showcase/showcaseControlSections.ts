import { bind, block, type TSpecNode } from '@/lib/spec-builders/builder';

/**
 * Steps, ratings and code.
 *
 * The vertical stepper carries every status, including `blocked`, and the
 * horizontal one is placed at full width so its connectors are visible. The
 * rating is fractional on purpose (a partial fill) and the second one uses a
 * non-default `max`. The code block has a line long enough to scroll.
 */
export const processSection = (): TSpecNode[] => [
  block('StepperBlock', {
    steps: [
      { title: 'Account created', description: null, status: 'done' },
      { title: 'Verify email', description: 'Check your inbox for the link.', status: 'current' },
      {
        title: 'Payment method',
        description: 'Blocked until the email is verified.',
        status: 'blocked',
      },
      { title: 'Invite your team', description: null, status: 'upcoming' },
    ],
    orientation: 'vertical',
  }),
  block('StepperBlock', {
    steps: [
      { title: 'Cart', description: null, status: 'done' },
      { title: 'Shipping', description: null, status: 'done' },
      { title: 'Payment', description: null, status: 'current' },
      { title: 'Review', description: null, status: 'upcoming' },
    ],
    orientation: 'horizontal',
  }),
  block(
    'GridBlock',
    { columns: 2, gap: 'md' },
    {
      children: [
        block('RatingBlock', {
          value: 4.5,
          max: 5,
          label: 'Guest rating',
          valueLabel: '4.5 (312 reviews)',
          size: 'md',
        }),
        block('RatingBlock', {
          value: 7,
          max: 10,
          label: 'Difficulty',
          valueLabel: '7 / 10',
          size: 'sm',
        }),
      ],
    },
  ),
  block('CodeBlock', {
    code: 'bun add @json-render/react\nbun run dev\n# a line long enough that the block has to scroll instead of widening the panel --------',
    language: 'bash',
    caption: 'Run from the project root',
    wrap: false,
  }),
];

/**
 * Buttons and a callout with children.
 *
 * One button binds `select`, one binds `suggest`, and the ghost one is left
 * unbound so its disabled treatment is reviewable. The callout carries a chip
 * beneath its text, which is the reason it has a `default` slot at all.
 */
export const controlSection = (): TSpecNode[] => [
  block(
    'StackBlock',
    { direction: 'row', gap: 'sm', align: 'center', justify: null, wrap: true },
    {
      children: [
        block(
          'ButtonBlock',
          { text: 'Choose this plan', variant: 'primary', size: 'md', icon: 'check' },
          { on: { press: bind('select', { value: 'team', label: 'Team plan' }) } },
        ),
        block(
          'ButtonBlock',
          { text: 'Compare plans', variant: 'outline', size: 'md', icon: null },
          {
            on: { press: bind('suggest', { text: 'Compare the plans side by side', value: null }) },
          },
        ),
        block('ButtonBlock', {
          text: 'Unbound is disabled',
          variant: 'ghost',
          size: 'sm',
          icon: null,
        }),
      ],
    },
  ),
  block(
    'CalloutBlock',
    {
      title: 'Heads up',
      text: 'Availability was checked a few minutes ago and can change before you book.',
      tone: 'info',
      icon: 'info',
    },
    {
      children: [
        block(
          'SuggestionChipBlock',
          { text: 'Check again', hint: null, tone: 'outline', icon: 'refresh' },
          { on: { press: bind('suggest', { text: 'Check availability again', value: null }) } },
        ),
      ],
    },
  ),
];
