'use client';

import { RiSparkling2Line } from '@remixicon/react';
import TypingIndicator from './TypingIndicator';

type TPendingToolRowProps = {
  /** The tool's wire name, e.g. `get_stock_quote`. */
  toolName: string;
};

/** "get_stock_quote" → "get stock quote". Wire names are readable enough once un-snaked. */
const humanise = (toolName: string) => toolName.replace(/_/g, ' ');

/**
 * Assistant-side row shown while a tool runs: the response that asked for it has completed and
 * the one that will speak its result has not started, so nothing else marks the wait.
 */
const PendingToolRow = ({ toolName }: TPendingToolRowProps) => (
  <article className="flex items-start gap-3">
    <span
      aria-hidden="true"
      className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full"
    >
      <RiSparkling2Line className="size-4" />
    </span>
    <div className="bg-muted/40 rounded-xl rounded-tl-sm border px-3.5 py-2.5">
      <span className="text-muted-foreground flex items-center gap-2 text-sm italic">
        Running {humanise(toolName)}
        <TypingIndicator label={`Running ${humanise(toolName)}`} />
      </span>
    </div>
  </article>
);

export default PendingToolRow;
