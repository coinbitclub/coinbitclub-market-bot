/**
 * 🔍 VERIFICADOR DE CONFIGURAÇÕES RAILWAY E INTEGRAÇÃO
 * ===================================================
 * 
 * Este script verifica todas as variáveis de ambiente configuradas
 * no Railway e testa se as integrações estão funcionando corretamente.
 */

const https = require('https');
const http = require('http');

console.log('🔍 VERIFICADOR DE CONFIGURAÇÕES RAILWAY');
console.log('======================================');

// Verificar variáveis de ambiente essenciais
function verificarVariaveisEssenciais() {
    console.log('\n📋 1. VERIFICANDO VARIÁVEIS DE AMBIENTE');
    console.log('=======================================');
    
    const variaveisEssenciais = {
        'NODE_ENV': process.env.NODE_ENV,
        'PORT': process.env.PORT,
        'DATABASE_URL': process.env.DATABASE_URL,
        'JWT_SECRET': process.env.JWT_SECRET,
        'ENCRYPTION_KEY': process.env.ENCRYPTION_KEY,
        'TWILIO_ACCOUNT_SID': process.env.TWILIO_ACCOUNT_SID,
        'TWILIO_AUTH_TOKEN': process.env.TWILIO_AUTH_TOKEN,
        'TWILIO_PHONE_NUMBER': process.env.TWILIO_PHONE_NUMBER
    };
    
    let todasConfiguradas = true;
    
    Object.entries(variaveisEssenciais).forEach(([nome, valor]) => {
        if (valor) {
            // Mascarar valores sensíveis
            let valorMascarado = valor;
            if (nome.includes('SECRET') || nome.includes('TOKEN') || nome.includes('KEY')) {
                valorMascarado = valor.substring(0, 8) + '***';
            } else if (nome === 'DATABASE_URL') {
                valorMascarado = valor.split('@')[0].split('//')[1].split(':')[0] + '@***';
            }
            console.log(`✅ ${nome}: ${valorMascarado}`);
        } else {
            console.log(`❌ ${nome}: NÃO CONFIGURADA`);
            todasConfiguradas = false;
        }
    });
    
    return todasConfiguradas;
}

// Verificar variáveis de exchanges
function verificarVariaveisExchanges() {
    console.log('\n📊 2. VERIFICANDO CONFIGURAÇÕES DE EXCHANGES');
    console.log('=============================================');
    
    const exchangeVars = {
        'BINANCE_API_KEY': process.env.BINANCE_API_KEY,
        'BINANCE_SECRET_KEY': process.env.BINANCE_SECRET_KEY,
        'BYBIT_API_KEY': process.env.BYBIT_API_KEY,
        'BYBIT_SECRET_KEY': process.env.BYBIT_SECRET_KEY,
        'OKX_API_KEY': process.env.OKX_API_KEY,
        'OKX_SECRET_KEY': process.env.OKX_SECRET_KEY,
        'OKX_PASSPHRASE': process.env.OKX_PASSPHRASE
    };
    
    let exchangesConfiguradas = 0;
    
    Object.entries(exchangeVars).forEach(([nome, valor]) => {
        if (valor) {
            const valorMascarado = valor.substring(0, 6) + '***';
            console.log(`✅ ${nome}: ${valorMascarado}`);
            exchangesConfiguradas++;
        } else {
            console.log(`⚠️ ${nome}: Não configurada (usará chaves do usuário)`);
        }
    });
    
    console.log(`📊 Total de exchanges configuradas: ${Math.floor(exchangesConfiguradas/2)}/3`);
    return exchangesConfiguradas;
}

// Verificar configurações Twilio
async function verificarTwilio() {
    console.log('\n📱 3. VERIFICANDO INTEGRAÇÃO TWILIO');
    console.log('===================================');
    
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    
    if (!twilioSid || !twilioToken || !twilioPhone) {
        console.log('❌ Credenciais Twilio incompletas');
        return false;
    }
    
    try {
        // Verificar se consegue conectar na API Twilio
        const authString = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
        
        return new Promise((resolve) => {
            const options = {
                hostname: 'api.twilio.com',
                port: 443,
                path: `/2010-04-01/Accounts/${twilioSid}.json`,
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'Accept': 'application/json'
                }
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        console.log('✅ Twilio API: Conectado com sucesso');
                        console.log(`✅ Phone Number: ${twilioPhone}`);
                        resolve(true);
                    } else {
                        console.log(`❌ Twilio API: Erro ${res.statusCode}`);
                        resolve(false);
                    }
                });
            });
            
            req.on('error', (error) => {
                console.log(`❌ Twilio API: Erro de conexão - ${error.message}`);
                resolve(false);
            });
            
            req.setTimeout(10000, () => {
                console.log('❌ Twilio API: Timeout');
                req.destroy();
                resolve(false);
            });
            
            req.end();
        });
    } catch (error) {
        console.log(`❌ Erro na verificação Twilio: ${error.message}`);
        return false;
    }
}

// Verificar conexão com banco de dados
async function verificarBancoDados() {
    console.log('\n🗄️ 4. VERIFICANDO CONEXÃO BANCO DE DADOS');
    console.log('=========================================');
    
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
        console.log('❌ DATABASE_URL não configurada');
        return false;
    }
    
    try {
        const { Client } = require('pg');
        const client = new Client({
            connectionString: databaseUrl,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        await client.connect();
        
        // Testar consulta simples
        const result = await client.query('SELECT NOW() as timestamp');
        console.log('✅ PostgreSQL: Conectado com sucesso');
        console.log(`✅ Timestamp: ${result.rows[0].timestamp}`);
        
        // Verificar tabelas essenciais
        const tabelas = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'user_api_keys', 'user_balances', 'trading_signals')
        `);
        
        console.log(`✅ Tabelas encontradas: ${tabelas.rows.length}/4`);
        tabelas.rows.forEach(row => {
            console.log(`  📋 ${row.table_name}`);
        });
        
        await client.end();
        return true;
        
    } catch (error) {
        console.log(`❌ Erro na conexão PostgreSQL: ${error.message}`);
        return false;
    }
}

// Verificar se o servidor está respondendo
async function verificarServidor() {
    console.log('\n🌐 5. VERIFICANDO SERVIDOR LOCAL');
    console.log('=================================');
    
    const port = process.env.PORT || 3000;
    
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: '/health',
            method: 'GET',
            timeout: 5000
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Servidor Local: Respondendo');
                    try {
                        const healthData = JSON.parse(data);
                        console.log(`✅ Status: ${healthData.status}`);
                        console.log(`✅ Versão: ${healthData.version}`);
                        resolve(true);
                    } catch (e) {
                        console.log('✅ Servidor respondendo (dados não-JSON)');
                        resolve(true);
                    }
                } else {
                    console.log(`❌ Servidor Local: Erro ${res.statusCode}`);
                    resolve(false);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`⚠️ Servidor Local: Não iniciado (${error.message})`);
            resolve(false);
        });
        
        req.on('timeout', () => {
            console.log('❌ Servidor Local: Timeout');
            req.destroy();
            resolve(false);
        });
        
        req.end();
    });
}

// Verificar URL de produção Railway
async function verificarProducao() {
    console.log('\n🚀 6. VERIFICANDO PRODUÇÃO RAILWAY');
    console.log('==================================');
    
    // URLs possíveis do Railway
    const possiveisUrls = [
        'https://coinbitclub-market-bot.up.railway.app',
        'https://coinbitclub-market-bot-production.up.railway.app',
        'https://web-production-1234.up.railway.app' // placeholder
    ];
    
    for (const url of possiveisUrls) {
        try {
            console.log(`🔍 Testando: ${url}`);
            
            const urlParts = new URL(url);
            
            const options = {
                hostname: urlParts.hostname,
                port: 443,
                path: '/health',
                method: 'GET',
                headers: {
                    'User-Agent': 'CoinBitClub-Health-Check'
                }
            };
            
            const resultado = await new Promise((resolve) => {
                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        resolve({ status: res.statusCode, data: data });
                    });
                });
                
                req.on('error', (error) => {
                    resolve({ status: 'error', error: error.message });
                });
                
                req.setTimeout(10000, () => {
                    req.destroy();
                    resolve({ status: 'timeout' });
                });
                
                req.end();
            });
            
            if (resultado.status === 200) {
                console.log(`✅ ${url}: Online e funcionando!`);
                try {
                    const healthData = JSON.parse(resultado.data);
                    console.log(`  📊 Status: ${healthData.status}`);
                    console.log(`  📅 Version: ${healthData.version}`);
                    console.log(`  🌍 Environment: ${healthData.environment}`);
                } catch (e) {
                    console.log('  📊 Respondendo (dados não-JSON)');
                }
                return url;
            } else if (resultado.status === 'timeout') {
                console.log(`⏳ ${url}: Timeout`);
            } else if (resultado.status === 'error') {
                console.log(`❌ ${url}: ${resultado.error}`);
            } else {
                console.log(`❌ ${url}: HTTP ${resultado.status}`);
            }
        } catch (error) {
            console.log(`❌ ${url}: Erro - ${error.message}`);
        }
    }
    
    console.log('⚠️ Nenhuma URL de produção encontrada online');
    return null;
}

// Função principal
async function executarVerificacao() {
    console.log('🔍 Iniciando verificação completa...\n');
    
    // 1. Variáveis essenciais
    const variaveisOk = verificarVariaveisEssenciais();
    
    // 2. Variáveis exchanges
    const exchangesOk = verificarVariaveisExchanges();
    
    // 3. Twilio
    const twilioOk = await verificarTwilio();
    
    // 4. Banco de dados
    const bancoOk = await verificarBancoDados();
    
    // 5. Servidor local
    const servidorOk = await verificarServidor();
    
    // 6. Produção
    const producaoUrl = await verificarProducao();
    
    // Resumo final
    console.log('\n📊 RESUMO DA VERIFICAÇÃO');
    console.log('========================');
    console.log(`✅ Variáveis Essenciais: ${variaveisOk ? 'OK' : 'ERRO'}`);
    console.log(`📊 Exchanges Configuradas: ${Math.floor(exchangesOk/2)}/3`);
    console.log(`📱 Twilio SMS: ${twilioOk ? 'OK' : 'ERRO'}`);
    console.log(`🗄️ Banco PostgreSQL: ${bancoOk ? 'OK' : 'ERRO'}`);
    console.log(`🌐 Servidor Local: ${servidorOk ? 'OK' : 'NÃO INICIADO'}`);
    console.log(`🚀 Produção Railway: ${producaoUrl ? 'OK' : 'OFFLINE'}`);
    
    // Status geral
    const statusGeral = variaveisOk && twilioOk && bancoOk;
    console.log(`\n🎯 STATUS GERAL: ${statusGeral ? '✅ PRONTO' : '❌ REQUER ATENÇÃO'}`);
    
    if (!statusGeral) {
        console.log('\n🔧 AÇÕES NECESSÁRIAS:');
        if (!variaveisOk) console.log('- Configurar variáveis de ambiente faltantes');
        if (!twilioOk) console.log('- Configurar credenciais Twilio');
        if (!bancoOk) console.log('- Verificar conexão PostgreSQL');
        if (!producaoUrl) console.log('- Deploy no Railway');
    } else {
        console.log('\n🎉 SISTEMA PRONTO PARA OPERAÇÃO!');
        if (producaoUrl) {
            console.log(`🌐 URL Produção: ${producaoUrl}`);
        }
    }
}

// Executar verificação
if (require.main === module) {
    executarVerificacao().catch(console.error);
}

module.exports = { executarVerificacao };
