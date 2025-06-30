-- Limpa sinais mais antigos que 72h
DELETE FROM signals WHERE received_at < NOW() - INTERVAL '72 hours';

-- Limpa dominance mais antigos que 72h
DELETE FROM dominance WHERE created_at < NOW() - INTERVAL '72 hours';

-- Limpa fear_greed mais antigos que 72h
DELETE FROM fear_greed WHERE created_at < NOW() - INTERVAL '72 hours';
