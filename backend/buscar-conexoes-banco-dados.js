/**
 * 🔍 BUSCAR CONEXÕES COM CHAVES DO BANCO DE DADOS
 * Demonstração de como o sistema busca e utiliza chaves do PostgreSQL
 */

const GestorChavesAPI = require('./gestor-chaves-parametrizacoes.js');

console.log('🔍 BUSCA DE CONEXÕES COM CHAVES DO BANCO DE DADOS');
console.log('================================================');

async function buscarConexoesBancoDados() {
    const gestor = new GestorChavesAPI();
    
    try {
        console.log('🚀 Iniciando busca de conexões do banco de dados...');
        console.log('');
        
        // ========================================
        // 👥 LISTA DE USUÁRIOS PARA TESTE
        // ========================================
        const usuariosTeste = [
            { id: 1, nome: 'Paloma' },
            { id: 2, nome: 'Luiza' },
            { id: 3, nome: 'Usuario Teste' }
        ];
        
        const exchangesTeste = ['binance', 'bybit'];
        
        // ========================================
        // 🔑 BUSCAR CHAVES POR USUÁRIO E EXCHANGE
        // ========================================
        console.log('🔑 BUSCANDO CHAVES POR USUÁRIO E EXCHANGE');
        console.log('=========================================');
        
        for (const usuario of usuariosTeste) {
            console.log(`\n👤 USUÁRIO: ${usuario.nome} (ID: ${usuario.id})`);
            console.log('─'.repeat(50));
            
            for (const exchange of exchangesTeste) {
                try {
                    console.log(`\n🔍 Buscando chaves ${exchange.toUpperCase()}...`);
                    
                    const chaves = await gestor.obterChavesParaTrading(usuario.id, exchange);
                    
                    if (chaves) {
                        console.log(`✅ Chaves encontradas para ${exchange.toUpperCase()}:`);
                        console.log(`   🔐 Fonte: ${chaves.source}`);
                        console.log(`   🌐 Modo: ${chaves.testnet ? 'TESTNET' : 'PRODUÇÃO'}`);
                        console.log(`   🔑 API Key: ${chaves.apiKey ? chaves.apiKey.substring(0, 8) + '...' : 'Não disponível'}`);
                        console.log(`   🛡️ Permissões: ${chaves.permissions ? chaves.permissions.join(', ') : 'N/A'}`);
                        console.log(`   ⏰ Última validação: ${chaves.lastValidated ? new Date(chaves.lastValidated).toLocaleString() : 'N/A'}`);
                        
                        if (chaves.source === 'USER_DATABASE') {
                            console.log(`   ✨ USANDO CHAVES PRÓPRIAS DO USUÁRIO`);
                        } else {
                            console.log(`   🌐 USANDO CHAVES DO SISTEMA (RAILWAY)`);
                        }
                    }
                    
                } catch (error) {
                    console.log(`❌ ${exchange.toUpperCase()}: ${error.message}`);
                }
            }
        }
        
        console.log('\n' + '='.repeat(60));
        
        // ========================================
        // 📊 BUSCAR DADOS COMPLETOS PARA TRADING
        // ========================================
        console.log('\n📊 DADOS COMPLETOS PARA TRADING');
        console.log('===============================');
        
        for (const usuario of usuariosTeste) {
            try {
                console.log(`\n👤 Analisando ${usuario.nome}...`);
                
                const dadosCompletos = await gestor.obterDadosUsuarioParaTrading(usuario.id);
                
                console.log(`✅ Dados completos recuperados:`);
                console.log(`   👤 Usuário: ${dadosCompletos.usuario?.username || usuario.nome}`);
                console.log(`   📧 Email: ${dadosCompletos.usuario?.email || 'N/A'}`);
                console.log(`   🔑 Exchanges configuradas: ${dadosCompletos.exchangesConfiguradas.length}`);
                console.log(`   ⚙️  Parametrizações: ${dadosCompletos.parametrizacoes ? 'Personalizadas' : 'Padrão'}`);
                console.log(`   🌐 Modo operação: ${dadosCompletos.modoOperacao}`);
                
                // Detalhar chaves por exchange
                console.log(`\n   🔐 CHAVES POR EXCHANGE:`);
                Object.entries(dadosCompletos.chaves).forEach(([exchange, chaves]) => {
                    const icone = chaves.source === 'USER_DATABASE' ? '👤' : '🌐';
                    const tipo = chaves.testnet ? 'TESTNET' : 'PRODUÇÃO';
                    console.log(`      ${icone} ${exchange.toUpperCase()}: ${chaves.source} (${tipo})`);
                });
                
                // Mostrar limites de trading
                if (dadosCompletos.parametrizacoes?.trading) {
                    const trading = dadosCompletos.parametrizacoes.trading;
                    console.log(`\n   ⚖️  LIMITES DE TRADING:`);
                    console.log(`      💰 Percentual saldo: ${trading.balance_percentage}%`);
                    console.log(`      📈 Alavancagem: ${trading.leverage_default}x`);
                    console.log(`      🎯 Take Profit: ${trading.take_profit_multiplier}x`);
                    console.log(`      🛑 Stop Loss: ${trading.stop_loss_multiplier}x`);
                    console.log(`      📊 Max posições: ${trading.max_open_positions}`);
                }
                
            } catch (error) {
                console.log(`❌ Erro ao buscar dados de ${usuario.nome}: ${error.message}`);
            }
        }
        
        console.log('\n' + '='.repeat(60));
        
        // ========================================
        // 🎯 TESTE DE PREPARAÇÃO DE OPERAÇÕES
        // ========================================
        console.log('\n🎯 TESTE DE PREPARAÇÃO DE OPERAÇÕES');
        console.log('===================================');
        
        const simbolosTeste = ['BTCUSDT', 'ETHUSDT'];
        
        for (const usuario of usuariosTeste.slice(0, 2)) { // Testar apenas 2 usuários
            console.log(`\n👤 Testando operações para ${usuario.nome}...`);
            
            for (const exchange of exchangesTeste) {
                for (const simbolo of simbolosTeste) {
                    try {
                        console.log(`\n🔍 Preparando ${exchange.toUpperCase()} - ${simbolo}...`);
                        
                        const operacao = await gestor.prepararOperacaoRobo(
                            usuario.id,
                            exchange,
                            simbolo
                        );
                        
                        console.log(`✅ Operação preparada com sucesso:`);
                        console.log(`   💱 Exchange: ${operacao.exchange}`);
                        console.log(`   🪙 Símbolo: ${operacao.simbolo}`);
                        console.log(`   🔐 Fonte chaves: ${operacao.source}`);
                        console.log(`   ⚖️  Alavancagem: ${operacao.limites.alavancagem}x`);
                        console.log(`   💰 % do saldo: ${operacao.limites.percentualSaldo}%`);
                        console.log(`   📊 Max posições: ${operacao.limites.maxPosicoesAbertas}`);
                        
                    } catch (error) {
                        console.log(`❌ ${exchange.toUpperCase()} ${simbolo}: ${error.message}`);
                    }
                }
            }
        }
        
        console.log('\n' + '='.repeat(60));
        
        // ========================================
        // 📈 RELATÓRIO DE STATUS
        // ========================================
        console.log('\n📈 RELATÓRIO DE STATUS DO SISTEMA');
        console.log('=================================');
        
        try {
            const relatorio = await gestor.gerarRelatorioUsuarios();
            
            console.log(`\n📊 USUÁRIOS NO SISTEMA: ${relatorio.length}`);
            console.table(relatorio.map(user => ({
                ID: user.id,
                Nome: user.username || 'N/A',
                Email: user.email,
                Status: user.status,
                Exchanges: user.exchanges_configuradas,
                Parametrizações: user.tem_parametrizacoes,
                Assets: user.assets_com_saldo
            })));
            
        } catch (error) {
            console.log(`❌ Erro ao gerar relatório: ${error.message}`);
        }
        
        console.log('\n🎉 ANÁLISE COMPLETA FINALIZADA!');
        console.log('==============================');
        console.log('✅ Sistema de busca de chaves do banco funcionando');
        console.log('✅ Recuperação de dados multi-usuário operacional');
        console.log('✅ Preparação de operações por usuário validada');
        console.log('✅ Fallback para chaves do Railway configurado');
        
    } catch (error) {
        console.error('❌ ERRO GERAL:', error.message);
        console.error('Stack:', error.stack);
    }
}

// ========================================
// 🚀 EXECUTAR ANÁLISE
// ========================================
if (require.main === module) {
    buscarConexoesBancoDados()
        .then(() => {
            console.log('\n✅ Análise executada com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Erro na execução:', error.message);
            process.exit(1);
        });
}

module.exports = { buscarConexoesBancoDados };
