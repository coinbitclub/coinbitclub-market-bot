/**
 * 🔧 DIAGNÓSTICO COMPLETO DAS CHAVES BINANCE
 * 
 * Script para identificar e corrigir problemas de autenticação
 * das chaves API da Binance no sistema multiusuário
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 DIAGNÓSTICO COMPLETO DAS CHAVES BINANCE');
console.log('==========================================');

async function diagnosticarChavesBinance() {
    try {
        // 1. Buscar todas as chaves Binance no banco
        console.log('\n📊 1. INVENTÁRIO DE CHAVES BINANCE:');
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
            WHERE uak.exchange = 'binance'
            ORDER BY u.name, uak.environment;
        `;
        
        const chavesResult = await pool.query(chavesQuery);
        
        if (chavesResult.rows.length === 0) {
            console.log('❌ Nenhuma chave Binance encontrada no banco de dados!');
            console.log('💡 RECOMENDAÇÃO: Adicione chaves Binance através da interface ou:');
            console.log('   • Visite https://www.binance.com/en/my/settings/api-management');
            console.log('   • Crie API Keys com permissões adequadas');
            console.log('   • Configure IP whitelist: 132.255.160.140');
            return;
        }
        
        console.log(`📋 ${chavesResult.rows.length} chave(s) Binance encontrada(s):\n`);
        
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
            const resultado = await testarChaveBinanceDetalhado(
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
        
        const percentualSucesso = chavesResult.rows.length > 0 ? (chavesValidas / chavesResult.rows.length) * 100 : 0;
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
            console.log('   A. Configurar IP 132.255.160.140 em todas as contas Binance');
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
        console.log('1. 🌐 Configurar IP nas contas Binance');
        console.log('   • Acessar https://www.binance.com');
        console.log('   • Account & Security → API Management');
        console.log('   • Adicionar IP: 132.255.160.140');
        
        console.log('\n2. 🔄 Regenerar chaves problemáticas');
        console.log('   • Criar novas API Keys');
        console.log('   • Configurar permissões: Reading + Spot Trading + Futures');
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

async function testarChaveBinanceDetalhado(apiKey, secretKey, environment) {
    try {
        const isTestnet = environment === 'testnet';
        const baseUrl = isTestnet ? 
            'https://testnet.binance.vision' : 
            'https://api.binance.com';
        
        const timestamp = Date.now();
        const recvWindow = 5000;
        
        // Criar assinatura
        const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`;
        const signature = crypto.createHmac('sha256', secretKey).update(queryString).digest('hex');
        
        const headers = {
            'X-MBX-APIKEY': apiKey,
            'Content-Type': 'application/json'
        };
        
        // Testar endpoint mais básico para verificar conectividade
        const response = await fetch(`${baseUrl}/api/v3/account?${queryString}&signature=${signature}`, {
            method: 'GET',
            headers: headers
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { msg: errorText };
            }
            
            return {
                valida: false,
                erro: `HTTP ${response.status}: ${errorData.msg || response.statusText}`
            };
        }
        
        const data = await response.json();
        
        console.log(`      📊 Resposta: Sucesso - Account Type: ${data.accountType}`);
        
        if (data.accountType) {
            // Verificar se há saldos
            const balances = data.balances?.filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0);
            if (balances && balances.length > 0) {
                console.log(`      💰 Saldos encontrados: ${balances.length} moedas`);
                balances.slice(0, 3).forEach(balance => {
                    const total = parseFloat(balance.free) + parseFloat(balance.locked);
                    if (total > 0) {
                        console.log(`         ${balance.asset}: ${total}`);
                    }
                });
            }
            
            return { valida: true, dados: data };
        } else {
            return { valida: false, erro: 'Resposta inválida da API' };
        }
        
    } catch (error) {
        // Mapear erros comuns
        if (error.message.includes('ENOTFOUND')) {
            return { valida: false, erro: 'Erro de DNS/Conectividade' };
        } else if (error.message.includes('ECONNRESET')) {
            return { valida: false, erro: 'Conexão resetada' };
        } else if (error.message.includes('timeout')) {
            return { valida: false, erro: 'Timeout na requisição' };
        } else {
            return { valida: false, erro: `Erro de conexão: ${error.message}` };
        }
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
diagnosticarChavesBinance().catch(console.error);
