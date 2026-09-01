import type { Metadata } from 'next';
import { createShowcaseSpec, createWeatherSpec } from '@/lib/spec-builders';
import { coldNightReport, warmDayReport } from '@/app/showcase/fixtures';
import ShowcaseView from '@/app/showcase/ShowcaseView';

export const metadata: Metadata = {
  title: 'json-render showcase',
  description: 'Visual catalog of every json-render block, rendered from hand-built specs.',
};

/**
 * `/showcase` — the visual catalog for `components/json-render`.
 *
 * A Server Component on purpose: `lib/spec-builders` and `lib/weather` are both
 * React-free, so the specs are built during the server render and cross to the
 * client as plain serializable JSON. Only `ShowcaseView` is `'use client'`,
 * because only the `onAction` callback needs to be.
 */
const ShowcasePage = () => (
  <ShowcaseView
    showcaseSpec={createShowcaseSpec()}
    weatherCases={[
      {
        label: 'Warm, daytime',
        description: 'clear sky, °F, sun icon variant',
        spec: createWeatherSpec(warmDayReport),
      },
      {
        label: 'Cold, night',
        description: 'sub-zero °C, moon icon variant, snow strip',
        spec: createWeatherSpec(coldNightReport),
      },
    ]}
  />
);

export default ShowcasePage;
