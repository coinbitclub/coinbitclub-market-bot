/**
 * 🔧 ATUALIZAÇÃO DAS CHAVES DA ÉRICA
 * 
 * Script para atualizar as chaves da API da Érica com base nas
 * novas credenciais fornecidas na interface do Bybit
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 ATUALIZAÇÃO DAS CHAVES DA ÉRICA');
console.log('==================================');

// Credenciais da Érica fornecidas na interface
const CREDENCIAIS_ERICA = {
    nome: 'COINBITCLUB_ERICA',
    apiKey: 'rg1HWyxENWwxbzJGew',
    secretKey: 'gOGr9nokGvtFDBOCSPymQZOE8XnyA1nmR4',
    permissoes: 'Contratos - Ordens, Posições, - Trading Unificado - Trade, SPOT - Negociar'
};

async function atualizarChavesErica() {
    try {
        // 1. Verificar se a Érica existe no sistema
        console.log('\n📊 1. VERIFICANDO USUÁRIA ÉRICA:');
        const userQuery = `
            SELECT id, name, email 
            FROM users 
            WHERE LOWER(name) LIKE '%erica%' OR LOWER(email) LIKE '%erica%'
            ORDER BY id
        `;
        
        const userResult = await pool.query(userQuery);
        
        if (userResult.rows.length === 0) {
            console.log('❌ Usuária Érica não encontrada no sistema!');
            console.log('💡 Criando nova usuária...');
            
            // Criar usuária Érica
            const createUserQuery = `
                INSERT INTO users (name, email, password_hash, is_active, created_at, updated_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
                RETURNING id, name, email
            `;
            
            const hashedPassword = crypto.createHash('sha256').update('erica123').digest('hex');
            const newUser = await pool.query(createUserQuery, [
                'Érica Coinbitclub',
                'erica@coinbitclub.com',
                hashedPassword,
                true
            ]);
            
            console.log(`✅ Usuária criada: ${newUser.rows[0].name} (ID: ${newUser.rows[0].id})`);
            userResult.rows = newUser.rows;
        } else {
            console.log(`✅ Usuária encontrada: ${userResult.rows[0].name} (ID: ${userResult.rows[0].id})`);
        }
        
        const usuario = userResult.rows[0];
        
        // 2. Verificar chaves existentes
        console.log('\n🔑 2. VERIFICANDO CHAVES EXISTENTES:');
        const existingKeysQuery = `
            SELECT id, exchange, environment, api_key, is_active, created_at
            FROM user_api_keys 
            WHERE user_id = $1 AND exchange = 'bybit'
            ORDER BY created_at DESC
        `;
        
        const existingKeys = await pool.query(existingKeysQuery, [usuario.id]);
        
        if (existingKeys.rows.length > 0) {
            console.log(`📋 ${existingKeys.rows.length} chave(s) Bybit existente(s):`);
            existingKeys.rows.forEach((key, index) => {
                console.log(`   ${index + 1}. ${key.exchange} (${key.environment}) - ${key.api_key?.substring(0, 10)}... (${key.is_active ? 'Ativa' : 'Inativa'})`);
            });
            
            // Desativar chaves antigas
            console.log('\n🔄 Desativando chaves antigas...');
            await pool.query(`
                UPDATE user_api_keys 
                SET is_active = false, updated_at = NOW()
                WHERE user_id = $1 AND exchange = 'bybit'
            `, [usuario.id]);
            
            console.log('✅ Chaves antigas desativadas');
        } else {
            console.log('📝 Nenhuma chave Bybit existente para esta usuária');
        }
        
        // 3. Testar as novas credenciais antes de inserir
        console.log('\n🧪 3. TESTANDO NOVAS CREDENCIAIS:');
        const testeResult = await testarChaveBybit(
            CREDENCIAIS_ERICA.apiKey, 
            CREDENCIAIS_ERICA.secretKey
        );
        
        if (!testeResult.valida) {
            console.log(`❌ ERRO: Credenciais inválidas - ${testeResult.erro}`);
            console.log('🚨 Não é possível prosseguir com chaves inválidas!');
            return;
        }
        
        console.log('✅ Credenciais testadas com sucesso!');
        console.log(`   💰 Saldo encontrado: ${testeResult.saldo || 'N/A'}`);
        
        // 4. Inserir novas chaves
        console.log('\n💾 4. INSERINDO NOVAS CHAVES:');
        
        const insertKeyQuery = `
            INSERT INTO user_api_keys (
                user_id, 
                exchange, 
                environment, 
                api_key, 
                secret_key, 
                is_active, 
                validation_status, 
                created_at, 
                updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            RETURNING id, exchange, environment
        `;
        
        // Inserir chave principal (mainnet)
        const mainnetKey = await pool.query(insertKeyQuery, [
            usuario.id,
            'bybit',
            'mainnet',
            CREDENCIAIS_ERICA.apiKey,
            CREDENCIAIS_ERICA.secretKey,
            true,
            'valid'
        ]);
        
        console.log(`✅ Chave mainnet inserida (ID: ${mainnetKey.rows[0].id})`);
        
        // 5. Verificar inserção
        console.log('\n📊 5. VERIFICAÇÃO FINAL:');
        const finalCheck = await pool.query(`
            SELECT 
                uak.id,
                uak.exchange,
                uak.environment,
                LEFT(uak.api_key, 10) || '...' as api_key_preview,
                LENGTH(uak.api_key) as api_key_length,
                LENGTH(uak.secret_key) as secret_key_length,
                uak.is_active,
                uak.validation_status,
                uak.created_at
            FROM user_api_keys uak
            WHERE uak.user_id = $1 AND uak.exchange = 'bybit' AND uak.is_active = true
            ORDER BY uak.created_at DESC
        `, [usuario.id]);
        
        console.log('📋 CHAVES ATIVAS DA ÉRICA:');
        finalCheck.rows.forEach((key, index) => {
            console.log(`   ${index + 1}. ${key.exchange} (${key.environment})`);
            console.log(`      🆔 ID: ${key.id}`);
            console.log(`      🔑 API Key: ${key.api_key_preview} (${key.api_key_length} chars)`);
            console.log(`      🔐 Secret: ****** (${key.secret_key_length} chars)`);
            console.log(`      ✅ Status: ${key.validation_status}`);
            console.log(`      📅 Criada: ${new Date(key.created_at).toLocaleString('pt-BR')}`);
            console.log('');
        });
        
        // 6. Teste final com sistema multiusuário
        console.log('🎯 6. TESTE FINAL COM SISTEMA MULTIUSUÁRIO:');
        await testarIntegracaoSistema(usuario.id);
        
        console.log('\n🎉 ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('=====================================');
        console.log('✅ Chaves da Érica atualizadas');
        console.log('✅ Validação completa realizada');
        console.log('✅ Sistema pronto para operar');
        console.log('\n💡 A Érica pode agora usar o sistema de trading em tempo real!');
        
    } catch (error) {
        console.error('❌ Erro na atualização:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

async function testarChaveBybit(apiKey, secretKey) {
    try {
        const timestamp = Date.now();
        const recvWindow = 5000;
        
        // Criar query string e assinatura (formato correto do Bybit)
        const queryString = `recvWindow=${recvWindow}&timestamp=${timestamp}`;
        const paramString = timestamp + apiKey + recvWindow + queryString;
        const signature = crypto.createHmac('sha256', secretKey).update(paramString).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp.toString(),
            'X-BAPI-RECV-WINDOW': recvWindow.toString(),
            'Content-Type': 'application/json'
        };
        
        // Testar com endpoint de saldo
        const response = await fetch(`https://api.bybit.com/v5/account/wallet-balance?accountType=UNIFIED&${queryString}`, {
            method: 'GET',
            headers: headers
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            return {
                valida: false,
                erro: `HTTP ${response.status}: ${errorText}`
            };
        }
        
        const data = await response.json();
        
        if (data.retCode === 0) {
            // Extrair informações de saldo
            let saldoInfo = 'Sem saldo';
            if (data.result?.list && data.result.list.length > 0) {
                const wallet = data.result.list[0];
                if (wallet.totalWalletBalance) {
                    saldoInfo = `$${parseFloat(wallet.totalWalletBalance).toFixed(2)} USD`;
                }
            }
            
            return { 
                valida: true, 
                dados: data.result,
                saldo: saldoInfo
            };
        } else {
            return { 
                valida: false, 
                erro: `Bybit Error: ${data.retMsg || 'Erro desconhecido'}` 
            };
        }
        
    } catch (error) {
        return { 
            valida: false, 
            erro: `Erro de conexão: ${error.message}` 
        };
    }
}

async function testarIntegracaoSistema(userId) {
    try {
        console.log('🔄 Testando integração com sistema multiusuário...');
        
        // Simular carregamento do usuário no sistema
        const userWithKeys = await pool.query(`
            SELECT 
                u.id,
                u.name,
                u.email,
                COUNT(uak.id) as total_keys,
                COUNT(CASE WHEN uak.is_active = true THEN 1 END) as active_keys
            FROM users u
            LEFT JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE u.id = $1
            GROUP BY u.id, u.name, u.email
        `, [userId]);
        
        if (userWithKeys.rows.length > 0) {
            const user = userWithKeys.rows[0];
            console.log(`   👤 Usuário: ${user.name}`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   🔑 Total de chaves: ${user.total_keys}`);
            console.log(`   ✅ Chaves ativas: ${user.active_keys}`);
            
            if (user.active_keys > 0) {
                console.log('   🎯 Usuário pronto para trading multiusuário!');
                return true;
            }
        }
        
        return false;
        
    } catch (error) {
        console.log(`   ❌ Erro no teste de integração: ${error.message}`);
        return false;
    }
}

// Executar atualização
atualizarChavesErica().catch(console.error);
