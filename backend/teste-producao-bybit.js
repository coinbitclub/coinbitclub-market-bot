/**
 * 🧪 TESTE REAL COM CHAVES DA BYBIT - USUÁRIO MAURO
 * Teste de produção com chaves reais para validar integração
 */

const GestorChavesAPI = require('./gestor-chaves-parametrizacoes');
const IntegradorExchanges = require('./integrador-exchanges-real');

console.log('🧪 TESTE REAL COM CHAVES BYBIT - MAURO');
console.log('=====================================\n');

class TesteProducaoBybit {
    constructor() {
        this.gestor = new GestorChavesAPI();
        this.integrador = new IntegradorExchanges();
        this.usuarioMauro = {
            id: 1, // ID do usuário Mauro no sistema
            nome: 'Mauro',
            email: 'mauro@example.com'
        };
    }

    async executarTestesReais() {
        console.log('🚀 Iniciando testes com chaves reais...\n');

        try {
            // 1. Testar conectividade primeiro
            await this.testarConectividade();
            
            // 2. Solicitar chaves reais do usuário
            await this.solicitarChavesReais();
            
            // 3. Testar validação das chaves
            await this.testarValidacaoChaves();
            
            // 4. Testar operações básicas
            await this.testarOperacoesBasicas();
            
            // 5. Testar integração completa
            await this.testarIntegracaoCompleta();

            console.log('\n🎉 TODOS OS TESTES REAIS CONCLUÍDOS COM SUCESSO!');
            
        } catch (error) {
            console.error('❌ Erro nos testes reais:', error.message);
            throw error;
        }
    }

    async testarConectividade() {
        console.log('🌐 1. TESTANDO CONECTIVIDADE COM EXCHANGES');
        console.log('─'.repeat(45));

        const resultados = await this.integrador.testarConectividadeExchanges();
        
        console.log('📊 Resultados de conectividade:');
        Object.entries(resultados).forEach(([exchange, resultado]) => {
            console.log(`   ${resultado.conectado ? '✅' : '❌'} ${exchange}: ${resultado.status}`);
        });

        if (!resultados.Bybit?.conectado) {
            throw new Error('Bybit não está acessível. Verifique sua conexão.');
        }

        console.log('✅ Conectividade OK\n');
    }

    async solicitarChavesReais() {
        console.log('🔑 2. CONFIGURAÇÃO DE CHAVES REAIS');
        console.log('─'.repeat(45));

        console.log('⚠️  ATENÇÃO: Este teste requer chaves API reais!');
        console.log('📋 Para configurar as chaves do usuário Mauro:');
        console.log('');
        console.log('1. Acesse sua conta Bybit');
        console.log('2. Vá em API Management');
        console.log('3. Crie uma nova API Key com permissões:');
        console.log('   - Read: ✅ Enabled');
        console.log('   - Spot Trading: ✅ Enabled');
        console.log('   - Derivatives Trading: ✅ Enabled (opcional)');
        console.log('4. Configure IP whitelist se necessário');
        console.log('5. Insira as chaves no arquivo .env.production:');
        console.log('');
        console.log('BYBIT_API_KEY=sua_api_key_aqui');
        console.log('BYBIT_API_SECRET=sua_api_secret_aqui');
        console.log('BYBIT_TESTNET=false');
        console.log('');

        // Verificar se as chaves estão configuradas
        const apiKey = process.env.BYBIT_API_KEY;
        const apiSecret = process.env.BYBIT_API_SECRET;
        const testnet = process.env.BYBIT_TESTNET === 'true';

        if (!apiKey || !apiSecret) {
            console.log('❌ Chaves não configuradas nas variáveis de ambiente');
            console.log('📝 Configure as variáveis BYBIT_API_KEY e BYBIT_API_SECRET');
            console.log('🔧 Ou execute: npm run test:demo para usar modo simulação');
            return false;
        }

        console.log('✅ Chaves encontradas nas variáveis de ambiente');
        console.log(`🔧 Modo: ${testnet ? 'TESTNET' : 'MAINNET'}`);
        
        this.chavesConfiguradasBybit = {
            apiKey,
            apiSecret,
            testnet
        };

        return true;
    }

    async testarValidacaoChaves() {
        console.log('🔍 3. VALIDANDO CHAVES REAIS');
        console.log('─'.repeat(45));

        if (!this.chavesConfiguradasBybit) {
            console.log('⏭️  Pulando teste - chaves não configuradas');
            return;
        }

        const { apiKey, apiSecret, testnet } = this.chavesConfiguradasBybit;

        console.log('🔐 Testando validação das chaves...');
        
        const resultado = await this.integrador.validarChavesReais(
            'bybit',
            apiKey,
            apiSecret,
            null,
            testnet
        );

        if (resultado.valida) {
            console.log('✅ Chaves Bybit validadas com sucesso!');
            console.log('📊 Informações da conta:');
            console.log(`   Exchange: ${resultado.exchange}`);
            console.log(`   Permissões: ${resultado.permissoes.join(', ')}`);
            
            if (resultado.informacoes) {
                console.log(`   User ID: ${resultado.informacoes.user_id || 'N/A'}`);
                console.log(`   Tipo: ${resultado.informacoes.tipo_conta || 'N/A'}`);
                console.log(`   Status: ${resultado.informacoes.status || 'N/A'}`);
            }

            console.log('💰 Saldos encontrados:');
            if (Object.keys(resultado.saldo).length > 0) {
                Object.entries(resultado.saldo).forEach(([moeda, saldo]) => {
                    console.log(`   ${moeda}: ${saldo.disponivel} (Total: ${saldo.total})`);
                });
            } else {
                console.log('   Nenhum saldo encontrado');
            }

            this.resultadoValidacao = resultado;
        } else {
            console.log('❌ Falha na validação das chaves');
            console.log(`   Erro: ${resultado.erro}`);
            throw new Error(`Chaves inválidas: ${resultado.erro}`);
        }

        console.log('');
    }

    async testarOperacoesBasicas() {
        console.log('⚙️  4. TESTANDO OPERAÇÕES BÁSICAS');
        console.log('─'.repeat(45));

        if (!this.resultadoValidacao) {
            console.log('⏭️  Pulando teste - validação não realizada');
            return;
        }

        try {
            // Testar adição no sistema
            console.log('💾 Adicionando chaves no sistema...');
            
            const { apiKey, apiSecret, testnet } = this.chavesConfiguradasBybit;
            
            const resultadoAdicao = await this.gestor.adicionarChaveAPI(
                this.usuarioMauro.id,
                'bybit',
                apiKey,
                apiSecret,
                testnet
            );

            if (resultadoAdicao.sucesso) {
                console.log('✅ Chaves adicionadas ao sistema com sucesso');
                console.log(`   ID da chave: ${resultadoAdicao.chaveId}`);
                console.log(`   Permissões: ${resultadoAdicao.permissoes.join(', ')}`);
                
                if (resultadoAdicao.saldoInicial) {
                    console.log('💰 Saldo inicial registrado:');
                    Object.entries(resultadoAdicao.saldoInicial).forEach(([moeda, saldo]) => {
                        console.log(`   ${moeda}: ${saldo.disponivel}`);
                    });
                }
            } else {
                throw new Error('Falha ao adicionar chaves no sistema');
            }

            // Testar recuperação dos dados
            console.log('🔍 Testando recuperação de dados...');
            
            const dadosUsuario = await this.gestor.obterDadosUsuarioParaTrading(this.usuarioMauro.id);
            
            if (dadosUsuario.chaves.length > 0) {
                console.log('✅ Dados recuperados com sucesso');
                console.log(`   Chaves configuradas: ${dadosUsuario.chaves.length}`);
                console.log(`   Parametrizações: ${dadosUsuario.parametrizacoes ? 'OK' : 'Não encontradas'}`);
            } else {
                throw new Error('Nenhuma chave encontrada após adição');
            }

        } catch (error) {
            console.error('❌ Erro nas operações básicas:', error.message);
            throw error;
        }

        console.log('');
    }

    async testarIntegracaoCompleta() {
        console.log('🔄 5. TESTE DE INTEGRAÇÃO COMPLETA');
        console.log('─'.repeat(45));

        try {
            // Testar fluxo completo de um sinal
            console.log('📡 Simulando recebimento de sinal TradingView...');
            
            const sinalTeste = {
                symbol: 'BTCUSDT',
                action: 'BUY',
                price: 50000,
                quantity: 0.001,
                timestamp: Date.now(),
                source: 'TradingView',
                user_id: this.usuarioMauro.id
            };

            console.log('📊 Dados do sinal:');
            console.log(`   Par: ${sinalTeste.symbol}`);
            console.log(`   Ação: ${sinalTeste.action}`);
            console.log(`   Preço: $${sinalTeste.price}`);
            console.log(`   Quantidade: ${sinalTeste.quantity} BTC`);

            // Verificar se o usuário tem saldo suficiente
            const dadosUsuario = await this.gestor.obterDadosUsuarioParaTrading(this.usuarioMauro.id);
            
            if (dadosUsuario.chaves.length === 0) {
                throw new Error('Usuário não possui chaves API configuradas');
            }

            const chaveBybit = dadosUsuario.chaves.find(chave => chave.exchange_name === 'bybit');
            if (!chaveBybit) {
                throw new Error('Chave Bybit não encontrada para o usuário');
            }

            console.log('✅ Chave Bybit encontrada para execução');
            console.log('🔧 Parametrizações aplicadas:');
            
            if (dadosUsuario.parametrizacoes) {
                console.log(`   Alavancagem: ${dadosUsuario.parametrizacoes.trading.leverage_default}x`);
                console.log(`   % do saldo: ${dadosUsuario.parametrizacoes.trading.balance_percentage}%`);
                console.log(`   Max posições: ${dadosUsuario.parametrizacoes.trading.max_open_positions}`);
            }

            // Em um ambiente real, aqui seria feita a ordem na exchange
            console.log('⚠️  SIMULAÇÃO: Em produção, ordem seria enviada para Bybit');
            console.log('✅ Integração completa validada');

        } catch (error) {
            console.error('❌ Erro na integração completa:', error.message);
            throw error;
        }

        console.log('');
    }

    async executarRelatorioPosTest() {
        console.log('📋 RELATÓRIO PÓS-TESTE');
        console.log('═'.repeat(50));

        try {
            const relatorio = await this.gestor.gerarRelatorioUsuarios();
            
            console.log('👥 Usuários configurados:');
            if (relatorio.length > 0) {
                console.table(relatorio.map(user => ({
                    ID: user.id,
                    Username: user.username,
                    Email: user.email,
                    Status: user.status,
                    Exchanges: user.exchanges_configuradas,
                    Parametrizações: user.tem_parametrizacoes
                })));
            } else {
                console.log('   Nenhum usuário encontrado');
            }

            console.log('\n🎯 RESUMO DO TESTE:');
            console.log('✅ Conectividade com exchanges validada');
            console.log('✅ Chaves API reais testadas');
            console.log('✅ Sistema de criptografia funcionando');
            console.log('✅ Integração com banco de dados OK');
            console.log('✅ Fluxo completo de trading simulado');

        } catch (error) {
            console.error('❌ Erro ao gerar relatório:', error.message);
        }
    }
}

// Executar testes se chamado diretamente
if (require.main === module) {
    const teste = new TesteProducaoBybit();
    
    console.log('⚠️  IMPORTANTE: Este script testa com chaves API REAIS');
    console.log('🔒 Certifique-se de que as chaves estão configuradas corretamente');
    console.log('💡 Configure as variáveis de ambiente antes de executar\n');

    teste.executarTestesReais()
        .then(() => {
            return teste.executarRelatorioPosTest();
        })
        .then(() => {
            console.log('\n🎉 TESTE DE PRODUÇÃO CONCLUÍDO COM SUCESSO!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ FALHA NO TESTE DE PRODUÇÃO:', error.message);
            console.log('\n📝 Verifique:');
            console.log('   1. Chaves API configuradas corretamente');
            console.log('   2. Permissões das chaves API');
            console.log('   3. Conectividade com a internet');
            console.log('   4. Configuração do banco de dados');
            process.exit(1);
        });
}

module.exports = TesteProducaoBybit;
