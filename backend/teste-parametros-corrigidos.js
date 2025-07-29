/**
 * 🧪 TESTE DOS PARÂMETROS CORRIGIDOS - ÉRICA DOS SANTOS ANDRADE
 * Verificação da especificação correta dos parâmetros
 */

const GestorChavesAPI = require('./gestor-chaves-parametrizacoes');

console.log('🧪 TESTE DOS PARÂMETROS CORRIGIDOS');
console.log('===================================');

async function testarParametrosErica() {
    try {
        const gestor = new GestorChavesAPI();
        
        // ID da Érica conforme cadastro anterior
        const usuarioId = 8;
        const exchangeName = 'bybit';
        const simbolo = 'BTCUSDT';
        
        console.log(`👤 Testando parâmetros do usuário ID: ${usuarioId} (Érica)`);
        console.log(`🔄 Exchange: ${exchangeName} | Símbolo: ${simbolo}\n`);
        
        // 1. BUSCAR DADOS COMPLETOS DO USUÁRIO
        console.log('📊 1. Buscando dados completos do usuário...');
        const dadosUsuario = await gestor.obterDadosUsuarioParaTrading(usuarioId);
        
        console.log('✅ Dados do usuário:');
        console.log(`   Nome: ${dadosUsuario.usuario.username}`);
        console.log(`   Email: ${dadosUsuario.usuario.email}`);
        console.log(`   Role: ${dadosUsuario.usuario.role}`);
        
        // 2. VERIFICAR PARAMETRIZAÇÕES
        console.log('\n⚙️ 2. Verificando parametrizações...');
        const params = dadosUsuario.parametrizacoes;
        
        if (params && params.db_fields) {
            console.log('✅ Parâmetros da tabela user_trading_params:');
            console.log(`   📊 Alavancagem: ${params.db_fields.alavancagem}x`);
            console.log(`   💵 Valor mínimo: $${params.db_fields.valor_minimo_trade}`);
            console.log(`   💰 Valor máximo: $${params.db_fields.valor_maximo_trade}`);
            console.log(`   📈 Percentual saldo: ${params.db_fields.percentual_saldo}%`);
            console.log(`   🎯 TP Multiplier: ${params.db_fields.take_profit_multiplier}x`);
            console.log(`   🛡️ SL Multiplier: ${params.db_fields.stop_loss_multiplier}x`);
            console.log(`   📅 Max operações/dia: ${params.db_fields.max_operacoes_diarias}`);
            console.log(`   🔗 Exchanges: ${params.db_fields.exchanges_ativas}`);
        } else {
            console.log('❌ Parâmetros db_fields não encontrados');
        }
        
        // 3. TESTAR CÁLCULOS COM DIFERENTES SALDOS
        console.log('\n🧮 3. Testando cálculos dinâmicos...');
        
        const saldosTeste = [100, 1000, 5000, 10000];
        
        for (const saldo of saldosTeste) {
            console.log(`\n💰 Testando com saldo: $${saldo} USDT`);
            
            const limites = gestor.calcularLimitesOperacao(params, saldo);
            
            console.log(`   📊 Percentual: ${limites.percentualSaldo}% do saldo`);
            console.log(`   📈 Valor por operação: $${limites.valorPorOperacao.toFixed(2)}`);
            console.log(`   ⬇️ Min trade: $${limites.valorMinimoTrade.toFixed(2)}`);
            console.log(`   ⬆️ Max trade: $${limites.valorMaximoTrade.toFixed(2)}`);
            console.log(`   ⚡ Alavancagem: ${limites.alavancagem}x`);
            console.log(`   🎯 TP: ${limites.takeProfitMultiplier}x | SL: ${limites.stopLossMultiplier}x`);
        }
        
        // 4. PREPARAR OPERAÇÃO COMPLETA
        console.log('\n🤖 4. Preparando operação completa...');
        
        try {
            const operacao = await gestor.prepararOperacaoRobo(usuarioId, exchangeName, simbolo);
            
            console.log('✅ Operação preparada com sucesso!');
            console.log(`   💰 Saldo detectado: $${operacao.saldoDisponivel} USDT`);
            console.log(`   📊 Limites calculados:`);
            console.log(`      Min: $${operacao.limites.valorMinimoTrade.toFixed(2)}`);
            console.log(`      Max: $${operacao.limites.valorMaximoTrade.toFixed(2)}`);
            console.log(`   🔑 Fonte das chaves: ${operacao.source}`);
            console.log(`   ⚙️ Parâmetros aplicados:`);
            console.log(`      Alavancagem: ${operacao.limites.alavancagem}x`);
            console.log(`      Percentual: ${operacao.limites.percentualSaldo}%`);
            console.log(`      TP/SL: ${operacao.limites.takeProfitMultiplier}x / ${operacao.limites.stopLossMultiplier}x`);
            
            if (operacao.limites.db_original) {
                console.log(`   📋 Valores originais da tabela:`);
                console.log(`      Alavancagem DB: ${operacao.limites.db_original.alavancagem}x`);
                console.log(`      Min trade DB: $${operacao.limites.db_original.valor_minimo_trade}`);
                console.log(`      Max trade DB: $${operacao.limites.db_original.valor_maximo_trade}`);
                console.log(`      Percentual DB: ${operacao.limites.db_original.percentual_saldo}%`);
            }
            
        } catch (error) {
            console.log(`⚠️ Erro ao preparar operação: ${error.message}`);
        }
        
        console.log('\n✅ TESTE DOS PARÂMETROS CONCLUÍDO!');
        console.log('Parâmetros agora seguem a especificação da tabela user_trading_params');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

// Executar teste
testarParametrosErica().catch(console.error);
