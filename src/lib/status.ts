export function statusTone(status: string) {
  if (['approved', 'paid', 'successful', 'published', 'accepted', 'active', 'occupied'].includes(status)) {
    return 'approved' as const;
  }

  if (['cleared', 'reconciled'].includes(status)) {
    return 'cleared' as const;
  }

  if (['held', 'overdue', 'queried', 'rejected'].includes(status)) {
    return 'held' as const;
  }

  if (['carryover', 'probation'].includes(status)) {
    return 'carryover' as const;
  }

  if (['inactive', 'declined', 'failed', 'vacated'].includes(status)) {
    return 'inactive' as const;
  }

  if (['part_paid', 'deferred', 'warning'].includes(status)) {
    return 'warning' as const;
  }

  return 'pending' as const;
}
