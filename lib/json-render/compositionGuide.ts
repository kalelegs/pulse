/**
 * How to compose the block vocabulary well, written for the model.
 *
 * Travels inside `render_ui`'s description (see `lib/json-render/catalogReference.ts`),
 * after the block list and before the icon and action lists, so the recipes sit
 * next to the vocabulary they refer to. Kept to a line array so its size is
 * easy to see and to trim; every line is paid for on every session connect.
 */
const GUIDE_LINES: string[] = [
  'COMPOSITION GUIDE',
  'Pick the layout from the intent, then fill it:',
  '- one fact -> a MetricBlock or a KeyValueBlock on its own, no card around it.',
  '- a few facts about one thing -> CardBlock > StackBlock(column) > KeyValueBlock or MetricBlock rows.',
  '- comparing 2-4 things -> CardBlock > GridBlock(columns = count) > one CardBlock each, with the same inner structure in every one.',
  '- comparing more than 4 things, or more than 3 attributes each -> one TableBlock.',
  '- a trend over time -> LineChartBlock: size sm beside a MetricBlock in a 2-column GridBlock, size lg on its own.',
  '- share of a whole -> SegmentedBarBlock. Ranked categories -> BarChartBlock.',
  '- steps to take or stages in progress -> StepperBlock; dated history -> TimelineBlock; plain items -> ListBlock.items.',
  '- a caveat -> CalloutBlock. Words someone else said -> QuoteBlock. A command, snippet or id -> CodeBlock.',
  '- prose -> TextBlock. Never wrap one sentence in a CardBlock of its own.',
  '',
  'Rules of composition:',
  '- One root, usually a CardBlock with a title (or a HeadingBlock as its first child).',
  '- Siblings that mean the same thing use the same block type with the same prop shape.',
  '- Nest at most 4 deep. Give a container 3-8 children; split into sections with DividerBlock past that.',
  '- GridBlock for side by side, StackBlock(column) for vertical rhythm, StackBlock(row, wrap) for a line of small items.',
  '- Label every value (`label`, `unit`). Pre-format numbers as display strings; raw numbers only where a chart needs them.',
  '',
  'Talking back:',
  '- End with 2-3 SuggestionChipBlocks in a StackBlock(row, wrap). Each `text` is the literal next question the user would ask.',
  '- Bind `suggest` on `press` with that same text. Chips and ButtonBlocks are the only way the user can answer a panel.',
  '- ButtonBlock binds `select` for an explicit choice among options.',
  '',
  'Updating a panel: a follow-up that changes what is shown re-emits the whole spec with the same keys plus the additions. Never a fragment.',
  '',
  'Hygiene:',
  '- Keys are short snake_case and unique; every child key must exist.',
  '- `props` and `on` may be JSON objects or JSON strings of them. Omitted nullable keys become null; unknown keys and wrong types are rejected.',
  '- Icons only from the ICONS list. No $state, $item, repeat or visible.',
];

export const COMPOSITION_GUIDE: string = GUIDE_LINES.join('\n');
