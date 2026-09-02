'use server';

import { designSpec } from '@/agents/uiDesigner';
import type { TJsonRenderSpec } from '@/lib/json-render/types';

/** Longest brief accepted, so a runaway realtime model cannot mint an arbitrarily large prompt. */
const MAX_BRIEF_LENGTH = 4_000;

export type TDesignUiResult = { ok: true; spec: TJsonRenderSpec } | { ok: false; issues: string[] };

/**
 * Server action behind the `design_ui` tool: runs the UI designer agent (`agents/uiDesigner.ts`)
 * on the server, where the API key lives, and returns a spec that already passed validation.
 *
 * Unauthenticated, like `getEphemeralToken`: fine for a reference app, and where a session check
 * would go in a real deployment.
 */
export const designUi = async (brief: string): Promise<TDesignUiResult> => {
  const trimmed = brief.trim().slice(0, MAX_BRIEF_LENGTH);
  if (!trimmed) {
    return { ok: false, issues: ['The brief was empty.'] };
  }

  try {
    const result = await designSpec(trimmed);
    // The validator builds `elements` with a null prototype (so a key like "constructor" cannot
    // collide), and Next refuses to serialise null-prototype objects across the server/client
    // boundary. A JSON round trip yields plain objects; the spec is JSON by definition.
    return result.ok ? { ok: true, spec: JSON.parse(JSON.stringify(result.spec)) } : result;
  } catch (error) {
    console.error('[designUi] designer run failed', error);
    return { ok: false, issues: ['The designer did not respond. Try again in a moment.'] };
  }
};
