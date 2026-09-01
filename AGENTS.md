# Pulse

This project is a reference architecture on implementing real time AI assistants

## UI Components

- We use shadcn and tailwind
- Prefer using an existing shadcn component (it's okay to install new component) before moving to creating a custom component

## Coding style

### 1. Prefer arrow functions.

e.g.

```typescript
const fn1 = () => {};
```

### 2. Name types with "T" prefix

e.g.

```ts
type TAgent = {};
```

### 3. Keep every file under 200 lines.

A file you can read in one sitting is a file you can safely change. Split by
responsibility — one component, one hook, one concern per file — never by line
count alone.

## Package Manager

- This project uses bun.
- All the installation of external packages should be done with bun

## How to run project

- `bun run dev`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
