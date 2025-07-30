/**
 * 🔧 DIAGNÓSTICO COMPLETO DAS CHAVES BYBIT
 * 
 * Script para identificar e corrigir problemas de autenticação
 * das chaves API da Bybit no sistema multiusuário
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 DIAGNÓSTICO COMPLETO DAS CHAVES BYBIT');
console.log('========================================');

async function diagnosticarChavesBybit() {
    try {
        // 1. Buscar todas as chaves Bybit no banco
        console.log('\n📊 1. INVENTÁRIO DE CHAVES BYBIT:');
        const chavesQuery = `
            SELECT 
                u.id as user_id,
                u.name,
                u.email,
                uak.id as key_id,
                uak.api_key,
                uak.secret_key,
                uak.exchange,
                uak.environment,
                uak.is_active,
                uak.validation_status,
                uak.created_at,
                uak.updated_at
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            WHERE uak.exchange = 'bybit'
            ORDER BY u.name, uak.environment;
        `;
        
        const chavesResult = await pool.query(chavesQuery);
        
        if (chavesResult.rows.length === 0) {
            console.log('❌ Nenhuma chave Bybit encontrada no banco de dados!');
            return;
        }
        
        console.log(`📋 ${chavesResult.rows.length} chave(s) Bybit encontrada(s):\n`);
        
        for (const [index, chave] of chavesResult.rows.entries()) {
            console.log(`${index + 1}. ${chave.name} (${chave.email})`);
            console.log(`   🆔 User ID: ${chave.user_id}`);
            console.log(`   🆔 Key ID: ${chave.key_id}`);
            console.log(`   🔑 API Key: ${chave.api_key?.substring(0, 12)}...`);
            console.log(`   🔐 Secret: ${chave.secret_key?.substring(0, 8)}...`);
            console.log(`   🌍 Ambiente: ${chave.environment}`);
            console.log(`   ✅ Ativa: ${chave.is_active}`);
            console.log(`   📊 Status: ${chave.validation_status || 'Não validada'}`);
            console.log(`   📅 Criada: ${new Date(chave.created_at).toLocaleString('pt-BR')}`);
            console.log('');
        }
        
        // 2. Verificar IP atual
        console.log('🌐 2. VERIFICAÇÃO DE IP:');
        await verificarIPAtual();
        
        // 3. Testar cada chave individualmente
        console.log('\n🧪 3. TESTE INDIVIDUAL DAS CHAVES:');
        console.log('==================================');
        
        let chavesValidas = 0;
        let chavesInvalidas = 0;
        
        for (const chave of chavesResult.rows) {
            console.log(`\n🔄 Testando: ${chave.name} (${chave.environment})`);
            
            // Verificar se a chave não está vazia ou corrompida
            if (!chave.api_key || !chave.secret_key) {
                console.log('   ❌ ERRO: API Key ou Secret Key ausente!');
                chavesInvalidas++;
                continue;
            }
            
            if (chave.api_key.length < 10 || chave.secret_key.length < 20) {
                console.log('   ❌ ERRO: API Key ou Secret Key muito curta!');
                chavesInvalidas++;
                continue;
            }
            
            // Testar a chave
            const resultado = await testarChaveBybitDetalhado(
                chave.api_key, 
                chave.secret_key, 
                chave.environment
            );
            
            if (resultado.valida) {
                console.log('   ✅ CHAVE VÁLIDA');
                chavesValidas++;
                
                // Atualizar status no banco
                await pool.query(`
                    UPDATE user_api_keys 
                    SET validation_status = 'valid', 
                        updated_at = NOW() 
                    WHERE id = $1
                `, [chave.key_id]);
                
            } else {
                console.log(`   ❌ CHAVE INVÁLIDA: ${resultado.erro}`);
                chavesInvalidas++;
                
                // Atualizar status no banco
                await pool.query(`
                    UPDATE user_api_keys 
                    SET validation_status = $1, 
                        updated_at = NOW() 
                    WHERE id = $2
                `, [resultado.erro, chave.key_id]);
            }
        }
        
        // 4. Resumo e recomendações
        console.log('\n📊 4. RESUMO DOS TESTES:');
        console.log('========================');
        console.log(`✅ Chaves válidas: ${chavesValidas}`);
        console.log(`❌ Chaves inválidas: ${chavesInvalidas}`);
        console.log(`📊 Total testadas: ${chavesResult.rows.length}`);
        
        const percentualSucesso = (chavesValidas / chavesResult.rows.length) * 100;
        console.log(`📈 Taxa de sucesso: ${percentualSucesso.toFixed(1)}%`);
        
        // 5. Recomendações específicas
        console.log('\n💡 5. RECOMENDAÇÕES:');
        console.log('===================');
        
        if (chavesInvalidas > 0) {
            console.log('🚨 PROBLEMAS IDENTIFICADOS:');
            console.log('   1. API Keys inválidas detectadas');
            console.log('   2. Possível problema de IP ou permissões');
            console.log('   3. Chaves podem ter expirado');
            
            console.log('\n🔧 SOLUÇÕES RECOMENDADAS:');
            console.log('   A. Configurar IP 132.255.160.140 em todas as contas Bybit');
            console.log('   B. Verificar permissões das API Keys');
            console.log('   C. Regenerar chaves com problemas');
            console.log('   D. Usar sistema híbrido testnet/mainnet temporariamente');
        }
        
        if (chavesValidas > 0) {
            console.log('✅ CHAVES FUNCIONANDO:');
            console.log('   • Usar como referência para configurações');
            console.log('   • Manter configurações atuais');
        }
        
        // 6. Plano de ação
        console.log('\n🎯 6. PLANO DE AÇÃO IMEDIATO:');
        console.log('============================');
        console.log('1. 🌐 Configurar IP nas contas Bybit');
        console.log('   • Acessar https://www.bybit.com');
        console.log('   • Account & Security → API Management');
        console.log('   • Adicionar IP: 132.255.160.140');
        
        console.log('\n2. 🔄 Regenerar chaves problemáticas');
        console.log('   • Criar novas API Keys');
        console.log('   • Configurar permissões: Read + Trade');
        console.log('   • Atualizar no sistema');
        
        console.log('\n3. 🧪 Configurar fallback');
        console.log('   • Usar chaves testnet como backup');
        console.log('   • Implementar sistema híbrido');
        
    } catch (error) {
        console.error('❌ Erro no diagnóstico:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

async function testarChaveBybitDetalhado(apiKey, secretKey, environment) {
    try {
        const baseUrl = environment === 'testnet' ? 
            'https://api-testnet.bybit.com' : 
            'https://api.bybit.com';
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        
        // Criar assinatura correta para endpoints com query parameters
        const queryString = parametros && Object.keys(parametros).length > 0 ? 
            Object.entries(parametros).map(([key, value]) => `${key}=${value}`).join('&') : '';
        
        // Formato correto Bybit V5: timestamp + apiKey + recvWindow + queryString
        const signPayload = timestamp + apiKey + recvWindow + queryString;
        const signature = crypto.createHmac('sha256', secretKey).update(signPayload).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        // Testar endpoint mais básico
        const response = await fetch(`${baseUrl}/v5/market/time`, {
            method: 'GET',
            headers: headers
        });
        
        if (!response.ok) {
            return {
                valida: false,
                erro: `HTTP ${response.status}: ${response.statusText}`
            };
        }
        
        const data = await response.json();
        
        console.log(`      📊 Resposta: ${data.retCode} - ${data.retMsg}`);
        
        if (data.retCode === 0) {
            return { valida: true, dados: data };
        } else {
            // Mapear códigos de erro específicos
            const erros = {
                10001: 'Parâmetros inválidos',
                10003: 'API key inválida',
                10004: 'Erro de assinatura',
                10005: 'Permissões insuficientes',
                10006: 'IP não autorizado',
                10007: 'API key expirada',
                10008: 'Muitas requisições',
                10009: 'Nonce inválido'
            };
            
            const erro = erros[data.retCode] || `Código ${data.retCode}: ${data.retMsg}`;
            return { valida: false, erro: erro };
        }
        
    } catch (error) {
        return {
            valida: false,
            erro: `Erro de conexão: ${error.message}`
        };
    }
}

async function verificarIPAtual() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        console.log(`   🌐 IP atual do servidor: ${data.ip}`);
        console.log('   📍 IP configurado no sistema: 132.255.160.140');
        
        if (data.ip === '132.255.160.140') {
            console.log('   ✅ IP está correto e estável');
        } else {
            console.log('   🚨 IP MUDOU! Precisa atualizar configurações');
        }
        
        return data.ip;
    } catch (error) {
        console.log('   ❌ Não foi possível verificar IP atual');
        return null;
    }
}

// Executar diagnóstico
diagnosticarChavesBybit().catch(console.error);
