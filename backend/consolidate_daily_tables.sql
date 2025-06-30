-- Consolida sinais do dia (EXEMPLO, personalize conforme colunas da sua tabela signals_daily!)
INSERT INTO signals_daily (
    ticker, date, avg_close, max_close, min_close
)
SELECT
    ticker,
    DATE(received_at) AS date,
    AVG(close),
    MAX(close),
    MIN(close)
FROM signals
WHERE received_at >= NOW() - INTERVAL '1 day'
GROUP BY ticker, DATE(received_at)
ON CONFLICT (ticker, date) DO NOTHING;

-- Consolida dominance do dia
INSERT INTO dominance_daily (
    date, avg_btc_dominance, max_btc_dominance, min_btc_dominance
)
SELECT
    DATE(created_at) AS date,
    AVG(btc_dominance),
    MAX(btc_dominance),
    MIN(btc_dominance)
FROM dominance
WHERE created_at >= NOW() - INTERVAL '1 day'
GROUP BY DATE(created_at)
ON CONFLICT (date) DO NOTHING;

-- Consolida fear_greed do dia
INSERT INTO fear_greed_daily (
    date, avg_value, max_value, min_value
)
SELECT
    DATE(created_at) AS date,
    AVG(value),
    MAX(value),
    MIN(value)
FROM fear_greed
WHERE created_at >= NOW() - INTERVAL '1 day'
GROUP BY DATE(created_at)
ON CONFLICT (date) DO NOTHING;
