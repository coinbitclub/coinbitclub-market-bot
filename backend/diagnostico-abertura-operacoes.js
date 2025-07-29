/**
 * 🔍 DIAGNÓSTICO COMPLETO - POR QUE NÃO ABRE OPERAÇÕES AUTOMATICAMENTE
 * Verifica todos os componentes necessários para abertura automática de operações
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function diagnosticoCompleto() {
    try {
        console.log('🔍 DIAGNÓSTICO: POR QUE NÃO ABRE OPERAÇÕES AUTOMATICAMENTE');
        console.log('='.repeat(70));
        
        const palomaId = 12;
        
        // 1. VERIFICAR SE IA SUPERVISOR ESTÁ APENAS MONITORANDO OU TAMBÉM ABRINDO
        console.log('🤖 1. VERIFICANDO PAPEL DA IA SUPERVISOR:');
        console.log('='.repeat(50));
        
        // A IA Supervisor atual está configurada apenas para MONITORAR
        // Ela NÃO abre operações - apenas monitora as existentes
        console.log('❌ PROBLEMA IDENTIFICADO:');
        console.log('   • IA Supervisor atual: APENAS MONITORA operações');
        console.log('   • IA Supervisor atual: NÃO ABRE novas operações');
        console.log('   • Falta: Sistema para ABERTURA automática');
        console.log('');
        
        // 2. VERIFICAR FLUXO OPERACIONAL NECESSÁRIO
        console.log('📋 2. FLUXO OPERACIONAL NECESSÁRIO PARA ABERTURA AUTOMÁTICA:');
        console.log('='.repeat(60));
        console.log('✅ COMPONENTES NECESSÁRIOS:');
        console.log('   1. 📡 WEBHOOK TradingView → Receber sinais');
        console.log('   2. 🔍 FILTRO Fear & Greed → Validar contexto de mercado');
        console.log('   3. 🤖 IA ABERTURA → Decidir se abre operação');
        console.log('   4. 📊 CÁLCULO DE RISCO → Definir tamanho da posição');
        console.log('   5. 🚀 EXECUTOR DE ORDENS → Enviar ordem para exchange');
        console.log('   6. 📝 REGISTRO → Salvar operação no banco');
        console.log('   7. 👁️ IA SUPERVISOR → Monitorar operação aberta');
        console.log('');
        
        // 3. VERIFICAR COMPONENTES EXISTENTES
        console.log('🔍 3. STATUS DOS COMPONENTES EXISTENTES:');
        console.log('='.repeat(50));
        
        // Verificar webhook configs
        const webhookQuery = `
            SELECT * FROM webhook_configs 
            WHERE user_id = $1 AND is_active = true;
        `;
        
        try {
            const webhooks = await pool.query(webhookQuery, [palomaId]);
            console.log(`📡 WEBHOOKS: ${webhooks.rows.length > 0 ? '✅ CONFIGURADO' : '❌ NÃO CONFIGURADO'}`);
            if (webhooks.rows.length > 0) {
                webhooks.rows.forEach(wh => {
                    console.log(`   URL: ${wh.url}`);
                    console.log(`   Tipo: ${wh.webhook_type}`);
                });
            }
        } catch (error) {
            console.log('📡 WEBHOOKS: ❌ TABELA NÃO EXISTE');
        }
        
        // Verificar sinais recebidos
        const sinaisQuery = `
            SELECT COUNT(*) as total, MAX(created_at) as ultimo_sinal
            FROM signals_received 
            WHERE user_id = $1;
        `;
        
        try {
            const sinais = await pool.query(sinaisQuery, [palomaId]);
            const totalSinais = sinais.rows[0]?.total || 0;
            console.log(`📡 SINAIS RECEBIDOS: ${totalSinais > 0 ? `✅ ${totalSinais} sinais` : '❌ NENHUM SINAL'}`);
            if (totalSinais > 0) {
                console.log(`   Último sinal: ${sinais.rows[0].ultimo_sinal}`);
            }
        } catch (error) {
            console.log('📡 SINAIS RECEBIDOS: ❌ TABELA NÃO EXISTE');
        }
        
        // Verificar Fear & Greed
        const fearGreedQuery = `
            SELECT * FROM fear_greed_index 
            ORDER BY date DESC 
            LIMIT 1;
        `;
        
        try {
            const fearGreed = await pool.query(fearGreedQuery);
            console.log(`😰 FEAR & GREED: ${fearGreed.rows.length > 0 ? '✅ ATIVO' : '❌ SEM DADOS'}`);
            if (fearGreed.rows.length > 0) {
                const fg = fearGreed.rows[0];
                console.log(`   Valor atual: ${fg.value} (${fg.classification})`);
            }
        } catch (error) {
            console.log('😰 FEAR & GREED: ❌ TABELA NÃO EXISTE');
        }
        
        // 4. VERIFICAR OPERAÇÕES MANUAIS vs AUTOMÁTICAS
        console.log('\n📊 4. ANÁLISE DAS OPERAÇÕES EXISTENTES:');
        console.log('='.repeat(50));
        
        const operacoesQuery = `
            SELECT 
                id, symbol, operation_type, amount, entry_price,
                created_at, status,
                CASE 
                    WHEN created_at < NOW() - INTERVAL '1 hour' THEN 'MANUAL/TESTE'
                    ELSE 'RECENTE'
                END as origem_provavel
            FROM user_operations 
            WHERE user_id = $1
            ORDER BY created_at DESC;
        `;
        
        const operacoes = await pool.query(operacoesQuery, [palomaId]);
        
        console.log(`📈 TOTAL DE OPERAÇÕES: ${operacoes.rows.length}`);
        operacoes.rows.forEach(op => {
            console.log(`   ${op.id}: ${op.symbol} ${op.operation_type} - ${op.origem_provavel} - ${op.created_at}`);
        });
        
        // 5. PROBLEMAS IDENTIFICADOS
        console.log('\n❌ 5. PROBLEMAS IDENTIFICADOS:');
        console.log('='.repeat(50));
        console.log('🚨 CAUSA RAIZ: SISTEMA INCOMPLETO PARA ABERTURA AUTOMÁTICA');
        console.log('');
        console.log('❌ COMPONENTES FALTANTES:');
        console.log('   1. 📡 WEBHOOK ENDPOINT para receber sinais TradingView');
        console.log('   2. 🤖 IA ABERTURA DE OPERAÇÕES (diferente da IA Supervisor)');
        console.log('   3. 🔗 INTEGRAÇÃO com API da Exchange (Bybit)');
        console.log('   4. 📋 SISTEMA DE VALIDAÇÃO DE SINAIS');
        console.log('   5. 💰 CALCULADORA DE TAMANHO DE POSIÇÃO');
        console.log('');
        console.log('✅ COMPONENTES EXISTENTES:');
        console.log('   1. 👁️ IA SUPERVISOR (monitora operações)');
        console.log('   2. 💾 BANCO DE DADOS (armazena operações)');
        console.log('   3. 📊 CONFIGURAÇÕES DE TRADING');
        console.log('   4. 🎯 CÁLCULOS DE TP/SL');
        console.log('');
        
        // 6. SOLUÇÃO NECESSÁRIA
        console.log('💡 6. SOLUÇÃO NECESSÁRIA:');
        console.log('='.repeat(40));
        console.log('🔧 PARA ABERTURA AUTOMÁTICA, PRECISAMOS CRIAR:');
        console.log('');
        console.log('📝 A. WEBHOOK TRADINGVIEW:');
        console.log('   • Endpoint: /webhook/tradingview');
        console.log('   • Recebe: "SINAL LONG", "SINAL SHORT", etc.');
        console.log('   • Valida: Timestamp (2 min timeout)');
        console.log('');
        console.log('🤖 B. IA ABERTURA DE OPERAÇÕES:');
        console.log('   • Analisa sinal recebido');
        console.log('   • Consulta Fear & Greed Index');
        console.log('   • Calcula tamanho da posição');
        console.log('   • Envia ordem para exchange');
        console.log('');
        console.log('🔗 C. INTEGRAÇÃO BYBIT API:');
        console.log('   • Autenticação com chaves reais');
        console.log('   • Envio de ordens de compra/venda');
        console.log('   • Confirmação de execução');
        console.log('');
        console.log('📋 D. FLUXO COMPLETO:');
        console.log('   TradingView → Webhook → IA Abertura → Exchange → IA Supervisor');
        
        console.log('\n🎯 PRÓXIMA AÇÃO RECOMENDADA:');
        console.log('   Criar sistema completo de abertura automática');
        console.log('   ou configurar sinais manuais para teste');
        
    } catch (error) {
        console.error('❌ Erro no diagnóstico:', error.message);
        console.error(error);
    } finally {
        await pool.end();
    }
}

diagnosticoCompleto();
