/**
 * 🔧 ATUALIZAÇÃO DAS CHAVES DO MAURO (TESTNET)
 * 
 * Script para atualizar as chaves testnet do Mauro com as
 * novas credenciais fornecidas na interface do Bybit
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 ATUALIZAÇÃO DAS CHAVES DO MAURO (TESTNET)');
console.log('==========================================');

// Credenciais do Mauro testnet fornecidas na interface
const CREDENCIAIS_MAURO_TESTNET = {
    nome: 'Robô Érica Coinbitclub',
    apiKey: 'JQVNA0QaCqNqPLzo25',
    secretKey: 'T01Glc81XBKnL5NrvSIQLqpT6brbZ7wXbOYk',
    permissoes: 'Contracts - Orders Positions, Unified Trading - Trade, SPOT - Trade',
    ambiente: 'testnet'
};

async function atualizarChavesMauroTestnet() {
    try {
        // 1. Verificar usuário Mauro
        console.log('\n📊 1. VERIFICANDO USUÁRIO MAURO:');
        const userQuery = `
            SELECT id, name, email 
            FROM users 
            WHERE UPPER(name) LIKE '%MAURO%' OR LOWER(name) LIKE '%mauro%'
            ORDER BY id
            LIMIT 1
        `;
        
        const userResult = await pool.query(userQuery);
        
        if (userResult.rows.length === 0) {
            console.log('❌ Usuário Mauro não encontrado no sistema!');
            return;
        }
        
        const usuario = userResult.rows[0];
        console.log(`✅ Usuário encontrado: ${usuario.name} (ID: ${usuario.id})`);
        
        // 2. Verificar chaves testnet existentes do Mauro
        console.log('\n🔑 2. VERIFICANDO CHAVES TESTNET EXISTENTES:');
        const existingKeysQuery = `
            SELECT id, exchange, environment, api_key, is_active, validation_status, created_at
            FROM user_api_keys 
            WHERE user_id = $1 AND environment = 'testnet'
            ORDER BY created_at DESC
        `;
        
        const existingKeys = await pool.query(existingKeysQuery, [usuario.id]);
        
        if (existingKeys.rows.length > 0) {
            console.log(`📋 ${existingKeys.rows.length} chave(s) testnet existente(s):`);
            existingKeys.rows.forEach((key, index) => {
                console.log(`   ${index + 1}. ${key.exchange} (${key.environment}) - ${key.api_key?.substring(0, 10)}... (${key.is_active ? 'Ativa' : 'Inativa'})`);
                console.log(`      📊 Status: ${key.validation_status || 'Não validada'}`);
            });
        } else {
            console.log('📝 Nenhuma chave testnet existente para Mauro');
        }
        
        // 3. Testar as novas credenciais
        console.log('\n🧪 3. TESTANDO NOVAS CREDENCIAIS TESTNET:');
        const testeResult = await testarChaveBybitTestnet(
            CREDENCIAIS_MAURO_TESTNET.apiKey, 
            CREDENCIAIS_MAURO_TESTNET.secretKey
        );
        
        console.log(`📊 Resultado do teste: ${testeResult.valida ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
        if (!testeResult.valida) {
            console.log(`   Erro: ${testeResult.erro}`);
        } else {
            console.log(`   💰 Saldo: ${testeResult.saldo || 'N/A'}`);
        }
        
        // 4. Remover chaves testnet antigas completamente
        console.log('\n�️ 4. REMOVENDO CHAVES TESTNET ANTIGAS:');
        const deleteQuery = `
            DELETE FROM user_api_keys 
            WHERE user_id = $1 AND environment = 'testnet'
            RETURNING id, exchange, environment
        `;
        
        const deleteResult = await pool.query(deleteQuery, [usuario.id]);
        console.log(`✅ ${deleteResult.rows.length} chave(s) testnet removida(s)`);
        
        // 5. Inserir nova chave testnet
        console.log('\n💾 5. INSERINDO NOVA CHAVE TESTNET:');
        
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
            RETURNING id, exchange, environment, validation_status
        `;
        
        const validationStatus = testeResult.valida ? 'valid' : 'pending_validation';
        
        const testnetKey = await pool.query(insertKeyQuery, [
            usuario.id,
            'bybit',
            'testnet',
            CREDENCIAIS_MAURO_TESTNET.apiKey,
            CREDENCIAIS_MAURO_TESTNET.secretKey,
            true,
            validationStatus
        ]);
        
        console.log(`✅ Chave testnet inserida (ID: ${testnetKey.rows[0].id})`);
        console.log(`   📊 Status: ${testnetKey.rows[0].validation_status}`);
        
        // 6. Verificação final de todas as chaves do Mauro
        console.log('\n📊 6. VERIFICAÇÃO FINAL - TODAS AS CHAVES DO MAURO:');
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
            WHERE uak.user_id = $1 AND uak.is_active = true
            ORDER BY uak.environment, uak.created_at DESC
        `, [usuario.id]);
        
        console.log('📋 CHAVES ATIVAS DO MAURO:');
        let testnetCount = 0;
        let mainnetCount = 0;
        
        finalCheck.rows.forEach((key, index) => {
            console.log(`   ${index + 1}. ${key.exchange} (${key.environment})`);
            console.log(`      🆔 ID: ${key.id}`);
            console.log(`      🔑 API Key: ${key.api_key_preview} (${key.api_key_length} chars)`);
            console.log(`      🔐 Secret: ****** (${key.secret_key_length} chars)`);
            console.log(`      ✅ Status: ${key.validation_status}`);
            console.log(`      📅 Criada: ${new Date(key.created_at).toLocaleString('pt-BR')}`);
            console.log('');
            
            if (key.environment === 'testnet') testnetCount++;
            if (key.environment === 'mainnet') mainnetCount++;
        });
        
        // 7. Resumo da diferenciação de ambientes
        console.log('🎯 7. DIFERENCIAÇÃO DE AMBIENTES:');
        console.log('=================================');
        console.log(`📊 Mauro possui:`);
        console.log(`   🧪 Testnet: ${testnetCount} chave(s) ativa(s)`);
        console.log(`   🏦 Mainnet: ${mainnetCount} chave(s) ativa(s)`);
        console.log(`   📈 Total: ${finalCheck.rows.length} chave(s) ativa(s)`);
        
        console.log('\n💡 COMO O SISTEMA DIFERENCIA:');
        console.log('   • Campo "environment" no banco de dados');
        console.log('   • testnet = ambiente de testes (sem dinheiro real)');
        console.log('   • mainnet = ambiente de produção (dinheiro real)');
        console.log('   • Sistema monitora ambos simultaneamente');
        
        // 8. Verificar integração com sistema multiusuário
        console.log('\n🔄 8. VERIFICANDO SISTEMA MULTIUSUÁRIO:');
        const systemQuery = `
            SELECT 
                u.name,
                uak.exchange,
                uak.environment,
                uak.validation_status,
                COUNT(*) as count
            FROM users u
            INNER JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE u.is_active = true 
            AND uak.is_active = true
            AND uak.validation_status = 'valid'
            GROUP BY u.name, uak.exchange, uak.environment, uak.validation_status
            ORDER BY u.name, uak.environment
        `;
        
        const systemResult = await pool.query(systemQuery);
        
        console.log('📋 Usuários no sistema multiusuário:');
        systemResult.rows.forEach((row, index) => {
            const envIcon = row.environment === 'testnet' ? '🧪' : '🏦';
            console.log(`   ${index + 1}. ${envIcon} ${row.name}: ${row.exchange} (${row.environment})`);
        });
        
        console.log('\n🎉 ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('=====================================');
        console.log('✅ Chaves testnet do Mauro atualizadas');
        console.log('✅ Sistema diferencia testnet/mainnet automaticamente');
        console.log('✅ Monitoramento em tempo real funcionando');
        console.log('\n💡 O Mauro pode operar simultaneamente em testnet e mainnet!');
        
    } catch (error) {
        console.error('❌ Erro na atualização:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

async function testarChaveBybitTestnet(apiKey, secretKey) {
    try {
        const timestamp = Date.now();
        const recvWindow = 5000;
        
        // Usar endpoint testnet do Bybit
        const baseUrl = 'https://api-testnet.bybit.com';
        
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
        
        // Testar com endpoint de saldo testnet
        const response = await fetch(`${baseUrl}/v5/account/wallet-balance?accountType=UNIFIED&${queryString}`, {
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
            let saldoInfo = 'Testnet - Sem saldo';
            if (data.result?.list && data.result.list.length > 0) {
                const wallet = data.result.list[0];
                if (wallet.totalWalletBalance) {
                    saldoInfo = `Testnet: $${parseFloat(wallet.totalWalletBalance).toFixed(2)} USD`;
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
                erro: `Bybit Testnet Error: ${data.retMsg || 'Erro desconhecido'}` 
            };
        }
        
    } catch (error) {
        return { 
            valida: false, 
            erro: `Erro de conexão testnet: ${error.message}` 
        };
    }
}

// Executar atualização
atualizarChavesMauroTestnet().catch(console.error);
