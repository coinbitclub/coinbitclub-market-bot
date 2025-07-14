export function initMetrics(_req, res) {
  res.set('Content-Type', 'text/plain');
  res.send('# HELP dummy Dummy metric\n# TYPE dummy counter\ndummy 1');
}
