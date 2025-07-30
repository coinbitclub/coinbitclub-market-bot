/**
 * 🚀 CONFIGURADOR AUTOMÁTICO - CHAVES BINANCE
 * 
 * Script para automatizar a configuração de chaves Binance
 * para todos os usuários existentes no sistema
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

const IP_RAILWAY = '132.255.160.140';

console.log('🚀 CONFIGURADOR AUTOMÁTICO - CHAVES BINANCE');
console.log('===========================================');

async function configurarChavesBinance() {
    try {
        // 1. Buscar usuários ativos que não têm chaves Binance
        console.log('\n📊 1. IDENTIFICANDO USUÁRIOS SEM BINANCE:');
        
        const usuariosSemBinance = await pool.query(`
            SELECT DISTINCT u.id, u.name, u.email, u.vip_status
            FROM users u
            WHERE u.is_active = true
            AND u.id NOT IN (
                SELECT DISTINCT user_id 
                FROM user_api_keys 
                WHERE exchange = 'binance' 
                AND is_active = true
            )
            ORDER BY u.vip_status DESC, u.name
        `);
        
        if (usuariosSemBinance.rows.length === 0) {
            console.log('✅ Todos os usuários ativos já possuem chaves Binance configuradas!');
            return;
        }
        
        console.log(`🎯 ${usuariosSemBinance.rows.length} usuário(s) precisam configurar Binance:\n`);
        
        for (const [index, usuario] of usuariosSemBinance.rows.entries()) {
            const status = usuario.vip_status ? 'VIP' : 'BÁSICO';
            console.log(`${index + 1}. ${usuario.name} (${usuario.email}) - ${status}`);
        }
        
        // 2. Verificar configuração atual do sistema
        console.log('\n🔧 2. VERIFICAÇÃO DO SISTEMA:');
        await verificarConfiguracaoSistema();
        
        // 3. Gerar instruções personalizadas para cada usuário
        console.log('\n📋 3. INSTRUÇÕES PERSONALIZADAS:');
        console.log('================================');
        
        for (const usuario of usuariosSemBinance.rows) {
            await gerarInstrucoesUsuario(usuario);
        }
        
        // 4. Gerar scripts SQL para inserção
        console.log('\n💾 4. SCRIPTS SQL PRONTOS:');
        console.log('==========================');
        await gerarScriptsSQL(usuariosSemBinance.rows);
        
        // 5. Gerar script de teste automático
        console.log('\n🧪 5. SCRIPT DE TESTE AUTOMÁTICO:');
        console.log('=================================');
        await gerarScriptTeste();
        
        // 6. Recomendações finais
        console.log('\n🎯 6. PRÓXIMOS PASSOS:');
        console.log('=====================');
        exibirProximosPassos();
        
    } catch (error) {
        console.error('❌ Erro na configuração:', error.message);
    } finally {
        await pool.end();
    }
}

async function verificarConfiguracaoSistema() {
    // Verificar IP atual
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        console.log(`   🌐 IP Railway atual: ${data.ip}`);
        console.log(`   📍 IP para configurar: ${IP_RAILWAY}`);
        
        if (data.ip === IP_RAILWAY) {
            console.log('   ✅ IP está correto e estável');
        } else {
            console.log('   🚨 ATENÇÃO: IP mudou! Usar o IP atual nas configurações');
        }
    } catch (error) {
        console.log('   ⚠️ Não foi possível verificar IP atual');
    }
    
    // Verificar conectividade Binance
    try {
        const response = await fetch('https://api.binance.com/api/v3/ping');
        if (response.ok) {
            console.log('   ✅ Conectividade Binance: OK');
        } else {
            console.log('   ❌ Problema de conectividade com Binance');
        }
    } catch (error) {
        console.log('   ❌ Erro ao testar Binance:', error.message);
    }
    
    // Verificar variáveis de ambiente
    const binanceKey = process.env.BINANCE_API_KEY;
    const binanceSecret = process.env.BINANCE_API_SECRET;
    
    if (binanceKey && binanceSecret) {
        console.log('   ✅ Variáveis de ambiente Binance: Configuradas');
    } else {
        console.log('   ⚠️ Variáveis de ambiente Binance: Não configuradas');
    }
}

async function gerarInstrucoesUsuario(usuario) {
    const isVip = usuario.vip_status;
    
    console.log(`\n👤 **${usuario.name}** (${isVip ? 'VIP' : 'BÁSICO'})`);
    console.log('─'.repeat(50));
    
    console.log('📧 **INSTRUÇÕES POR EMAIL:**');
    console.log('```');
    console.log(`Olá ${usuario.name},`);
    console.log('');
    console.log('Para ativar o trading automático na Binance, siga estes passos:');
    console.log('');
    console.log('1. 🌐 Acesse: https://www.binance.com/en/my/settings/api-management');
    console.log('2. 🔑 Clique em "Create API"');
    console.log('3. 📝 Nome sugerido: "CoinBitClub Trading Bot"');
    console.log('4. ✅ Permissões necessárias:');
    console.log('   • ✅ Enable Reading');
    console.log('   • ✅ Enable Spot & Margin Trading');
    if (isVip) {
        console.log('   • ✅ Enable Futures (VIP)');
    }
    console.log('5. 🌍 Restricão de IP:');
    console.log('   • Marque "Restrict access to trusted IPs only"');
    console.log(`   • Adicione: ${IP_RAILWAY}`);
    console.log('6. 📤 Envie as chaves por email seguro ou WhatsApp');
    console.log('```');
    
    console.log('\n🔒 **FORMATO DAS CHAVES:**');
    console.log('```');
    console.log(`Usuário: ${usuario.name}`);
    console.log(`Email: ${usuario.email}`);
    console.log('API Key: [CHAVE_GERADA_PELA_BINANCE]');
    console.log('Secret Key: [SECRET_GERADA_PELA_BINANCE]');
    console.log('Ambiente: mainnet (produção)');
    console.log('```');
}

async function gerarScriptsSQL(usuarios) {
    console.log('📄 **SCRIPT SQL PARA INSERÇÃO EM MASSA:**');
    console.log('```sql');
    
    for (const usuario of usuarios) {
        console.log(`-- ${usuario.name}`);
        console.log(`INSERT INTO user_api_keys (`);
        console.log(`    user_id, exchange, api_key, secret_key, environment,`);
        console.log(`    is_active, validation_status, created_at, updated_at`);
        console.log(`) VALUES (`);
        console.log(`    ${usuario.id}, 'binance', '[API_KEY_${usuario.name.toUpperCase().replace(' ', '_')}]', '[SECRET_KEY_${usuario.name.toUpperCase().replace(' ', '_')}]', 'mainnet',`);
        console.log(`    true, 'pending', NOW(), NOW()`);
        console.log(`);`);
        console.log('');
    }
    
    console.log('```');
    
    console.log('\n📄 **SCRIPT DE VALIDAÇÃO:**');
    console.log('```sql');
    console.log('-- Verificar chaves inseridas');
    console.log('SELECT u.name, u.email, uak.exchange, uak.environment, uak.validation_status');
    console.log('FROM user_api_keys uak');
    console.log('JOIN users u ON uak.user_id = u.id');
    console.log('WHERE uak.exchange = \'binance\'');
    console.log('ORDER BY u.name;');
    console.log('```');
}

async function gerarScriptTeste() {
    console.log('📄 **SCRIPT DE TESTE (test-all-binance-keys.js):**');
    console.log('```javascript');
    console.log(`const { Pool } = require('pg');`);
    console.log(`const crypto = require('crypto');`);
    console.log('');
    console.log(`const pool = new Pool({`);
    console.log(`    connectionString: process.env.DATABASE_URL,`);
    console.log(`    ssl: { rejectUnauthorized: false }`);
    console.log(`});`);
    console.log('');
    console.log(`async function testAllBinanceKeys() {`);
    console.log(`    const keys = await pool.query(\``);
    console.log(`        SELECT u.name, uak.api_key, uak.secret_key`);
    console.log(`        FROM user_api_keys uak`);
    console.log(`        JOIN users u ON uak.user_id = u.id`);
    console.log(`        WHERE uak.exchange = 'binance' AND uak.is_active = true`);
    console.log(`    \`);`);
    console.log('');
    console.log(`    for (const key of keys.rows) {`);
    console.log(`        console.log(\`Testing \${key.name}...\`);`);
    console.log(`        // Teste de conectividade aqui`);
    console.log(`    }`);
    console.log(`}`);
    console.log('```');
}

function exibirProximosPassos() {
    console.log('1. 📧 **Enviar instruções para usuários**');
    console.log('   • Usar templates gerados acima');
    console.log('   • Enfatizar importância do IP correto');
    console.log('   • Definir prazo para configuração');
    
    console.log('\n2. 🔑 **Receber e inserir chaves**');
    console.log('   • Usar scripts SQL gerados');
    console.log('   • Validar formato das chaves');
    console.log('   • Marcar como "pending" inicialmente');
    
    console.log('\n3. 🧪 **Testar chaves recebidas**');
    console.log('   • Executar diagnose-binance-keys.js');
    console.log('   • Validar conectividade');
    console.log('   • Atualizar status para "valid"');
    
    console.log('\n4. 🚀 **Ativar sistema híbrido**');
    console.log('   • Bybit: Exchange principal');
    console.log('   • Binance: Exchange secundária');
    console.log('   • Load balancing automático');
    
    console.log('\n5. 📊 **Monitoramento contínuo**');
    console.log('   • Health checks diários');
    console.log('   • Alertas de falha');
    console.log('   • Relatórios de performance');
}

// Função utilitária para gerar chave de teste
function gerarChaveTeste() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let resultado = '';
    for (let i = 0; i < 64; i++) {
        resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return resultado;
}

// Executar configuração
configurarChavesBinance().catch(console.error);
