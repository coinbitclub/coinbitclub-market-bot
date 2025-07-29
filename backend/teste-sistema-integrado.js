/**
 * 🧪 TESTE DO SISTEMA INTEGRADO
 * Verificação básica dos componentes
 */

console.log('🧪 Testando componentes do sistema...');

try {
    // Testar importações
    console.log('📦 Testando importações...');
    
    const SystemOrchestrator = require('./sistema-orquestrador-completo');
    console.log('✅ SystemOrchestrator carregado');
    
    const SystemController = require('./controlador-sistema-web');
    console.log('✅ SystemController carregado');
    
    const DashboardLiveData = require('./dashboard-live-data');
    console.log('✅ DashboardLiveData carregado');
    
    // Testar criação de instâncias
    console.log('🏗️ Testando criação de instâncias...');
    
    const orchestrator = new SystemOrchestrator();
    console.log('✅ Orquestrador criado');
    
    const controller = new SystemController();
    console.log('✅ Controlador criado');
    
    const dashboard = new DashboardLiveData(orchestrator);
    console.log('✅ Dashboard Live Data criado');
    
    // Testar métodos básicos
    console.log('🔧 Testando métodos básicos...');
    
    const status = orchestrator.getSystemStatus();
    console.log('✅ Status do sistema obtido:', status);
    
    const connections = dashboard.getConnectionStats();
    console.log('✅ Estatísticas de conexões:', connections);
    
    console.log('');
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Sistema está pronto para execução');
    console.log('');
    console.log('🚀 Para iniciar o servidor completo:');
    console.log('   node servidor-integrado-completo.js');
    
} catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
    console.error('');
    console.error('🔍 Detalhes do erro:');
    console.error(error.stack);
    process.exit(1);
}
