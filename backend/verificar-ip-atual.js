/**
 * 🌐 VERIFICADOR DE IP ATUAL - BYBIT API
 * 
 * Este script verifica o IP atual do servidor Railway e fornece
 * informações para configurar corretamente as chaves API da Bybit
 * com restrições de IP.
 */

const axios = require('axios');
const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

/**
 * Obter IP atual do servidor
 */
async function obterIPAtual() {
    console.log('🌐 === VERIFICAÇÃO DE IP ATUAL ===\n');
    
    try {
        // Método 1: ipify.org
        console.log('📡 Verificando IP via ipify.org...');
        const response1 = await axios.get('https://api.ipify.org?format=json', {
            timeout: 10000
        });
        console.log(`✅ IP detectado (ipify): ${response1.data.ip}`);
        
        // Método 2: httpbin.org
        console.log('\n📡 Verificando IP via httpbin.org...');
        const response2 = await axios.get('https://httpbin.org/ip', {
            timeout: 10000
        });
        console.log(`✅ IP detectado (httpbin): ${response2.data.origin}`);
        
        // Método 3: icanhazip.com
        console.log('\n📡 Verificando IP via icanhazip.com...');
        const response3 = await axios.get('https://icanhazip.com/', {
            timeout: 10000
        });
        const ip3 = response3.data.trim();
        console.log(`✅ IP detectado (icanhazip): ${ip3}`);
        
        // Verificar consistência
        const ips = [response1.data.ip, response2.data.origin, ip3];
        const ipUnico = [...new Set(ips)];
        
        console.log('\n🔍 === ANÁLISE DE CONSISTÊNCIA ===');
        console.log(`📊 IPs detectados: ${ips.join(', ')}`);
        console.log(`🎯 IPs únicos: ${ipUnico.length}`);
        
        if (ipUnico.length === 1) {
            console.log(`✅ IP CONSISTENTE: ${ipUnico[0]}`);
            return ipUnico[0];
        } else {
            console.log('⚠️ IPs diferentes detectados - usando o mais comum');
            return response1.data.ip; // Usar ipify como padrão
        }
        
    } catch (error) {
        console.error('❌ Erro ao obter IP:', error.message);
        return null;
    }
}

/**
 * Verificar informações de rede do Railway
 */
async function verificarInfoRailway() {
    console.log('\n🚂 === INFORMAÇÕES DO RAILWAY ===\n');
    
    try {
        // Headers que o Railway pode fornecer
        const headers = {
            'X-Forwarded-For': process.env.HTTP_X_FORWARDED_FOR,
            'X-Real-IP': process.env.HTTP_X_REAL_IP,
            'CF-Connecting-IP': process.env.HTTP_CF_CONNECTING_IP
        };
        
        console.log('📋 Headers de IP disponíveis:');
        Object.entries(headers).forEach(([key, value]) => {
            if (value) {
                console.log(`  ${key}: ${value}`);
            } else {
                console.log(`  ${key}: Não disponível`);
            }
        });
        
        // Informações do ambiente Railway
        console.log('\n🏗️ Ambiente Railway:');
        console.log(`  RAILWAY_ENVIRONMENT: ${process.env.RAILWAY_ENVIRONMENT || 'Não definido'}`);
        console.log(`  RAILWAY_SERVICE_NAME: ${process.env.RAILWAY_SERVICE_NAME || 'Não definido'}`);
        console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'Não definido'}`);
        
    } catch (error) {
        console.error('❌ Erro ao verificar informações Railway:', error.message);
    }
}

/**
 * Buscar usuários com chaves Bybit
 */
async function buscarUsuariosBybit() {
    console.log('\n👥 === USUÁRIOS COM CHAVES BYBIT ===\n');
    
    try {
        const query = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.country,
                u.is_vip,
                uak.exchange,
                uak.api_key,
                uak.status,
                uak.created_at,
                uak.updated_at
            FROM users u
            INNER JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE uak.exchange = 'bybit'
            ORDER BY u.name;
        `;
        
        const result = await pool.query(query);
        
        if (result.rows.length === 0) {
            console.log('📭 Nenhum usuário com chaves Bybit encontrado');
            return [];
        }
        
        console.log(`👥 ${result.rows.length} usuário(s) com chaves Bybit:`);
        
        result.rows.forEach((user, index) => {
            console.log(`\n${index + 1}. ${user.name} (${user.email})`);
            console.log(`   🏳️ País: ${user.country}`);
            console.log(`   💎 VIP: ${user.is_vip ? 'Sim' : 'Não'}`);
            console.log(`   🔑 API Key: ${user.api_key.substring(0, 8)}...`);
            console.log(`   📊 Status: ${user.status}`);
            console.log(`   📅 Criada: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
            console.log(`   🔄 Atualizada: ${new Date(user.updated_at).toLocaleString('pt-BR')}`);
        });
        
        return result.rows;
        
    } catch (error) {
        console.error('❌ Erro ao buscar usuários Bybit:', error.message);
        return [];
    }
}

/**
 * Gerar instruções para configurar IP na Bybit
 */
function gerarInstrucoesBybit(ip) {
    console.log('\n📋 === INSTRUÇÕES PARA CONFIGURAR IP NA BYBIT ===\n');
    
    console.log('🎯 PASSO A PASSO PARA CONFIGURAR RESTRIÇÃO DE IP:');
    console.log('');
    console.log('1. 🌐 Acesse https://www.bybit.com');
    console.log('2. 🔐 Faça login na conta');
    console.log('3. 👤 Vá em "Account & Security" > "API Management"');
    console.log('4. 🔧 Clique em "Edit" na API key que está sendo usada');
    console.log('5. 🌍 Na seção "IP Access Restriction":');
    console.log('   - Selecione "Restrict access to trusted IPs only"');
    console.log(`   - Adicione o IP: ${ip}`);
    console.log('6. 💾 Salve as alterações');
    console.log('7. ⏳ Aguarde alguns minutos para propagação');
    console.log('');
    console.log('🔒 CONFIGURAÇÕES DE SEGURANÇA RECOMENDADAS:');
    console.log('   ✅ Enable IP Restriction');
    console.log('   ✅ Enable API Key Expiration (opcional)');
    console.log('   ✅ Restrict to specific functions (se necessário)');
    console.log('');
    console.log('⚠️ IMPORTANTE:');
    console.log('   - O IP pode mudar se o Railway reiniciar o serviço');
    console.log('   - Considere usar IPs de range do Railway se disponível');
    console.log('   - Monitore logs para detectar mudanças de IP');
}

/**
 * Testar conectividade após configuração
 */
async function testarConectividadeBybit(ip) {
    console.log('\n🧪 === TESTE DE CONECTIVIDADE BYBIT ===\n');
    
    try {
        // Buscar primeira chave Bybit
        const query = `
            SELECT 
                uak.api_key,
                uak.secret_key,
                u.name
            FROM user_api_keys uak
            INNER JOIN users u ON uak.user_id = u.id
            WHERE uak.exchange = 'bybit' 
            AND uak.status = 'active'
            LIMIT 1;
        `;
        
        const result = await pool.query(query);
        
        if (result.rows.length === 0) {
            console.log('❌ Nenhuma chave Bybit ativa encontrada');
            return false;
        }
        
        const { api_key, secret_key, name } = result.rows[0];
        
        console.log(`🔑 Testando chave do usuário: ${name}`);
        console.log(`📍 IP atual do servidor: ${ip}`);
        console.log(`🔗 API Key: ${api_key.substring(0, 8)}...`);
        
        // Fazer requisição simples para testar
        const crypto = require('crypto');
        const timestamp = Date.now().toString();
        
        const queryString = `timestamp=${timestamp}`;
        const signature = crypto
            .createHmac('sha256', secret_key)
            .update(timestamp + api_key + '5000' + queryString)
            .digest('hex');
        
        const response = await axios.get('https://api.bybit.com/v5/account/wallet-balance', {
            headers: {
                'X-BAPI-API-KEY': api_key,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': '5000'
            },
            params: {
                accountType: 'UNIFIED'
            },
            timeout: 10000
        });
        
        if (response.data.retCode === 0) {
            console.log('✅ SUCESSO! Chave API funcionando corretamente');
            console.log('🎉 IP configurado corretamente na Bybit');
            return true;
        } else {
            console.log('❌ Erro na resposta:', response.data.retMsg);
            return false;
        }
        
    } catch (error) {
        if (error.response?.data) {
            console.log('❌ Erro da API Bybit:', error.response.data);
            if (error.response.data.retCode === 10003) {
                console.log('🚨 IP não autorizado - configure o IP na Bybit!');
            }
        } else {
            console.log('❌ Erro de conexão:', error.message);
        }
        return false;
    }
}

/**
 * Função principal
 */
async function main() {
    console.log('🚀 INICIANDO VERIFICAÇÃO DE IP PARA BYBIT API...\n');
    
    try {
        // 1. Obter IP atual
        const ip = await obterIPAtual();
        
        if (!ip) {
            console.log('❌ Não foi possível obter o IP atual');
            return;
        }
        
        // 2. Verificar informações Railway
        await verificarInfoRailway();
        
        // 3. Buscar usuários Bybit
        const usuarios = await buscarUsuariosBybit();
        
        // 4. Gerar instruções
        gerarInstrucoesBybit(ip);
        
        // 5. Testar conectividade (opcional)
        console.log('\n🔄 Deseja testar a conectividade agora? (depois de configurar IP)');
        console.log('💡 Execute: node teste-conectividade-real-bybit.js');
        
        console.log('\n✅ === RESUMO FINAL ===');
        console.log(`🌐 IP do servidor: ${ip}`);
        console.log(`👥 Usuários Bybit: ${usuarios.length}`);
        console.log('📋 Configure este IP nas chaves API da Bybit');
        console.log('🔄 Teste novamente após configuração');
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { obterIPAtual, verificarInfoRailway, buscarUsuariosBybit };
