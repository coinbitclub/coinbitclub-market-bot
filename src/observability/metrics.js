import client from "prom-client";
import promBundle from "express-prom-bundle";

// Coleta métricas padrão de Node.js
client.collectDefaultMetrics({ timeout: 5000 });

// Middleware que injeta métricas HTTP
export const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  promClient: { collectDefaultMetrics: true }
});

// Handler manual para o /metrics
export async function metricsHandler(req, res) {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
}
