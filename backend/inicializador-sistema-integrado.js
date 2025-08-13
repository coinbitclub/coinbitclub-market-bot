/**
 * 🎯 INICIALIZADOR AUTOMÁTICO DO SISTEMA INTEGRADO
 * 
 * Este arquivo garante que:
 * 1. Todas as variáveis de ambiente estejam configuradas
 * 2. O sistema de leitura seja iniciado automaticamente
 * 3. O orquestrador monitore todos os componentes
 * 4. Os sistemas sejam reiniciados automaticamente em caso de falha
 */

const fs = require('fs');
const path = require('path');

// Verificar e configurar variáveis de ambiente
function configurarVariaveisAmbiente() {
    console.log('🔧 Configurando variáveis de ambiente...');
    
    const requiredEnvVars = {
        'DATABASE_URL': 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
        'COINSTATS_API_KEY': 'ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=',
        'BINANCE_API_KEY': 'tEJm7uhqtpgAftcaVGlQbADfR1LOmeLW5WkN6gNNYKzmmXyHso4NSAiXHFXdXRxw',
        'NODE_ENV': 'production',
        'PORT': '3000'
    };
    
    let envConfigured = true;
    
    for (const [key, defaultValue] of Object.entries(requiredEnvVars)) {
        if (!process.env[key]) {
            process.env[key] = defaultValue;
            console.log(`✅ ${key}: Configurada com valor padrão`);
            envConfigured = false;
        } else {
            console.log(`✅ ${key}: Já configurada`);
        }
    }
    
    // OPENAI_API_KEY deve estar nas variáveis de ambiente
    if (!process.env.OPENAI_API_KEY) {
        console.log('⚠️ OPENAI_API_KEY não configurada - algumas funcionalidades podem não funcionar');
    } else {
        console.log('✅ OPENAI_API_KEY: Configurada');
    }
    
    return envConfigured;
}

// Inicializar sistema completo
async function inicializarSistemaCompleto() {
    try {
        console.log('\n🚀 INICIALIZADOR AUTOMÁTICO - SISTEMA INTEGRADO');
        console.log('================================================\n');
        
        // 1. Configurar ambiente
        configurarVariaveisAmbiente();
        
        // 2. Iniciar banco de dados
        console.log('\n📊 Inicializando estrutura do banco...');
        const { spawn } = require('child_process');
        
        const bancoProcess = spawn('node', ['banco-sistema-leitura-mercado.js'], {
            cwd: __dirname,
            stdio: 'inherit'
        });
        
        await new Promise((resolve, reject) => {
            bancoProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Estrutura do banco inicializada');
                    resolve();
                } else {
                    console.log('⚠️ Banco já existe ou erro controlado');
                    resolve(); // Continuar mesmo com erro controlado
                }
            });
            
            bancoProcess.on('error', (error) => {
                console.log('⚠️ Erro ao inicializar banco:', error.message);
                resolve(); // Continuar mesmo com erro
            });
        });
        
        // 3. Iniciar orquestrador
        console.log('\n🎯 Iniciando orquestrador do sistema...');
        const OrquestradorSistemaIntegrado = require('./orquestrador-sistema-integrado.js');
        
        const orquestrador = new OrquestradorSistemaIntegrado();
        await orquestrador.iniciarSistema();
        
        // 4. Aguardar estabilização
        console.log('\n⏳ Aguardando estabilização do sistema (30s)...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        // 5. Verificar status
        console.log('\n📊 Verificando status do sistema...');
        const status = await orquestrador.getStatus();
        
        console.log('\n📋 STATUS FINAL:');
        console.log(`   🎯 Orquestrador: ${status.orquestrador_ativo ? 'ATIVO' : 'INATIVO'}`);
        console.log(`   📈 Sistema Leitura: ${status.sistema_leitura?.registros_24h || 0} registros em 24h`);
        console.log(`   ⏰ Última atualização: ${status.sistema_leitura?.ultima_atualizacao || 'N/A'}`);
        console.log(`   😨 Último F&G: ${status.sistema_leitura?.ultimo_fear_greed || 'N/A'}`);
        console.log(`   🎯 Recomendação: ${status.sistema_leitura?.ultima_recomendacao || 'N/A'}`);
        
        console.log('\n✅ SISTEMA INTEGRADO INICIADO COM SUCESSO!');
        console.log('\n📝 PRÓXIMOS PASSOS:');
        console.log('   1. Monitorar logs do orquestrador');
        console.log('   2. Verificar endpoint: GET /api/orquestrador/status');
        console.log('   3. Verificar AI analysis: GET /api/dashboard/ai-analysis');
        console.log('   4. O sistema atualizará automaticamente a cada 15 minutos');
        
        // Manter processo ativo
        console.log('\n🔄 Sistema em execução contínua...');
        console.log('   Use Ctrl+C para parar');
        
        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n📛 Parando sistema integrado...');
            await orquestrador.pararSistema();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            console.log('\n📛 Terminando sistema integrado...');
            await orquestrador.pararSistema();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error.message);
        console.error('\n🔧 SOLUÇÕES POSSÍVEIS:');
        console.error('   1. Verificar variáveis de ambiente');
        console.error('   2. Verificar conectividade com banco');
        console.error('   3. Verificar permissões de arquivos');
        console.error('   4. Executar manualmente: node banco-sistema-leitura-mercado.js');
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    inicializarSistemaCompleto();
}

module.exports = {
    configurarVariaveisAmbiente,
    inicializarSistemaCompleto
};
