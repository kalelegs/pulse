/**
 * Typed helpers for hand-building json-render specs (demos, fixtures, defaults).
 * Agent-generated specs arrive as JSON and do not go through these.
 */
export {
  bind,
  block,
  buildSpec,
  type TActionName,
  type TSpecNode,
  type TSpecNodeOptions,
} from '@/lib/spec-builders/builder';
export { createShowcaseSpec } from '@/lib/spec-builders/showcase';
export { createWeatherSpec } from '@/lib/spec-builders/weather';
