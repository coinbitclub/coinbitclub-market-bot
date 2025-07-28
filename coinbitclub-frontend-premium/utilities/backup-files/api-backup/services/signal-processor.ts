import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../src/lib/database';

// Signal Processor - Processador automático da fila
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('⚡ Signal Processor: Iniciando processamento da fila...');
    
    // 1. Buscar sinais pendentes na fila
    const pendingSignals = await query(`
      SELECT * FROM signal_processing_queue 
      WHERE status = 'PENDING' 
      ORDER BY created_at ASC 
      LIMIT 10
    `);

    const processedSignals = [];
    const errors = [];

    // 2. Processar cada sinal
    for (const signal of pendingSignals.rows) {
      try {
        console.log(`🔄 Processando sinal ID: ${signal.id} (${signal.symbol})`);
        
        // Marcar como processando
        await query(`
          UPDATE signal_processing_queue 
          SET status = 'PROCESSING' 
          WHERE id = $1
        `, [signal.id]);

        // Chamar Decision Engine
        const response = await fetch('http://localhost:3001/api/services/decision-engine', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            signalId: signal.signal_id,
            source: signal.source,
            symbol: signal.symbol,
            action: signal.action,
            confidence: signal.confidence,
            marketData: signal.market_data
          })
        });

        if (response.ok) {
          const result = await response.json();
          processedSignals.push({
            signalId: signal.id,
            symbol: signal.symbol,
            action: signal.action,
            result: result.analysis,
            status: 'success'
          });
          console.log(`✅ Sinal ${signal.id} processado com sucesso`);
        } else {
          throw new Error(`Decision Engine error: ${response.status}`);
        }

      } catch (error) {
        console.error(`❌ Erro ao processar sinal ${signal.id}:`, error);
        
        // Marcar como falha
        await query(`
          UPDATE signal_processing_queue 
          SET status = 'FAILED', processed_at = NOW(), result = $1
          WHERE id = $2
        `, [JSON.stringify({ error: error.message }), signal.id]);

        errors.push({
          signalId: signal.id,
          symbol: signal.symbol,
          error: error.message
        });
      }
    }

    // 3. Estatísticas da fila
    const queueStats = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM signal_processing_queue
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY status
    `);

    const stats: any = {};
    queueStats.rows.forEach(row => {
      stats[row.status.toLowerCase()] = parseInt(row.count);
    });

    // 4. Limpar sinais processados antigos (> 7 dias)
    const cleanupResult = await query(`
      DELETE FROM signal_processing_queue 
      WHERE status IN ('COMPLETED', 'FAILED') 
      AND processed_at < NOW() - INTERVAL '7 days'
    `);

    return res.status(200).json({
      status: 'success',
      message: `⚡ Signal Processor executado com sucesso`,
      timestamp: new Date().toISOString(),
      processing: {
        pendingSignals: pendingSignals.rows.length,
        processedSuccessfully: processedSignals.length,
        errors: errors.length,
        successRate: pendingSignals.rows.length > 0 
          ? `${((processedSignals.length / pendingSignals.rows.length) * 100).toFixed(1)}%`
          : '100%'
      },
      queueStats: {
        pending: stats.pending || 0,
        processing: stats.processing || 0,
        completed: stats.completed || 0,
        failed: stats.failed || 0
      },
      processedSignals,
      errors,
      cleanup: {
        oldRecordsRemoved: cleanupResult.rowCount || 0
      },
      nextRun: 'Execute novamente em 1-2 minutos para processar mais sinais'
    });

  } catch (error) {
    console.error('Erro no Signal Processor:', error);
    
    return res.status(500).json({
      status: 'error',
      message: '❌ Erro no Signal Processor',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

// Função para processar sinais em background (poderia ser chamada por cron)
export async function processQueueInBackground() {
  try {
    console.log('🔄 Background processing: Verificando fila...');
    
    const response = await fetch('http://localhost:3001/api/services/signal-processor', {
      method: 'POST'
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Background processing: ${result.processing.processedSuccessfully} sinais processados`);
      return result;
    } else {
      console.error('❌ Background processing failed:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ Background processing error:', error);
    return null;
  }
}
