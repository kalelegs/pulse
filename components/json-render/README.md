# JSON Render

The block library and registry behind Pulse's agent-driven UI. An agent emits a
JSON **spec**; this directory turns it into React.

A spec is a flat, key-addressed element map:

```json
{
  "root": "root",
  "elements": {
    "root": { "type": "CardBlock", "props": { "title": "San Francisco" }, "children": ["m1"] },
    "m1": {
      "type": "MetricBlock",
      "props": { "label": "Now", "value": "68", "unit": "°F" },
      "children": []
    }
  }
}
```

## Layout

Each block is split in two, and the halves live in different trees so the
dependency direction stays components -> lib: nothing under `lib/` or `tools/`
imports from `components/`.

```
lib/json-render/                                 React-free, server-safe
  blocks/
    <Name>.definition.ts   zod props + description + example
    index.ts               the vocabulary barrel: blockDefinitions, TBlockName, …
    defineBlock.ts         definition helper + TBlockDefinition
    actions.ts             catalog action vocabulary
    safeUrl.ts             http(s)-only href guard (LinkBlock definition + component)
  catalog.ts    jsonRenderCatalog                (imports only blocks/index.ts)
  validateSpec.ts      parseAndValidateSpec: tool arguments or a built spec -> validated spec
  specChecks.ts        per-block props (null-filled, unknown keys named) + action binding checks
  catalogReference.ts  buildCatalogReference(): the block list + guide + icons + actions text
  compositionGuide.ts  COMPOSITION_GUIDE, the layout recipes inside that text
  iconNames.ts  ICON_NAMES, TIconName, iconEnum
  types.ts      TJsonRenderSpec, TJsonRenderAction (type-only)

components/json-render/                          'use client'
  blocks/
    <Name>.tsx             the React component, typed TBlockComponent<'Name'>
    components.ts          blockComponents registry, typed TBlockComponents
    dataTones.ts           the one dataToneEnum -> class map every data block uses
    chartScale.ts / chartFormat.ts / chartParts.tsx   range, unit and legend helpers for charts
  renderer.tsx             JsonRenderer: catalog + blockComponents
  icons.ts / BlockIcon.tsx icon name -> remixicon component map, shared icon renderer
  JsonRenderSurface.tsx    the public render surface (wraps JsonRenderErrorBoundary.tsx)
```

## Why the catalog and the renderer are separate

`lib/json-render/catalog.ts` exists so that `jsonRenderCatalog.validate()` and
the block vocabulary stay importable from server code (`validateSpec.ts`
checks model-authored specs with it, from the client tool or a Server Action). None of that should drag `next/image`,
shadcn or `'use client'` into a server bundle — so the catalog imports only
`lib/json-render/blocks/index.ts`, which imports only `*.definition.ts` files.
`prompt()` and `jsonSchema()` are deliberately unused (`tools/README.md` says why).

`blocks/components.ts` is typed `TBlockComponents`, an exhaustive map over
`keyof blockDefinitions`, so a block missing from either map fails to compile.
It cannot catch a component that ignores a declared prop — that is on review.

## Adding a new block

1. `lib/json-render/blocks/MyBlock.definition.ts`

   ```ts
   import { z } from 'zod';
   import { defineBlock } from '@/lib/json-render/blocks/defineBlock';

   export const myBlockDefinition = defineBlock({
     props: z.object({ text: z.string(), tone: z.enum(['a', 'b']).nullable() }),
     slots: [], // ['default'] if it renders children
     description: 'Written for the LLM: what it is and when to pick it over its neighbours.',
     example: { text: 'Realistic value', tone: 'a' },
   });
   ```

   Optional props **must** use `.nullable()`, never `.optional()` — the catalog's
   strict JSON schema mode requires it. `render_ui` fills omitted nullable keys
   with null, so a model may leave them out; typed builders must not. Keep the
   description and example domain-neutral: both are few-shot text for the model.

2. `components/json-render/blocks/MyBlock.tsx`

   ```tsx
   'use client';
   import type { TBlockComponent } from '@/lib/json-render/blocks';

   export const MyBlock: TBlockComponent<'MyBlock'> = ({ props, loading }) => ...;
   ```

   Honour `loading` with a `Skeleton`, use `<BlockIcon />` for icons, resolve any
   `dataToneEnum` prop through `dataTones.ts`, and do **not** re-export the
   definition from here (see above).

3. Add one line to `lib/json-render/blocks/index.ts` (`MyBlock: myBlockDefinition`)
   and one line to `components/json-render/blocks/components.ts` (`MyBlock`).

Nothing else changes — the catalog, `render_ui`'s vocabulary, the renderer and the
builder all pick it up. Add it to an `app/showcase/showcase*Sections.ts` file and to the table below.

## Block vocabulary

29 blocks in seven families: layout, text, numbers, charts, narrative, process,
and media/interaction. Every container accepts any block as a child, including
other containers. Charts are inline SVG or plain divs, no library.

| Block                 | Slots   | Use for                                          |
| --------------------- | ------- | ------------------------------------------------ |
| `StackBlock`          | default | row/column flow — the default container          |
| `GridBlock`           | default | evenly sized tiles                               |
| `DividerBlock`        | —       | section rule, optional label                     |
| `CardBlock`           | default | bordered surface with title/description/icon     |
| `CarouselBlock`       | default | horizontal snap strip                            |
| `ListBlock`           | default | bulleted or numbered list (`items` + children)   |
| `HeadingBlock`        | —       | section title + subtitle                         |
| `TextBlock`           | —       | paragraph prose                                  |
| `TextBubbleBlock`     | —       | chat-transcript bubble                           |
| `LabelBlock`          | —       | short caption / field label                      |
| `MetricBlock`         | —       | headline number + unit + delta/trend             |
| `KeyValueBlock`       | —       | one labelled fact                                |
| `ProgressBlock`       | —       | 0–100 level bar                                  |
| `TableBlock`          | —       | small tabular data                               |
| `LineChartBlock`      | —       | trend of one or more series; `sm` = sparkline    |
| `BarChartBlock`       | —       | a few categories on one measure                  |
| `SegmentedBarBlock`   | —       | how one whole splits into parts                  |
| `CalloutBlock`        | default | tinted caveat / tip / warning, optional children |
| `TimelineBlock`       | —       | dated entries down a vertical rail               |
| `QuoteBlock`          | —       | attributed excerpt with source link              |
| `CodeBlock`           | —       | preformatted monospace text                      |
| `StepperBlock`        | —       | ordered steps with done/current/upcoming/blocked |
| `RatingBlock`         | —       | score as filled symbols out of `max`             |
| `BadgeBlock`          | —       | static status pill                               |
| `SuggestionChipBlock` | —       | pressable follow-up prompt (binds `suggest`)     |
| `ButtonBlock`         | —       | generic pressable, binds any action (`select`)   |
| `IconBlock`           | —       | standalone pictogram                             |
| `ImageBlock`          | —       | remote image + caption                           |
| `LinkBlock`           | —       | external hyperlink                               |

Actions: `suggest` (`{ text, value }`) and `select` (`{ value, label }`), plus the
runtime built-ins `setState` / `pushState` / `removeState` / `validateForm` from
`@json-render/react`'s schema (`validateForm` nominally — no inputs ship here).
`SuggestionChipBlock` and `ButtonBlock` are the two pressables; bind actions on
the **element**, not in props:

```json
{
  "type": "SuggestionChipBlock",
  "props": { "text": "Show hourly" },
  "children": [],
  "on": { "press": { "action": "suggest", "params": { "text": "Show the hourly forecast" } } }
}
```

## `JsonRenderSurface` — the render contract

```tsx
import JsonRenderSurface from '@/components/json-render/JsonRenderSurface';

<JsonRenderSurface
  spec={message.spec}
  loading={isStreaming}
  onAction={(actionName, params) => { ... }}
  className="max-w-xl"
/>;
```

Guarantees:

- **Invalid in, nothing out.** The spec is checked with
  `jsonRenderCatalog.validate()`; a failure logs `console.warn` and renders
  `null` instead of throwing. While `loading` is true the spec is still
  streaming, so validation is advisory and the partial tree still renders. The
  catalog check covers the element _envelope_ only; per-block prop schemas and
  action bindings are enforced upstream (`lib/json-render/validateSpec.ts`, the builders).
- **Unknown blocks are visible.** A hallucinated `type` renders a muted
  "Unsupported block: X" chip, never a blank hole.
- **A bad spec cannot white-screen the app.** Everything renders inside
  `JsonRenderErrorBoundary`, which resets on the spec object's identity — never
  on `spec.root`, which repeats across specs and would latch the error forever.
- **No spec-supplied URL can execute script.** `LinkBlock` renders an `<a>` only for
  absolute `http:`/`https:` hrefs; anything else degrades to plain text. The check
  lives in the component, not just the schema, since unvalidated specs still render.
- **The original spec is rendered**, never `validate().data` — the catalog's zod
  schema does not model `on` or `state`, so parsing through it would silently
  strip every action binding and seeded state value.

## Building specs by hand

`lib/spec-builders/` provides `block()`, `bind()` and `buildSpec()`: a tool
builds its card in TypeScript, props and action params type-checked against the
catalog and element keys generated, so the spec is schema-valid the moment the
tool resolves. See `lib/spec-builders/weather.ts` and `app/showcase/showcaseSpec.ts`.
