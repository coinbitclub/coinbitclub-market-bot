/**
 * 🔄 RECONEXÃO COM SERVIDOR E VERIFICAÇÃO DE DADOS REAIS
 * Script para reconectar e validar dados do sistema
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

class ReconexaoServidor {
    constructor() {
        this.client = new Client(DATABASE_CONFIG);
    }

    async reconectar() {
        console.log('🔄 INICIANDO RECONEXÃO COM SERVIDOR');
        console.log('=' .repeat(60));
        
        try {
            console.log('🔗 Estabelecendo nova conexão...');
            await this.client.connect();
            console.log('✅ Conexão estabelecida com sucesso!');
            
            // Verificar se o banco está respondendo
            const testQuery = await this.client.query('SELECT NOW() as server_time');
            console.log(`🕐 Servidor respondendo - Hora: ${testQuery.rows[0].server_time}`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro na reconexão:', error.message);
            return false;
        }
    }

    async verificarDadosCompletos() {
        console.log('🔍 VERIFICANDO DADOS COMPLETOS DO SISTEMA');
        console.log('-' .repeat(60));
        
        try {
            // 1. Verificar todas as tabelas existentes
            console.log('📋 Verificando estrutura do banco...');
            const tablesQuery = await this.client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            `);
            
            console.log('📊 Tabelas encontradas:');
            tablesQuery.rows.forEach(row => {
                console.log(`   - ${row.table_name}`);
            });
            
            // 2. Verificar usuários (todos, não só ativos)
            console.log('\\n👥 Verificando usuários...');
            const allUsersQuery = await this.client.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN is_active = true THEN 1 END) as ativos,
                    COUNT(CASE WHEN last_login_at > NOW() - INTERVAL '7 days' THEN 1 END) as recentes,
                    MAX(created_at) as ultimo_criado,
                    MIN(created_at) as primeiro_criado
                FROM users
            `);
            
            if (allUsersQuery.rows.length > 0) {
                const userData = allUsersQuery.rows[0];
                console.log(`   Total de usuários: ${userData.total}`);
                console.log(`   Usuários ativos: ${userData.ativos}`);
                console.log(`   Login últimos 7 dias: ${userData.recentes}`);
                console.log(`   Primeiro usuário: ${userData.primeiro_criado}`);
                console.log(`   Último usuário: ${userData.ultimo_criado}`);
            }

            // 3. Verificar operações (todas, incluindo antigas)
            console.log('\\n📊 Verificando operações...');
            const allOperationsQuery = await this.client.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status IN ('OPEN', 'ACTIVE', 'PENDING') THEN 1 END) as ativas,
                    COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as recentes,
                    COALESCE(SUM(pnl), 0) as total_pnl,
                    MAX(created_at) as ultima_operacao,
                    MIN(created_at) as primeira_operacao
                FROM operations
            `);
            
            if (allOperationsQuery.rows.length > 0) {
                const opData = allOperationsQuery.rows[0];
                console.log(`   Total de operações: ${opData.total}`);
                console.log(`   Operações ativas: ${opData.ativas}`);
                console.log(`   Operações últimos 7 dias: ${opData.recentes}`);
                console.log(`   P&L total: R$ ${parseFloat(opData.total_pnl).toFixed(2)}`);
                console.log(`   Primeira operação: ${opData.primeira_operacao}`);
                console.log(`   Última operação: ${opData.ultima_operacao}`);
            }

            // 4. Verificar sinais de trading
            console.log('\\n🎯 Verificando sinais de trading...');
            const allSignalsQuery = await this.client.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as ativos,
                    COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as ultimas_24h,
                    MAX(created_at) as ultimo_sinal,
                    MIN(created_at) as primeiro_sinal
                FROM trading_signals
            `);
            
            if (allSignalsQuery.rows.length > 0) {
                const signalData = allSignalsQuery.rows[0];
                console.log(`   Total de sinais: ${signalData.total}`);
                console.log(`   Sinais ativos: ${signalData.ativos}`);
                console.log(`   Sinais últimas 24h: ${signalData.ultimas_24h}`);
                console.log(`   Primeiro sinal: ${signalData.primeiro_sinal}`);
                console.log(`   Último sinal: ${signalData.ultimo_sinal}`);
            }

            // 5. Verificar chaves API
            console.log('\\n🔑 Verificando chaves API...');
            const apiKeysQuery = await this.client.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN is_active = true THEN 1 END) as ativas,
                    array_agg(DISTINCT exchange_name) as exchanges
                FROM api_keys
            `).catch(() => ({ rows: [{ total: 0, ativas: 0, exchanges: [] }] }));
            
            if (apiKeysQuery.rows.length > 0) {
                const apiData = apiKeysQuery.rows[0];
                console.log(`   Total de chaves: ${apiData.total}`);
                console.log(`   Chaves ativas: ${apiData.ativas}`);
                console.log(`   Exchanges: ${(apiData.exchanges || []).filter(e => e).join(', ')}`);
            }

            return {
                usuarios: allUsersQuery.rows[0] || {},
                operacoes: allOperationsQuery.rows[0] || {},
                sinais: allSignalsQuery.rows[0] || {},
                chaves: apiKeysQuery.rows[0] || {}
            };

        } catch (error) {
            console.error('❌ Erro ao verificar dados:', error.message);
            return null;
        }
    }

    async verificarAtividadeRecente() {
        console.log('\\n🕐 VERIFICANDO ATIVIDADE RECENTE');
        console.log('-' .repeat(60));
        
        try {
            // Últimos usuários que fizeram login
            const recentUsers = await this.client.query(`
                SELECT name, last_login_at, created_at
                FROM users 
                WHERE last_login_at IS NOT NULL
                ORDER BY last_login_at DESC
                LIMIT 5
            `);
            
            console.log('👥 Últimos logins:');
            if (recentUsers.rows.length > 0) {
                recentUsers.rows.forEach(user => {
                    console.log(`   - ${user.name}: ${user.last_login_at}`);
                });
            } else {
                console.log('   Nenhum login registrado');
            }

            // Últimas operações
            const recentOps = await this.client.query(`
                SELECT o.symbol, o.side, o.amount, o.status, o.created_at, u.name as user_name
                FROM operations o
                LEFT JOIN users u ON o.user_id = u.id
                ORDER BY o.created_at DESC
                LIMIT 5
            `);
            
            console.log('\\n📊 Últimas operações:');
            if (recentOps.rows.length > 0) {
                recentOps.rows.forEach(op => {
                    console.log(`   - ${op.user_name || 'N/A'}: ${op.symbol} ${op.side} - ${op.created_at}`);
                });
            } else {
                console.log('   Nenhuma operação registrada');
            }

            // Últimos sinais
            const recentSignals = await this.client.query(`
                SELECT symbol, direction, confidence, created_at
                FROM trading_signals
                ORDER BY created_at DESC
                LIMIT 5
            `);
            
            console.log('\\n🎯 Últimos sinais:');
            if (recentSignals.rows.length > 0) {
                recentSignals.rows.forEach(signal => {
                    console.log(`   - ${signal.symbol} ${signal.direction} (${signal.confidence}%) - ${signal.created_at}`);
                });
            } else {
                console.log('   Nenhum sinal registrado');
            }

        } catch (error) {
            console.error('❌ Erro ao verificar atividade:', error.message);
        }
    }

    async analisarStatusSistema() {
        console.log('\\n🎯 ANÁLISE DO STATUS DO SISTEMA');
        console.log('=' .repeat(60));
        
        try {
            const dados = await this.verificarDadosCompletos();
            
            if (!dados) {
                console.log('❌ Não foi possível analisar o sistema');
                return;
            }

            const temUsuarios = parseInt(dados.usuarios.total || 0) > 0;
            const temOperacoes = parseInt(dados.operacoes.total || 0) > 0;
            const temSinais = parseInt(dados.sinais.total || 0) > 0;
            const temAtividadeRecente = parseInt(dados.usuarios.recentes || 0) > 0 || 
                                       parseInt(dados.operacoes.recentes || 0) > 0 || 
                                       parseInt(dados.sinais.ultimas_24h || 0) > 0;

            console.log('📊 RESUMO EXECUTIVO:');
            console.log(`   🗃️  Banco tem dados: ${temUsuarios || temOperacoes || temSinais ? 'SIM' : 'NÃO'}`);
            console.log(`   ⚡ Atividade recente: ${temAtividadeRecente ? 'SIM' : 'NÃO'}`);
            console.log(`   🟢 Sistema deveria estar: ${temAtividadeRecente ? 'ONLINE' : 'OFFLINE'}`);
            
            if (temUsuarios || temOperacoes || temSinais) {
                console.log('\\n✅ O BANCO CONTÉM DADOS - Sistema pode ser ativado');
                
                if (!temAtividadeRecente) {
                    console.log('⚠️  Dados existem mas são antigos - Sistema em modo OFFLINE é correto');
                    console.log('💡 Para ativar: registre novos usuários ou operações');
                }
            } else {
                console.log('\\n❌ BANCO VAZIO - Necessário popular com dados');
                console.log('💡 Sugestão: Criar usuários e operações de exemplo');
            }

        } catch (error) {
            console.error('❌ Erro na análise:', error.message);
        }
    }

    async desconectar() {
        try {
            await this.client.end();
            console.log('\\n🔌 Conexão encerrada');
        } catch (error) {
            console.error('❌ Erro ao desconectar:', error.message);
        }
    }
}

// Executar reconexão completa
async function executarReconexao() {
    const reconexao = new ReconexaoServidor();
    
    try {
        const conectado = await reconexao.reconectar();
        
        if (conectado) {
            await reconexao.verificarDadosCompletos();
            await reconexao.verificarAtividadeRecente();
            await reconexao.analisarStatusSistema();
        }
        
    } catch (error) {
        console.error('❌ Erro geral na reconexão:', error.message);
    } finally {
        await reconexao.desconectar();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    executarReconexao();
}

module.exports = { ReconexaoServidor };
