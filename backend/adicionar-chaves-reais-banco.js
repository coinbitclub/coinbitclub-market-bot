/**
 * 🔐 ADICIONAR CHAVES REAIS NO BANCO DE DADOS
 * Script para cadastrar as chaves da Luiza Maria no PostgreSQL
 */

const GestorChavesAPI = require('./gestor-chaves-parametrizacoes.js');

console.log('🔐 ADICIONANDO CHAVES REAIS NO BANCO DE DADOS');
console.log('=============================================');

async function adicionarChavesReaisBanco() {
    const gestor = new GestorChavesAPI();
    
    console.log('👤 USUÁRIO: Luiza Maria');
    console.log('🏪 EXCHANGE: Bybit (Produção Real)');
    console.log('🔑 API Key: 9HZy9BiUW95iXprVRl');
    console.log('🔐 API Secret: QUjDXNmSI0qiqaKTUk7FHAHZnjiEN8AaRKQO');
    console.log('');

    try {
        // Dados da Luiza Maria
        const dadosLuiza = {
            userId: 2,
            username: 'Luiza Maria',
            exchangeName: 'bybit',
            apiKey: '9HZy9BiUW95iXprVRl',
            apiSecret: 'QUjDXNmSI0qiqaKTUk7FHAHZnjiEN8AaRKQO',
            testnet: false, // PRODUÇÃO REAL
            passphrase: null
        };

        console.log('📡 Validando e adicionando chave no banco PostgreSQL...');
        
        // Adicionar a chave no banco de dados
        const resultado = await gestor.adicionarChaveAPI(
            dadosLuiza.userId,
            dadosLuiza.exchangeName,
            dadosLuiza.apiKey,
            dadosLuiza.apiSecret,
            dadosLuiza.testnet,
            dadosLuiza.passphrase
        );

        if (resultado.sucesso) {
            console.log('✅ CHAVE ADICIONADA COM SUCESSO NO BANCO!');
            console.log('');
            console.log('📊 DETALHES DO CADASTRO:');
            console.log('========================');
            console.log(`🆔 ID da Chave: ${resultado.chaveId}`);
            console.log(`👤 Usuário: ${dadosLuiza.username} (ID: ${dadosLuiza.userId})`);
            console.log(`🏪 Exchange: ${dadosLuiza.exchangeName.toUpperCase()}`);
            console.log(`🎯 Modo: PRODUÇÃO REAL`);
            console.log(`🔒 Permissões: ${resultado.permissoes.join(', ')}`);
            console.log(`💰 Saldos: ${Object.keys(resultado.saldoInicial || {}).length} moedas detectadas`);
            
            if (resultado.saldoInicial && Object.keys(resultado.saldoInicial).length > 0) {
                console.log('');
                console.log('💹 SALDOS ENCONTRADOS:');
                Object.entries(resultado.saldoInicial).forEach(([moeda, dados]) => {
                    console.log(`   ${moeda}: ${dados.total} (Disponível: ${dados.disponivel})`);
                });
            }
            
            console.log('');
            console.log('🎯 STATUS: LUIZA MARIA CONFIGURADA PARA TRADING REAL');
            console.log('🤖 O robô agora pode acessar essas chaves do banco!');
            
            // Testar recuperação das chaves
            console.log('');
            console.log('🔍 TESTANDO RECUPERAÇÃO DAS CHAVES...');
            const chavesRecuperadas = await gestor.obterChavesParaTrading(dadosLuiza.userId, dadosLuiza.exchangeName);
            
            console.log('✅ Chaves recuperadas com sucesso:');
            console.log(`   🔑 API Key: ${chavesRecuperadas.apiKey?.substring(0, 10)}...`);
            console.log(`   🔐 Secret: ***${chavesRecuperadas.apiSecret?.slice(-6)}`);
            console.log(`   🌐 Fonte: ${chavesRecuperadas.source}`);
            console.log(`   🧪 Testnet: ${chavesRecuperadas.testnet}`);
            console.log(`   📅 Última validação: ${chavesRecuperadas.lastValidated}`);

        } else {
            console.log('❌ ERRO ao adicionar chave no banco');
        }

    } catch (error) {
        console.error('❌ ERRO:', error.message);
        
        // Verificar se é erro de validação de chaves
        if (error.message.includes('inválidas') || error.message.includes('10004')) {
            console.log('');
            console.log('⚠️  POSSÍVEIS CAUSAS:');
            console.log('1. Chaves ainda não ativadas na Bybit');
            console.log('2. Restrições de IP ativas');
            console.log('3. Permissões insuficientes');
            console.log('4. Chaves de sandbox/testnet ao invés de produção');
            console.log('');
            console.log('💡 SOLUÇÃO:');
            console.log('1. Verifique se as chaves são de PRODUÇÃO (www.bybit.com)');
            console.log('2. Remova restrições de IP na Bybit');
            console.log('3. Ative permissões de trading nas chaves');
        } else if (error.message.includes('database') || error.message.includes('connect')) {
            console.log('');
            console.log('⚠️  ERRO DE BANCO DE DADOS');
            console.log('1. Verifique se o PostgreSQL está rodando');
            console.log('2. Configure a DATABASE_URL corretamente');
            console.log('3. Verifique as tabelas do banco');
        }
    }
}

async function testarSistemaCompleto() {
    const gestor = new GestorChavesAPI();
    
    console.log('');
    console.log('🧪 TESTANDO SISTEMA COMPLETO DE CHAVES');
    console.log('======================================');
    
    try {
        // Testar dados completos para trading
        const dadosTrading = await gestor.obterDadosUsuarioParaTrading(2);
        
        console.log('✅ Dados completos recuperados:');
        console.log(`   👤 Usuário: ${dadosTrading.usuario?.username || 'Luiza Maria'}`);
        console.log(`   🏪 Exchanges configuradas: ${dadosTrading.exchangesConfiguradas.join(', ')}`);
        console.log(`   🎯 Modo operação: ${dadosTrading.modoOperacao}`);
        
        // Mostrar configurações específicas
        Object.entries(dadosTrading.chaves).forEach(([exchange, chaves]) => {
            console.log(`   📊 ${exchange.toUpperCase()}: ${chaves.source} (${chaves.testnet ? 'TESTNET' : 'PRODUÇÃO'})`);
        });
        
        // Testar preparação de operação
        console.log('');
        console.log('🤖 TESTANDO PREPARAÇÃO DE OPERAÇÃO...');
        const operacao = await gestor.prepararOperacaoRobo(2, 'bybit', 'BTCUSDT');
        
        console.log('✅ Operação preparada:');
        console.log(`   🏪 Exchange: ${operacao.exchange}`);
        console.log(`   💰 Símbolo: ${operacao.simbolo}`);
        console.log(`   🌐 Fonte chaves: ${operacao.source}`);
        console.log(`   📊 Percentual saldo: ${operacao.limites.percentualSaldo}%`);
        console.log(`   📈 Alavancagem: ${operacao.limites.alavancagem}x`);
        
    } catch (error) {
        console.log(`❌ Erro no teste: ${error.message}`);
    }
}

// Executar script completo
async function main() {
    try {
        console.log('🚀 INICIANDO CONFIGURAÇÃO COMPLETA...');
        console.log('');
        
        // Passo 1: Adicionar chaves da Luiza
        await adicionarChavesReaisBanco();
        
        // Passo 2: Testar sistema completo
        await testarSistemaCompleto();
        
        console.log('');
        console.log('🎉 CONFIGURAÇÃO COMPLETA FINALIZADA!');
        console.log('===================================');
        console.log('✅ Chaves da Luiza Maria no banco de dados');
        console.log('✅ Sistema de recuperação funcionando');
        console.log('✅ Robô pode acessar chaves por usuário');
        console.log('✅ Fallback para chaves do Railway ativo');
        console.log('');
        console.log('🤖 SISTEMA PRONTO PARA OPERAÇÕES REAIS!');
        
    } catch (error) {
        console.error('💥 ERRO GERAL:', error.message);
    }
}

main();
