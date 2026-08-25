export function parseDuration(duration: string, defaultMs = 30 * 24 * 60 * 60 * 1000): number {
  const match = duration.match(/^(\d+)([dhms])$/);
  if (!match) return defaultMs;
  const value = parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'm': return value * 60 * 1000;
    case 's': return value * 1000;
    default: return defaultMs;
  }
}
