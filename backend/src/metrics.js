import client from 'prom-client';

// 1) Cria e registra o Registry padrão
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// 2) Contador de requisições aos webhooks
export const webhookCounter = new client.Counter({
  name: 'webhook_requests_total',
  help: 'Total de requisições recebidas nos webhooks',
  labelNames: ['route']
});
register.registerMetric(webhookCounter);

// 3) Histograma de latência no processamento de /webhook/signal
export const signalLatency = new client.Histogram({
  name: 'signal_processing_latency_seconds',
  help: 'Latência no processamento de /webhook/signal',
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
});
register.registerMetric(signalLatency);

// 4) Exporta o Registry para o endpoint /metrics
export default register;




