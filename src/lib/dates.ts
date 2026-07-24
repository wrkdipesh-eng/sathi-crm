// Whole days elapsed since `date`. Used to derive "days in current stage"
// live from stageUpdatedAt instead of trusting a stored counter that only
// ever gets set once (at the last stage transition) and never updates.
export function daysSince(date: Date | string): number {
  const ms = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

// Cutoff timestamp for "at least N days ago" -- for use directly in Prisma
// date-range filters, e.g. { stageUpdatedAt: { lte: daysAgo(7) } }.
export function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}
