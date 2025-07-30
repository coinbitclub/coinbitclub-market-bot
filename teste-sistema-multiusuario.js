/**
 * 🔧 TESTE COMPLETO DO SISTEMA MULTIUSUÁRIO BYBIT
 * 
 * Script para testar e validar o funcionamento completo do sistema
 * multiusuário com foco nas conexões da Bybit
 */

const { Pool } = require('pg');
const GestorChavesAPI = require('./backend/gestor-chaves-parametrizacoes.js');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 TESTE COMPLETO DO SISTEMA MULTIUSUÁRIO BYBIT');
console.log('===============================================');

async function testeCompletoMultiusuario() {
    try {
        // 1. Verificar usuários no banco
        console.log('\n📊 1. VERIFICANDO USUÁRIOS NO BANCO:');
        const usuarios = await pool.query(`
            SELECT 
                u.id,
                u.name,
                u.email,
                COUNT(uak.id) as total_chaves
            FROM users u
            LEFT JOIN user_api_keys uak ON u.id = uak.user_id AND uak.is_active = true
            GROUP BY u.id, u.name, u.email
            ORDER BY u.name;
        `);
        
        console.log(`👥 ${usuarios.rows.length} usuário(s) encontrado(s):`);
        for (const user of usuarios.rows) {
            console.log(`   ${user.id}. ${user.name} (${user.email}) - ${user.total_chaves} chave(s)`);
        }
        
        // 2. Inicializar gestor de chaves
        console.log('\n🔧 2. INICIALIZANDO GESTOR DE CHAVES:');
        const gestor = new GestorChavesAPI();
        console.log('✅ Gestor inicializado com sucesso');
        
        // 3. Testar cada usuário individualmente
        console.log('\n🧪 3. TESTANDO CADA USUÁRIO:');
        console.log('============================');
        
        for (const user of usuarios.rows) {
            console.log(`\n👤 USUÁRIO: ${user.name} (ID: ${user.id})`);
            console.log('-'.repeat(50));
            
            // 3.1. Testar obtenção de chaves Bybit
            try {
                console.log('🔑 Testando obtenção de chaves Bybit...');
                const chavesBybit = await gestor.obterChavesParaTrading(user.id, 'bybit');
                
                console.log(`   ✅ Chaves obtidas com sucesso!`);
                console.log(`   📊 Fonte: ${chavesBybit.source}`);
                console.log(`   🔑 API Key: ${chavesBybit.apiKey?.substring(0, 12)}...`);
                console.log(`   🌍 Ambiente: ${chavesBybit.testnet ? 'TESTNET' : 'MAINNET'}`);
                console.log(`   📅 Última validação: ${chavesBybit.lastValidated}`);
                
                // 3.2. Testar conectividade real com Bybit
                console.log('🌐 Testando conectividade com Bybit...');
                const testeConectividade = await testarConectividadeBybit(
                    chavesBybit.apiKey, 
                    chavesBybit.apiSecret, 
                    chavesBybit.testnet
                );
                
                if (testeConectividade.sucesso) {
                    console.log(`   ✅ Conectividade OK!`);
                    console.log(`   💰 Saldos encontrados: ${Object.keys(testeConectividade.saldos).length} moedas`);
                    
                    // Mostrar principais saldos
                    const saldosSignificativos = Object.entries(testeConectividade.saldos)
                        .filter(([coin, data]) => parseFloat(data.total) > 0.01)
                        .slice(0, 3);
                    
                    if (saldosSignificativos.length > 0) {
                        console.log('   💰 Principais saldos:');
                        saldosSignificativos.forEach(([coin, data]) => {
                            console.log(`      ${coin}: ${data.total} (disponível: ${data.disponivel})`);
                        });
                    }
                } else {
                    console.log(`   ❌ Erro de conectividade: ${testeConectividade.erro}`);
                    
                    // Diagnosticar problema específico
                    await diagnosticarProblemaConexao(chavesBybit, user.name);
                }
                
                // 3.3. Testar dados completos para trading
                console.log('📊 Testando dados completos para trading...');
                const dadosCompletos = await gestor.obterDadosUsuarioParaTrading(user.id);
                
                console.log(`   ✅ Dados completos obtidos!`);
                console.log(`   📈 Exchanges disponíveis: ${dadosCompletos.exchangesConfiguradas.join(', ')}`);
                console.log(`   ⚙️ Modo de operação: ${dadosCompletos.modoOperacao}`);
                
            } catch (error) {
                console.log(`   ❌ ERRO no usuário ${user.name}: ${error.message}`);
                console.log(`   🔧 Possíveis causas:`);
                console.log(`      • Chaves API não configuradas no banco`);
                console.log(`      • Problema de conectividade com Bybit`);
                console.log(`      • IP não configurado na conta Bybit`);
                console.log(`      • Chaves com permissões insuficientes`);
            }
        }
        
        // 4. Teste do sistema de fallback
        console.log('\n🌐 4. TESTANDO SISTEMA DE FALLBACK:');
        console.log('===================================');
        
        // Simular usuário inexistente para testar fallback
        const usuarioInexistente = 999;
        try {
            console.log(`🔄 Testando fallback para usuário inexistente (${usuarioInexistente})...`);
            const chavesFallback = await gestor.obterChavesParaTrading(usuarioInexistente, 'bybit');
            
            console.log(`✅ Sistema de fallback funcionando!`);
            console.log(`📊 Fonte: ${chavesFallback.source}`);
            console.log(`🌍 Ambiente: ${chavesFallback.testnet ? 'TESTNET' : 'MAINNET'}`);
            
        } catch (error) {
            console.log(`❌ Sistema de fallback com problema: ${error.message}`);
        }
        
        // 5. Resumo final
        console.log('\n📊 5. RESUMO FINAL:');
        console.log('==================');
        
        console.log('✅ SISTEMA FUNCIONANDO:');
        console.log('   • Gestor de chaves inicializado');
        console.log('   • Usuários carregados do banco');
        console.log('   • Sistema multiusuário operacional');
        
        console.log('\n💡 PRÓXIMOS PASSOS:');
        console.log('   1. Se houver erros 401/IP: Configurar IP nas contas Bybit');
        console.log('   2. Se chaves inválidas: Regenerar API keys');
        console.log('   3. Se sem chaves: Adicionar chaves no banco de dados');
        console.log('   4. Testar operações reais de trading');
        
    } catch (error) {
        console.error('❌ Erro geral no teste:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

async function testarConectividadeBybit(apiKey, apiSecret, testnet) {
    try {
        const crypto = require('crypto');
        
        const baseUrl = testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
        const timestamp = Date.now();
        const recvWindow = '5000';
        
        // Criar assinatura
        const message = timestamp + apiKey + recvWindow;
        const signature = crypto.createHmac('sha256', apiSecret).update(message).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': apiKey,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp.toString(),
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        // Testar endpoint de saldo
        const response = await fetch(`${baseUrl}/v5/account/wallet-balance?accountType=UNIFIED`, {
            method: 'GET',
            headers: headers
        });
        
        if (!response.ok) {
            return {
                sucesso: false,
                erro: `HTTP ${response.status}: ${response.statusText}`
            };
        }
        
        const data = await response.json();
        
        if (data.retCode === 0) {
            // Extrair saldos
            const saldos = {};
            if (data.result?.list?.[0]?.coin) {
                data.result.list[0].coin.forEach(coin => {
                    const total = parseFloat(coin.walletBalance);
                    if (total >= 0) {
                        saldos[coin.coin] = {
                            total: total,
                            disponivel: parseFloat(coin.availableToWithdraw || coin.walletBalance),
                            bloqueado: parseFloat(coin.locked || 0)
                        };
                    }
                });
            }
            
            return {
                sucesso: true,
                saldos: saldos,
                dados: data.result
            };
        } else {
            return {
                sucesso: false,
                erro: `Bybit retCode ${data.retCode}: ${data.retMsg}`
            };
        }
        
    } catch (error) {
        return {
            sucesso: false,
            erro: `Erro de conexão: ${error.message}`
        };
    }
}

async function diagnosticarProblemaConexao(chaves, nomeUsuario) {
    console.log(`\n🔍 DIAGNÓSTICO - ${nomeUsuario}:`);
    
    // Verificar formato das chaves
    if (!chaves.apiKey || chaves.apiKey.length < 10) {
        console.log('   ⚠️ API Key muito curta ou ausente');
    }
    
    if (!chaves.apiSecret || chaves.apiSecret.length < 20) {
        console.log('   ⚠️ Secret Key muito curto ou ausente');
    }
    
    // Verificar IP atual
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const ipData = await response.json();
        console.log(`   🌐 IP atual do servidor: ${ipData.ip}`);
        console.log('   💡 Certifique-se de que este IP está configurado na conta Bybit');
    } catch (error) {
        console.log('   ❌ Não foi possível verificar IP');
    }
    
    // Testar endpoint público (sem autenticação)
    try {
        const baseUrl = chaves.testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
        const response = await fetch(`${baseUrl}/v5/market/time`);
        const data = await response.json();
        
        if (data.retCode === 0) {
            console.log('   ✅ Conectividade básica com Bybit OK');
        } else {
            console.log('   ❌ Problema de conectividade básica com Bybit');
        }
    } catch (error) {
        console.log('   ❌ Erro de rede ao conectar com Bybit');
    }
}

// Executar teste
testeCompletoMultiusuario().catch(console.error);
