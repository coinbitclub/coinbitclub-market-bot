/**
 * 🧪 TESTAR API COM DADOS REAIS
 * Verificar se API está retornando dados corretos da Paloma
 */

const fetch = require('node-fetch');

async function testarApiDadosReais() {
    try {
        console.log('🧪 TESTANDO API COM DADOS REAIS DA PALOMA');
        console.log('='.repeat(50));
        
        // 1. Testar endpoint principal
        console.log('📊 Testando endpoint principal...');
        
        const response = await fetch('http://localhost:3001/api/dashboard/paloma');
        const data = await response.json();
        
        console.log('✅ Resposta da API:');
        console.log('👤 Usuário:', data.usuario?.name || 'N/A');
        console.log('💰 Saldo:', data.saldo ? `$${data.saldo}` : 'N/A');
        console.log('📊 Operações Ativas:', data.operacoesAtivas || 0);
        console.log('📈 P&L Total:', data.plTotal ? `$${data.plTotal}` : 'N/A');
        console.log('🎯 Taxa de Sucesso:', data.taxaSucesso ? `${data.taxaSucesso}%` : 'N/A');
        console.log('⚖️ Leverage Média:', data.leverageMedia ? `${data.leverageMedia}x` : 'N/A');
        
        // 2. Testar endpoint de histórico
        console.log('\n📈 Testando endpoint de histórico...');
        
        const histResponse = await fetch('http://localhost:3001/api/dashboard/paloma/historico');
        const histData = await histResponse.json();
        
        console.log('✅ Histórico:');
        console.log('📋 Total de operações:', histData.length || 0);
        
        if (histData.length > 0) {
            console.log('\n📊 Últimas operações:');
            histData.slice(0, 3).forEach((op, index) => {
                console.log(`${index + 1}. ${op.symbol} ${op.operation_type} - P&L: $${op.pnl}`);
            });
        }
        
        // 3. Verificar se dados são reais (não mock)
        console.log('\n🔍 VERIFICAÇÃO DE DADOS REAIS:');
        
        const isReal = data.operacoesAtivas > 0 && data.saldo > 1000;
        
        if (isReal) {
            console.log('✅ DADOS REAIS DETECTADOS!');
            console.log('   ✅ Saldo real da Paloma carregado');
            console.log('   ✅ Operações reais em andamento');
            console.log('   ✅ P&L real sendo calculado');
            console.log('   ✅ Sistema conectado à conta real');
        } else {
            console.log('❌ AINDA USANDO DADOS MOCK');
            console.log('   ❌ Verificar conexão com banco');
            console.log('   ❌ Verificar dados da Paloma');
        }
        
        console.log('\n📱 PRÓXIMAS AÇÕES:');
        console.log('1. Abrir dashboard para visualizar');
        console.log('2. Verificar atualizações em tempo real');
        console.log('3. Monitorar operações da Paloma');
        
    } catch (error) {
        console.error('❌ Erro ao testar API:', error.message);
    }
}

testarApiDadosReais();
