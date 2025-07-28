#!/usr/bin/env node

/**
 * 🧪 EXECUTOR DE TESTES COMPLETOS
 * DIA 23: Validação Final do Sistema CoinbitClub IA
 */

const CoinbitClubIATestSuite = require('./CoinbitClubIATestSuite');
const { logger } = require('../src/utils/logger');

async function runCompleteValidation() {
    try {
        console.clear();
        console.log('🧪 =====================================');
        console.log('🚀 COINBITCLUB IA - VALIDAÇÃO COMPLETA');
        console.log('📅 DIA 23: Testes e Validação Final');
        console.log('🧪 =====================================\n');
        
        // Inicializar suite de testes
        const testSuite = new CoinbitClubIATestSuite();
        
        // Executar bateria completa
        const results = await testSuite.runFullTestSuite();
        
        // Log dos resultados
        logger.info('Validação completa executada', {
            results,
            timestamp: new Date().toISOString()
        });
        
        return results;
        
    } catch (error) {
        console.error('💥 ERRO FATAL na validação:', error.message);
        logger.error('Erro fatal na validação', error);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    runCompleteValidation()
        .then(results => {
            const successRate = ((results.passed / results.total) * 100).toFixed(1);
            
            if (successRate >= 80) {
                console.log('\n🎉 VALIDAÇÃO CONCLUÍDA COM SUCESSO!');
                process.exit(0);
            } else {
                console.log('\n⚠️ VALIDAÇÃO CONCLUÍDA COM RESSALVAS');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Erro não tratado:', error);
            process.exit(1);
        });
}

module.exports = runCompleteValidation;
