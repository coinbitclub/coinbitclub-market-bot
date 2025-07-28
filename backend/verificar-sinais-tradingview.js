/**
 * 🔍 VERIFICAR SINAIS TRADINGVIEW
 * Analisar sinais recebidos e processamento
 */

const { Client } = require('pg');

const DATABASE_CONFIG = {
    host: 'yamabiko.proxy.rlwy.net',
    port: 32866,
    database: 'railway',
    user: 'postgres',
    password: 'TQDSOVEqxVgCFdcKtwHEvnkoLSTFvswS',
    ssl: false,
    connectionTimeoutMillis: 30000
};

async function checkTradingViewSignals() {
    const client = new Client(DATABASE_CONFIG);
    
    try {
        await client.connect();
        
        // 1. Verificar tabelas de sinais
        console.log('📊 TABELAS DE SINAIS DISPONÍVEIS:');
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND (table_name LIKE '%signal%' OR table_name LIKE '%tradingview%' OR table_name LIKE '%webhook%')
            ORDER BY table_name;
        `;
        
        const tablesResult = await client.query(tablesQuery);
        tablesResult.rows.forEach(table => {
            console.log(`   📄 ${table.table_name}`);
        });

        // 2. Verificar sinais recentes
        console.log('\n📡 SINAIS TRADINGVIEW RECENTES:');
        try {
            const signalsQuery = `
                SELECT * FROM signals 
                ORDER BY created_at DESC 
                LIMIT 10;
            `;
            
            const signalsResult = await client.query(signalsQuery);
            
            if (signalsResult.rows.length > 0) {
                console.log(`✅ ${signalsResult.rows.length} sinais encontrados:`);
                
                signalsResult.rows.forEach((signal, index) => {
                    console.log(`\n${index + 1}. SINAL ID: ${signal.id}`);
                    console.log(`   Símbolo: ${signal.symbol}`);
                    console.log(`   Ação: ${signal.action}`);
                    console.log(`   Preço: ${signal.price}`);
                    console.log(`   Criado: ${new Date(signal.created_at).toLocaleString('pt-BR')}`);
                    console.log(`   Processado: ${signal.processed ? 'SIM' : 'NÃO'}`);
                    if (signal.strategy) console.log(`   Estratégia: ${signal.strategy}`);
                    if (signal.confidence) console.log(`   Confiança: ${signal.confidence}%`);
                });
            } else {
                console.log('⚠️ Nenhum sinal encontrado na tabela signals');
            }
        } catch (signalError) {
            console.log('❌ Erro ao buscar signals:', signalError.message);
        }

        // 3. Verificar tradingview_signals
        console.log('\n📈 TRADINGVIEW SIGNALS:');
        try {
            const tvSignalsQuery = `
                SELECT * FROM tradingview_signals 
                ORDER BY created_at DESC 
                LIMIT 10;
            `;
            
            const tvSignalsResult = await client.query(tvSignalsQuery);
            
            if (tvSignalsResult.rows.length > 0) {
                console.log(`✅ ${tvSignalsResult.rows.length} sinais TradingView encontrados:`);
                
                tvSignalsResult.rows.forEach((signal, index) => {
                    console.log(`\n${index + 1}. TV SIGNAL ID: ${signal.id}`);
                    Object.keys(signal).forEach(key => {
                        if (signal[key] !== null && key !== 'id') {
                            console.log(`   ${key}: ${signal[key]}`);
                        }
                    });
                });
            } else {
                console.log('⚠️ Nenhum sinal encontrado na tabela tradingview_signals');
            }
        } catch (tvError) {
            console.log('❌ Erro ao buscar tradingview_signals:', tvError.message);
        }

        // 4. Verificar webhooks recebidos
        console.log('\n🔗 WEBHOOKS RECEBIDOS:');
        try {
            const webhooksQuery = `
                SELECT * FROM webhook_logs 
                WHERE source = 'tradingview' OR endpoint LIKE '%webhook%'
                ORDER BY created_at DESC 
                LIMIT 10;
            `;
            
            const webhooksResult = await client.query(webhooksQuery);
            
            if (webhooksResult.rows.length > 0) {
                console.log(`✅ ${webhooksResult.rows.length} webhooks encontrados:`);
                
                webhooksResult.rows.forEach((webhook, index) => {
                    console.log(`\n${index + 1}. WEBHOOK ID: ${webhook.id}`);
                    console.log(`   Endpoint: ${webhook.endpoint}`);
                    console.log(`   Método: ${webhook.method}`);
                    console.log(`   Status: ${webhook.status_code}`);
                    console.log(`   Criado: ${new Date(webhook.created_at).toLocaleString('pt-BR')}`);
                    if (webhook.payload) {
                        console.log(`   Payload: ${JSON.stringify(webhook.payload).substring(0, 200)}...`);
                    }
                });
            } else {
                console.log('⚠️ Nenhum webhook encontrado');
            }
        } catch (webhookError) {
            console.log('❌ Erro ao buscar webhooks:', webhookError.message);
        }

        // 5. Verificar raw_webhook
        console.log('\n📦 RAW WEBHOOKS:');
        try {
            const rawWebhooksQuery = `
                SELECT * FROM raw_webhook 
                ORDER BY created_at DESC 
                LIMIT 5;
            `;
            
            const rawResult = await client.query(rawWebhooksQuery);
            
            if (rawResult.rows.length > 0) {
                console.log(`✅ ${rawResult.rows.length} raw webhooks encontrados:`);
                
                rawResult.rows.forEach((raw, index) => {
                    console.log(`\n${index + 1}. RAW WEBHOOK ID: ${raw.id}`);
                    console.log(`   Criado: ${new Date(raw.created_at).toLocaleString('pt-BR')}`);
                    if (raw.headers) {
                        console.log(`   Headers: ${JSON.stringify(raw.headers).substring(0, 100)}...`);
                    }
                    if (raw.body) {
                        console.log(`   Body: ${JSON.stringify(raw.body).substring(0, 200)}...`);
                    }
                });
            } else {
                console.log('⚠️ Nenhum raw webhook encontrado');
            }
        } catch (rawError) {
            console.log('❌ Erro ao buscar raw webhooks:', rawError.message);
        }

        // 6. Verificar operações recentes
        console.log('\n💹 OPERAÇÕES RECENTES:');
        const recentOpsQuery = `
            SELECT 
                id, symbol, side, status, entry_price, profit, 
                opened_at, closed_at, created_at, signal_id, signal_tv_id
            FROM operations 
            ORDER BY created_at DESC 
            LIMIT 5;
        `;
        
        const recentOpsResult = await client.query(recentOpsQuery);
        
        if (recentOpsResult.rows.length > 0) {
            console.log(`✅ ${recentOpsResult.rows.length} operações recentes:`);
            
            recentOpsResult.rows.forEach((op, index) => {
                console.log(`\n${index + 1}. OPERAÇÃO: ${op.symbol} ${op.side}`);
                console.log(`   Status: ${op.status}`);
                console.log(`   Criado: ${new Date(op.created_at).toLocaleString('pt-BR')}`);
                console.log(`   Signal ID: ${op.signal_id || 'N/A'}`);
                console.log(`   Signal TV ID: ${op.signal_tv_id || 'N/A'}`);
                if (op.profit) console.log(`   Lucro: R$ ${op.profit}`);
            });
        } else {
            console.log('⚠️ Nenhuma operação encontrada');
        }

    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    } finally {
        await client.end();
    }
}

// Executar
if (require.main === module) {
    checkTradingViewSignals().catch(console.error);
}

module.exports = { checkTradingViewSignals };
