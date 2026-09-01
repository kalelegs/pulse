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

```
components/json-render/
  blocks/
    <Name>.definition.ts   zod props + description + example  (React-free)
    <Name>.tsx             the React component                ('use client')
    index.ts               blockDefinitions barrel            (React-free)
    components.ts          blockComponents barrel             ('use client')
    defineBlock.ts         definition helper + TBlockDefinition
    actions.ts             catalog action vocabulary
    iconNames.ts           curated icon name tuple
  icons.ts                 icon name -> remixicon component map
  BlockIcon.tsx            shared icon renderer
  JsonRenderSurface.tsx    the public render surface
  JsonRenderErrorBoundary.tsx

lib/json-render/                                 no barrel: import a leaf
  catalog.ts    jsonRenderCatalog                (React-free, server-safe)
  registry.tsx  JsonRenderer                     ('use client')
  types.ts      TJsonRenderSpec + block types    (type-only)
```

## Why the catalog and the registry are separate

`lib/json-render/catalog.ts` is the contract shared with the model. Agent
instructions call `jsonRenderCatalog.prompt()`, tool definitions call
`jsonRenderCatalog.jsonSchema()`, and tool handlers call
`jsonRenderCatalog.validate()`. None of that should drag `next/image`, shadcn or
`'use client'` into a server bundle — so the catalog imports only
`blocks/index.ts`, which in turn imports only `*.definition.ts` files.

That is why each block is two files. The `.definition.ts` half is pure zod and
prose; the `.tsx` half is JSX. Import each from its own file — a `.tsx` never
re-exports its definition, precisely so that server code cannot reach a
definition through a `'use client'` module by accident:

```ts
import { cardBlockDefinition } from '@/components/json-render/blocks/CardBlock.definition'; // server-safe
import { CardBlock } from '@/components/json-render/blocks/CardBlock'; // client only
```

`blocks/components.ts` is annotated `TBlockComponents`, an exhaustive mapped type
over `keyof blockDefinitions` whose value type is derived from each block's own
zod schema. That catches a block registered in one map and missing from the
other, and a component that _demands_ a prop its definition does not declare.

It does not catch the opposite. A component typed `BaseComponentProps<{}>`, or one
ignoring `props`, assigns cleanly — `{ text: string }` is assignable to `{}` — so a
block that quietly stopped reading a prop the catalog still advertises to the model
type-checks fine while the LLM keeps emitting a value nothing renders. Keys and
over-demanding props are enforced; consuming what you declare is still on review.

## Adding a new block

1. `components/json-render/blocks/MyBlock.definition.ts`

   ```ts
   import { z } from 'zod';
   import { defineBlock } from '@/components/json-render/blocks/defineBlock';

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
   import type { BaseComponentProps } from '@json-render/react';
   import type { TBlockProps } from '@/components/json-render/blocks';

   export const MyBlock = ({ props, loading }: BaseComponentProps<TBlockProps<'MyBlock'>>) => ...;
   ```

   Honour `loading` with a `Skeleton` where it means something. Use `on('press')`
   / `emit('press')` for interactivity, and `<BlockIcon />` for icons. Do **not**
   re-export the definition from here — that would let server code pull a
   `'use client'` module in with no compile error.

3. Add one line to `blocks/index.ts` (`MyBlock: myBlockDefinition`) and one line
   to `blocks/components.ts` (`MyBlock`).

Nothing else changes — the catalog, prompt, registry, renderer and builder all
pick it up. Add it to `lib/spec-builders/showcase.ts` so it stays visually
covered.

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

```ts
export type TJsonRenderSurfaceProps = {
  spec: TJsonRenderSpec | null | undefined;
  loading?: boolean;
  onAction?: (actionName: string, params?: Record<string, unknown>) => void;
  className?: string;
};
```

Guarantees:

- **Invalid in, nothing out.** The spec is checked with
  `jsonRenderCatalog.validate()`; a failure logs `console.warn` and renders
  `null` instead of throwing. While `loading` is true the spec is still
  streaming, so validation is advisory and the partial tree still renders.
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

`lib/spec-builders/` provides `block()`, `bind()` and `buildSpec()` for fixtures
and demos. Props and action params are type-checked against the catalog, and
element keys are generated for you. See `showcase.ts` (every block) and
`weather.ts` (a domain card composed purely from generic blocks).
