import clsx from 'clsx';
import { titleCase } from '../lib/formatters';

interface StatusBadgeProps {
  tone:
    | 'pending'
    | 'approved'
    | 'held'
    | 'cleared'
    | 'carryover'
    | 'inactive'
    | 'warning'
    | 'info';
  label: string;
}

export function StatusBadge({ tone, label }: StatusBadgeProps) {
  return <span className={clsx('status-badge', `status-badge--${tone}`)}>{titleCase(label)}</span>;
}
