#!/usr/bin/env node

/**
 * 🧹 LIMPADOR COMPLETO DE DADOS DE TESTE - COINBITCLUB MARKET BOT V3.0.0
 * 
 * Remove TODOS os dados de teste mantendo apenas dados de produção essenciais
 * CUIDADO: Esta operação é IRREVERSÍVEL!
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@yamabiko.proxy.rlwy.net:42095/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

class LimpadorCompleto {
    constructor() {
        this.resultados = {
            inicio: new Date(),
            tabelas_processadas: [],
            registros_removidos: {},
            total_removidos: 0,
            erros: [],
            preservados: {}
        };
    }

    async executarLimpezaCompleta() {
        console.log('🧹 LIMPEZA COMPLETA DE DADOS DE TESTE');
        console.log('=====================================');
        console.log('⚠️ REMOVENDO TODOS OS DADOS DE TESTE DO BANCO!');
        console.log('🎯 Preservando apenas configurações essenciais\n');

        try {
            // FASE 1: Operações e trading
            await this.limparOperacoes();
            await this.limparSinais();
            await this.limparProcessamento();
            
            // FASE 2: Análises e IA
            await this.limparAnalises();
            await this.limparIA();
            
            // FASE 3: Logs e monitoramento
            await this.limparLogs();
            await this.limparMonitoramento();
            
            // FASE 4: Dados financeiros de teste
            await this.limparFinanceiro();
            
            // FASE 5: Dados de mercado antigos
            await this.limparMercado();
            
            // FASE 6: Otimização
            await this.otimizarBanco();
            
            await this.verificarPreservados();
            await this.gerarRelatorio();
            
        } catch (error) {
            console.error('❌ ERRO CRÍTICO:', error.message);
            this.resultados.erros.push(`CRÍTICO: ${error.message}`);
        } finally {
            await pool.end();
        }
    }

    async limparOperacoes() {
        console.log('� LIMPANDO OPERAÇÕES DE TESTE');
        console.log('===============================');

        // 1. TODAS as operações (são dados de teste)
        await this.executarLimpeza(
            'operations',
            'DELETE FROM operations',
            'TODAS as operações (dados de teste)'
        );

        // 2. Order executions
        await this.executarLimpeza(
            'order_executions',
            'DELETE FROM order_executions',
            'Todas as execuções de ordem'
        );

        // 3. Operação monitoramento
        await this.executarLimpeza(
            'operacao_monitoramento',
            'DELETE FROM operacao_monitoramento',
            'Todo o monitoramento de operações'
        );

        // 4. Signal user processing
        await this.executarLimpeza(
            'signal_user_processing',
            'DELETE FROM signal_user_processing',
            'Todo o processamento de sinais por usuário'
        );

        // 5. Bloqueios de ticker
        await this.executarLimpeza(
            'bloqueio_ticker',
            'DELETE FROM bloqueio_ticker',
            'Todos os bloqueios de ticker'
        );
      DELETE FROM trading_signals 
      WHERE created_at < NOW() - INTERVAL '2 hours'
    `);
    console.log(`   ✅ ${deleteSignals.rowCount} sinais antigos removidos`);
    
    // 5. Verificação final
    console.log('\n🔍 VERIFICAÇÃO FINAL:');
    const finalOps = await pool.query('SELECT COUNT(*) as total FROM user_operations');
    const finalSignals = await pool.query('SELECT COUNT(*) as total FROM trading_signals');
    
    console.log(`   📊 Operações restantes: ${finalOps.rows[0].total}`);
    console.log(`   📡 Sinais restantes: ${finalSignals.rows[0].total}`);
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ LIMPEZA CONCLUÍDA COM SUCESSO!');
    console.log('🚀 SISTEMA PRONTO PARA OPERAÇÃO REAL!');
    console.log('📈 Próximos sinais serão de produção real');
    
  } catch (error) {
    console.error('❌ Erro durante limpeza:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
    console.log('🔌 Conexão com banco fechada');
  }
}

// Executar limpeza
limparDadosTeste().catch(console.error);
