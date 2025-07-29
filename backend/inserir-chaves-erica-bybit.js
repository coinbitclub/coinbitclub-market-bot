/**
 * 🔑 INSERIR CHAVES BYBIT DA ÉRICA SANTOS
 * 
 * Script para inserir as chaves API da Bybit para a usuária Érica dos Santos
 * e configurar IP fixo para resolver problemas de autenticação
 */

const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

// Dados da Érica dos Santos (conforme imagem fornecida)
const ERICA_BYBIT_DATA = {
    api_key: 'dtbi5nXnYURm7uHnxA',
    secret_key: 'LsbaYXM2cWr2FrDy5ZQyKW9TieqLHfnC'
};

// IP atual do servidor Railway
const IP_SERVIDOR = '132.255.160.140';

/**
 * Buscar usuária Érica dos Santos
 */
async function buscarErica() {
    console.log('👤 === BUSCANDO USUÁRIA ÉRICA DOS SANTOS ===\n');
    
    try {
        const query = `
            SELECT 
                id,
                name,
                email,
                perfil,
                country_code,
                created_at,
                updated_at
            FROM users 
            WHERE email = 'erica.andrade.santos@hotmail.com'
            OR name ILIKE '%ERICA%SANTOS%'
            ORDER BY updated_at DESC;
        `;
        
        const result = await pool.query(query);
        
        if (result.rows.length === 0) {
            console.log('❌ Usuária Érica dos Santos não encontrada');
            return null;
        }
        
        const erica = result.rows[0];
        console.log('✅ Usuária encontrada:');
        console.log(`   ID: ${erica.id}`);
        console.log(`   Nome: ${erica.name}`);
        console.log(`   Email: ${erica.email}`);
        console.log(`   Perfil: ${erica.perfil}`);
        console.log(`   País: ${erica.country_code}`);
        console.log(`   Criada: ${new Date(erica.created_at).toLocaleString('pt-BR')}`);
        
        return erica;
        
    } catch (error) {
        console.error('❌ Erro ao buscar Érica:', error.message);
        return null;
    }
}

/**
 * Verificar se já existem chaves para a Érica
 */
async function verificarChavesExistentes(userId) {
    console.log('\n🔍 === VERIFICANDO CHAVES EXISTENTES ===\n');
    
    try {
        const query = `
            SELECT 
                id,
                exchange,
                environment,
                LEFT(api_key, 8) as api_key_preview,
                is_active,
                validation_status,
                created_at
            FROM user_api_keys
            WHERE user_id = $1;
        `;
        
        const result = await pool.query(query, [userId]);
        
        if (result.rows.length === 0) {
            console.log('📭 Nenhuma chave API encontrada para esta usuária');
            return [];
        }
        
        console.log(`🔑 ${result.rows.length} chave(s) encontrada(s):`);
        result.rows.forEach((key, index) => {
            console.log(`\n${index + 1}. Exchange: ${key.exchange}`);
            console.log(`   Ambiente: ${key.environment}`);
            console.log(`   API Key: ${key.api_key_preview}...`);
            console.log(`   Ativa: ${key.is_active ? 'Sim' : 'Não'}`);
            console.log(`   Status: ${key.validation_status || 'Não validada'}`);
            console.log(`   Criada: ${new Date(key.created_at).toLocaleString('pt-BR')}`);
        });
        
        return result.rows;
        
    } catch (error) {
        console.error('❌ Erro ao verificar chaves:', error.message);
        return [];
    }
}

/**
 * Inserir chaves Bybit da Érica
 */
async function inserirChavesBybit(userId) {
    console.log('\n🔑 === INSERINDO CHAVES BYBIT DA ÉRICA ===\n');
    
    try {
        // Verificar se já existe chave Bybit
        const checkQuery = `
            SELECT id FROM user_api_keys 
            WHERE user_id = $1 AND exchange = 'bybit';
        `;
        
        const existing = await pool.query(checkQuery, [userId]);
        
        if (existing.rows.length > 0) {
            console.log('⚠️ Já existe chave Bybit para esta usuária');
            console.log('🔄 Atualizando chave existente...');
            
            const updateQuery = `
                UPDATE user_api_keys 
                SET 
                    api_key = $1,
                    secret_key = $2,
                    environment = 'production',
                    is_active = true,
                    validation_status = 'pending',
                    updated_at = NOW()
                WHERE user_id = $3 AND exchange = 'bybit'
                RETURNING id, api_key;
            `;
            
            const updateResult = await pool.query(updateQuery, [
                ERICA_BYBIT_DATA.api_key,
                ERICA_BYBIT_DATA.secret_key,
                userId
            ]);
            
            console.log('✅ Chave Bybit atualizada com sucesso!');
            console.log(`   ID: ${updateResult.rows[0].id}`);
            console.log(`   API Key: ${updateResult.rows[0].api_key.substring(0, 8)}...`);
            
        } else {
            console.log('➕ Inserindo nova chave Bybit...');
            
            const insertQuery = `
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
                ) VALUES (
                    $1, 'bybit', 'production', $2, $3, true, 'pending', NOW(), NOW()
                ) RETURNING id, api_key;
            `;
            
            const insertResult = await pool.query(insertQuery, [
                userId,
                ERICA_BYBIT_DATA.api_key,
                ERICA_BYBIT_DATA.secret_key
            ]);
            
            console.log('✅ Chave Bybit inserida com sucesso!');
            console.log(`   ID: ${insertResult.rows[0].id}`);
            console.log(`   API Key: ${insertResult.rows[0].api_key.substring(0, 8)}...`);
        }
        
        console.log('\n📋 INSTRUÇÕES PARA CONFIGURAR IP NA BYBIT:');
        console.log('1. Acesse https://www.bybit.com');
        console.log('2. Vá em Account & Security > API Management');
        console.log(`3. Edite a API key: ${ERICA_BYBIT_DATA.api_key}`);
        console.log('4. Configure IP Restriction: Restrict access to trusted IPs only');
        console.log(`5. Adicione o IP: ${IP_SERVIDOR}`);
        console.log('6. Salve as alterações');
        console.log('7. Aguarde 2-5 minutos para propagação');
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao inserir chaves:', error.message);
        return false;
    }
}

/**
 * Testar conectividade após inserção
 */
async function testarConectividade(userId) {
    console.log('\n🧪 === TESTE DE CONECTIVIDADE BYBIT ===\n');
    
    const axios = require('axios');
    const crypto = require('crypto');
    
    try {
        // Buscar chave inserida
        const query = `
            SELECT api_key, secret_key
            FROM user_api_keys
            WHERE user_id = $1 AND exchange = 'bybit' AND is_active = true;
        `;
        
        const result = await pool.query(query, [userId]);
        
        if (result.rows.length === 0) {
            console.log('❌ Nenhuma chave Bybit ativa encontrada');
            return false;
        }
        
        const { api_key, secret_key } = result.rows[0];
        
        console.log(`🔑 Testando chave: ${api_key.substring(0, 8)}...`);
        console.log(`📍 IP do servidor: ${IP_SERVIDOR}`);
        console.log('🔄 Fazendo requisição para Bybit...');
        
        // Teste de autenticação
        const timestamp = Date.now().toString();
        const queryString = `timestamp=${timestamp}`;
        const signature = crypto
            .createHmac('sha256', secret_key)
            .update(timestamp + api_key + '5000' + queryString)
            .digest('hex');
        
        const response = await axios.get('https://api.bybit.com/v5/account/wallet-balance', {
            headers: {
                'X-BAPI-API-KEY': api_key,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': '5000'
            },
            params: {
                accountType: 'UNIFIED'
            },
            timeout: 15000
        });
        
        if (response.data.retCode === 0) {
            console.log('✅ SUCESSO! Conectividade estabelecida!');
            console.log('🎉 Chaves funcionando corretamente');
            
            // Atualizar status da validação
            await pool.query(`
                UPDATE user_api_keys 
                SET 
                    validation_status = 'validated',
                    last_validated = NOW()
                WHERE user_id = $1 AND exchange = 'bybit';
            `, [userId]);
            
            return true;
        } else {
            console.log('❌ Erro na resposta:', response.data.retMsg);
            return false;
        }
        
    } catch (error) {
        if (error.response?.data) {
            const errorData = error.response.data;
            console.log('❌ Erro da API Bybit:');
            console.log(`   Código: ${errorData.retCode}`);
            console.log(`   Mensagem: ${errorData.retMsg}`);
            
            if (errorData.retCode === 10003) {
                console.log('\n🚨 ERRO DE IP - CONFIGURE NA BYBIT:');
                console.log(`📍 IP necessário: ${IP_SERVIDOR}`);
                console.log('📋 Siga as instruções acima para configurar');
            }
        } else {
            console.log('❌ Erro de conexão:', error.message);
        }
        return false;
    }
}

/**
 * Função principal
 */
async function main() {
    console.log('🚀 CONFIGURAÇÃO DE CHAVES BYBIT - ÉRICA DOS SANTOS\n');
    console.log('=' .repeat(60));
    
    try {
        // 1. Buscar usuária Érica
        const erica = await buscarErica();
        if (!erica) {
            console.log('❌ Não foi possível encontrar a usuária');
            return;
        }
        
        // 2. Verificar chaves existentes
        const chavesExistentes = await verificarChavesExistentes(erica.id);
        
        // 3. Inserir/atualizar chaves Bybit
        const sucesso = await inserirChavesBybit(erica.id);
        if (!sucesso) {
            console.log('❌ Falha ao inserir chaves');
            return;
        }
        
        // 4. Testar conectividade
        console.log('\n⏳ Aguardando alguns segundos antes do teste...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const conectividade = await testarConectividade(erica.id);
        
        console.log('\n' + '=' .repeat(60));
        console.log('📊 RESUMO FINAL:');
        console.log(`👤 Usuária: ${erica.name}`);
        console.log(`✉️ Email: ${erica.email}`);
        console.log(`🔑 Chave Bybit: ${ERICA_BYBIT_DATA.api_key.substring(0, 8)}...`);
        console.log(`📍 IP Railway: ${IP_SERVIDOR}`);
        console.log(`🔗 Conectividade: ${conectividade ? 'OK' : 'Pendente configuração IP'}`);
        
        if (!conectividade) {
            console.log('\n⚠️ PRÓXIMOS PASSOS:');
            console.log('1. Configure o IP na Bybit conforme instruções');
            console.log('2. Execute: node teste-conectividade-real-bybit.js');
            console.log('3. Verifique se o erro foi resolvido');
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { buscarErica, inserirChavesBybit, testarConectividade };
