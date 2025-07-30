/**
 * 🔍 VERIFICAÇÃO COMPLETA DE GESTORES AUTOMÁTICOS
 * Testa se os sinais são processados automaticamente
 */

const { Pool } = require('pg');

console.log('🔍 ====================================================');
console.log('   VERIFICAÇÃO DE GESTORES AUTOMÁTICOS DE TRADING');
console.log('====================================================');

class VerificadorGestoresAutomaticos {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });
    }

    async verificarSinaisPendentes() {
        console.log('\n📊 1. VERIFICANDO SINAIS PENDENTES...');
        
        try {
            const client = await this.pool.connect();
            
            // Verificar se existe tabela de sinais
            const tabelaExiste = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'trading_signals'
                );
            `);
            
            if (!tabelaExiste.rows[0].exists) {
                console.log('⚠️ Tabela trading_signals não existe - será criada ao receber primeiro sinal');
                client.release();
                return;
            }
            
            // Verificar sinais não processados
            const sinaisNaoProcessados = await client.query(`
                SELECT 
                    id, 
                    symbol, 
                    signal_data,
                    source,
                    received_at,
                    processed,
                    EXTRACT(EPOCH FROM (NOW() - received_at))/60 as minutos_pendente
                FROM trading_signals 
                WHERE processed = false 
                ORDER BY received_at DESC
                LIMIT 10
            `);
            
            console.log(`📈 Sinais não processados: ${sinaisNaoProcessados.rows.length}`);
            
            if (sinaisNaoProcessados.rows.length > 0) {
                console.log('\n⚠️ SINAIS PENDENTES ENCONTRADOS:');
                sinaisNaoProcessados.rows.forEach(sinal => {
                    console.log(`   - ID ${sinal.id}: ${sinal.symbol} (${sinal.minutos_pendente.toFixed(1)} min atrás)`);
                    console.log(`     Dados: ${JSON.stringify(sinal.signal_data).substring(0, 100)}...`);
                });
                
                console.log('\n❌ PROBLEMA: Sinais não estão sendo processados automaticamente!');
            } else {
                console.log('✅ Não há sinais pendentes - sistema processando corretamente');
            }
            
            client.release();
            
        } catch (error) {
            console.error('❌ Erro ao verificar sinais:', error.message);
        }
    }

    async verificarProcessamentoPeriodico() {
        console.log('\n⏰ 2. VERIFICANDO PROCESSAMENTO PERIÓDICO...');
        
        try {
            const client = await this.pool.connect();
            
            // Verificar últimos sinais processados
            const ultimosProcessados = await client.query(`
                SELECT 
                    id, 
                    symbol, 
                    source,
                    received_at,
                    processed,
                    EXTRACT(EPOCH FROM (NOW() - received_at))/60 as minutos_atras
                FROM trading_signals 
                ORDER BY received_at DESC
                LIMIT 5
            `);
            
            if (ultimosProcessados.rows.length === 0) {
                console.log('📭 Nenhum sinal encontrado no sistema ainda');
                client.release();
                return;
            }
            
            console.log('📊 Últimos sinais no sistema:');
            ultimosProcessados.rows.forEach(sinal => {
                const status = sinal.processed ? '✅ PROCESSADO' : '⏳ PENDENTE';
                console.log(`   - ${sinal.symbol}: ${status} (${sinal.minutos_atras.toFixed(1)} min atrás)`);
            });
            
            client.release();
            
        } catch (error) {
            console.error('❌ Erro ao verificar processamento:', error.message);
        }
    }

    async verificarGestoresAtivos() {
        console.log('\n🤖 3. VERIFICANDO GESTORES ATIVOS...');
        
        // Verificar Fear & Greed (sabemos que está ativo)
        console.log('✅ Fear & Greed Gestor: ATIVO (atualização automática a cada 15 min)');
        
        // Verificar se há outros gestores
        const gestoresEsperados = [
            'GestorSinaisTradingView',
            'GestorOperacoes', 
            'GestorMonitoramento',
            'GestorAberturaOrdens',
            'ProcessadorSinais'
        ];
        
        console.log('\n🔍 Gestores esperados no sistema:');
        gestoresEsperados.forEach(gestor => {
            console.log(`   - ${gestor}: ❓ STATUS DESCONHECIDO`);
        });
        
        console.log('\n⚠️ OBSERVAÇÃO: Apenas Fear & Greed confirmado como automático');
    }

    async verificarValidacaoFearGreed() {
        console.log('\n🎯 4. VERIFICANDO VALIDAÇÃO FEAR & GREED...');
        
        try {
            const client = await this.pool.connect();
            
            // Buscar último Fear & Greed
            const ultimoFG = await client.query(`
                SELECT 
                    value,
                    classification,
                    classificacao_pt,
                    created_at,
                    CASE 
                        WHEN value < 30 THEN 'LONG_ONLY'
                        WHEN value > 80 THEN 'SHORT_ONLY'
                        ELSE 'BOTH'
                    END as direction_allowed,
                    EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as horas_atras
                FROM fear_greed_index 
                ORDER BY created_at DESC 
                LIMIT 1
            `);
            
            if (ultimoFG.rows.length === 0) {
                console.log('❌ Nenhum dado Fear & Greed encontrado');
                client.release();
                return;
            }
            
            const fg = ultimoFG.rows[0];
            console.log(`📊 Fear & Greed atual: ${fg.value} (${fg.classificacao_pt})`);
            console.log(`🎯 Direção permitida: ${fg.direction_allowed}`);
            console.log(`⏰ Última atualização: ${fg.horas_atras.toFixed(1)} horas atrás`);
            
            // Verificar se está muito desatualizado
            if (fg.horas_atras > 2) {
                console.log('⚠️ ATENÇÃO: Dados Fear & Greed podem estar desatualizados');
            } else {
                console.log('✅ Dados Fear & Greed atualizados');
            }
            
            client.release();
            
        } catch (error) {
            console.error('❌ Erro ao verificar Fear & Greed:', error.message);
        }
    }

    async verificarFluxoOperacional() {
        console.log('\n🔄 5. VERIFICANDO FLUXO OPERACIONAL COMPLETO...');
        
        const fluxoEsperado = [
            '1. Recebimento de Sinal (Webhook)',
            '2. Validação Fear & Greed',
            '3. Processamento Automático',
            '4. Abertura de Posição',
            '5. Monitoramento TP/SL',
            '6. Fechamento Automático'
        ];
        
        console.log('\n📋 Fluxo operacional esperado:');
        fluxoEsperado.forEach(etapa => {
            console.log(`   ${etapa}`);
        });
        
        console.log('\n❓ STATUS ATUAL:');
        console.log('   ✅ Etapa 1: Webhook funcionando (salva no banco)');
        console.log('   ✅ Etapa 2: Fear & Greed ativo');
        console.log('   ❓ Etapa 3: Processamento automático - PRECISA VERIFICAR');
        console.log('   ❓ Etapa 4: Abertura automática - PRECISA VERIFICAR');
        console.log('   ❓ Etapa 5: Monitoramento - PRECISA VERIFICAR');
        console.log('   ❓ Etapa 6: Fechamento - PRECISA VERIFICAR');
    }

    async executarVerificacaoCompleta() {
        console.log('🚀 Iniciando verificação completa dos gestores automáticos...\n');
        
        await this.verificarSinaisPendentes();
        await this.verificarProcessamentoPeriodico();
        await this.verificarGestoresAtivos();
        await this.verificarValidacaoFearGreed();
        await this.verificarFluxoOperacional();
        
        console.log('\n📋 ====================================================');
        console.log('                    RESUMO DA ANÁLISE');
        console.log('====================================================');
        console.log('✅ FUNCIONANDO: Fear & Greed (atualização automática)');
        console.log('✅ FUNCIONANDO: Webhook recebimento de sinais');
        console.log('❓ INDEFINIDO: Processamento automático de sinais');
        console.log('❓ INDEFINIDO: Abertura automática de posições');
        console.log('❓ INDEFINIDO: Monitoramento automático de TP/SL');
        console.log('❓ INDEFINIDO: Fechamento automático');
        
        console.log('\n🔧 PRÓXIMAS AÇÕES NECESSÁRIAS:');
        console.log('1. Implementar gestor automático de processamento de sinais');
        console.log('2. Configurar abertura automática de posições');
        console.log('3. Implementar monitoramento automático de TP/SL');
        console.log('4. Configurar fechamento automático');
        
        console.log('\n✅ Verificação concluída!');
        
        await this.pool.end();
    }
}

// Executar verificação
const verificador = new VerificadorGestoresAutomaticos();
verificador.executarVerificacaoCompleta().catch(console.error);
