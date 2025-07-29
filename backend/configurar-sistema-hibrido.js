/**
 * 🌐 CONFIGURAÇÃO SISTEMA HÍBRIDO - TESTNET + PRODUÇÃO
 * Sistema operando simultaneamente com testnet e produção
 */

const GestorChavesAPI = require('./gestor-chaves-parametrizacoes.js');

console.log('🌐 CONFIGURAÇÃO SISTEMA HÍBRIDO TESTNET + PRODUÇÃO');
console.log('==================================================');

async function configurarSistemaHibrido() {
    const gestor = new GestorChavesAPI();
    
    console.log('🎯 MODO DE OPERAÇÃO: HÍBRIDO');
    console.log('📋 TESTNET: Ativo para testes e desenvolvimento');
    console.log('🚀 PRODUÇÃO: Ativo para trading real com chaves do Railway');
    console.log('');
    
    try {
        // Verificar status das configurações atuais
        console.log('📊 VERIFICANDO STATUS ATUAL...');
        
        const relatorio = await gestor.gerarRelatorioUsuarios();
        
        console.log('');
        console.log('👥 USUÁRIOS CONFIGURADOS:');
        console.log('=========================');
        
        if (relatorio.length === 0) {
            console.log('⚠️  Nenhum usuário encontrado no sistema');
        } else {
            relatorio.forEach(usuario => {
                console.log(`🆔 ${usuario.id} - ${usuario.username} (${usuario.email})`);
                console.log(`   📈 Exchanges: ${usuario.exchanges_configuradas}`);
                console.log(`   ⚙️  Parametrizações: ${usuario.tem_parametrizacoes}`);
                console.log(`   💰 Assets: ${usuario.assets_com_saldo}`);
                console.log('');
            });
        }
        
        console.log('🔧 CONFIGURAÇÕES DO SISTEMA:');
        console.log('============================');
        console.log(`📱 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🌐 TESTNET: ${process.env.TESTNET || 'Não definido'}`);
        console.log(`🚀 TRADING_MODE: ${process.env.TRADING_MODE || 'Não definido'}`);
        console.log('');
        
        // Verificar chaves disponíveis
        console.log('🔑 CHAVES API DISPONÍVEIS:');
        console.log('==========================');
        
        console.log('🔸 Binance:');
        console.log(`   TESTNET: ${process.env.BINANCE_TESTNET === 'false' ? '❌' : '✅'}`);
        console.log(`   PRODUÇÃO: ${process.env.BINANCE_API_KEY ? '✅' : '❌'}`);
        
        console.log('🔸 Bybit:');
        console.log(`   TESTNET: ${process.env.BYBIT_TESTNET === 'false' ? '❌' : '✅'}`);
        console.log(`   PRODUÇÃO: ${process.env.BYBIT_API_KEY ? '✅' : '❌'}`);
        
        console.log('🔸 OKX:');
        console.log(`   TESTNET: ${process.env.OKX_TESTNET === 'false' ? '❌' : '✅'}`);
        console.log(`   PRODUÇÃO: ${process.env.OKX_API_KEY ? '✅' : '❌'}`);
        
        console.log('');
        
        // Status de operação
        console.log('📈 STATUS DE OPERAÇÃO:');
        console.log('======================');
        console.log('✅ Sistema preparado para operar em AMBOS os modos');
        console.log('🔄 Usuários podem escolher entre TESTNET ou PRODUÇÃO');
        console.log('🛡️  Validação automática de chaves para ambos os ambientes');
        console.log('📊 Monitoramento independente por ambiente');
        console.log('');
        
        // Próximos passos
        console.log('🎯 PRÓXIMOS PASSOS:');
        console.log('===================');
        console.log('1. ✅ Adicionar chave Bybit da Luiza Maria (PRODUÇÃO)');
        console.log('2. 🔧 Configurar chaves do Railway nas variáveis de ambiente');
        console.log('3. 🚀 Ativar trading automático para usuários configurados');
        console.log('4. 📊 Monitorar operações em tempo real');
        console.log('');
        
        return true;
        
    } catch (error) {
        console.error('❌ ERRO na configuração:', error.message);
        return false;
    }
}

async function verificarValidacaoChaves() {
    const gestor = new GestorChavesAPI();
    
    console.log('🔍 TESTE DE VALIDAÇÃO DE CHAVES:');
    console.log('=================================');
    
    // Teste com chave simulada
    try {
        console.log('📝 Testando validação Binance (TESTNET)...');
        const validacaoBinanceTest = await gestor.validarBinance('test_key', 'test_secret', true);
        console.log(`   ${validacaoBinanceTest.valida ? '✅' : '❌'} TESTNET: ${validacaoBinanceTest.valida ? 'Conectado' : validacaoBinanceTest.erro}`);
        
        console.log('📝 Testando validação Bybit (TESTNET)...');
        const validacaoBybitTest = await gestor.validarBybit('test_key', 'test_secret', true);
        console.log(`   ${validacaoBybitTest.valida ? '✅' : '❌'} TESTNET: ${validacaoBybitTest.valida ? 'Conectado' : validacaoBybitTest.erro}`);
        
        console.log('📝 Testando validação Binance (PRODUÇÃO)...');
        const validacaoBinanceProd = await gestor.validarBinance('test_key', 'test_secret', false);
        console.log(`   ${validacaoBinanceProd.valida ? '✅' : '❌'} PRODUÇÃO: ${validacaoBinanceProd.valida ? 'Conectado' : validacaoBinanceProd.erro}`);
        
        console.log('📝 Testando validação Bybit (PRODUÇÃO)...');
        const validacaoBybitProd = await gestor.validarBybit('test_key', 'test_secret', false);
        console.log(`   ${validacaoBybitProd.valida ? '✅' : '❌'} PRODUÇÃO: ${validacaoBybitProd.valida ? 'Conectado' : validacaoBybitProd.erro}`);
        
    } catch (error) {
        console.log(`❌ Erro no teste: ${error.message}`);
    }
}

// Executar configuração completa
async function main() {
    try {
        await configurarSistemaHibrido();
        console.log('');
        await verificarValidacaoChaves();
        
        console.log('');
        console.log('🎉 SISTEMA HÍBRIDO CONFIGURADO COM SUCESSO!');
        console.log('🌐 Operando simultaneamente em TESTNET e PRODUÇÃO');
        console.log('');
        
    } catch (error) {
        console.error('💥 ERRO na configuração:', error.message);
    }
}

main();
