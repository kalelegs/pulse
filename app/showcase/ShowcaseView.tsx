'use client';

import { useCallback, useState } from 'react';
import JsonRenderSurface from '@/components/json-render/JsonRenderSurface';
import ActionReadout, { type TShowcaseAction } from '@/app/showcase/ActionReadout';
import ShowcaseSection from '@/app/showcase/ShowcaseSection';
import type { TJsonRenderSpec } from '@/lib/json-render/types';

/** One labelled weather card on the page. */
export type TWeatherCase = {
  label: string;
  description: string;
  spec: TJsonRenderSpec;
};

export type TShowcaseViewProps = {
  weatherCases: TWeatherCase[];
  showcaseSpec: TJsonRenderSpec;
  /** `Object.keys(blockDefinitions).length`, read on the server so the heading cannot drift. */
  blockCount: number;
};

/**
 * The interactive half of `/showcase`.
 *
 * Specs are built on the server (`page.tsx`) and arrive here as plain JSON —
 * the only thing that has to live on the client is the `onAction` callback and
 * the state it writes, since functions cannot cross the server/client boundary.
 */
const ShowcaseView = ({ weatherCases, showcaseSpec, blockCount }: TShowcaseViewProps) => {
  const [action, setAction] = useState<TShowcaseAction | null>(null);
  const [count, setCount] = useState(0);

  const handleAction = useCallback((name: string, params?: Record<string, unknown>) => {
    setAction({ name, params });
    setCount((previous) => previous + 1);
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
      <header className="space-y-1 py-8">
        <h1 className="text-2xl font-semibold">json-render showcase</h1>
        <p className="text-muted-foreground text-sm">
          Every block in the catalog, rendered through{' '}
          <code className="font-mono">JsonRenderSurface</code> from hand-built specs. Reference page
          — no network calls, no agent.
        </p>
      </header>

      <ActionReadout action={action} count={count} />

      <div className="space-y-12 pt-10">
        <ShowcaseSection
          title="Weather card"
          description="createWeatherSpec() over a fixed TWeatherReport, in two contrasting states."
        >
          <div className="grid gap-6 md:grid-cols-2">
            {weatherCases.map((weatherCase) => (
              // `min-w-0`: a grid item defaults to `min-width: auto`, so the
              // card's horizontally scrolling day strip would otherwise widen
              // the column past the viewport instead of scrolling inside it.
              <div className="min-w-0 space-y-2" key={weatherCase.label}>
                <p className="text-muted-foreground text-xs">
                  <span className="text-foreground font-medium">{weatherCase.label}</span> —{' '}
                  {weatherCase.description}
                </p>
                <JsonRenderSurface onAction={handleAction} spec={weatherCase.spec} />
              </div>
            ))}
          </div>
        </ShowcaseSection>

        <ShowcaseSection
          title={`All ${blockCount} blocks`}
          description="createShowcaseSpec() — the visual smoke test for the whole catalog."
        >
          <JsonRenderSurface className="max-w-2xl" onAction={handleAction} spec={showcaseSpec} />
        </ShowcaseSection>

        <ShowcaseSection
          title="Loading state"
          description="The same spec with loading=true, so every block's skeleton treatment is reviewable."
        >
          <JsonRenderSurface
            className="max-w-2xl"
            loading
            onAction={handleAction}
            spec={showcaseSpec}
          />
        </ShowcaseSection>
      </div>
    </main>
  );
};

export default ShowcaseView;
