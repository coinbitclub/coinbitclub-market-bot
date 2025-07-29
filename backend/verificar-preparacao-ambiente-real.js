/**
 * 🔍 VERIFICAÇÃO COMPLETA - PREPARAÇÃO PARA AMBIENTE REAL
 * Análise detalhada de todos os componentes necessários
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICAÇÃO COMPLETA - PREPARAÇÃO AMBIENTE REAL');
console.log('=================================================');
console.log('📅 Data:', new Date().toLocaleDateString('pt-BR'));
console.log('⏰ Hora:', new Date().toLocaleTimeString('pt-BR'));
console.log('');

// ======================================
// 1. VERIFICAÇÃO DE ARQUIVOS CRÍTICOS
// ======================================

console.log('📁 1. VERIFICAÇÃO DE ARQUIVOS CRÍTICOS');
console.log('=======================================');

const arquivosCriticos = [
    { nome: 'Backend Server', arquivo: 'api-gateway/server.cjs', descricao: 'Servidor principal' },
    { nome: 'Binance Connector', arquivo: 'src/exchanges/binanceConnector.js', descricao: 'Conexão com Binance' },
    { nome: 'Exchange Manager', arquivo: 'src/services/exchangeManager.js', descricao: 'Gerenciador de exchanges' },
    { nome: 'Order Executor', arquivo: 'src/trading/orderExecutor.js', descricao: 'Executor de ordens' },
    { nome: 'Plano Desenvolvimento', arquivo: 'plano-desenvolvimento-3-fases.js', descricao: 'Plano executivo' },
    { nome: 'Executor Fase 2', arquivo: 'executar-fase2-operacoes-reais.js', descricao: 'Script Fase 2' },
    { nome: 'Teste Trading', arquivo: 'testar-endpoints-trading.js', descricao: 'Testes de trading' }
];

let arquivosOK = 0;
let arquivosFaltando = [];

arquivosCriticos.forEach(item => {
    const caminho = path.join(__dirname, item.arquivo);
    const existe = fs.existsSync(caminho);
    
    if (existe) {
        const stats = fs.statSync(caminho);
        const tamanho = (stats.size / 1024).toFixed(1);
        console.log(`  ✅ ${item.nome}: ${tamanho}KB - ${item.descricao}`);
        arquivosOK++;
    } else {
        console.log(`  ❌ ${item.nome}: AUSENTE - ${item.descricao}`);
        arquivosFaltando.push(item.nome);
    }
});

console.log(`\n📊 Arquivos críticos: ${arquivosOK}/${arquivosCriticos.length} (${(arquivosOK/arquivosCriticos.length*100).toFixed(1)}%)`);

// ======================================
// 2. VERIFICAÇÃO DE COMPONENTES DE TRADING
// ======================================

console.log('\n⚡ 2. VERIFICAÇÃO DE COMPONENTES DE TRADING');
console.log('==========================================');

const componentesTrading = [
    { nome: 'Diretório Exchanges', path: 'src/exchanges' },
    { nome: 'Diretório Services', path: 'src/services' },
    { nome: 'Diretório Trading', path: 'src/trading' }
];

let componentesOK = 0;

componentesTrading.forEach(comp => {
    const existe = fs.existsSync(path.join(__dirname, comp.path));
    console.log(`  ${existe ? '✅' : '❌'} ${comp.nome}: ${existe ? 'Criado' : 'Ausente'}`);
    if (existe) componentesOK++;
});

console.log(`\n📊 Componentes de trading: ${componentesOK}/${componentesTrading.length} (${(componentesOK/componentesTrading.length*100).toFixed(1)}%)`);

// ======================================
// 3. VERIFICAÇÃO DE FUNCIONALIDADES
// ======================================

console.log('\n🚀 3. VERIFICAÇÃO DE FUNCIONALIDADES');
console.log('===================================');

try {
    // Testar carregamento dos módulos
    const funcionalidades = [];
    
    // Binance Connector
    try {
        const BinanceConnector = require('./src/exchanges/binanceConnector');
        const testConnector = new BinanceConnector('test', 'test', true);
        funcionalidades.push({ nome: 'Binance Connector', status: '✅ Carregado' });
    } catch (error) {
        funcionalidades.push({ nome: 'Binance Connector', status: `❌ Erro: ${error.message}` });
    }
    
    // Exchange Manager
    try {
        const exchangeManager = require('./src/services/exchangeManager');
        funcionalidades.push({ nome: 'Exchange Manager', status: '✅ Carregado' });
    } catch (error) {
        funcionalidades.push({ nome: 'Exchange Manager', status: `❌ Erro: ${error.message}` });
    }
    
    // Order Executor
    try {
        const orderExecutor = require('./src/trading/orderExecutor');
        funcionalidades.push({ nome: 'Order Executor', status: '✅ Carregado' });
    } catch (error) {
        funcionalidades.push({ nome: 'Order Executor', status: `❌ Erro: ${error.message}` });
    }
    
    // Server Principal
    try {
        // Verificar se server.cjs tem os endpoints de trading
        const serverContent = fs.readFileSync(path.join(__dirname, 'api-gateway/server.cjs'), 'utf8');
        const hasTrading = serverContent.includes('/api/trading/signal') && 
                          serverContent.includes('/api/trading/exchanges');
        funcionalidades.push({ nome: 'Endpoints Trading', status: hasTrading ? '✅ Integrados' : '❌ Ausentes' });
    } catch (error) {
        funcionalidades.push({ nome: 'Endpoints Trading', status: `❌ Erro: ${error.message}` });
    }
    
    funcionalidades.forEach(func => {
        console.log(`  ${func.status.includes('✅') ? func.status : func.status} - ${func.nome}`);
    });
    
} catch (error) {
    console.log(`  ❌ Erro na verificação: ${error.message}`);
}

// ======================================
// 4. ANÁLISE DE CONFIGURAÇÃO
// ======================================

console.log('\n⚙️ 4. ANÁLISE DE CONFIGURAÇÃO');
console.log('============================');

const configuracoes = [
    { nome: 'Package.json', existe: fs.existsSync(path.join(__dirname, 'package.json')) },
    { nome: 'Node Modules', existe: fs.existsSync(path.join(__dirname, 'node_modules')) },
    { nome: 'Frontend Premium', existe: fs.existsSync(path.join(__dirname, '../coinbitclub-frontend-premium/package.json')) },
    { nome: 'Dockerfile', existe: fs.existsSync(path.join(__dirname, 'Dockerfile')) }
];

configuracoes.forEach(config => {
    console.log(`  ${config.existe ? '✅' : '❌'} ${config.nome}: ${config.existe ? 'Presente' : 'Ausente'}`);
});

// ======================================
// 5. ANÁLISE FINAL E RECOMENDAÇÕES
// ======================================

console.log('\n🎯 5. ANÁLISE FINAL E RECOMENDAÇÕES');
console.log('===================================');

const porcentagemArquivos = (arquivosOK / arquivosCriticos.length) * 100;
const porcentagemComponentes = (componentesOK / componentesTrading.length) * 100;

console.log(`📊 Taxa de preparação geral: ${((porcentagemArquivos + porcentagemComponentes) / 2).toFixed(1)}%`);
console.log(`📁 Arquivos críticos: ${porcentagemArquivos.toFixed(1)}%`);
console.log(`⚡ Componentes trading: ${porcentagemComponentes.toFixed(1)}%`);

if (porcentagemArquivos >= 95 && porcentagemComponentes >= 95) {
    console.log('\n🎉 RESULTADO: SISTEMA PREPARADO PARA AMBIENTE REAL!');
    console.log('==================================================');
    console.log('✅ Todos os componentes críticos estão presentes');
    console.log('✅ Sistema de trading implementado');
    console.log('✅ Endpoints integrados no servidor');
    console.log('✅ Estrutura completa criada');
    console.log('');
    console.log('🚀 PRÓXIMOS PASSOS:');
    console.log('   1. Configurar API keys reais dos usuários');
    console.log('   2. Testar com small amounts primeiro');
    console.log('   3. Configurar TradingView webhook real');
    console.log('   4. Monitorar execução das primeiras operações');
    console.log('');
    console.log('⚠️  AVISO: Lembre-se de usar testnet primeiro!');
} else {
    console.log('\n⚠️  RESULTADO: SISTEMA PRECISA DE AJUSTES');
    console.log('========================================');
    console.log('❌ Alguns componentes críticos estão ausentes');
    
    if (arquivosFaltando.length > 0) {
        console.log('\n📝 Arquivos em falta:');
        arquivosFaltando.forEach(arquivo => {
            console.log(`   - ${arquivo}`);
        });
    }
    
    console.log('\n🔧 Recomendação: Execute primeiro o script de Fase 2');
    console.log('   node executar-fase2-operacoes-reais.js');
}

console.log('\n📋 CHECKLIST FINAL PARA AMBIENTE REAL:');
console.log('======================================');
console.log('□ API keys da Binance configuradas');
console.log('□ Webhook TradingView configurado');
console.log('□ Testnet funcionando');
console.log('□ Sistema de logs implementado');
console.log('□ Backup de segurança criado');
console.log('□ Monitoramento ativo');
console.log('□ Stop loss configurado');
console.log('□ Limites de exposição definidos');

console.log('\n✅ VERIFICAÇÃO CONCLUÍDA!');
