import type { ReactNode } from 'react';

export type TShowcaseSectionProps = {
  /** Section heading — tells a reviewer what they are looking at. */
  title: string;
  /** One line on why this section exists / what to check in it. */
  description: string;
  children: ReactNode;
};

/**
 * Titled wrapper around one rendered surface.
 *
 * Deliberately plain: this is a reference page, so the chrome around a block
 * must never be mistaken for the block itself.
 */
const ShowcaseSection = ({ title, description, children }: TShowcaseSectionProps) => (
  <section className="space-y-4">
    <div className="space-y-1 border-b pb-3">
      <h2 className="text-foreground text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
    {children}
  </section>
);

export default ShowcaseSection;
