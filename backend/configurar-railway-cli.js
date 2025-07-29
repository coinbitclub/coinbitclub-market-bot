#!/usr/bin/env node

/**
 * 🚀 CONFIGURADOR AUTOMÁTICO RAILWAY - NOVO PROJETO
 * Conecta ao projeto e configura todas as variáveis via Railway CLI
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🚀 CONFIGURADOR AUTOMÁTICO RAILWAY - NOVO PROJETO');
console.log('================================================\n');

// Verificar se Railway CLI está instalado
function checkRailwayCLI() {
    try {
        execSync('railway --version', { stdio: 'ignore' });
        console.log('✅ Railway CLI encontrado');
        return true;
    } catch (error) {
        console.log('❌ Railway CLI não encontrado');
        console.log('📥 Instalando Railway CLI...');
        try {
            execSync('npm install -g @railway/cli', { stdio: 'inherit' });
            console.log('✅ Railway CLI instalado com sucesso');
            return true;
        } catch (installError) {
            console.log('❌ Erro ao instalar Railway CLI');
            console.log('💡 Execute manualmente: npm install -g @railway/cli');
            return false;
        }
    }
}

// Configurar variáveis
function configureVariables() {
    const variables = {
        'DATABASE_URL': 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
        'NODE_ENV': 'production',
        'PORT': '3000',
        'JWT_SECRET': 'coinbitclub-production-secret-2025-ultra-secure',
        'ENCRYPTION_KEY': 'coinbitclub-encryption-key-production-2025',
        'SESSION_SECRET': 'coinbitclub-session-secret-2025-ultra-secure',
        'WEBHOOK_SECRET': 'coinbitclub-webhook-secret-2025',
        'SISTEMA_MULTIUSUARIO': 'true',
        'MODO_HIBRIDO': 'true',
        'DEFAULT_LEVERAGE': '10',
        'DEFAULT_RISK_PERCENTAGE': '2',
        'MAX_CONCURRENT_TRADES': '5',
        'CORS_ORIGIN': 'https://coinbitclub-market-bot.vercel.app',
        'FRONTEND_URL': 'https://coinbitclub-market-bot.vercel.app'
    };

    console.log('🔧 Configurando variáveis de ambiente...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const [key, value] of Object.entries(variables)) {
        try {
            console.log(`⚙️ Configurando ${key}...`);
            execSync(`railway variables set ${key}="${value}"`, { stdio: 'ignore' });
            console.log(`✅ ${key} configurado`);
            successCount++;
        } catch (error) {
            console.log(`❌ Erro ao configurar ${key}`);
            errorCount++;
        }
    }

    console.log(`\n📊 RESULTADO:`);
    console.log(`✅ Sucesso: ${successCount} variáveis`);
    console.log(`❌ Erros: ${errorCount} variáveis`);

    return errorCount === 0;
}

// Função principal
async function main() {
    // 1. Verificar Railway CLI
    if (!checkRailwayCLI()) {
        console.log('\n❌ Não foi possível instalar/usar Railway CLI');
        console.log('💡 Use a configuração manual no Railway Dashboard');
        process.exit(1);
    }

    console.log('\n🔗 Conectando ao projeto Railway...');
    console.log('💡 Escolha o projeto correto quando solicitado\n');

    try {
        // 2. Conectar ao projeto
        execSync('railway link', { stdio: 'inherit' });
        console.log('\n✅ Conectado ao projeto');

        // 3. Configurar variáveis
        const success = configureVariables();

        if (success) {
            console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
            console.log('=====================================');
            console.log('✅ Todas as 15 variáveis principais configuradas');
            console.log('\n🔧 PRÓXIMOS PASSOS:');
            console.log('1. Configure BACKEND_URL com a URL do novo projeto');
            console.log('2. Configure chaves de exchanges (BINANCE/BYBIT)');
            console.log('3. Execute: railway up (para fazer deploy)');
            console.log('\n📋 COMANDOS PARA EXCHANGES:');
            console.log('railway variables set BINANCE_API_KEY="[SUA_CHAVE]"');
            console.log('railway variables set BINANCE_SECRET_KEY="[SEU_SECRET]"');
            console.log('railway variables set BYBIT_API_KEY="[SUA_CHAVE]"');
            console.log('railway variables set BYBIT_SECRET_KEY="[SEU_SECRET]"');
        } else {
            console.log('\n⚠️ CONFIGURAÇÃO PARCIAL');
            console.log('Algumas variáveis podem não ter sido configuradas');
            console.log('Verifique o Railway Dashboard');
        }

    } catch (error) {
        console.log('\n❌ Erro durante configuração:', error.message);
        console.log('💡 Tente configurar manualmente no Railway Dashboard');
    }

    rl.close();
}

main();
