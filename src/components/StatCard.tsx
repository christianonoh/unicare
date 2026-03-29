import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  meta: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, meta, icon }: StatCardProps) {
  return (
    <article className="stat-card">
      <div className="stat-card__top">
        <span>{label}</span>
        {icon ? <div className="stat-card__icon">{icon}</div> : null}
      </div>
      <strong>{value}</strong>
      <p>{meta}</p>
    </article>
  );
}
