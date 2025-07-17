export function filterByTimeWindow(signal, windowMinutes = 30) {
  const ts = new Date(signal.received_at || signal.timestamp || Date.now());
  const diff = Date.now() - ts.getTime();
  return diff <= windowMinutes * 60 * 1000;
}

export function filterByFearGreed(value, min = 0, max = 100) {
  return value >= min && value <= max;
}

export function filterByDominanceDiff(diff, threshold = 0.3) {
  return Math.abs(diff) >= threshold;
}
