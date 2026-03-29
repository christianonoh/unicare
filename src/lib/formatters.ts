export const currencyFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat('en-NG', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function titleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}
