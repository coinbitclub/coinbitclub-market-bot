/**
 * 🧪 TESTE COMPARATIVO - IP CONFIGURADO vs NÃO CONFIGURADO
 * 
 * Testar as chaves da Érica e Luiza (com IP configurado)
 * vs Mauro (sem IP configurado) para validar a solução
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🧪 TESTE COMPARATIVO - IP CONFIGURADO vs NÃO CONFIGURADO');
console.log('========================================================');

async function testeComparativo() {
    try {
        // Buscar usuários específicos
        const usuarios = await pool.query(`
            SELECT 
                u.name,
                u.email,
                uak.api_key,
                uak.secret_key,
                uak.environment,
                CASE 
                    WHEN u.email IN ('erica.andrade.santos@hotmail.com', 'lmariadapinto@gmail.com') 
                    THEN true 
                    ELSE false 
                END as ip_configurado
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            WHERE uak.exchange = 'bybit' AND uak.is_active = true
            ORDER BY ip_configurado DESC, u.name
        `);
        
        console.log('\n📊 CENÁRIOS DE TESTE:');
        console.log('====================');
        
        const comIP = usuarios.rows.filter(u => u.ip_configurado);
        const semIP = usuarios.rows.filter(u => !u.ip_configurado);
        
        console.log(`✅ Com IP configurado: ${comIP.length} usuário(s)`);
        console.log(`❌ Sem IP configurado: ${semIP.length} usuário(s)`);
        console.log('');
        
        // Testar usuários COM IP configurado
        console.log('🟢 TESTE 1: USUÁRIOS COM IP CONFIGURADO');
        console.log('======================================');
        
        let sucessosComIP = 0;
        for (const usuario of comIP) {
            console.log(`\n👤 ${usuario.name} (${usuario.email})`);
            console.log(`🔑 Ambiente: ${usuario.environment}`);
            console.log('🌍 Status IP: ✅ Configurado');
            
            const resultado = await testarEndpointsCompletos(usuario);
            if (resultado.todosFuncionando) {
                console.log('   🎉 RESULTADO: ✅ TODOS OS ENDPOINTS FUNCIONANDO!');
                sucessosComIP++;
            } else {
                console.log('   🚨 RESULTADO: ❌ Ainda há problemas');
            }
        }
        
        // Testar usuários SEM IP configurado
        console.log('\n🔴 TESTE 2: USUÁRIOS SEM IP CONFIGURADO');
        console.log('======================================');
        
        let sucessosSemIP = 0;
        for (const usuario of semIP) {
            console.log(`\n👤 ${usuario.name} (${usuario.email})`);
            console.log(`🔑 Ambiente: ${usuario.environment}`);
            console.log('🌍 Status IP: ❌ Não configurado');
            
            const resultado = await testarEndpointsCompletos(usuario);
            if (resultado.todosFuncionando) {
                console.log('   😲 RESULTADO: ✅ Funcionando (inesperado!)');
                sucessosSemIP++;
            } else {
                console.log('   📝 RESULTADO: ❌ Falhando (esperado)');
            }
        }
        
        // Análise comparativa
        console.log('\n📈 ANÁLISE COMPARATIVA:');
        console.log('=======================');
        console.log(`✅ Com IP - Sucessos: ${sucessosComIP}/${comIP.length}`);
        console.log(`❌ Sem IP - Sucessos: ${sucessosSemIP}/${semIP.length}`);
        
        if (sucessosComIP > sucessosSemIP) {
            console.log('\n🎯 CONCLUSÃO: ✅ SOLUÇÃO CONFIRMADA!');
            console.log('   • Configurar IP resolve o problema');
            console.log('   • Usuários com IP funcionando');
            console.log('   • Usuários sem IP falhando');
            console.log('\n🚀 PRÓXIMO PASSO:');
            console.log('   • Configurar IP para usuários restantes');
        } else if (sucessosComIP === comIP.length && sucessosSemIP === semIP.length) {
            console.log('\n🤔 CONCLUSÃO: Todos funcionando');
            console.log('   • Problema pode ter sido resolvido');
            console.log('   • Ou configurações propagaram para todos');
        } else {
            console.log('\n🔍 CONCLUSÃO: Resultado inesperado');
            console.log('   • Investigar configurações individuais');
        }
        
        // Recomendações finais
        if (semIP.length > 0 && sucessosSemIP < semIP.length) {
            console.log('\n📋 AÇÃO PENDENTE:');
            console.log('=================');
            semIP.forEach(usuario => {
                console.log(`❌ ${usuario.name} (${usuario.email})`);
                console.log('   🎯 Ação: Configurar IP na conta Bybit');
            });
        }
        
        if (sucessosComIP === comIP.length && sucessosSemIP < semIP.length) {
            console.log('\n🎉 STATUS: SOLUÇÃO VALIDADA!');
            console.log('=====================');
            console.log('✅ Usuários com IP: Funcionando');
            console.log('❌ Usuários sem IP: Falhando');
            console.log('🔧 Solução: Configurar IP resolve 100%');
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    } finally {
        await pool.end();
    }
}

async function testarEndpointsCompletos(usuario) {
    const baseUrl = usuario.environment === 'testnet' ? 
        'https://api-testnet.bybit.com' : 
        'https://api.bybit.com';
    
    console.log('   🔄 Testando endpoints...');
    
    // Teste 1: Endpoint público (deve sempre funcionar)
    const publicoOK = await testarEndpointPublico(baseUrl);
    console.log(`      🌍 Público: ${publicoOK ? '✅' : '❌'}`);
    
    // Teste 2: Endpoint privado básico
    const privadoOK = await testarEndpointPrivado(usuario, baseUrl, '/v5/account/info');
    console.log(`      🔐 Account Info: ${privadoOK ? '✅' : '❌'}`);
    
    // Teste 3: Endpoint privado avançado
    const walletOK = await testarEndpointPrivado(usuario, baseUrl, '/v5/account/wallet-balance?accountType=UNIFIED');
    console.log(`      💰 Wallet Balance: ${walletOK ? '✅' : '❌'}`);
    
    const todosFuncionando = publicoOK && privadoOK && walletOK;
    
    return {
        todosFuncionando,
        publico: publicoOK,
        privado: privadoOK,
        wallet: walletOK
    };
}

async function testarEndpointPublico(baseUrl) {
    try {
        const response = await fetch(`${baseUrl}/v5/market/time`);
        const data = await response.json();
        return data.retCode === 0;
    } catch (error) {
        return false;
    }
}

async function testarEndpointPrivado(usuario, baseUrl, endpoint) {
    try {
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        
        // Extrair query string se houver
        const [path, queryString = ''] = endpoint.split('?');
        
        const message = timestamp + usuario.api_key + recvWindow + queryString;
        const signature = crypto.createHmac('sha256', usuario.secret_key).update(message).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': usuario.api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        return data.retCode === 0;
        
    } catch (error) {
        return false;
    }
}

// Executar teste
testeComparativo().catch(console.error);
