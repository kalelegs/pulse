/** The last action a rendered block emitted, as captured by the page. */
export type TShowcaseAction = {
  name: string;
  params?: Record<string, unknown>;
};

export type TActionReadoutProps = {
  action: TShowcaseAction | null;
  /** How many actions have been emitted since load — proves repeats register. */
  count: number;
};

/**
 * Live readout of `JsonRenderSurface.onAction`.
 *
 * Pressing a bound `SuggestionChipBlock` has no visible effect on its own, so
 * without this the chips would only be *rendered*, never *demonstrated*. Sticks
 * to the top of the viewport so a chip lower down the page can still be seen to
 * fire.
 */
const ActionReadout = ({ action, count }: TActionReadoutProps) => (
  <div className="bg-background/85 sticky top-0 z-10 -mx-4 border-b px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        Last action
      </span>
      {action ? (
        <>
          <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
            {action.name}
          </code>
          <span className="text-muted-foreground text-xs tabular-nums">#{count}</span>
        </>
      ) : (
        <span className="text-muted-foreground text-xs">
          none yet — press a bound suggestion chip
        </span>
      )}
    </div>
    {action ? (
      <pre className="text-muted-foreground mt-2 max-w-full overflow-x-auto font-mono text-xs whitespace-pre-wrap">
        {JSON.stringify(action.params ?? {}, null, 2)}
      </pre>
    ) : null}
  </div>
);

export default ActionReadout;
