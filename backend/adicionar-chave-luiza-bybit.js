/**
 * 🔐 CONFIGURAÇÃO DE CHAVES DA LUIZA MARIA - BYBIT PRODUÇÃO
 * Adicionar chaves reais da Bybit para a usuária Luiza Maria
 */

const GestorChavesAPI = require('./gestor-chaves-parametrizacoes.js');

console.log('🚀 CONFIGURANDO CHAVES BYBIT - LUIZA MARIA');
console.log('==========================================');

async function adicionarChavesBybitLuiza() {
    const gestor = new GestorChavesAPI();
    
    try {
        // Dados da Luiza Maria
        const userId = 2; // ID da Luiza Maria no banco
        const exchangeName = 'bybit';
        const apiKey = '9HZy9BiUW95iXprVRl';
        const apiSecret = 'QUjDXNmSI0qiqaKTUk7FHAHZnjiEN8AaRKQO';
        const testnet = false; // PRODUÇÃO REAL
        
        console.log('👤 Usuário: Luiza Maria (ID: 2)');
        console.log('🏪 Exchange: Bybit (PRODUÇÃO)');
        console.log('🔑 API Key:', apiKey);
        console.log('🔐 API Secret: ***' + apiSecret.slice(-6));
        console.log('');
        
        // Adicionar chave API
        console.log('📡 Validando e adicionando chave API...');
        const resultado = await gestor.adicionarChaveAPI(
            userId,
            exchangeName,
            apiKey,
            apiSecret,
            testnet
        );
        
        if (resultado.sucesso) {
            console.log('✅ CHAVE BYBIT ADICIONADA COM SUCESSO!');
            console.log('');
            console.log('📊 DETALHES DA CONFIGURAÇÃO:');
            console.log('============================');
            console.log('🆔 ID da Chave:', resultado.chaveId);
            console.log('🔒 Permissões:', resultado.permissoes.join(', '));
            console.log('💰 Saldos iniciais:', Object.keys(resultado.saldoInicial || {}).length, 'moedas');
            console.log('');
            
            if (resultado.saldoInicial && Object.keys(resultado.saldoInicial).length > 0) {
                console.log('💹 SALDOS DETECTADOS:');
                Object.entries(resultado.saldoInicial).forEach(([moeda, dados]) => {
                    console.log(`   ${moeda}: ${dados.total} (Disponível: ${dados.disponivel})`);
                });
            }
            
            console.log('');
            console.log('🎯 STATUS: LUIZA MARIA CONFIGURADA PARA TRADING REAL');
            console.log('🚀 Sistema pronto para operar na Bybit com conta real!');
            
        } else {
            console.log('❌ ERRO ao adicionar chave API');
        }
        
    } catch (error) {
        console.error('❌ ERRO na configuração:', error.message);
        
        // Se der erro de validação, tentar novamente com testnet
        if (error.message.includes('inválidas') || error.message.includes('10003') || error.message.includes('10004')) {
            console.log('');
            console.log('🔄 Tentando com modo TESTNET...');
            
            try {
                const resultadoTestnet = await gestor.adicionarChaveAPI(
                    2, // Luiza Maria
                    'bybit',
                    apiKey,
                    apiSecret,
                    true // TESTNET
                );
                
                if (resultadoTestnet.sucesso) {
                    console.log('✅ Chave configurada em modo TESTNET');
                    console.log('⚠️  Para usar em produção, verifique as permissões da API na Bybit');
                }
            } catch (testnetError) {
                console.error('❌ Erro também no testnet:', testnetError.message);
            }
        }
    }
}

// Executar configuração
adicionarChavesBybitLuiza()
    .then(() => {
        console.log('');
        console.log('🏁 CONFIGURAÇÃO FINALIZADA');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 ERRO FATAL:', error.message);
        process.exit(1);
    });
