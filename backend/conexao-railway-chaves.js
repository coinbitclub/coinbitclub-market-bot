#!/usr/bin/env node

/**
 * 🚂 CONEXÃO DIRETA COM RAILWAY - ANÁLISE DE CHAVES API
 * 
 * Script para conectar ao Railway e analisar as chaves API reais
 * configuradas no projeto CoinBitClub Market Bot
 */

const { Pool } = require('pg');
const crypto = require('crypto');

// Conectar diretamente ao Railway PostgreSQL
const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

class RailwayChavesAnalyzer {
    constructor() {
        this.chavesEncontradas = new Map();
        this.estatisticas = {
            total: 0,
            validas: 0,
            invalidas: 0,
            nunca_testadas: 0
        };
    }

    async conectarRailway() {
        try {
            console.log('🚂 Conectando ao Railway PostgreSQL...');
            
            // Testar conexão
            const testResult = await pool.query('SELECT NOW() as timestamp, version() as postgres_version');
            
            console.log('✅ Conectado ao Railway com sucesso!');
            console.log(`⏰ Timestamp: ${testResult.rows[0].timestamp}`);
            console.log(`🗄️ PostgreSQL: ${testResult.rows[0].postgres_version.split(' ')[1]}`);
            
            return true;
        } catch (error) {
            console.error('❌ Erro ao conectar ao Railway:', error.message);
            return false;
        }
    }

    async buscarUsuariosEChaves() {
        try {
            console.log('\n🔍 Buscando usuários e chaves API no Railway...');

            // Buscar todos os usuários
            const usuariosResult = await pool.query(`
                SELECT 
                    id, name, email, is_active, 
                    balance_usd, vip_status, plan_type,
                    created_at, updated_at
                FROM users 
                ORDER BY created_at DESC
            `);

            console.log(`👥 Encontrados ${usuariosResult.rows.length} usuários no sistema`);

            // Buscar todas as chaves API
            const chavesResult = await pool.query(`
                SELECT 
                    k.id, k.user_id, k.api_key, k.secret_key,
                    k.is_active, k.last_validated, k.error_message,
                    k.exchange, k.environment, k.validation_status,
                    k.created_at, k.updated_at,
                    u.name as user_name, u.email as user_email,
                    u.is_active as user_active, u.balance_usd, u.vip_status
                FROM user_api_keys k
                INNER JOIN users u ON k.user_id = u.id
                ORDER BY k.created_at DESC
            `);

            console.log(`🔑 Encontradas ${chavesResult.rows.length} chaves API no sistema`);

            return {
                usuarios: usuariosResult.rows,
                chaves: chavesResult.rows
            };

        } catch (error) {
            console.error('❌ Erro ao buscar dados:', error.message);
            return null;
        }
    }

    async analisarChavesDetalhadamente(chaves) {
        console.log('\n📊 ANÁLISE DETALHADA DAS CHAVES API:\n');

        for (const chave of chaves) {
            console.log(`🔑 CHAVE ID: ${chave.id}`);
            console.log(`   👤 Usuário: ${chave.user_name} (${chave.user_email})`);
            console.log(`   📊 VIP: ${chave.vip_status ? '✅ VIP' : '❌ Regular'}`);
            console.log(`   💰 Saldo USD: $${chave.balance_usd || '0.00'}`);
            console.log(`   🏢 Exchange: ${chave.exchange || 'N/A'}`);
            console.log(`   🌍 Environment: ${chave.environment || 'N/A'}`);
            console.log(`   🔐 API Key: ${chave.api_key.substring(0, 12)}...${chave.api_key.substring(chave.api_key.length - 8)}`);
            console.log(`   🗝️ Secret: ${chave.secret_key.substring(0, 8)}...${chave.secret_key.substring(chave.secret_key.length - 8)}`);
            console.log(`   📊 Status: ${chave.is_active ? '✅ ATIVA' : '❌ INATIVA'}`);
            console.log(`   🔍 Validação: ${chave.validation_status || 'N/A'}`);
            console.log(`   📅 Última validação: ${chave.last_validated || 'Nunca validada'}`);
            
            if (chave.error_message) {
                console.log(`   ⚠️ Erro: ${chave.error_message}`);
            }
            
            console.log(`   📅 Criada em: ${chave.created_at}`);
            console.log('');

            this.estatisticas.total++;
            if (chave.is_active) {
                this.estatisticas.validas++;
            } else {
                this.estatisticas.invalidas++;
            }
            if (!chave.last_validated) {
                this.estatisticas.nunca_testadas++;
            }
        }
    }

    async testarChavesBybit(apiKey, secretKey) {
        try {
            console.log('🔄 Testando conexão com Bybit...');
            
            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            
            // Usar endpoint mais simples para teste
            const params = `api_key=${apiKey}&recv_window=${recvWindow}&timestamp=${timestamp}`;
            const signature = crypto.createHmac('sha256', secretKey).update(params).digest('hex');
            
            const url = `https://api.bybit.com/v5/market/time?${params}&sign=${signature}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-BAPI-API-KEY': apiKey,
                    'X-BAPI-TIMESTAMP': timestamp,
                    'X-BAPI-RECV-WINDOW': recvWindow,
                    'X-BAPI-SIGN': signature,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            return {
                sucesso: data.retCode === 0,
                resposta: data,
                timestamp: data.result?.timeSecond || null
            };

        } catch (error) {
            return {
                sucesso: false,
                erro: error.message
            };
        }
    }

    async testarTodasAsChaves(chaves) {
        console.log('\n🔗 TESTANDO CONECTIVIDADE DAS CHAVES COM BYBIT:\n');

        for (const chave of chaves) {
            if (!chave.is_active) {
                console.log(`⏭️ Pulando chave inativa: ${chave.user_name}`);
                continue;
            }

            console.log(`🔄 Testando chave de: ${chave.user_name}`);
            
            const resultado = await this.testarChavesBybit(chave.api_key, chave.secret_key);
            
            if (resultado.sucesso) {
                console.log(`✅ Chave funcional! Timestamp servidor: ${resultado.timestamp}`);
            } else {
                console.log(`❌ Erro na chave: ${resultado.erro || resultado.resposta?.retMsg || 'Erro desconhecido'}`);
            }

            // Delay para evitar rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    async verificarEstruturaBanco() {
        try {
            console.log('\n🗄️ VERIFICANDO ESTRUTURA DO BANCO DE DADOS:\n');

            // Verificar tabelas existentes
            const tabelasResult = await pool.query(`
                SELECT table_name, table_type
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name
            `);

            console.log('📋 Tabelas encontradas:');
            tabelasResult.rows.forEach(tabela => {
                console.log(`   📁 ${tabela.table_name} (${tabela.table_type})`);
            });

            // Verificar estrutura da tabela users
            const colunasUsers = await pool.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'users'
                ORDER BY ordinal_position
            `);

            console.log('\n👥 Estrutura da tabela users:');
            colunasUsers.rows.forEach(coluna => {
                console.log(`   🔹 ${coluna.column_name}: ${coluna.data_type} ${coluna.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
            });

            // Verificar estrutura da tabela user_api_keys
            const colunasChaves = await pool.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'user_api_keys'
                ORDER BY ordinal_position
            `);

            console.log('\n🔑 Estrutura da tabela user_api_keys:');
            colunasChaves.rows.forEach(coluna => {
                console.log(`   🔹 ${coluna.column_name}: ${coluna.data_type} ${coluna.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
            });

        } catch (error) {
            console.error('❌ Erro ao verificar estrutura:', error.message);
        }
    }

    async executarAnaliseCompleta() {
        console.log('🚀 INICIANDO ANÁLISE COMPLETA DO RAILWAY...');
        console.log(`⏰ Timestamp: ${new Date().toISOString()}\n`);

        // 1. Conectar ao Railway
        const conectado = await this.conectarRailway();
        if (!conectado) {
            console.log('❌ Não foi possível conectar ao Railway');
            return;
        }

        // 2. Verificar estrutura do banco
        await this.verificarEstruturaBanco();

        // 3. Buscar usuários e chaves
        const dados = await this.buscarUsuariosEChaves();
        if (!dados) {
            console.log('❌ Não foi possível buscar dados');
            return;
        }

        // 4. Analisar chaves detalhadamente
        if (dados.chaves.length > 0) {
            await this.analisarChavesDetalhadamente(dados.chaves);
            
            // 5. Testar conectividade das chaves ativas
            const chavesAtivas = dados.chaves.filter(c => c.is_active);
            if (chavesAtivas.length > 0) {
                await this.testarTodasAsChaves(chavesAtivas);
            } else {
                console.log('⚠️ Nenhuma chave ativa encontrada para teste');
            }
        } else {
            console.log('ℹ️ Nenhuma chave API encontrada no sistema');
        }

        // 6. Resumo final
        console.log('\n📊 RESUMO DA ANÁLISE:');
        console.log(`   👥 Usuários encontrados: ${dados.usuarios.length}`);
        console.log(`   🔑 Total de chaves: ${this.estatisticas.total}`);
        console.log(`   ✅ Chaves válidas: ${this.estatisticas.validas}`);
        console.log(`   ❌ Chaves inválidas: ${this.estatisticas.invalidas}`);
        console.log(`   🆕 Nunca testadas: ${this.estatisticas.nunca_testadas}`);

        console.log('\n✅ ANÁLISE CONCLUÍDA!');
        
        // Fechar conexão
        await pool.end();
    }
}

// Executar análise se chamado diretamente
if (require.main === module) {
    const analyzer = new RailwayChavesAnalyzer();
    analyzer.executarAnaliseCompleta().catch(console.error);
}

module.exports = RailwayChavesAnalyzer;
