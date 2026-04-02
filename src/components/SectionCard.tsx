import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  aside?: ReactNode;
  children: ReactNode;
}

export function SectionCard({ title, subtitle, aside, children }: SectionCardProps) {
  return (
    <section className="section-card">
      <div className="section-card__header">
        <div>
          <h2>{title}</h2>
          {/* {subtitle ? <p>{subtitle}</p> : null} */}
        </div>
        {aside ? <div>{aside}</div> : null}
      </div>
      {children}
    </section>
  );
}