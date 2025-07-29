/**
 * 🧪 TESTAR API DADOS PALOMA
 */

const axios = require('axios');

async function testarAPIPaloma() {
    try {
        console.log('🧪 TESTANDO API DASHBOARD PALOMA');
        console.log('='.repeat(50));
        
        const response = await axios.get('http://localhost:3001/api/dashboard/paloma');
        const dados = response.data;
        
        console.log('✅ DADOS RECEBIDOS COM SUCESSO!\n');
        
        console.log('👤 USUÁRIO:');
        console.log(`   Nome: ${dados.usuario.nome}`);
        console.log(`   Email: ${dados.usuario.email}`);
        console.log(`   Saldo: $${dados.usuario.saldoUSD}`);
        console.log(`   VIP: ${dados.usuario.vipStatus ? 'Sim' : 'Não'}`);
        
        console.log('\n📊 PERFORMANCE:');
        console.log(`   % de Acerto: ${dados.performance.percentualAcerto}%`);
        console.log(`   Retorno: ${dados.performance.retornoPercentual}%`);
        console.log(`   Lucro Total: $${dados.performance.lucroTotal}`);
        console.log(`   Total Operações: ${dados.performance.totalOperacoes}`);
        
        console.log('\n💹 OPERAÇÕES:');
        console.log(`   Ativas: ${dados.operacoes.ativas.length}`);
        console.log(`   Fechadas: ${dados.operacoes.fechadas}`);
        console.log(`   Com Lucro: ${dados.operacoes.totalLucro}`);
        console.log(`   Com Prejuízo: ${dados.operacoes.totalPrejuizo}`);
        
        if (dados.operacoes.ativas.length > 0) {
            console.log('\n📈 OPERAÇÕES ATIVAS:');
            dados.operacoes.ativas.forEach(op => {
                console.log(`   ${op.par} ${op.tipo} - $${op.valor} - ${op.minutosAberta}min`);
            });
        }
        
        console.log('\n🤖 IA SUPERVISOR:');
        console.log(`   Logs Hoje: ${dados.iaSupervisor.logsHoje}`);
        console.log(`   Sinais Rejeitados: ${dados.iaSupervisor.sinaisRejeitados}`);
        console.log(`   Taxa Sucesso: ${(((dados.iaSupervisor.logsHoje - dados.iaSupervisor.sinaisRejeitados) / dados.iaSupervisor.logsHoje) * 100).toFixed(1)}%`);
        
        console.log('\n👁️ MONITORAMENTO:');
        console.log(`   Verificações: ${dados.monitoramento.verificacoes}`);
        console.log(`   P&L Atual: $${dados.monitoramento.plAtual}`);
        console.log(`   Última Verificação: ${dados.monitoramento.ultimaVerificacao || 'N/A'}`);
        
        console.log('\n🎉 API FUNCIONANDO PERFEITAMENTE!');
        console.log('📱 Dashboard pode consumir dados reais da Paloma');
        
    } catch (error) {
        console.error('❌ ERRO AO TESTAR API:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n🔧 SOLUÇÃO:');
            console.log('   Execute: npm run api-paloma');
            console.log('   Aguarde a mensagem "API rodando na porta 3001"');
            console.log('   Depois execute este teste novamente');
        }
    }
}

testarAPIPaloma();
