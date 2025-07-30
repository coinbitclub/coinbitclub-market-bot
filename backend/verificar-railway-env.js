#!/usr/bin/env node

/**
 * 🚅 VERIFICADOR DE VARIÁVEIS RAILWAY
 * 
 * Verifica todas as variáveis de ambiente configuradas no Railway
 */

async function verificarVariaveisRailway() {
    console.log('🚅 VERIFICADOR DE VARIÁVEIS RAILWAY');
    console.log('==================================');
    
    // Lista de variáveis críticas esperadas
    const variaveisEsperadas = {
        // Database
        'DATABASE_URL': 'Conexão PostgreSQL',
        'PGDATABASE': 'Nome do banco',
        'PGHOST': 'Host do banco',
        'PGPASSWORD': 'Senha do banco',
        'PGPORT': 'Porta do banco',
        'PGUSER': 'Usuário do banco',
        
        // OpenAI - CRÍTICO PARA OPERAÇÃO REAL
        'OPENAI_API_KEY': '🤖 API Key OpenAI (OBRIGATÓRIA)',
        'OPENAI_ORG_ID': '🤖 Organization ID OpenAI',
        
        // Bybit - Trading
        'BYBIT_API_KEY': '📈 API Key Bybit',
        'BYBIT_SECRET': '📈 Secret Bybit',
        'BYBIT_TESTNET': '📈 Modo Testnet Bybit',
        
        // Stripe - Pagamentos
        'STRIPE_SECRET_KEY': '💳 Secret Key Stripe',
        'STRIPE_PUBLISHABLE_KEY': '💳 Publishable Key Stripe',
        'STRIPE_WEBHOOK_SECRET': '💳 Webhook Secret Stripe',
        
        // Twilio - Comunicação
        'TWILIO_ACCOUNT_SID': '📱 Account SID Twilio',
        'TWILIO_AUTH_TOKEN': '📱 Auth Token Twilio',
        'TWILIO_PHONE_NUMBER': '📱 Número Twilio',
        
        // Sistema
        'NODE_ENV': '⚙️ Ambiente (production/development)',
        'PORT': '⚙️ Porta da aplicação',
        'JWT_SECRET': '🔐 Secret JWT',
        
        // Fear & Greed
        'FEAR_GREED_API_KEY': '😨 API Key Fear & Greed'
    };
    
    console.log('\n🔍 VERIFICANDO VARIÁVEIS DE AMBIENTE...\n');
    
    let variaveisConfiguradas = 0;
    let variaveisFaltantes = [];
    let variaveisCriticas = [];
    
    // Verificar cada variável
    for (const [nome, descricao] of Object.entries(variaveisEsperadas)) {
        const valor = process.env[nome];
        
        if (valor) {
            // Mascarar valores sensíveis
            let valorMascarado = valor;
            if (nome.includes('KEY') || nome.includes('SECRET') || nome.includes('PASSWORD') || nome.includes('TOKEN')) {
                valorMascarado = valor.substring(0, 8) + '...';
            }
            
            console.log(`✅ ${nome}: ${valorMascarado}`);
            console.log(`   📝 ${descricao}`);
            variaveisConfiguradas++;
            
        } else {
            console.log(`❌ ${nome}: NÃO CONFIGURADA`);
            console.log(`   📝 ${descricao}`);
            variaveisFaltantes.push(nome);
            
            // Verificar se é crítica
            if (nome.includes('OPENAI') || nome === 'BYBIT_API_KEY' || nome === 'DATABASE_URL') {
                variaveisCriticas.push(nome);
            }
        }
        console.log('');
    }
    
    // Relatório final
    console.log('\n📊 RELATÓRIO FINAL');
    console.log('==================');
    console.log(`✅ Configuradas: ${variaveisConfiguradas}/${Object.keys(variaveisEsperadas).length}`);
    console.log(`❌ Faltantes: ${variaveisFaltantes.length}`);
    console.log(`🚨 Críticas faltantes: ${variaveisCriticas.length}`);
    
    if (variaveisFaltantes.length > 0) {
        console.log('\n❌ VARIÁVEIS FALTANTES:');
        variaveisFaltantes.forEach(v => console.log(`   • ${v}`));
    }
    
    if (variaveisCriticas.length > 0) {
        console.log('\n🚨 VARIÁVEIS CRÍTICAS FALTANTES:');
        variaveisCriticas.forEach(v => console.log(`   • ${v}`));
        console.log('\n⚠️ SISTEMA NÃO PODE OPERAR EM PRODUÇÃO SEM ESSAS VARIÁVEIS!');
    }
    
    // Status específico para operação real
    console.log('\n🎯 STATUS PARA OPERAÇÃO REAL:');
    console.log('=============================');
    
    const openaiConfigured = !!process.env.OPENAI_API_KEY;
    const bybitConfigured = !!process.env.BYBIT_API_KEY && !!process.env.BYBIT_SECRET;
    const databaseConfigured = !!process.env.DATABASE_URL;
    
    console.log(`🤖 OpenAI: ${openaiConfigured ? '✅ CONFIGURADA' : '❌ FALTANTE'}`);
    console.log(`📈 Bybit: ${bybitConfigured ? '✅ CONFIGURADA' : '❌ FALTANTE'}`);
    console.log(`🗄️ Database: ${databaseConfigured ? '✅ CONFIGURADA' : '❌ FALTANTE'}`);
    
    const podeOperar = openaiConfigured && bybitConfigured && databaseConfigured;
    
    if (podeOperar) {
        console.log('\n🟢 STATUS: PRONTO PARA OPERAÇÃO REAL! 🚀');
    } else {
        console.log('\n🔴 STATUS: NÃO PRONTO - Configurações obrigatórias faltando!');
        
        console.log('\n📋 PRÓXIMOS PASSOS OBRIGATÓRIOS:');
        if (!openaiConfigured) {
            console.log('1. 🤖 Configurar OPENAI_API_KEY no Railway');
            console.log('   • Ir para railway.app/projeto/variables');
            console.log('   • Adicionar OPENAI_API_KEY=sk-...');
        }
        if (!bybitConfigured) {
            console.log('2. 📈 Configurar API Keys Bybit no Railway');
            console.log('   • BYBIT_API_KEY=...');
            console.log('   • BYBIT_SECRET=...');
            console.log('   • BYBIT_TESTNET=false (para produção)');
        }
        if (!databaseConfigured) {
            console.log('3. 🗄️ Verificar DATABASE_URL');
        }
    }
    
    // Verificar se está em modo de teste
    const isTestnet = process.env.BYBIT_TESTNET === 'true';
    const isProduction = process.env.NODE_ENV === 'production';
    
    console.log('\n⚙️ CONFIGURAÇÕES DE AMBIENTE:');
    console.log(`   📊 NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
    console.log(`   🧪 Bybit Testnet: ${isTestnet ? 'SIM' : 'NÃO'}`);
    console.log(`   🚀 Produção: ${isProduction ? 'SIM' : 'NÃO'}`);
    
    if (isProduction && isTestnet) {
        console.log('\n⚠️ ATENÇÃO: Produção configurada mas Bybit em testnet!');
    }
    
    return {
        configuradas: variaveisConfiguradas,
        faltantes: variaveisFaltantes.length,
        criticas: variaveisCriticas.length,
        podeOperar,
        openaiConfigured,
        bybitConfigured,
        databaseConfigured
    };
}

// Função para testar conexões
async function testarConexoes() {
    console.log('\n🔗 TESTANDO CONEXÕES...');
    console.log('========================');
    
    // Teste OpenAI
    if (process.env.OPENAI_API_KEY) {
        try {
            console.log('🤖 Testando OpenAI...');
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ OpenAI: Conectado (${data.data?.length || 0} modelos disponíveis)`);
            } else {
                console.log(`❌ OpenAI: Erro ${response.status} - ${response.statusText}`);
            }
        } catch (error) {
            console.log(`❌ OpenAI: Erro de conexão - ${error.message}`);
        }
    } else {
        console.log('❌ OpenAI: API Key não configurada');
    }
    
    // Teste Database
    if (process.env.DATABASE_URL) {
        try {
            console.log('🗄️ Testando Database...');
            const { Pool } = require('pg');
            const pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: false }
            });
            
            const result = await pool.query('SELECT NOW()');
            console.log(`✅ Database: Conectado (${result.rows[0].now})`);
            await pool.end();
        } catch (error) {
            console.log(`❌ Database: Erro - ${error.message}`);
        }
    } else {
        console.log('❌ Database: URL não configurada');
    }
}

// Executar verificação
async function main() {
    try {
        const resultado = await verificarVariaveisRailway();
        await testarConexoes();
        
        console.log('\n' + '='.repeat(50));
        console.log('🎯 RESUMO EXECUTIVO');
        console.log('='.repeat(50));
        
        if (resultado.podeOperar) {
            console.log('🟢 SISTEMA PRONTO PARA OPERAÇÃO REAL!');
            console.log('✅ Todas as configurações críticas estão presentes');
            console.log('🚀 Pode iniciar trading automatizado');
        } else {
            console.log('🔴 SISTEMA NÃO PRONTO PARA OPERAÇÃO');
            console.log(`❌ ${resultado.criticas} configuração(ões) crítica(s) faltando`);
            console.log('⏳ Configure as variáveis faltantes antes de operar');
        }
        
    } catch (error) {
        console.error('💥 Erro na verificação:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { verificarVariaveisRailway, testarConexoes };
