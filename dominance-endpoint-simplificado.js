// Webhook para dominância do Bitcoin (versão simplificada)
app.post('/api/webhooks/dominance', async (req, res) => {
    try {
        console.log('📈 WEBHOOK DOMINÂNCIA BTC RECEBIDO:', JSON.stringify(req.body, null, 2));

        const dominanceData = req.body;

        // Validar dados obrigatórios do Pine Script
        if (!dominanceData.btc_dominance || !dominanceData.sinal) {
            return res.status(400).json({ 
                error: 'Dados inválidos - btc_dominance e sinal são obrigatórios' 
            });
        }

        // Processar timestamp
        let timestamp = new Date();
        if (dominanceData.time) {
            try {
                // Pine Script envia formato: "2025-01-30 17:30:00"
                const timeStr = dominanceData.time.replace(' ', 'T') + 'Z';
                timestamp = new Date(timeStr);
                if (isNaN(timestamp.getTime())) {
                    timestamp = new Date();
                }
            } catch (e) {
                timestamp = new Date();
            }
        }

        // 1. Inserir na tabela específica de dominância
        const dominanceInsert = await pool.query(`
            INSERT INTO btc_dominance_signals 
            (ticker, btc_dominance, ema_7, diff_pct, signal, raw_data, timestamp)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id;
        `, [
            dominanceData.ticker || 'BTC.D',
            parseFloat(dominanceData.btc_dominance),
            dominanceData.ema_7 ? parseFloat(dominanceData.ema_7) : null,
            dominanceData.diff_pct ? parseFloat(dominanceData.diff_pct) : null,
            dominanceData.sinal,
            JSON.stringify(dominanceData),
            timestamp
        ]);

        const dominanceId = dominanceInsert.rows[0].id;

        // 2. Inserir na tabela principal de sinais
        const signalInsert = await pool.query(`
            INSERT INTO signals 
            (ticker, signal, source, metadata, created_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id;
        `, [
            dominanceData.ticker || 'BTC.D',
            dominanceData.sinal,
            'dominance_webhook',
            JSON.stringify({
                dominance_id: dominanceId,
                btc_dominance: dominanceData.btc_dominance,
                ema_7: dominanceData.ema_7,
                diff_pct: dominanceData.diff_pct,
                webhook_type: 'btc_dominance',
                timestamp: timestamp.toISOString()
            }),
            timestamp
        ]);

        const signalId = signalInsert.rows[0].id;

        const result = {
            success: true,
            dominance_signal_id: dominanceId,
            signal_id: signalId,
            ticker: dominanceData.ticker || 'BTC.D',
            btc_dominance: parseFloat(dominanceData.btc_dominance),
            signal: dominanceData.sinal,
            timestamp: timestamp.toISOString()
        };

        console.log('✅ Dominância BTC processada:', result);

        return res.json({
            success: true,
            message: 'Sinal de dominância BTC processado com sucesso',
            data: result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro no webhook dominância:', error);
        return res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
});
