/**
 * 🧹 LIMPEZA LOCAL DE DADOS DE TESTE
 * Remove arquivos e dados locais de teste para operação real limpa
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 LIMPEZA LOCAL PRÉ-OPERAÇÃO REAL');
console.log('=================================');
console.log('📅 Data:', new Date().toLocaleDateString('pt-BR'));
console.log('⏰ Hora:', new Date().toLocaleTimeString('pt-BR'));
console.log('');

async function executarLimpezaLocal() {
    
    // ===================================
    // 1. LIMPEZA DE ARQUIVOS DE TESTE
    // ===================================
    
    console.log('📁 1. LIMPEZA DE ARQUIVOS DE TESTE');
    console.log('=================================');
    
    const arquivosParaRemover = [
        'test-data.json',
        'sinais-teste.json',
        'usuarios-demo.json',
        'operacoes-teste.json',
        'logs-teste.txt',
        'backup-teste.sql',
        'debug.log',
        'test.log'
    ];
    
    let arquivosRemovidos = 0;
    
    arquivosParaRemover.forEach(arquivo => {
        const caminhoArquivo = path.join(__dirname, arquivo);
        if (fs.existsSync(caminhoArquivo)) {
            try {
                fs.unlinkSync(caminhoArquivo);
                console.log(`   ✅ Removido: ${arquivo}`);
                arquivosRemovidos++;
            } catch (error) {
                console.log(`   ❌ Erro ao remover ${arquivo}: ${error.message}`);
            }
        } else {
            console.log(`   ⚪ Não existe: ${arquivo}`);
        }
    });
    
    // ===================================
    // 2. LIMPEZA DE CACHE E TEMPORÁRIOS
    // ===================================
    
    console.log('\n🗂️  2. LIMPEZA DE CACHE E TEMPORÁRIOS');
    console.log('====================================');
    
    const diretoriosTemp = [
        'temp',
        'tmp',
        'cache',
        'logs/temp'
    ];
    
    diretoriosTemp.forEach(dir => {
        const caminhoDir = path.join(__dirname, dir);
        if (fs.existsSync(caminhoDir)) {
            try {
                const arquivos = fs.readdirSync(caminhoDir);
                arquivos.forEach(arquivo => {
                    const caminhoArquivo = path.join(caminhoDir, arquivo);
                    fs.unlinkSync(caminhoArquivo);
                });
                console.log(`   ✅ Diretório ${dir} limpo (${arquivos.length} arquivos)`);
            } catch (error) {
                console.log(`   ❌ Erro ao limpar ${dir}: ${error.message}`);
            }
        } else {
            console.log(`   ⚪ Diretório ${dir} não existe`);
        }
    });
    
    // ===================================
    // 3. RESET DE VARIÁVEIS DE AMBIENTE
    // ===================================
    
    console.log('\n⚙️  3. VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE');
    console.log('==========================================');
    
    const variaveisImportantes = [
        'DATABASE_URL',
        'NODE_ENV',
        'PORT'
    ];
    
    variaveisImportantes.forEach(variaval => {
        const valor = process.env[variaval];
        if (valor) {
            // Mascarar valores sensíveis
            const valorMascarado = variaval === 'DATABASE_URL' ? 
                valor.substring(0, 20) + '...' + valor.substring(valor.length - 10) : 
                valor;
            console.log(`   ✅ ${variaval}: ${valorMascarado}`);
        } else {
            console.log(`   ⚠️  ${variaval}: NÃO DEFINIDA`);
        }
    });
    
    // ===================================
    // 4. VERIFICAÇÃO DE COMPONENTES
    // ===================================
    
    console.log('\n🔍 4. VERIFICAÇÃO DE COMPONENTES CRÍTICOS');
    console.log('=========================================');
    
    const componentesCriticos = [
        { nome: 'Backend Server', arquivo: 'api-gateway/server.cjs' },
        { nome: 'Binance Connector', arquivo: 'src/exchanges/binanceConnector.js' },
        { nome: 'Exchange Manager', arquivo: 'src/services/exchangeManager.js' },
        { nome: 'Order Executor', arquivo: 'src/trading/orderExecutor.js' }
    ];
    
    let componentesOK = 0;
    
    componentesCriticos.forEach(comp => {
        const existe = fs.existsSync(path.join(__dirname, comp.arquivo));
        if (existe) {
            console.log(`   ✅ ${comp.nome}: PRESENTE`);
            componentesOK++;
        } else {
            console.log(`   ❌ ${comp.nome}: AUSENTE`);
        }
    });
    
    // ===================================
    // 5. CRIAÇÃO DE ESTRUTURA LIMPA
    // ===================================
    
    console.log('\n🏗️  5. PREPARAÇÃO DE ESTRUTURA LIMPA');
    console.log('===================================');
    
    // Criar diretório de logs se não existir
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
        console.log('   ✅ Diretório logs/ criado');
    } else {
        console.log('   ✅ Diretório logs/ já existe');
    }
    
    // Criar arquivo de log para operação real
    const logOperacaoReal = path.join(logsDir, 'operacao-real.log');
    const timestampInicio = new Date().toISOString();
    const logContent = `[${timestampInicio}] INÍCIO OPERAÇÃO REAL - Sistema limpo e preparado\n`;
    
    fs.writeFileSync(logOperacaoReal, logContent);
    console.log('   ✅ Log de operação real iniciado');
    
    // ===================================
    // 6. CONFIGURAÇÃO PADRÃO PARA PRODUÇÃO
    // ===================================
    
    console.log('\n⚙️  6. CONFIGURAÇÃO PADRÃO PARA PRODUÇÃO');
    console.log('=======================================');
    
    const configProducao = {
        ambiente: 'PRODUCTION',
        debug: false,
        testnet: false,
        maxUsuariosSimultaneos: 100,
        limiteOperacoesPorMinuto: 60,
        parametrosDefault: {
            maxExposure: 1000.00,
            riskPercentage: 2.00,
            stopLossPercentage: 2.00,
            takeProfitPercentage: 6.00
        },
        exchanges: {
            binance: {
                timeout: 30000,
                recvWindow: 5000
            }
        }
    };
    
    const configPath = path.join(__dirname, 'config-producao.json');
    fs.writeFileSync(configPath, JSON.stringify(configProducao, null, 2));
    console.log('   ✅ Configuração de produção criada');
    
    // ===================================
    // 7. RESULTADO FINAL
    // ===================================
    
    console.log('\n🎯 7. RESULTADO DA LIMPEZA');
    console.log('=========================');
    
    console.log(`📁 Arquivos removidos: ${arquivosRemovidos}`);
    console.log(`🔧 Componentes verificados: ${componentesOK}/${componentesCriticos.length}`);
    console.log(`⚙️  Configuração: PRODUÇÃO`);
    console.log(`📝 Log iniciado: ${logOperacaoReal}`);
    
    if (componentesOK === componentesCriticos.length) {
        console.log('\n✅ LIMPEZA LOCAL CONCLUÍDA COM SUCESSO!');
        console.log('=====================================');
        console.log('🎯 Sistema local preparado para operação real');
        console.log('🧹 Dados de teste removidos');
        console.log('⚙️  Configuração de produção ativa');
        console.log('📝 Logs de operação real iniciados');
        console.log('');
        console.log('🚀 PRÓXIMOS PASSOS:');
        console.log('   1. Verificar conexão com banco de dados');
        console.log('   2. Validar API keys dos usuários');
        console.log('   3. Testar webhook TradingView');
        console.log('   4. Iniciar sistema para operação real');
        
        return true;
    } else {
        console.log('\n⚠️  LIMPEZA INCOMPLETA - VERIFICAR COMPONENTES');
        console.log('============================================');
        console.log('❌ Alguns componentes críticos estão ausentes');
        console.log('🔧 Execute primeiro: node executar-fase2-operacoes-reais.js');
        
        return false;
    }
}

// Executar limpeza local
if (require.main === module) {
    executarLimpezaLocal()
        .then((sucesso) => {
            if (sucesso) {
                console.log('\n🎉 SISTEMA PREPARADO - PRONTO PARA OPERAÇÃO REAL!');
                process.exit(0);
            } else {
                console.log('\n⚠️  PREPARAÇÃO INCOMPLETA - VERIFICAR COMPONENTES');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('\n💥 ERRO NA LIMPEZA LOCAL:', error);
            process.exit(1);
        });
}

module.exports = { executarLimpezaLocal };
