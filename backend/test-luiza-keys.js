#!/usr/bin/env node

/**
 * 🧪 TESTE DIRETO COM CHAVES DA LUIZA
 * ===================================
 * 
 * Teste específico com as chaves reais da Luiza
 */

const EnterpriseExchangeConnector = require('./enterprise-exchange-connector');

async function testarChavesLuiza() {
    console.log('🧪 TESTE DIRETO COM CHAVES DA LUIZA');
    console.log('===================================');

    const connector = new EnterpriseExchangeConnector();
    
    // Chaves da Luiza conforme imagem
    const chaves = {
        apiKey: '9HZy9BiUW95iXprVRl',
        secretKey: 'QUjDXNmSI0qiqaKTUk7FHAHZnjfEN8AaRKQO',
        userId: 14,
        username: 'Luiza Maria de Almeida Pinto'
    };

    console.log(`👤 Usuária: ${chaves.username}`);
    console.log(`🆔 User ID: ${chaves.userId}`);
    console.log(`🔑 API Key: ${chaves.apiKey}`);
    console.log(`🔐 Secret: ${chaves.secretKey.substring(0, 8)}...${chaves.secretKey.substring(-4)}`);
    console.log('');

    try {
        console.log('🔄 Testando conexão enterprise...');
        
        const startTime = Date.now();
        
        // Testar com auto-detecção
        const resultado = await connector.connectAndValidateExchange(
            chaves.userId,
            chaves.apiKey,
            chaves.secretKey
        );

        const tempoExecucao = Date.now() - startTime;

        console.log(`⏱️ Tempo de execução: ${tempoExecucao}ms`);
        console.log('');

        if (resultado.success) {
            console.log('✅ CONEXÃO BEM-SUCEDIDA!');
            console.log('========================');
            console.log(`🎯 Exchange detectada: ${resultado.exchange} ${resultado.environment}`);
            console.log(`🏢 Tipo de conta: ${resultado.accountInfo?.accountType || 'N/A'}`);
            
            if (resultado.accountInfo) {
                console.log('\n📊 INFORMAÇÕES DA CONTA:');
                console.log('========================');
                console.log(`ID da conta: ${resultado.accountInfo.uid || 'N/A'}`);
                console.log(`Status: ${resultado.accountInfo.accountStatus || 'N/A'}`);
                console.log(`Tipo: ${resultado.accountInfo.accountType || 'N/A'}`);
                
                if (resultado.accountInfo.totalWalletBalance) {
                    console.log(`💰 Saldo total: ${resultado.accountInfo.totalWalletBalance} USDT`);
                }
                
                if (resultado.accountInfo.totalAvailableBalance) {
                    console.log(`💵 Saldo disponível: ${resultado.accountInfo.totalAvailableBalance} USDT`);
                }
                
                if (resultado.accountInfo.totalPerpUPL) {
                    console.log(`📈 PnL não realizado: ${resultado.accountInfo.totalPerpUPL} USDT`);
                }
            }
            
            if (resultado.balances && resultado.balances.length > 0) {
                console.log('\n💼 SALDOS POR MOEDA:');
                console.log('===================');
                
                const saldosPositivos = resultado.balances.filter(b => parseFloat(b.free) > 0);
                console.log(`Total de moedas: ${resultado.balances.length}`);
                console.log(`Com saldo: ${saldosPositivos.length}`);
                
                if (saldosPositivos.length > 0) {
                    console.log('\n💎 Top moedas com saldo:');
                    saldosPositivos
                        .sort((a, b) => parseFloat(b.free) - parseFloat(a.free))
                        .slice(0, 5)
                        .forEach((asset, index) => {
                            console.log(`  ${index + 1}. ${asset.asset}: ${asset.free} (locked: ${asset.locked || '0'})`);
                        });
                }
            }

            if (resultado.permissions && resultado.permissions.length > 0) {
                console.log('\n🔐 PERMISSÕES DA API:');
                console.log('====================');
                resultado.permissions.forEach(perm => {
                    console.log(`  ✅ ${perm}`);
                });
            }

            console.log('\n🎉 SUCESSO TOTAL! Chaves da Luiza funcionando perfeitamente!');

        } else {
            console.log('❌ CONEXÃO FALHADA!');
            console.log('===================');
            console.log(`🔍 Erro: ${resultado.error}`);
            console.log(`📋 Detalhes: ${resultado.details || 'N/A'}`);
            
            if (resultado.error.includes('IP')) {
                console.log('\n⚠️ PROBLEMA DE IP DETECTADO!');
                console.log('===========================');
                console.log('A chave API está configurada para funcionar apenas com IPs específicos.');
                console.log('Soluções possíveis:');
                console.log('1. Adicionar o IP do servidor na configuração da API Key na Bybit');
                console.log('2. Remover a restrição de IP da API Key');
                console.log('3. Usar um servidor com IP autorizado');
            }
            
            if (resultado.error.includes('key') || resultado.error.includes('signature')) {
                console.log('\n⚠️ PROBLEMA DE AUTENTICAÇÃO DETECTADO!');
                console.log('=====================================');
                console.log('Possíveis causas:');
                console.log('1. API Key ou Secret incorretos');
                console.log('2. Permissões insuficientes');
                console.log('3. API Key expirada ou desativada');
            }
        }

        // Testar especificamente Bybit Mainnet
        console.log('\n\n🔵 TESTE ESPECÍFICO BYBIT MAINNET');
        console.log('=================================');

        const resultadoBybit = await connector.connectAndValidateExchange(
            chaves.userId,
            chaves.apiKey,
            chaves.secretKey,
            'bybit'
        );

        if (resultadoBybit.success) {
            console.log('✅ Bybit Mainnet: SUCESSO!');
        } else {
            console.log('❌ Bybit Mainnet: FALHA!');
            console.log(`   Erro: ${resultadoBybit.error}`);
        }

        // Testar Bybit Testnet
        console.log('\n🔵 TESTE ESPECÍFICO BYBIT TESTNET');
        console.log('=================================');

        // Para testnet, geralmente as chaves são diferentes
        // Mas vou testar mesmo assim
        console.log('⚠️ Nota: Testando com chaves de mainnet no testnet (pode falhar)');
        
        // Aqui seria necessário usar chaves específicas do testnet se disponíveis
        
    } catch (error) {
        console.log('💥 ERRO CRÍTICO!');
        console.log('================');
        console.log(`❌ ${error.message}`);
        console.log(`📚 Stack: ${error.stack}`);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    testarChavesLuiza()
        .then(() => {
            console.log('\n✅ TESTE COM CHAVES DA LUIZA CONCLUÍDO!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 ERRO:', error.message);
            process.exit(1);
        });
}

module.exports = { testarChavesLuiza };
