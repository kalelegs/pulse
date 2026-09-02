/**
 * URL guard shared by the `LinkBlock` definition and component.
 *
 * Spec hrefs are agent-generated, so they are attacker-influenced whenever tool
 * output or a user utterance can carry a prompt injection. `javascript:` and
 * `data:text/html` URIs are one-click script execution in the app origin —
 * React only dev-warns on them and still emits the attribute — so nothing but
 * `http:`/`https:` may ever reach an `href`.
 *
 * Lives under `lib/` because the `.definition.ts` half needs it too, and
 * definitions must stay importable from server code (see
 * `lib/json-render/catalog.ts`).
 */
const SAFE_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * True only for absolute `http:`/`https:` URLs.
 *
 * Takes `unknown` on purpose: `JsonRenderSurface` renders specs that have not
 * passed validation while they stream, so the runtime value may not be a string.
 * Relative hrefs fail too — blocks describe external destinations, and resolving
 * them against an unknown base is not something a spec should get to do.
 */
export const isSafeHttpUrl = (href: unknown): boolean => {
  if (typeof href !== 'string') {
    return false;
  }

  try {
    return SAFE_PROTOCOLS.has(new URL(href).protocol);
  } catch {
    return false;
  }
};
