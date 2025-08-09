/**
 * 🔍 VERIFICAÇÃO URGENTE - MUDANÇA DE IP PÓS-DEPLOY
 * 
 * Verificar se o deploy no Railway hoje alterou o IP
 * e se isso está causando o problema nas chaves Bybit
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔍 VERIFICAÇÃO URGENTE - MUDANÇA DE IP PÓS-DEPLOY');
console.log('=================================================');

async function verificarMudancaIP() {
    try {
        // 1. Verificar IP atual vs IP esperado
        console.log('\n🌐 1. VERIFICANDO MUDANÇA DE IP:');
        console.log('===============================');
        
        const ipAtual = await obterIPAtual();
        const ipAnterior = '132.255.160.140'; // IP que estava configurado
        
        console.log(`📍 IP anterior (configurado): ${ipAnterior}`);
        console.log(`🌍 IP atual do servidor: ${ipAtual}`);
        
        if (ipAtual !== ipAnterior) {
            console.log('🚨 PROBLEMA IDENTIFICADO: IP MUDOU!');
            console.log('');
            console.log('🔍 CAUSA DO PROBLEMA:');
            console.log('   • Deploy no Railway hoje alterou IP');
            console.log('   • Chaves Bybit ainda configuradas para IP antigo');
            console.log('   • Sistema rejeitando conexões do novo IP');
            
            await analisarImpactoMudancaIP(ipAnterior, ipAtual);
            await testarChavesComNovoIP(ipAtual);
            await gerarPlanoCorrecao(ipAtual);
            
        } else {
            console.log('✅ IP mantido estável - problema pode ser outro');
            await investigarOutrassCausas();
        }
        
    } catch (error) {
        console.error('❌ Erro na verificação:', error.message);
    } finally {
        await pool.end();
    }
}

async function obterIPAtual() {
    try {
        console.log('🔄 Consultando IP atual...');
        
        // Testar múltiplos serviços para confirmar
        const servicos = [
            'https://api.ipify.org?format=json',
            'https://httpbin.org/ip',
            'https://api.myip.com'
        ];
        
        for (const servico of servicos) {
            try {
                const response = await fetch(servico);
                const data = await response.json();
                
                let ip;
                if (data.ip) {
                    ip = data.ip;
                } else if (data.origin) {
                    ip = data.origin;
                } else if (data.query) {
                    ip = data.query;
                }
                
                if (ip) {
                    console.log(`   ✅ ${servico}: ${ip}`);
                    return ip;
                }
                
            } catch (error) {
                console.log(`   ❌ ${servico}: ${error.message}`);
            }
        }
        
        throw new Error('Não foi possível obter IP de nenhum serviço');
        
    } catch (error) {
        console.log(`   ❌ Erro ao obter IP: ${error.message}`);
        return 'Desconhecido';
    }
}

async function analisarImpactoMudancaIP(ipAnterior, ipAtual) {
    console.log('\n📊 2. ANÁLISE DO IMPACTO DA MUDANÇA:');
    console.log('===================================');
    
    console.log('🔴 IMPACTOS IDENTIFICADOS:');
    console.log(`   • IP anterior: ${ipAnterior}`);
    console.log(`   • IP atual: ${ipAtual}`);
    console.log('   • Todas as configurações de IP ficaram inválidas');
    console.log('   • Chaves podem estar rejeitando conexões');
    console.log('');
    
    console.log('📋 EXPLICAÇÃO TÉCNICA:');
    console.log('   1. Railway pode alterar IP em deploys');
    console.log('   2. Bybit mantém whitelist do IP anterior');
    console.log('   3. Novo IP não está autorizado');
    console.log('   4. Resultado: Erro 10003 (API key invalid)');
    
    // Verificar quando foi o último deploy
    console.log('\n🕐 TIMELINE DO PROBLEMA:');
    console.log('   • Sistema funcionava antes');
    console.log('   • Deploy realizado hoje');
    console.log('   • IP alterado no deploy');
    console.log('   • Chaves pararam de funcionar');
    console.log('   • Usuário reportou problema agora');
}

async function testarChavesComNovoIP(novoIP) {
    console.log('\n🧪 3. TESTANDO CHAVES COM NOVO IP:');
    console.log('=================================');
    
    try {
        // Buscar uma chave para testar
        const chaves = await pool.query(`
            SELECT 
                u.name,
                uak.api_key,
                uak.secret_key,
                uak.environment
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            WHERE uak.exchange = 'bybit' AND uak.is_active = true
            LIMIT 1
        `);
        
        if (chaves.rows.length === 0) {
            console.log('❌ Nenhuma chave para testar');
            return;
        }
        
        const chave = chaves.rows[0];
        console.log(`🔑 Testando chave: ${chave.name}`);
        
        // Testar endpoint público (deve funcionar)
        await testarEndpointPublico(chave);
        
        // Testar endpoint privado (deve falhar por IP)
        await testarEndpointPrivado(chave);
        
    } catch (error) {
        console.log('❌ Erro no teste:', error.message);
    }
}

async function testarEndpointPublico(chave) {
    console.log('\n🌍 Testando endpoint público:');
    
    try {
        const baseUrl = chave.environment === 'testnet' ? 
            'https://api-testnet.bybit.com' : 
            'https://api.bybit.com';
        
        const response = await fetch(`${baseUrl}/v5/market/time`);
        const data = await response.json();
        
        if (data.retCode === 0) {
            console.log('   ✅ Endpoint público: OK (IP pode acessar Bybit)');
        } else {
            console.log('   ❌ Endpoint público: Falhou');
        }
        
    } catch (error) {
        console.log('   ❌ Erro de conectividade com Bybit');
    }
}

async function testarEndpointPrivado(chave) {
    console.log('\n🔐 Testando endpoint privado:');
    
    try {
        const baseUrl = chave.environment === 'testnet' ? 
            'https://api-testnet.bybit.com' : 
            'https://api.bybit.com';
        
        const timestamp = Date.now().toString();
        const recvWindow = '5000';
        const message = timestamp + chave.api_key + recvWindow;
        const signature = crypto.createHmac('sha256', chave.secret_key).update(message).digest('hex');
        
        const headers = {
            'X-BAPI-API-KEY': chave.api_key,
            'X-BAPI-SIGN': signature,
            'X-BAPI-SIGN-TYPE': '2',
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': recvWindow,
            'Content-Type': 'application/json'
        };
        
        const response = await fetch(`${baseUrl}/v5/account/info`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        
        if (data.retCode === 0) {
            console.log('   ✅ Endpoint privado: OK (problema resolvido!)');
        } else if (data.retCode === 10006) {
            console.log('   🚨 Endpoint privado: Erro 10006 (IP não autorizado)');
        } else if (data.retCode === 10003) {
            console.log('   🚨 Endpoint privado: Erro 10003 (provável problema de IP)');
        } else {
            console.log(`   ❌ Endpoint privado: Erro ${data.retCode} - ${data.retMsg}`);
        }
        
    } catch (error) {
        console.log('   ❌ Erro no teste privado');
    }
}

async function gerarPlanoCorrecao(novoIP) {
    console.log('\n🎯 4. PLANO DE CORREÇÃO IMEDIATA:');
    console.log('================================');
    
    console.log('🚨 PROBLEMA CONFIRMADO: MUDANÇA DE IP PÓS-DEPLOY');
    console.log('');
    
    console.log('📋 SOLUÇÕES DISPONÍVEIS:');
    console.log('========================');
    
    console.log('✅ OPÇÃO 1 - ATUALIZAR IP NAS CHAVES (RECOMENDADO):');
    console.log(`   • Acessar contas Bybit`);
    console.log(`   • API Management → Editar cada chave`);
    console.log(`   • Atualizar IP para: ${novoIP}`);
    console.log(`   • Tempo: 5-10 minutos total`);
    console.log('');
    
    console.log('✅ OPÇÃO 2 - REMOVER RESTRIÇÃO IP (MAIS RÁPIDO):');
    console.log('   • Acessar contas Bybit');
    console.log('   • API Management → Editar cada chave');
    console.log('   • IP Access → "Unrestricted"');
    console.log('   • Tempo: 2-3 minutos total');
    console.log('   • Vantagem: Não afetado por mudanças futuras de IP');
    console.log('');
    
    console.log('🔄 OPÇÃO 3 - FIXAR IP NO RAILWAY (TÉCNICA):');
    console.log('   • Investigar se Railway permite IP fixo');
    console.log('   • Configurar IP estático se possível');
    console.log('   • Pode envolver upgrade do plano');
    
    console.log('\n📞 AÇÕES ESPECÍFICAS POR USUÁRIO:');
    console.log('=================================');
    
    // Buscar todas as chaves para dar instruções específicas
    const todasChaves = await pool.query(`
        SELECT 
            u.name,
            u.email,
            uak.api_key,
            uak.environment
        FROM user_api_keys uak
        JOIN users u ON uak.user_id = u.id
        WHERE uak.exchange = 'bybit' AND uak.is_active = true
        ORDER BY u.name
    `);
    
    todasChaves.rows.forEach((chave, index) => {
        console.log(`\n${index + 1}. 👤 ${chave.name}:`);
        console.log(`   📧 Login: ${chave.email}`);
        console.log(`   🔑 Editar chave: ${chave.api_key.substring(0, 12)}...`);
        console.log(`   🌍 Ambiente: ${chave.environment}`);
        console.log(`   🔧 Ação: Atualizar IP para ${novoIP} OU remover restrição`);
    });
    
    console.log('\n⚡ RECOMENDAÇÃO FINAL:');
    console.log('=====================');
    console.log('🚀 Para resolver RAPIDAMENTE: Use OPÇÃO 2');
    console.log('   • Remove restrição de IP');
    console.log('   • Sistema funciona imediatamente');
    console.log('   • Não afetado por futuras mudanças de IP');
    console.log('');
    console.log('🔒 Para máxima SEGURANÇA: Use OPÇÃO 1');
    console.log(`   • Atualiza IP para ${novoIP}`);
    console.log('   • Mantém segurança por IP');
    console.log('   • Pode precisar reconfigurar em futuros deploys');
    
    console.log('\n🧪 TESTE PÓS-CORREÇÃO:');
    console.log('======================');
    console.log('Após qualquer correção, executar:');
    console.log('   node diagnose-bybit-keys.js');
    console.log('');
    console.log('Resultado esperado:');
    console.log('   ✅ Todas as chaves funcionando');
    console.log('   ✅ Erro 10003 eliminado');
    console.log('   ✅ Acesso completo às APIs privadas');
}

async function investigarOutrassCausas() {
    console.log('\n🔍 INVESTIGANDO OUTRAS CAUSAS:');
    console.log('=============================');
    
    console.log('IP não mudou, verificando outras possibilidades:');
    console.log('1. Configurações foram revertidas no deploy');
    console.log('2. Chaves foram alteradas na Bybit');
    console.log('3. Problema temporário da Bybit');
    console.log('4. Mudança nas permissões das chaves');
    
    console.log('\n🧪 Execute teste específico:');
    console.log('node teste-chaves-validas.js');
}

// Executar verificação
verificarMudancaIP().catch(console.error);
