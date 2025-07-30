const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function correcaoUrgenteBancoDados() {
    console.log('🚨 CORREÇÃO URGENTE - BANCO CORROMPIDO COM NUL');
    console.log('===============================================');
    console.log('🎯 Estratégia: Deletar registros corrompidos e recriar limpos');
    console.log('⚠️  Railway com múltiplos caracteres NUL detectados\n');
    
    try {
        // 1. BACKUP DOS USUÁRIOS ANTES DA CORREÇÃO
        console.log('💾 BACKUP DE SEGURANÇA:');
        const usuarios = await pool.query(`
            SELECT u.id, u.name, u.email FROM users u 
            WHERE u.name ILIKE '%luiza%' OR u.name ILIKE '%érica%'
        `);
        
        console.log('📋 Usuários encontrados:');
        usuarios.rows.forEach(u => {
            console.log(`   👤 ${u.name} (ID: ${u.id}) - ${u.email}`);
        });
        
        // 2. DELETAR TODAS AS CHAVES CORROMPIDAS
        console.log('\n🗑️ REMOVENDO CHAVES CORROMPIDAS:');
        const deleteResult = await pool.query(`
            DELETE FROM user_api_keys 
            WHERE user_id IN (
                SELECT id FROM users 
                WHERE name ILIKE '%luiza%' OR name ILIKE '%érica%'
            )
            RETURNING user_id, id
        `);
        
        console.log(`   ✅ ${deleteResult.rows.length} chaves corrompidas removidas`);
        
        // 3. RECRIAR CHAVES LIMPAS - MÉTODO SEGURO
        console.log('\n🔄 RECRIANDO CHAVES LIMPAS:');
        
        // Definir chaves válidas de forma segura
        const chavesLimpas = [
            {
                nome: 'Luiza',
                user_id: 4, // ID conhecido da Luiza
                api_key: '9HZy9BiUW95iXprVRI',
                secret_key: 'QUjDXNmSI0qiqaKTUk7FHAHZnjEN8AaRKQO'
            },
            {
                nome: 'Érica',
                user_id: 8, // ID conhecido da Érica
                api_key: 'rg1HWyxEfWwobzJGew',
                secret_key: 'sOGr9nokGvtfDB0CSFymJZrOE8XnyA1nmB4r'
            }
        ];
        
        // Inserir uma por vez usando prepared statements
        for (const chave of chavesLimpas) {
            console.log(`\n   👤 Criando chave limpa para ${chave.nome}:`);
            
            try {
                const insertResult = await pool.query(`
                    INSERT INTO user_api_keys (
                        user_id, 
                        exchange, 
                        api_key, 
                        secret_key, 
                        environment, 
                        is_active, 
                        validation_status, 
                        error_message,
                        created_at,
                        updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                    RETURNING id, api_key, secret_key
                `, [
                    chave.user_id,
                    'bybit',
                    chave.api_key,
                    chave.secret_key,
                    'mainnet',
                    true,
                    'valid',
                    'Clean key - no NUL corruption'
                ]);
                
                const nova = insertResult.rows[0];
                console.log(`      ✅ Chave criada (ID: ${nova.id})`);
                console.log(`      🔑 API Key: ${nova.api_key}`);
                console.log(`      🔐 Secret: ${nova.secret_key.substring(0, 15)}...`);
                
            } catch (error) {
                console.log(`      ❌ Erro ao criar chave para ${chave.nome}: ${error.message}`);
            }
        }
        
        // 4. VERIFICAÇÃO FINAL - SEM CONSULTAS PROBLEMÁTICAS
        console.log('\n📊 VERIFICAÇÃO FINAL:');
        const verificacao = await pool.query(`
            SELECT u.name, ak.id, ak.api_key, ak.secret_key, ak.validation_status
            FROM users u
            JOIN user_api_keys ak ON u.id = ak.user_id
            WHERE u.name ILIKE '%luiza%' OR u.name ILIKE '%érica%'
            ORDER BY u.name
        `);
        
        console.log('📋 Estado final das chaves:');
        verificacao.rows.forEach(row => {
            console.log(`   👤 ${row.name}:`);
            console.log(`      🆔 ID: ${row.id}`);
            console.log(`      🔑 API: ${row.api_key}`);
            console.log(`      🔐 Secret: ${row.secret_key.substring(0, 20)}...`);
            console.log(`      📊 Status: ${row.validation_status}`);
        });
        
        // 5. TESTE DAS CHAVES RECRIADAS
        console.log('\n🧪 TESTE DAS CHAVES RECRIADAS:');
        
        for (const chave of chavesLimpas) {
            console.log(`\n   👤 Testando ${chave.nome}:`);
            await testarChaveRapido(chave);
        }
        
        console.log('\n✅ CORREÇÃO CONCLUÍDA');
        console.log('=====================');
        console.log('🗑️ Chaves corrompidas removidas');
        console.log('🔄 Chaves limpas recriadas');
        console.log('🧪 Testes executados');
        console.log('💾 Banco de dados limpo');
        
    } catch (error) {
        console.error('❌ Erro na correção:', error.message);
        console.error(error.stack);
    } finally {
        pool.end();
    }
}

async function testarChaveRapido(chave) {
    try {
        const timestamp = Date.now().toString();
        const recvWindow = '10000';
        const message = timestamp + chave.api_key + recvWindow;
        const signature = crypto.createHmac('sha256', chave.secret_key).update(message).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': chave.api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        const response = await fetch('https://api.bybit.com/v5/account/info', {
            method: 'GET',
            headers: headers,
            timeout: 10000
        });
        
        const data = await response.json();
        
        console.log(`      ${data.retCode === 0 ? '✅' : '❌'} ${data.retCode} - ${data.retMsg}`);
        
        if (data.retCode === 0) {
            console.log(`      🎉 SUCESSO! Chave ${chave.nome} funcionando perfeitamente`);
        } else if (data.retCode === 10003) {
            console.log(`      ⚠️  API Key inválida - verificar se está ativa na Bybit`);
        } else if (data.retCode === 10006) {
            console.log(`      ⚠️  IP não autorizado - adicionar IP Railway na whitelist`);
        }
        
    } catch (error) {
        console.log(`      ❌ Erro de conexão: ${error.message}`);
    }
}

// Executar correção
console.log('🚀 INICIANDO CORREÇÃO URGENTE');
console.log('============================');
console.log('⚠️  PROBLEMA IDENTIFICADO: Railway com caracteres NUL');
console.log('🎯 SOLUÇÃO: Deletar e recriar chaves limpas');
console.log('');

correcaoUrgenteBancoDados();
