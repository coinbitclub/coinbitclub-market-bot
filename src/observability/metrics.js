import client from 'prom-client';

// Cria um registry customizado
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Contador de requisições de webhook
export const webhookCounter = new client.Counter({
  name: 'webhook_requests_total',
  help: 'Total de requisições recebidas nos webhooks',
  labelNames: ['route']
});
register.registerMetric(webhookCounter);

// Histograma de latência dos sinais
export const signalLatency = new client.Histogram({
  name: 'signal_processing_latency_seconds',
  help: 'Latência no processamento do webhook /signal',
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
});
register.registerMetric(signalLatency);

// Exporta o registry para o handler de métricas
export default register;
