/**
 * 🔧 DIAGNÓSTICO DETALHADO DA CHAVE API BYBIT
 * ==========================================
 * 
 * Verificando problemas com a chave API da Érica
 */

const { Pool } = require('pg');
const crypto = require('crypto');
const axios = require('axios');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function diagnosticoChaveAPI() {
    console.log('🔧 DIAGNÓSTICO DETALHADO DA CHAVE API BYBIT');
    console.log('==========================================');
    
    const client = await pool.connect();
    
    try {
        console.log('\n🔍 1. VERIFICANDO DADOS NO BANCO');
        console.log('─────────────────────────────────────');
        
        // Buscar todas as informações da Érica
        const resultado = await client.query(`
            SELECT u.id, u.email, u.full_name,
                   k.id as key_id, k.api_key, k.secret_key, k.exchange, 
                   k.environment, k.is_active, k.validation_status,
                   k.permissions, k.created_at, k.updated_at
            FROM users u
            JOIN user_api_keys k ON u.id = k.user_id
            WHERE u.email = 'erica.andrade.santos@hotmail.com'
        `);
        
        if (resultado.rows.length === 0) {
            console.log('❌ Nenhuma chave encontrada para Érica');
            return;
        }
        
        const usuario = resultado.rows[0];
        console.log('📊 DADOS DA CHAVE:');
        console.log(`👤 Usuária: ${usuario.full_name}`);
        console.log(`🏪 Exchange: ${usuario.exchange}`);
        console.log(`🌍 Ambiente: ${usuario.environment}`);
        console.log(`✅ Ativa: ${usuario.is_active}`);
        console.log(`📊 Status: ${usuario.validation_status}`);
        console.log(`📅 Criada: ${usuario.created_at}`);
        console.log(`🔄 Atualizada: ${usuario.updated_at}`);
        console.log(`🔐 API Key: ${usuario.api_key}`);
        console.log(`🔐 Secret: ${usuario.secret_key}`);
        console.log(`🎯 Permissões: ${usuario.permissions}`);
        
        console.log('\n🔍 2. ANÁLISE DA CHAVE API');
        console.log('──────────────────────────────');
        
        const apiKey = usuario.api_key.trim();
        const secretKey = usuario.secret_key.trim();
        
        console.log(`📏 Tamanho API Key: ${apiKey.length} caracteres`);
        console.log(`📏 Tamanho Secret: ${secretKey.length} caracteres`);
        console.log(`🔤 API Key válida: ${/^[A-Za-z0-9]+$/.test(apiKey)}`);
        console.log(`🔤 Secret válida: ${/^[A-Za-z0-9]+$/.test(secretKey)}`);
        
        // Verificar se a chave corresponde aos dados da imagem
        console.log('\n📋 3. COMPARAÇÃO COM DADOS DA IMAGEM');
        console.log('───────────────────────────────────────');
        
        const dadosImagem = {
            nome: 'COINBITCLU_ERICA',
            api_key: 'dtbi5nXnYURm7uHnxA',
            secret_key: 'LsbaYXM2cWr2FrDy5ZQyKW9TieqLHfnC'
        };
        
        console.log(`✅ API Key confere: ${apiKey === dadosImagem.api_key}`);
        console.log(`✅ Secret confere: ${secretKey === dadosImagem.secret_key}`);
        
        if (apiKey !== dadosImagem.api_key || secretKey !== dadosImagem.secret_key) {
            console.log('\n🔄 ATUALIZANDO COM DADOS CORRETOS DA IMAGEM');
            console.log('──────────────────────────────────────────────');
            
            await client.query(`
                UPDATE user_api_keys 
                SET api_key = $1,
                    secret_key = $2,
                    validation_status = 'updated_from_image',
                    updated_at = NOW()
                WHERE id = $3
            `, [dadosImagem.api_key, dadosImagem.secret_key, usuario.key_id]);
            
            console.log('✅ Chaves atualizadas com dados da imagem');
        }
        
        console.log('\n🧪 4. TESTE DE CONECTIVIDADE SIMPLES');
        console.log('───────────────────────────────────────');
        
        // Testar conectividade básica
        try {
            const response = await axios.get('https://api.bybit.com/v5/market/time', { timeout: 5000 });
            console.log('✅ Servidor Bybit: ACESSÍVEL');
            console.log(`⏰ Server Time: ${new Date(parseInt(response.data.result.timeSecond) * 1000).toLocaleString('pt-BR')}`);
        } catch (error) {
            console.log('❌ Servidor Bybit: INACESSÍVEL -', error.message);
            return;
        }
        
        console.log('\n🔐 5. TESTE DE AUTENTICAÇÃO STEP-BY-STEP');
        console.log('──────────────────────────────────────────');
        
        // Usar as chaves corretas da imagem
        const finalApiKey = dadosImagem.api_key;
        const finalSecret = dadosImagem.secret_key;
        
        console.log(`🔑 Usando API Key: ${finalApiKey}`);
        console.log(`🔑 Usando Secret: ${finalSecret.substring(0, 10)}...`);
        
        // Gerar assinatura para teste
        const timestamp = Date.now().toString();
        console.log(`⏰ Timestamp: ${timestamp}`);
        
        // Método de assinatura Bybit V5
        const rawSignature = timestamp + finalApiKey + '5000';  // recv_window
        const signature = crypto.createHmac('sha256', finalSecret).update(rawSignature).digest('hex');
        
        console.log(`🔏 Raw signature string: ${rawSignature}`);
        console.log(`🔐 Signature: ${signature}`);
        
        const headers = {
            'X-BAPI-API-KEY': finalApiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': '5000',
            'Content-Type': 'application/json'
        };
        
        console.log('\n📡 Headers enviados:');
        Object.entries(headers).forEach(([key, value]) => {
            console.log(`  ${key}: ${key.includes('SIGN') && key !== 'X-BAPI-SIGN-TYPE' ? value.substring(0, 20) + '...' : value}`);
        });
        
        try {
            console.log('\n🔄 Testando endpoint /v5/account/info...');
            const authResponse = await axios.get('https://api.bybit.com/v5/account/info', {
                headers: headers,
                timeout: 10000
            });
            
            console.log(`📊 Status Code: ${authResponse.status}`);
            console.log(`📋 Response:`, JSON.stringify(authResponse.data, null, 2));
            
            if (authResponse.data.retCode === 0) {
                console.log('🎉 AUTENTICAÇÃO SUCESSO!');
                
                // Marcar chave como validada
                await client.query(`
                    UPDATE user_api_keys 
                    SET validation_status = 'validated_successfully',
                        last_validated_at = NOW()
                    WHERE id = $1
                `, [usuario.key_id]);
                
                console.log('✅ Status da chave atualizado no banco');
                
            } else {
                console.log('❌ Erro na resposta:', authResponse.data.retMsg);
            }
            
        } catch (authError) {
            console.log('❌ Erro na autenticação:', authError.message);
            
            if (authError.response) {
                console.log('📊 Status Code:', authError.response.status);
                console.log('📋 Response Data:', JSON.stringify(authError.response.data, null, 2));
                
                // Marcar erro no banco
                await client.query(`
                    UPDATE user_api_keys 
                    SET validation_status = 'validation_failed',
                        error_message = $1,
                        updated_at = NOW()
                    WHERE id = $2
                `, [authError.message, usuario.key_id]);
            }
        }
        
        console.log('\n📋 6. INFORMAÇÕES PARA DEPURAÇÃO');
        console.log('─────────────────────────────────────');
        console.log('🔍 Possíveis causas do erro:');
        console.log('1. ⏰ Chave API pode ter expirado');
        console.log('2. 🚫 Permissões insuficientes');
        console.log('3. 🌍 Restrições de IP');
        console.log('4. 📊 Formato incorreto da assinatura');
        console.log('5. 🔄 Chave precisa ser ativada no Bybit');
        
        console.log('\n💡 Recomendações:');
        console.log('1. 🔄 Verificar se a chave está ativa no painel Bybit');
        console.log('2. 🌍 Confirmar se não há restrições de IP');
        console.log('3. 🎯 Validar permissões da chave API');
        console.log('4. ⏰ Verificar se a chave não expirou');
        
    } catch (error) {
        console.log('❌ Erro no diagnóstico:', error.message);
        console.log('📋 Stack:', error.stack);
    } finally {
        client.release();
    }
}

// Executar diagnóstico
diagnosticoChaveAPI().catch(console.error);
