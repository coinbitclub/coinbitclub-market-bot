"use strict";

require("dotenv/config");
var _express = _interopRequireDefault(require("express"));
var _expressBasicAuth = _interopRequireDefault(require("express-basic-auth"));
var _path = _interopRequireDefault(require("path"));
var _webhook = _interopRequireDefault(require("./routes/webhook.js"));
var _logger = require("./logger.js");
var _metrics = _interopRequireWildcard(require("./metrics.js"));
var _orderManager = require("./services/orderManager.js");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const app = (0, _express.default)();
app.use(_express.default.json());

// Prote��o e Dashboard est�tico
app.use('/dashboard', (0, _expressBasicAuth.default)({
  users: {
    'erica.andrade.santos@hotmail.com': 'Apelido22@'
  },
  challenge: true
}));
app.use('/dashboard', _express.default.static(_path.default.resolve('dashboard')));

// Health-check
app.get('/healthz', (_req, res) => {
  _logger.logger.info('Health-check OK');
  res.sendStatus(200);
});

// M�tricas Prometheus
app.get('/metrics', async (_req, res) => {
  _logger.logger.debug('Serving /metrics');
  res.set('Content-Type', _metrics.default.contentType);
  res.end(await _metrics.default.metrics());
});

// Contador de Webhooks
app.use((req, _res, next) => {
  if (req.path.startsWith('/webhook/')) {
    _metrics.webhookCounter.inc({
      route: req.path
    });
  }
  next();
});

// Rotas de Webhook
app.use(_webhook.default);

// Monitoramento de posi��es

setInterval(async () => {
  try {
    await (0, _orderManager.monitorPositions)();
  } catch (err) {
    _logger.logger.error({
      err
    }, 'monitorPositions error');
  }
}, 15000);

// Inicializa��o do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  _logger.logger.info(`Server listening on port ${PORT}`);
});