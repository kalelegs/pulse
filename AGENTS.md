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

## Package Manager

- This project uses bun.
- All the installation of external packages should be done with bun

## How to run project

- `bun run dev`
