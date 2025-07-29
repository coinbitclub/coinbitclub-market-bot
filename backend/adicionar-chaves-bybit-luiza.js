/**
 * SCRIPT ESPECÍFICO: Adicionar Chaves Bybit para Luiza
 * Sistema CoinbitClub MarketBot - Multi-usuário
 * Focado na usuária Luiza (ID: 2) para operações reais
 */

const { Pool } = require('pg');

class AdicionarChavesBybitLuiza {
    constructor() {
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: {
                rejectUnauthorized: false
            }
        });
    }

    async conectar() {
        try {
            const client = await this.pool.connect();
            console.log('✅ Conectado ao PostgreSQL Railway');
            client.release();
            return true;
        } catch (error) {
            console.error('❌ Erro de conexão:', error.message);
            return false;
        }
    }

    async verificarUsuarioLuiza() {
        try {
            const query = `
                SELECT id, name, email, username, role, status 
                FROM users 
                WHERE id = 2 AND email = 'luiza@coinbitclub.com'
            `;
            
            const result = await this.pool.query(query);
            
            if (result.rows.length === 0) {
                console.log('❌ Usuária Luiza não encontrada (ID: 2)');
                return null;
            }
            
            const luiza = result.rows[0];
            console.log('✅ USUÁRIA LUIZA VERIFICADA:');
            console.table(luiza);
            
            return luiza;
        } catch (error) {
            console.error('❌ Erro ao verificar usuária Luiza:', error.message);
            return null;
        }
    }

    async verificarChavesExistentes() {
        try {
            const query = `
                SELECT id, user_id, exchange, api_key, created_at, is_active
                FROM user_api_keys 
                WHERE user_id = 2
            `;
            
            const result = await this.pool.query(query);
            
            console.log('🔐 CHAVES EXISTENTES PARA LUIZA:');
            if (result.rows.length === 0) {
                console.log('   ❌ Nenhuma chave API encontrada para Luiza');
                return [];
            } else {
                console.table(result.rows);
                return result.rows;
            }
        } catch (error) {
            console.error('❌ Erro ao verificar chaves existentes:', error.message);
            return [];
        }
    }

    async adicionarChaveBybit(apiKey, secretKey, isTestnet = false) {
        try {
            console.log('🔑 ADICIONANDO CHAVES BYBIT PARA LUIZA...');
            
            // Primeiro verificar se já existe chave Bybit para Luiza
            const checkQuery = `
                SELECT id FROM user_api_keys 
                WHERE user_id = 2 AND exchange = 'bybit'
            `;
            
            const existing = await this.pool.query(checkQuery);
            
            if (existing.rows.length > 0) {
                console.log('⚠️ Já existe chave Bybit para Luiza. Atualizando...');
                
                const updateQuery = `
                    UPDATE user_api_keys 
                    SET 
                        api_key = $1,
                        secret_key = $2,
                        is_testnet = $3,
                        is_active = true,
                        updated_at = NOW()
                    WHERE user_id = 2 AND exchange = 'bybit'
                    RETURNING *
                `;
                
                const result = await this.pool.query(updateQuery, [apiKey, secretKey, isTestnet]);
                console.log('✅ Chave Bybit atualizada para Luiza:');
                console.table(result.rows[0]);
                return result.rows[0];
                
            } else {
                console.log('➕ Inserindo nova chave Bybit para Luiza...');
                
                const insertQuery = `
                    INSERT INTO user_api_keys (
                        user_id, 
                        exchange, 
                        api_key, 
                        secret_key, 
                        is_testnet, 
                        is_active,
                        created_at,
                        updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                    RETURNING *
                `;
                
                const result = await this.pool.query(insertQuery, [
                    2,           // user_id da Luiza
                    'bybit',     // exchange
                    apiKey,      // api_key
                    secretKey,   // secret_key
                    isTestnet,   // is_testnet
                    true         // is_active
                ]);
                
                console.log('✅ Nova chave Bybit adicionada para Luiza:');
                console.table(result.rows[0]);
                return result.rows[0];
            }
            
        } catch (error) {
            console.error('❌ Erro ao adicionar chave Bybit:', error.message);
            throw error;
        }
    }

    async verificarSaldoLuiza() {
        try {
            console.log('💰 VERIFICANDO SALDOS DA LUIZA...');
            
            // Buscar saldos por user_id = 2 (como integer)
            // Mas user_balances usa UUID, então vamos buscar por correlação
            const query = `
                SELECT ub.*, u.name, u.email
                FROM user_balances ub
                JOIN users u ON u.id::text = ub.user_id::text
                WHERE u.id = 2
            `;
            
            const result = await this.pool.query(query);
            
            if (result.rows.length === 0) {
                console.log('❌ Nenhum saldo encontrado para Luiza');
                console.log('💡 Verificando estrutura de user_balances...');
                
                // Buscar estrutura da tabela user_balances
                const structQuery = `
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = 'user_balances' 
                    ORDER BY ordinal_position
                `;
                
                const structResult = await this.pool.query(structQuery);
                console.table(structResult.rows);
                
                return null;
            } else {
                console.log('✅ SALDOS ENCONTRADOS PARA LUIZA:');
                console.table(result.rows);
                return result.rows;
            }
            
        } catch (error) {
            console.error('❌ Erro ao verificar saldos:', error.message);
            
            // Tentar buscar todos os saldos para análise
            try {
                console.log('🔍 Analisando todos os saldos existentes...');
                const allBalances = await this.pool.query('SELECT * FROM user_balances LIMIT 3');
                console.table(allBalances.rows);
            } catch (e) {
                console.error('❌ Erro na análise de saldos:', e.message);
            }
            
            return null;
        }
    }

    async testarConexaoBybit() {
        try {
            console.log('🧪 TESTE DE CONEXÃO BYBIT (SIMULADO)');
            console.log('   📡 Endpoint: https://api.bybit.com');
            console.log('   🔑 Autenticação: API Key + Secret (HMAC SHA256)');
            console.log('   ⚠️ Nota: Teste real requer chaves válidas');
            console.log('   ✅ Estrutura de conexão preparada');
            
            return true;
        } catch (error) {
            console.error('❌ Erro no teste Bybit:', error.message);
            return false;
        }
    }

    async executarConfiguracao() {
        try {
            console.log('🚀 INICIANDO CONFIGURAÇÃO DE CHAVES BYBIT PARA LUIZA');
            console.log('=' .repeat(60));
            
            // 1. Conectar ao banco
            const conectado = await this.conectar();
            if (!conectado) {
                throw new Error('Falha na conexão com o banco');
            }
            
            // 2. Verificar usuária Luiza
            const luiza = await this.verificarUsuarioLuiza();
            if (!luiza) {
                throw new Error('Usuária Luiza não encontrada');
            }
            
            // 3. Verificar chaves existentes
            await this.verificarChavesExistentes();
            
            // 4. Verificar saldos
            await this.verificarSaldoLuiza();
            
            // 5. Teste de conexão Bybit
            await this.testarConexaoBybit();
            
            console.log('\n📋 PRÓXIMOS PASSOS PARA LUIZA:');
            console.log('=' .repeat(50));
            console.log('1. ✅ Usuária verificada: luiza@coinbitclub.com (ID: 2)');
            console.log('2. 🔑 Para adicionar chaves Bybit reais, execute:');
            console.log('   gestor.adicionarChaveBybit("SUA_API_KEY", "SUA_SECRET_KEY", false)');
            console.log('3. 💰 Verificar saldos após adicionar chaves');
            console.log('4. 🚀 Ativar operações reais');
            
            console.log('\n⚠️ ATENÇÃO:');
            console.log('- Use is_testnet = false para operações reais');
            console.log('- Verifique saldos antes de ativar trading');
            console.log('- Mantenha chaves API seguras');
            
            return true;
            
        } catch (error) {
            console.error('❌ ERRO NA CONFIGURAÇÃO:', error.message);
            return false;
        }
    }

    // Método para uso direto com chaves reais
    async configurarChavesReais(apiKey, secretKey) {
        if (!apiKey || !secretKey) {
            console.error('❌ API Key e Secret Key são obrigatórios');
            return false;
        }
        
        console.log('🔐 CONFIGURANDO CHAVES REAIS BYBIT PARA LUIZA');
        
        try {
            const resultado = await this.adicionarChaveBybit(apiKey, secretKey, false);
            
            if (resultado) {
                console.log('✅ CHAVES BYBIT CONFIGURADAS COM SUCESSO!');
                console.log('🎯 Luiza está pronta para operações reais');
                
                // Verificar chaves após inserção
                await this.verificarChavesExistentes();
                
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Erro ao configurar chaves reais:', error.message);
            return false;
        }
    }

    async fecharConexao() {
        await this.pool.end();
        console.log('🔌 Conexão fechada');
    }
}

// Execução principal
async function main() {
    const gestor = new AdicionarChavesBybitLuiza();
    
    try {
        await gestor.executarConfiguracao();
        
        console.log('\n' + '='.repeat(60));
        console.log('💡 PARA ADICIONAR CHAVES REAIS:');
        console.log('const gestor = new AdicionarChavesBybitLuiza();');
        console.log('await gestor.configurarChavesReais("SUA_API_KEY", "SUA_SECRET_KEY");');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('❌ Erro na execução:', error.message);
    } finally {
        await gestor.fecharConexao();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = AdicionarChavesBybitLuiza;
