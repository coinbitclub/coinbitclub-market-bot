"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.consolidate = exports.cleanup = void 0;
var _pg = _interopRequireDefault(require("pg"));
var _nodeCron = _interopRequireDefault(require("node-cron"));
var _dotenv = _interopRequireDefault(require("dotenv"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const {
  Pool
} = _pg.default;
_dotenv.default.config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Limpeza dos temporários
const cleanup = async () => {
  await pool.query(`DELETE FROM signals WHERE received_at < NOW() - INTERVAL '72 hours';`);
  await pool.query(`DELETE FROM dominance WHERE created_at < NOW() - INTERVAL '72 hours';`);
  await pool.query(`DELETE FROM fear_greed WHERE created_at < NOW() - INTERVAL '72 hours';`);
  // Adapte para demais entidades...
  console.log('[Maintenance] Limpeza concluída.');
};

// Consolidação diária
exports.cleanup = cleanup;
const consolidate = async () => {
  await pool.query(`
    INSERT INTO signals_daily (ticker, date, avg_close, max_close, min_close)
    SELECT ticker, DATE(received_at) AS date, AVG(close), MAX(close), MIN(close)
    FROM signals
    WHERE received_at >= NOW() - INTERVAL '1 day'
    GROUP BY ticker, DATE(received_at)
    ON CONFLICT (ticker, date) DO NOTHING;
  `);
  // Repita/adapte para dominance, fear_greed etc.
  console.log('[Maintenance] Consolidação concluída.');
};

// Agendamento usando node-cron
exports.consolidate = consolidate;
_nodeCron.default.schedule('5 0 * * *', cleanup); // Limpa todos os dias às 00h05
_nodeCron.default.schedule('0 0 * * *', consolidate); // Consolida todos os dias às 00h00