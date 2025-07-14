let clients = [];

export function setupSSE(app) {
  app.get('/api/notifications/sse', (req, res) => {
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.flushHeaders();
    clients.push(res);
    req.on('close', () => { clients = clients.filter(c => c !== res); });
  });
}

export function broadcast(eventType, payload) {
  clients.forEach(res => res.write(`event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`));
}
