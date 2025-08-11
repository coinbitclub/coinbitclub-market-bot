/**
 * 🔍 ANÁLISE FINAL DE OPERAÇÕES
 * ============================
 * 
 * Análise detalhada das operações reais encontradas
 * 
 * @author Sistema Automatizado
 * @version 3.0
 * @date 07/08/2025 21:27
 */

const { Pool } = require('pg');

class AnaliseOperacoesFinal {
    constructor() {
        this.pool = new Pool({
    host: 'trolley.proxy.rlwy.net',
            port: 44790,
            database: 'railway',
            user: 'postgres',
            password: 'ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq',
            ssl: {
                rejectUnauthorized: false
            },
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
    ssl: { rejectUnauthorized: false }
});
    }

    log(message, level = 'INFO') {
        const timestamp = new Date().toLocaleString('pt-BR');
        const prefix = {
            'INFO': '[📊]',
            'WARNING': '[⚠️ ]',
            'SUCCESS': '[✅]',
            'ERROR': '[❌]'
        }[level] || '[📊]';
        
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    /**
     * 🔍 ANALISAR POSITIONS EM DETALHE
     */
    async analisarPositions() {
        this.log('🔍 Analisando todas as positions encontradas...');
        
        try {
            const positions = await this.pool.query(`
                SELECT 
                    id, user_id, symbol, side, size, 
                    entry_price, mark_price, unrealized_pnl, 
                    leverage, is_active, testnet
                FROM positions 
                ORDER BY id DESC
            `);

            this.log(`💹 Total de ${positions.rows.length} positions encontradas:`);
            console.log('');

            positions.rows.forEach((pos, index) => {
                this.log(`📈 Position ${index + 1}:`);
                this.log(`   • ID: ${pos.id}`);
                this.log(`   • User ID: ${pos.user_id}`);
                this.log(`   • Symbol: ${pos.symbol}`);
                this.log(`   • Side: ${pos.side}`);
                this.log(`   • Size: ${pos.size}`);
                this.log(`   • Entry Price: ${pos.entry_price}`);
                this.log(`   • Mark Price: ${pos.mark_price || 'N/A'}`);
                this.log(`   • Unrealized PnL: ${pos.unrealized_pnl || 'N/A'}`);
                this.log(`   • Leverage: ${pos.leverage || 'N/A'}`);
                this.log(`   • Is Active: ${pos.is_active}`);
                this.log(`   • Testnet: ${pos.testnet}`);
                console.log('');
            });

            // Verificar se há positions ativas
            const positionsAtivas = positions.rows.filter(p => p.is_active && p.position_size > 0);
            
            if (positionsAtivas.length > 0) {
                this.log(`⚠️  ATENÇÃO: ${positionsAtivas.length} POSITIONS ATIVAS ENCONTRADAS!`, 'WARNING');
                positionsAtivas.forEach(pos => {
                    const isTestnet = pos.testnet ? '(TESTNET)' : '(MAINNET)';
                    this.log(`   🚨 ${pos.symbol} ${pos.side} ${pos.position_size} @ ${pos.entry_price} ${isTestnet}`, 'WARNING');
                });
            } else {
                this.log('✅ Nenhuma position ativa encontrada');
            }

            return positions.rows;
        } catch (error) {
            this.log(`❌ Erro ao analisar positions: ${error.message}`, 'ERROR');
            return [];
        }
    }

    /**
     * 🔍 ANALISAR TRADES EM DETALHE
     */
    async analisarTrades() {
        this.log('🔍 Analisando todos os trades encontrados...');
        
        try {
            const trades = await this.pool.query(`
                SELECT 
                    id, user_id, symbol, side, quantity, 
                    price, executed_price, status, pnl, 
                    commission, created_at, executed_at
                FROM trades 
                ORDER BY id DESC
            `);

            this.log(`⚡ Total de ${trades.rows.length} trades encontrados:`);
            console.log('');

            trades.rows.forEach((trade, index) => {
                this.log(`💰 Trade ${index + 1}:`);
                this.log(`   • ID: ${trade.id}`);
                this.log(`   • User ID: ${trade.user_id}`);
                this.log(`   • Symbol: ${trade.symbol}`);
                this.log(`   • Side: ${trade.side}`);
                this.log(`   • Quantity: ${trade.quantity}`);
                this.log(`   • Price: ${trade.price}`);
                this.log(`   • Executed Price: ${trade.executed_price || 'N/A'}`);
                this.log(`   • Status: ${trade.status}`);
                this.log(`   • PnL: ${trade.pnl || 'N/A'}`);
                this.log(`   • Commission: ${trade.commission || 'N/A'}`);
                this.log(`   • Created: ${trade.created_at}`);
                this.log(`   • Executed: ${trade.executed_at || 'N/A'}`);
                console.log('');
            });

            // Verificar trades em aberto
            const tradesAbertos = trades.rows.filter(t => t.status === 'open' || t.status === 'pending');
            
            if (tradesAbertos.length > 0) {
                this.log(`⚠️  ATENÇÃO: ${tradesAbertos.length} TRADES EM ABERTO!`, 'WARNING');
            } else {
                this.log('✅ Nenhum trade em aberto encontrado');
            }

            return trades.rows;
        } catch (error) {
            this.log(`❌ Erro ao analisar trades: ${error.message}`, 'ERROR');
            return [];
        }
    }

    /**
     * 🔍 VERIFICAR BALANCES
     */
    async verificarBalances() {
        this.log('🔍 Verificando balances...');
        
        try {
            const balances = await this.pool.query(`
                SELECT 
                    user_id, asset, wallet_balance, 
                    available_balance, locked_balance, 
                    unrealized_pnl, equity, account_type
                FROM balances 
                WHERE wallet_balance > 0 OR available_balance > 0 OR locked_balance > 0
                ORDER BY wallet_balance DESC
            `);

            if (balances.rows.length > 0) {
                this.log(`💰 ${balances.rows.length} balances com valores encontrados:`);
                balances.rows.forEach(bal => {
                    this.log(`   • User ${bal.user_id} - ${bal.asset}: Wallet ${bal.wallet_balance}, Available ${bal.available_balance}, Locked ${bal.locked_balance}`);
                });
            } else {
                this.log('✅ Nenhum balance com valor encontrado');
            }

            return balances.rows;
        } catch (error) {
            this.log(`❌ Erro ao verificar balances: ${error.message}`, 'ERROR');
            return [];
        }
    }

    /**
     * 📊 GERAR RELATÓRIO FINAL
     */
    async gerarRelatorioFinal() {
        this.log('📊 INICIANDO ANÁLISE FINAL DE OPERAÇÕES ABERTAS', 'SUCCESS');
        console.log('='.repeat(70));
        
        try {
            // 1. Analisar positions
            const positions = await this.analisarPositions();

            // 2. Analisar trades  
            const trades = await this.analisarTrades();

            // 3. Verificar balances
            const balances = await this.verificarBalances();

            // 4. Resumo final
            console.log('='.repeat(70));
            this.log('🎯 RESUMO FINAL DE OPERAÇÕES:', 'SUCCESS');
            
            const positionsAtivas = positions.filter(p => p.is_active && p.position_size > 0);
            const positionsMainnet = positionsAtivas.filter(p => !p.testnet);
            const positionsTestnet = positionsAtivas.filter(p => p.testnet);
            
            const tradesAbertos = trades.filter(t => t.status === 'open' || t.status === 'pending');
            
            this.log(`📈 Positions Total: ${positions.length}`);
            this.log(`🔴 Positions Ativas: ${positionsAtivas.length}`);
            this.log(`🌐 Positions Mainnet: ${positionsMainnet.length}`);
            this.log(`🧪 Positions Testnet: ${positionsTestnet.length}`);
            this.log(`⚡ Trades Total: ${trades.length}`);
            this.log(`🔄 Trades Abertos: ${tradesAbertos.length}`);
            this.log(`💰 Balances com Valor: ${balances.length}`);

            console.log('');
            
            if (positionsMainnet.length > 0) {
                this.log('🚨 ALERTA: EXISTEM POSITIONS ATIVAS EM MAINNET!', 'WARNING');
                positionsMainnet.forEach(pos => {
                    this.log(`   ⚠️  ${pos.symbol} ${pos.side} ${pos.size} - User ${pos.user_id}`, 'WARNING');
                });
            } else if (positionsTestnet.length > 0) {
                this.log('ℹ️  INFO: Existem positions apenas em testnet (seguro)', 'INFO');
            } else {
                this.log('✅ SISTEMA SEGURO: Nenhuma operação real aberta!', 'SUCCESS');
            }

            return {
                positions,
                trades,
                balances,
                positionsAtivas: positionsAtivas.length,
                positionsMainnet: positionsMainnet.length,
                tradesAbertos: tradesAbertos.length,
                temOperacoesReais: positionsMainnet.length > 0 || tradesAbertos.length > 0
            };

        } catch (error) {
            this.log(`❌ ERRO CRÍTICO: ${error.message}`, 'ERROR');
            throw error;
        } finally {
            await this.pool.end();
        }
    }
}

// 🚀 EXECUÇÃO
if (require.main === module) {
    const analise = new AnaliseOperacoesFinal();
    analise.gerarRelatorioFinal().then(resultado => {
        console.log('\n🎯 Análise finalizada!');
        if (resultado.temOperacoesReais) {
            console.log('⚠️  ATENÇÃO: Operações reais detectadas!');
        } else {
            console.log('✅ Sistema seguro para manutenção!');
        }
        process.exit(0);
    }).catch(error => {
        console.error('❌ ERRO:', error.message);
        process.exit(1);
    });
}

module.exports = AnaliseOperacoesFinal;
