/**
 * 🔐 ADICIONAR CHAVES DA LUIZA NO BANCO DE DADOS
 * Script para inserir as chaves API da Luiza no PostgreSQL Railway
 */

const GestorChavesAPI = require('./gestor-chaves-parametrizacoes.js');

console.log('🔐 ADICIONANDO CHAVES DA LUIZA NO BANCO DE DADOS');
console.log('==============================================');

async function adicionarChavesLuiza() {
    const gestor = new GestorChavesAPI();
    
    try {
        console.log('🚀 Iniciando processo de adição das chaves da Luiza...');
        
        // ========================================
        // 🔑 DADOS DA LUIZA
        // ========================================
        
        // ⚠️ ATENÇÃO: Para executar este script, você precisa inserir as chaves reais da Luiza
        console.log('⚠️  AVISO: Chaves de exemplo detectadas!');
        console.log('📝 Para adicionar as chaves reais da Luiza:');
        console.log('   1. Substitua as chaves de exemplo pelas chaves reais');
        console.log('   2. Execute novamente o script');
        console.log('');
        
        const dadosLuiza = {
            userId: 2, // ID da Luiza no sistema
            nome: 'Luiza',
            email: 'luiza@coinbitclub.com',
            
            // Chaves Binance da Luiza (SUBSTITUA PELAS CHAVES REAIS)
            binance: {
                apiKey: process.env.LUIZA_BINANCE_API_KEY || 'EXEMPLO_BINANCE_API_KEY_LUIZA',
                apiSecret: process.env.LUIZA_BINANCE_SECRET || 'EXEMPLO_BINANCE_SECRET_KEY_LUIZA',
                testnet: false // Produção
            },
            
            // Chaves Bybit da Luiza (SUBSTITUA PELAS CHAVES REAIS)
            bybit: {
                apiKey: process.env.LUIZA_BYBIT_API_KEY || 'EXEMPLO_BYBIT_API_KEY_LUIZA',
                apiSecret: process.env.LUIZA_BYBIT_SECRET || 'EXEMPLO_BYBIT_SECRET_KEY_LUIZA',
                testnet: false // Produção
            }
        };
        
        // Verificar se são chaves de exemplo
        const saoChavesExemplo = 
            dadosLuiza.binance.apiKey.includes('EXEMPLO') || 
            dadosLuiza.bybit.apiKey.includes('EXEMPLO');
            
        if (saoChavesExemplo) {
            console.log('🚫 ABORTANDO: Chaves de exemplo detectadas!');
            console.log('');
            console.log('📋 INSTRUÇÕES PARA ADICIONAR AS CHAVES REAIS:');
            console.log('');
            console.log('1️⃣ Obtenha as chaves API da Luiza:');
            console.log('   🔶 Binance: API Key + Secret Key');
            console.log('   🔷 Bybit: API Key + Secret Key');
            console.log('');
            console.log('2️⃣ Substitua no código ou use variáveis de ambiente:');
            console.log('   export LUIZA_BINANCE_API_KEY="sua_chave_binance"');
            console.log('   export LUIZA_BINANCE_SECRET="seu_secret_binance"');
            console.log('   export LUIZA_BYBIT_API_KEY="sua_chave_bybit"');
            console.log('   export LUIZA_BYBIT_SECRET="seu_secret_bybit"');
            console.log('');
            console.log('3️⃣ Execute novamente: node adicionar-chaves-luiza-banco.js');
            console.log('');
            return;
        }
        
        console.log(`👤 Usuário: ${dadosLuiza.nome} (ID: ${dadosLuiza.userId})`);
        console.log(`📧 Email: ${dadosLuiza.email}`);
        console.log('');
        
        // ========================================
        // 🔑 ADICIONAR CHAVES BINANCE
        // ========================================
        console.log('🔶 Adicionando chaves BINANCE da Luiza...');
        
        try {
            const resultadoBinance = await gestor.adicionarChaveAPI(
                dadosLuiza.userId,
                'binance',
                dadosLuiza.binance.apiKey,
                dadosLuiza.binance.apiSecret,
                dadosLuiza.binance.testnet
            );
            
            console.log('✅ Chaves Binance adicionadas com sucesso!');
            console.log(`   📊 ID da chave: ${resultadoBinance.chaveId}`);
            console.log(`   🔐 Permissões: ${resultadoBinance.permissoes.join(', ')}`);
            console.log(`   💰 Saldos encontrados: ${Object.keys(resultadoBinance.saldoInicial).length} moedas`);
            
            // Mostrar principais saldos
            const saldosBinance = resultadoBinance.saldoInicial;
            Object.entries(saldosBinance).slice(0, 5).forEach(([moeda, dados]) => {
                console.log(`      ${moeda}: ${dados.disponivel} disponível`);
            });
            
        } catch (error) {
            console.error('❌ Erro ao adicionar chaves Binance:', error.message);
            console.log('⚠️  Continuando com Bybit...');
        }
        
        console.log('');
        
        // ========================================
        // 🔑 ADICIONAR CHAVES BYBIT
        // ========================================
        console.log('🔷 Adicionando chaves BYBIT da Luiza...');
        
        try {
            const resultadoBybit = await gestor.adicionarChaveAPI(
                dadosLuiza.userId,
                'bybit',
                dadosLuiza.bybit.apiKey,
                dadosLuiza.bybit.apiSecret,
                dadosLuiza.bybit.testnet
            );
            
            console.log('✅ Chaves Bybit adicionadas com sucesso!');
            console.log(`   📊 ID da chave: ${resultadoBybit.chaveId}`);
            console.log(`   🔐 Permissões: ${resultadoBybit.permissoes.join(', ')}`);
            console.log(`   💰 Saldos encontrados: ${Object.keys(resultadoBybit.saldoInicial).length} moedas`);
            
            // Mostrar principais saldos
            const saldosBybit = resultadoBybit.saldoInicial;
            Object.entries(saldosBybit).slice(0, 5).forEach(([moeda, dados]) => {
                console.log(`      ${moeda}: ${dados.disponivel} disponível`);
            });
            
        } catch (error) {
            console.error('❌ Erro ao adicionar chaves Bybit:', error.message);
        }
        
        console.log('');
        
        // ========================================
        // 📊 VERIFICAR DADOS COMPLETOS
        // ========================================
        console.log('📊 Verificando dados completos da Luiza...');
        
        try {
            const dadosCompletos = await gestor.obterDadosUsuarioParaTrading(dadosLuiza.userId);
            
            console.log('✅ Dados completos recuperados:');
            console.log(`   👤 Usuário: ${dadosCompletos.usuario?.username || 'Luiza'}`);
            console.log(`   🔑 Exchanges configuradas: ${dadosCompletos.exchangesConfiguradas.join(', ')}`);
            console.log(`   ⚙️  Parametrizações: ${dadosCompletos.parametrizacoes ? 'Configuradas' : 'Padrão'}`);
            console.log(`   🌐 Modo: ${dadosCompletos.modoOperacao}`);
            
            // Mostrar chaves por exchange
            Object.entries(dadosCompletos.chaves).forEach(([exchange, chaves]) => {
                console.log(`   🔐 ${exchange.toUpperCase()}: ${chaves.source} (${chaves.testnet ? 'TESTNET' : 'PRODUÇÃO'})`);
            });
            
        } catch (error) {
            console.error('❌ Erro ao verificar dados completos:', error.message);
        }
        
        console.log('');
        
        // ========================================
        // 🎯 TESTE DE PREPARAÇÃO PARA TRADING
        // ========================================
        console.log('🎯 Testando preparação para trading...');
        
        try {
            const operacaoTeste = await gestor.prepararOperacaoRobo(
                dadosLuiza.userId,
                'binance',
                'BTCUSDT'
            );
            
            console.log('✅ Operação de teste preparada com sucesso!');
            console.log(`   💱 Exchange: ${operacaoTeste.exchange}`);
            console.log(`   🪙 Símbolo: ${operacaoTeste.simbolo}`);
            console.log(`   🔐 Fonte das chaves: ${operacaoTeste.source}`);
            console.log(`   ⚖️  Alavancagem padrão: ${operacaoTeste.limites.alavancagem}x`);
            console.log(`   💰 Percentual do saldo: ${operacaoTeste.limites.percentualSaldo}%`);
            
        } catch (error) {
            console.error('❌ Erro no teste de preparação:', error.message);
        }
        
        console.log('');
        console.log('🎉 PROCESSO CONCLUÍDO!');
        console.log('=====================');
        console.log('✅ Chaves da Luiza foram adicionadas ao banco PostgreSQL');
        console.log('✅ Sistema configurado para operações multi-usuário');
        console.log('✅ Pronto para trading com chaves individuais da Luiza');
        
    } catch (error) {
        console.error('❌ ERRO GERAL:', error.message);
        console.error('Stack:', error.stack);
    }
}

// ========================================
// 🚀 EXECUTAR SCRIPT
// ========================================
if (require.main === module) {
    adicionarChavesLuiza()
        .then(() => {
            console.log('✅ Script executado com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Erro na execução:', error.message);
            process.exit(1);
        });
}

module.exports = { adicionarChavesLuiza };
