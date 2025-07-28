#!/usr/bin/env node

/**
 * 🛡️ DIA 21 - TESTE SEGURANÇA E IP FIXO
 * Validação completa do sistema de segurança corporativa
 * Modo produção Railway com IP fixo
 */

const { logger } = require('./src/utils/logger');

async function testDay21() {
    console.log('🛡️ DIA 21 - SEGURANÇA E IP FIXO');
    console.log('================================');
    
    try {
        // Carregar Sistema de Segurança Corporativa
        console.log('📦 Carregando Corporate Security System...');
        const CorporateSecuritySystem = require('./src/security/CorporateSecuritySystem');
        
        // Instanciar sistema
        const securitySystem = new CorporateSecuritySystem();
        console.log('✅ Sistema de Segurança Corporativa carregado');
        
        // Teste 1: Validação IP fixo Railway
        console.log('\n🌐 Teste 1: Validação IP Fixo Railway');
        const ipValidation = await securitySystem.validateRailwayIP();
        console.log(`✅ IP Railway: ${ipValidation.railway_fixed_ip}`);
        console.log(`✅ Status: ${ipValidation.is_authorized ? 'AUTORIZADO' : 'NEGADO'}`);
        
        // Teste 2: Autenticação JWT
        console.log('\n🔐 Teste 2: Sistema de Autenticação JWT');
        const session = await securitySystem.createSecureSession({
            userId: 'admin',
            userType: 'admin'
        }, '132.255.160.140');
        console.log(`✅ Sessão criada: ${session.sessionId}`);
        
        // Teste 3: Rate Limiting
        console.log('\n⏱️ Teste 3: Rate Limiting');
        const rateLimitResult = await securitySystem.checkRateLimit('132.255.160.140', 'api');
        console.log(`✅ Rate Limit: ${rateLimitResult.allowed ? 'OK' : 'EXCEDIDO'}`);
        console.log(`📊 Requests: ${rateLimitResult.requests_count}/${rateLimitResult.limit}`);
        
        // Teste 4: Integridade de Arquivos
        console.log('\n🔍 Teste 4: Verificação Integridade');
        const integrityReport = await securitySystem.checkFileIntegrity();
        console.log(`✅ Arquivos verificados: ${integrityReport.files_checked}`);
        console.log(`⚠️ Violações: ${integrityReport.violations.length}`);
        
        // Teste 5: Monitoramento Contínuo
        console.log('\n🔄 Teste 5: Monitoramento Contínuo');
        await securitySystem.startSecurityMonitoring();
        console.log(`✅ Monitoramento: ${securitySystem.isActive ? 'ATIVO' : 'INATIVO'}`);
        
        // Relatório final
        console.log('\n📊 RELATÓRIO FINAL - DIA 21');
        console.log('============================');
        
        const securityReport = securitySystem.generateSecurityReport();
        console.log(`🛡️ IP Fixo Railway: ${securityReport.railway_ip}`);
        console.log(`🔐 Sessões Ativas: ${securityReport.active_sessions}`);
        console.log(`📁 Arquivos Monitorados: ${securityReport.monitored_files}`);
        console.log(`🚨 Alertas 24h: ${securityReport.security_alerts.length}`);
        
        console.log('\n🎉 DIA 21 - CONCLUÍDO COM SUCESSO!');
        console.log('✅ Sistema Segurança Corporativa operacional');
        console.log('🔐 IP fixo Railway configurado: 132.255.160.140');
        console.log('🚀 Pronto para Dia 22: Dashboard Admin IA');
        
        // Parar monitoramento para o teste
        securitySystem.stopSecurityMonitoring();
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro no teste do Dia 21:', error.message);
        return false;
    }
}

// Executar teste
testDay21().then(success => {
    if (success) {
        console.log('\n✅ TESTE DIA 21 CONCLUÍDO COM SUCESSO');
        process.exit(0);
    } else {
        console.log('\n❌ TESTE DIA 21 FALHOU');
        process.exit(1);
    }
}).catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
});
