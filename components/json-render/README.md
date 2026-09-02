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
  iconNames.ts  ICON_NAMES, TIconName, iconEnum
  types.ts      TJsonRenderSpec, TJsonRenderAction (type-only)

components/json-render/                          'use client'
  blocks/
    <Name>.tsx             the React component, typed TBlockComponent<'Name'>
    components.ts          blockComponents registry, typed TBlockComponents
  renderer.tsx             JsonRenderer: catalog + blockComponents
  icons.ts                 icon name -> remixicon component map
  BlockIcon.tsx            shared icon renderer
  JsonRenderSurface.tsx    the public render surface
  JsonRenderErrorBoundary.tsx
```

## Why the catalog and the renderer are separate

`lib/json-render/catalog.ts` exists so that `jsonRenderCatalog.validate()` and
the block vocabulary stay importable from server code (`tools/specSchema.ts`
validates model-authored specs with it). None of that should drag `next/image`,
shadcn or `'use client'` into a server bundle — so the catalog imports only
`lib/json-render/blocks/index.ts`, which imports only `*.definition.ts` files.
`prompt()` and `jsonSchema()` are deliberately unused; `tools/README.md`
explains why.

That is why each block is two files in two trees. The `.definition.ts` half
under `lib/` is pure zod and prose; the `.tsx` half under `components/` is JSX.
Import each from its own file — a `.tsx` never re-exports its definition,
precisely so that server code cannot reach a definition through a
`'use client'` module by accident:

```ts
import { cardBlockDefinition } from '@/lib/json-render/blocks/CardBlock.definition'; // server-safe
import { CardBlock } from '@/components/json-render/blocks/CardBlock'; // client only
```

Each component is annotated `TBlockComponent<'Name'>` and `blocks/components.ts`
is annotated `TBlockComponents`, an exhaustive map over `keyof blockDefinitions`
typed from each block's own zod schema. That catches a block registered in one
map and missing from the other, and a component that _demands_ a prop its
definition does not declare. It does not catch the opposite — a component that
ignores `props` assigns cleanly — so consuming what you declare is on review.

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
   strict JSON schema mode requires it.

2. `components/json-render/blocks/MyBlock.tsx`

   ```tsx
   'use client';
   import type { TBlockComponent } from '@/lib/json-render/blocks';

   export const MyBlock: TBlockComponent<'MyBlock'> = ({ props, loading }) => ...;
   ```

   Honour `loading` with a `Skeleton` where it means something. Use `on('press')`
   / `emit('press')` for interactivity, and `<BlockIcon />` for icons. Do **not**
   re-export the definition from here — that would let server code pull a
   `'use client'` module in with no compile error.

3. Add one line to `lib/json-render/blocks/index.ts` (`MyBlock: myBlockDefinition`)
   and one line to `components/json-render/blocks/components.ts` (`MyBlock`).

Nothing else changes — the catalog, `render_ui`'s vocabulary, the renderer and
the builder all pick it up. Add it to `app/showcase/showcaseSections.ts` so it
stays visually covered.

## Block vocabulary

| Block            | Slots   | Use for                                      |
| ---------------- | ------- | -------------------------------------------- |
| `StackBlock`     | default | row/column flow — the default container      |
| `GridBlock`      | default | evenly sized tiles                           |
| `DividerBlock`   | —       | section rule, optional label                 |
| `CardBlock`      | default | bordered surface with title/description/icon |
| `CarouselBlock`  | default | horizontal snap strip                        |
| `ListBlock`      | default | bulleted or numbered list                    |
| `HeadingBlock`   | —       | section title + subtitle                     |
| `TextBlock`      | —       | paragraph prose                              |
| `TextBubble`     | —       | chat-transcript bubble                       |
| `LabelBlock`     | —       | short caption / field label                  |
| `MetricBlock`    | —       | headline number + unit + delta/trend         |
| `KeyValueBlock`  | —       | one labelled fact                            |
| `ProgressBlock`  | —       | 0–100 level bar                              |
| `TableBlock`     | —       | small tabular data                           |
| `BadgeBlock`     | —       | static status pill                           |
| `SuggestionChip` | —       | pressable follow-up                          |
| `IconBlock`      | —       | standalone pictogram                         |
| `ImageBlock`     | —       | remote image + caption                       |
| `LinkBlock`      | —       | external hyperlink                           |

Actions: `suggest` (`{ text, value }`) and `select` (`{ value, label }`), plus the
runtime built-ins `setState` / `pushState` / `removeState` / `validateForm` from
`@json-render/react`'s schema (`validateForm` nominally — no inputs ship here).
Bind them on the **element**, not in props:

```json
{
  "type": "SuggestionChip",
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
  catalog check covers the element _envelope_ only and types `props` loosely;
  per-block prop schemas and action bindings are enforced upstream, in
  `tools/specSchema.ts` for model-authored specs and by the typed builders.
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

`lib/spec-builders/` provides `block()`, `bind()` and `buildSpec()` — the
primary path for shipping UI: a tool builds its card in TypeScript, so the spec
is complete and schema-valid the moment the tool resolves. Props and action
params are type-checked against the catalog and element keys are generated. See
`lib/spec-builders/weather.ts` (a domain card from generic blocks) and
`app/showcase/showcaseSpec.ts` (every block, for the visual smoke test).
