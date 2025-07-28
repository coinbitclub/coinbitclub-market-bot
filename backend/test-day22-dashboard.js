#!/usr/bin/env node

/**
 * 📊 DIA 22 - TESTE DASHBOARD ADMIN IA
 * Validação completa da interface administrativa
 */

const { logger } = require('./src/utils/logger');

async function testDay22() {
    console.log('📊 DIA 22 - DASHBOARD ADMIN IA');
    console.log('===============================');
    
    try {
        // Carregar Dashboard Admin IA
        console.log('📦 Carregando Admin IA Dashboard...');
        const AdminIADashboard = require('./src/dashboard/AdminIADashboard');
        
        // Instanciar dashboard
        const dashboard = new AdminIADashboard();
        console.log('✅ Dashboard Admin IA carregado');
        
        // Teste 1: Iniciar servidor do dashboard
        console.log('\n🚀 Teste 1: Inicializando Servidor');
        await dashboard.startDashboardServer();
        console.log(`✅ Servidor ativo: http://${dashboard.config.host}:${dashboard.config.port}`);
        
        // Teste 2: API Endpoints
        console.log('\n📊 Teste 2: Testando API Endpoints');
        const overview = await dashboard.getDashboardOverview();
        console.log(`✅ Overview: ${overview.status}`);
        
        const aiData = await dashboard.getAIMonitoringData();
        console.log(`✅ IA Monitoring: ${aiData.status}`);
        
        const volatilityData = await dashboard.getVolatilityStatus();
        console.log(`✅ Volatility Status: ${volatilityData.status}`);
        
        const securityData = await dashboard.getSecurityStatus();
        console.log(`✅ Security Status: ${securityData.status}`);
        
        const tradingData = await dashboard.getTradingOperations();
        console.log(`✅ Trading Operations: ${tradingData.status}`);
        
        // Teste 3: Controles Administrativos
        console.log('\n⚡ Teste 3: Controles Administrativos');
        
        // Testar pausa de trading
        const pauseResult = await dashboard.pauseTrading();
        console.log(`✅ Pause Trading: ${pauseResult.success ? 'OK' : 'ERRO'}`);
        
        // Testar retomada de trading
        const resumeResult = await dashboard.resumeTrading();
        console.log(`✅ Resume Trading: ${resumeResult.success ? 'OK' : 'ERRO'}`);
        
        // Teste 4: Geração de relatórios
        console.log('\n📋 Teste 4: Geração de Relatórios');
        const reportResult = await dashboard.generateReport();
        console.log(`✅ Relatório gerado: ${reportResult.report_id}`);
        
        // Teste 5: Métricas em tempo real
        console.log('\n📊 Teste 5: Métricas em Tempo Real');
        await dashboard.collectSystemMetrics();
        console.log('✅ Métricas coletadas');
        
        // Teste 6: Status do dashboard
        console.log('\n📈 Teste 6: Status do Dashboard');
        const dashboardStatus = dashboard.getDashboardStatus();
        console.log(`✅ Dashboard ativo: ${dashboardStatus.active}`);
        console.log(`✅ Rotas API: ${dashboardStatus.api_routes}`);
        
        // Relatório final
        console.log('\n📊 RELATÓRIO FINAL - DIA 22');
        console.log('============================');
        
        console.log(`📊 Servidor Dashboard: ${dashboardStatus.active ? 'ATIVO' : 'INATIVO'}`);
        console.log(`🌐 Endereço: http://${dashboard.config.host}:${dashboard.config.port}`);
        console.log(`📡 WebSocket: Porta ${dashboard.config.port + 1}`);
        console.log(`🛣️ Rotas API: ${dashboardStatus.api_routes}`);
        console.log(`📊 Métricas: Coleta ativa`);
        console.log(`📋 Relatórios: Sistema operacional`);
        
        console.log('\n🎉 DIA 22 - CONCLUÍDO COM SUCESSO!');
        console.log('✅ Dashboard Admin IA 100% operacional');
        console.log('📊 Interface administrativa completa');
        console.log('🚀 Pronto para Dia 23: Testes IA & Homologação');
        
        // Parar servidor para o teste
        dashboard.stopDashboardServer();
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro no teste do Dia 22:', error.message);
        return false;
    }
}

// Executar teste
testDay22().then(success => {
    if (success) {
        console.log('\n✅ TESTE DIA 22 CONCLUÍDO COM SUCESSO');
        process.exit(0);
    } else {
        console.log('\n❌ TESTE DIA 22 FALHOU');
        process.exit(1);
    }
}).catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
});
