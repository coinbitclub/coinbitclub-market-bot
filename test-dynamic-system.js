/**
 * 🧪 TESTE DO SISTEMA DINÂMICO
 * 
 * Script para testar funcionalidades:
 * - Recarregamento dinâmico
 * - Validação automática
 * - Adição de chaves em tempo real
 */

const { TradingMultiuserDynamic } = require('./multiuser-trading-system-dynamic');
const { triggerReload } = require('./dynamic-reloader');

console.log('🧪 TESTE DO SISTEMA DINÂMICO');
console.log('============================');

async function testarSistemaDinamico() {
    const sistema = new TradingMultiuserDynamic();
    
    try {
        // 1. Inicializar sistema
        console.log('\n1️⃣ Inicializando sistema...');
        await sistema.inicializar();
        
        // 2. Mostrar estatísticas iniciais
        setTimeout(() => {
            console.log('\n📊 ESTATÍSTICAS INICIAIS:');
            const stats = sistema.obterEstatisticas();
            console.log(`   👥 Total de usuários: ${stats.totalUsers}`);
            console.log(`   🟢 Usuários online: ${stats.onlineUsers}`);
            console.log(`   💰 Balance total: $${stats.totalBalance}`);
            console.log(`   🔄 Último reload: ${stats.lastReload || 'Inicial'}`);
        }, 15000);
        
        // 3. Teste de adição de nova chave (simulação)
        setTimeout(async () => {
            console.log('\n🧪 TESTE: Simulando adição de nova chave...');
            
            // Simulação - em produção isso seria feito via interface
            const resultado = await sistema.adicionarChaveComValidacaoAutomatica(
                12, // ID da Paloma
                'bybit',
                'TESTE_API_KEY_' + Date.now(),
                'TESTE_SECRET_KEY_' + crypto.randomBytes(32).toString('hex'),
                'testnet'
            );
            
            console.log('📋 Resultado da adição:', resultado);
        }, 30000);
        
        // 4. Teste de recarregamento manual
        setTimeout(() => {
            console.log('\n🔄 TESTE: Disparando recarregamento manual...');
            triggerReload('teste_manual');
        }, 60000);
        
        // 5. Estatísticas finais
        setTimeout(() => {
            console.log('\n📊 ESTATÍSTICAS FINAIS:');
            const stats = sistema.obterEstatisticas();
            console.log(`   📈 Total de operações: ${stats.totalOperations}`);
            console.log(`   ✅ Operações bem-sucedidas: ${stats.successfulOperations}`);
            console.log(`   ❌ Erros: ${stats.errors}`);
            console.log(`   🔄 Último reload: ${stats.lastReload}`);
            console.log(`   📊 Reloader stats:`, stats.reloaderStats);
        }, 90000);
        
        // 6. Instruções para teste manual
        console.log('\n💡 PARA TESTAR MANUALMENTE:');
        console.log('==========================');
        console.log('1. Adicione um usuário no banco de dados');
        console.log('2. Adicione chaves API para este usuário');
        console.log('3. Observe o recarregamento automático em ~30 segundos');
        console.log('4. Modifique validation_status de uma chave');
        console.log('5. Observe as mudanças sendo detectadas');
        
        console.log('\n🎯 SISTEMA EM EXECUÇÃO - Monitoramento ativo!');
        console.log('Press Ctrl+C para parar...');
        
        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n⏹️ Encerrando teste...');
            await sistema.parar();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        await sistema.parar();
    }
}

// Executar teste
testarSistemaDinamico().catch(console.error);
