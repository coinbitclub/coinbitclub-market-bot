/**
 * 🔧 CONFIGURAR IP NAS CHAVES BYBIT
 * 
 * Script para configurar o IP atual do servidor Railway
 * nas chaves API da Bybit para resolver problemas de autenticação
 */

const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

// IP atual do servidor Railway
const IP_SERVIDOR_RAILWAY = '132.255.160.140';

/**
 * Buscar usuários com chaves Bybit (query corrigida)
 */
async function buscarUsuariosBybit() {
    console.log('👥 === USUÁRIOS COM CHAVES BYBIT ===\n');
    
    try {
        const query = `
            SELECT 
                u.id,
                u.name,
                u.email,
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
            console.log(`   💎 VIP: ${user.is_vip ? 'Sim' : 'Não'}`);
            console.log(`   🔑 API Key: ${user.api_key.substring(0, 8)}...`);
            console.log(`   📊 Status: ${user.status}`);
            console.log(`   📅 Criada: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
        });
        
        return result.rows;
        
    } catch (error) {
        console.error('❌ Erro ao buscar usuários Bybit:', error.message);
        return [];
    }
}

/**
 * Instruções detalhadas para configurar IP na Bybit
 */
function exibirInstrucoesDetalhadas() {
    console.log('\n🎯 === INSTRUÇÕES DETALHADAS PARA CONFIGURAR IP NA BYBIT ===\n');
    
    console.log('📍 IP DO SERVIDOR RAILWAY: 132.255.160.140');
    console.log('');
    
    console.log('🔗 PASSO 1: ACESSAR BYBIT');
    console.log('   1. Abra https://www.bybit.com');
    console.log('   2. Faça login na conta onde criou as API keys');
    console.log('');
    
    console.log('⚙️ PASSO 2: ACESSAR CONFIGURAÇÕES DE API');
    console.log('   1. Clique no ícone do perfil (canto superior direito)');
    console.log('   2. Selecione "Account & Security"');
    console.log('   3. No menu lateral, clique em "API Management"');
    console.log('');
    
    console.log('🔧 PASSO 3: EDITAR API KEY');
    console.log('   1. Encontre a API key que está sendo usada no sistema');
    console.log('   2. Clique no botão "Edit" ao lado da chave');
    console.log('   3. Na tela de edição, procure por "IP Access Restriction"');
    console.log('');
    
    console.log('🌐 PASSO 4: CONFIGURAR RESTRIÇÃO DE IP');
    console.log('   1. Marque a opção "Restrict access to trusted IPs only"');
    console.log('   2. No campo de IP, digite: 132.255.160.140');
    console.log('   3. Clique em "Add" para adicionar o IP');
    console.log('   4. Clique em "Save" para salvar as alterações');
    console.log('');
    
    console.log('⏳ PASSO 5: AGUARDAR PROPAGAÇÃO');
    console.log('   1. Aguarde 2-5 minutos para as alterações fazerem efeito');
    console.log('   2. A Bybit precisa propagar as configurações nos servidores');
    console.log('');
    
    console.log('🧪 PASSO 6: TESTAR CONECTIVIDADE');
    console.log('   1. Execute: node teste-conectividade-real-bybit.js');
    console.log('   2. Verifique se o erro "API key is invalid" foi resolvido');
    console.log('   3. Confirme que os saldos são exibidos corretamente');
    console.log('');
    
    console.log('⚠️ OBSERVAÇÕES IMPORTANTES:');
    console.log('   ❗ O IP 132.255.160.140 é específico do Railway');
    console.log('   ❗ Se o Railway reiniciar, o IP pode mudar');
    console.log('   ❗ Configure TODOS as API keys que estão sendo usadas');
    console.log('   ❗ Mantenha um backup das configurações');
    console.log('');
    
    console.log('🔒 CONFIGURAÇÕES DE SEGURANÇA EXTRAS:');
    console.log('   ✅ Marque "Enable withdrawal" apenas se necessário');
    console.log('   ✅ Configure expiração da API key (opcional)');
    console.log('   ✅ Limite as permissões apenas ao que é necessário');
    console.log('   ✅ Ative notificações de uso da API');
}

/**
 * Verificar se configuração foi aplicada
 */
async function verificarConfiguracaoIP() {
    console.log('\n🔍 === VERIFICAÇÃO DE CONFIGURAÇÃO ===\n');
    
    const axios = require('axios');
    const crypto = require('crypto');
    
    try {
        // Buscar primeira chave ativa
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
            console.log('❌ Nenhuma chave Bybit ativa encontrada para teste');
            return false;
        }
        
        const { api_key, secret_key, name } = result.rows[0];
        
        console.log(`🔑 Testando configuração IP com chave do usuário: ${name}`);
        console.log(`📍 IP esperado: ${IP_SERVIDOR_RAILWAY}`);
        console.log(`🔗 API Key: ${api_key.substring(0, 8)}...`);
        console.log('');
        
        // Teste simples de autenticação
        const timestamp = Date.now().toString();
        const queryString = `timestamp=${timestamp}`;
        const signature = crypto
            .createHmac('sha256', secret_key)
            .update(timestamp + api_key + '5000' + queryString)
            .digest('hex');
        
        console.log('🔄 Fazendo requisição de teste...');
        
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
            timeout: 15000
        });
        
        if (response.data.retCode === 0) {
            console.log('✅ SUCESSO! IP configurado corretamente!');
            console.log('🎉 Chave API funcionando com restrição de IP');
            console.log('💰 Saldos obtidos com sucesso');
            return true;
        } else {
            console.log('❌ Erro na resposta da API:', response.data.retMsg);
            console.log('🔄 Código do erro:', response.data.retCode);
            return false;
        }
        
    } catch (error) {
        if (error.response?.data) {
            const errorData = error.response.data;
            console.log('❌ Erro da API Bybit:');
            console.log(`   Código: ${errorData.retCode}`);
            console.log(`   Mensagem: ${errorData.retMsg}`);
            
            if (errorData.retCode === 10003) {
                console.log('');
                console.log('🚨 IP NÃO CONFIGURADO OU INCORRETO!');
                console.log('💡 Siga as instruções acima para configurar o IP');
                console.log(`📍 IP correto: ${IP_SERVIDOR_RAILWAY}`);
            }
        } else {
            console.log('❌ Erro de conexão:', error.message);
        }
        return false;
    }
}

/**
 * Monitorar mudanças de IP
 */
async function monitorarMudancasIP() {
    console.log('\n📊 === MONITORAMENTO DE IP ===\n');
    
    const axios = require('axios');
    
    try {
        // Verificar IP atual
        const response = await axios.get('https://api.ipify.org?format=json');
        const ipAtual = response.data.ip;
        
        console.log(`🌐 IP atual do servidor: ${ipAtual}`);
        console.log(`📍 IP configurado na Bybit: ${IP_SERVIDOR_RAILWAY}`);
        
        if (ipAtual === IP_SERVIDOR_RAILWAY) {
            console.log('✅ IPs coincidem - configuração correta');
        } else {
            console.log('⚠️ IP MUDOU! Atualize na Bybit:');
            console.log(`   Antigo: ${IP_SERVIDOR_RAILWAY}`);
            console.log(`   Novo: ${ipAtual}`);
        }
        
        console.log('\n💡 DICA: Configure alertas para mudanças de IP');
        console.log('🔔 Implemente verificação automática de IP no sistema');
        
    } catch (error) {
        console.error('❌ Erro ao verificar IP:', error.message);
    }
}

/**
 * Função principal
 */
async function main() {
    console.log('🚀 CONFIGURAÇÃO DE IP PARA CHAVES BYBIT\n');
    console.log('=' .repeat(60));
    
    try {
        // 1. Buscar usuários com chaves Bybit
        const usuarios = await buscarUsuariosBybit();
        
        // 2. Exibir instruções detalhadas
        exibirInstrucoesDetalhadas();
        
        // 3. Verificar se já foi configurado
        console.log('🔍 Verificando se IP já foi configurado...\n');
        const configurado = await verificarConfiguracaoIP();
        
        if (!configurado) {
            console.log('\n❌ IP ainda não configurado ou incorreto');
            console.log('📋 Siga as instruções acima para configurar');
        }
        
        // 4. Monitorar mudanças de IP
        await monitorarMudancasIP();
        
        console.log('\n' + '=' .repeat(60));
        console.log('✅ RESUMO FINAL:');
        console.log(`🌐 IP do Railway: ${IP_SERVIDOR_RAILWAY}`);
        console.log(`👥 Usuários Bybit: ${usuarios.length}`);
        console.log('🔧 Configure este IP nas suas API keys da Bybit');
        console.log('🧪 Teste após configuração: node teste-conectividade-real-bybit.js');
        
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

module.exports = { buscarUsuariosBybit, verificarConfiguracaoIP };
