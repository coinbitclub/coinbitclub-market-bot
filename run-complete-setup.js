// ========================================
// MARKETBOT - SCRIPT EXECUTOR PRINCIPAL
// Validação e Correção Completa para 100%
// ========================================

const { execSync } = require('child_process');
const fs = require('fs');

class MarketBotCompleteSetup {
  constructor() {
    this.startTime = Date.now();
  }

  log(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
  }

  async run() {
    console.log('🚀 MARKETBOT - SETUP COMPLETO PARA 100%');
    console.log('======================================');
    console.log('Executando validação e correções automáticas');
    console.log('======================================\n');

    try {
      // 1. Executar correções automáticas primeiro
      this.log('🔧 FASE 1: Aplicando correções automáticas...');
      console.log('\n' + '='.repeat(60));
      execSync('node fix-sprints-1-5-auto.js', { stdio: 'inherit' });
      
      this.log('✅ Correções automáticas concluídas');
      
      // 2. Aguardar um pouco para estabilizar
      this.log('⏳ Aguardando estabilização...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 3. Executar validação completa
      this.log('🔍 FASE 2: Executando validação completa...');
      console.log('\n' + '='.repeat(60));
      execSync('node validate-sprints-1-5-complete.js', { stdio: 'inherit' });
      
      this.log('✅ Validação completa concluída');
      
      // 4. Relatório final
      this.generateSummaryReport();
      
    } catch (error) {
      console.error('\n❌ Erro durante execução:', error.message);
      this.log('❌ Processo interrompido devido a erro');
    }
  }

  generateSummaryReport() {
    const endTime = Date.now();
    const duration = Math.round((endTime - this.startTime) / 1000);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 RELATÓRIO FINAL - SETUP COMPLETO MARKETBOT');
    console.log('='.repeat(60));
    
    console.log(`⏱️  Tempo total de execução: ${duration} segundos`);
    console.log(`📅 Data/Hora: ${new Date().toLocaleString()}`);
    
    console.log('\n📋 PROCESSOS EXECUTADOS:');
    console.log('1. ✅ Correções automáticas aplicadas');
    console.log('2. ✅ Validação completa executada');
    console.log('3. ✅ Relatórios gerados');
    
    console.log('\n🎉 PRÓXIMOS PASSOS:');
    console.log('1. Verificar o relatório de validação acima');
    console.log('2. Se algum item não estiver 100%, executar correções manuais');
    console.log('3. Testar endpoints via Postman/Insomnia');
    console.log('4. Executar testes de carga se necessário');
    
    console.log('\n🚀 COMANDOS ÚTEIS:');
    console.log('• Validar novamente: node validate-sprints-1-5-complete.js');
    console.log('• Aplicar correções: node fix-sprints-1-5-auto.js');
    console.log('• Testar API: npm test');
    console.log('• Iniciar servidor: npm start');
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ MARKETBOT SETUP COMPLETO - VERIFIQUE OS RESULTADOS ACIMA');
    console.log('='.repeat(60));
  }
}

// ========================================
// EXECUÇÃO
// ========================================

const setup = new MarketBotCompleteSetup();
setup.run().catch(console.error);

module.exports = MarketBotCompleteSetup;
