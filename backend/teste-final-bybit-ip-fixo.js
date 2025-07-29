/**
 * 🎯 TESTE FINAL - CHAVES BYBIT COM IP FIXO
 * 
 * Script para testar as chaves Bybit da Érica após configuração do IP
 * IP do Railway: 132.255.160.140
 */

const axios = require('axios');
const crypto = require('crypto');
const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

const IP_RAILWAY = '132.255.160.140';

/**
 * Instruções para configurar IP na Bybit
 */
function exibirInstrucoesIP() {
    console.log('🎯 === INSTRUÇÕES PARA CONFIGURAR IP NA BYBIT ===\n');
    
    console.log('📍 IP DO SERVIDOR RAILWAY: 132.255.160.140\n');
    
    console.log('🔗 PASSO A PASSO:');
    console.log('1. 🌐 Acesse: https://www.bybit.com');
    console.log('2. 🔐 Faça login na conta da Érica dos Santos');
    console.log('3. 👤 Clique no perfil > "Account & Security"');
    console.log('4. ⚙️ Clique em "API Management" no menu lateral');
    console.log('5. 🔧 Encontre a API key: dtbi5nXnYURm7uHnxA');
    console.log('6. ✏️ Clique em "Edit" ao lado da chave');
    console.log('7. 🌐 Na seção "IP Access Restriction":');
    console.log('   • Marque "Restrict access to trusted IPs only"');
    console.log('   • Digite o IP: 132.255.160.140');
    console.log('   • Clique em "Add"');
    console.log('8. 💾 Clique em "Save" para salvar');
    console.log('9. ⏳ Aguarde 2-5 minutos para propagação\n');
    
    console.log('⚠️ IMPORTANTE:');
    console.log('❗ Configure EXATAMENTE o IP: 132.255.160.140');
    console.log('❗ Não use outros IPs ou ranges');
    console.log('❗ Certifique-se de salvar as alterações');
    console.log('❗ Aguarde alguns minutos antes de testar\n');
}

/**
 * Buscar chaves da Érica
 */
async function buscarChavesErica() {
    console.log('🔑 === BUSCANDO CHAVES DA ÉRICA ===\n');
    
    try {
        const query = `
            SELECT 
                u.name,
                u.email,
                uak.api_key,
                uak.secret_key,
                uak.is_active,
                uak.validation_status,
                uak.created_at
            FROM user_api_keys uak
            INNER JOIN users u ON uak.user_id = u.id
            WHERE u.email = 'erica.andrade.santos@hotmail.com'
            AND uak.exchange = 'bybit';
        `;
        
        const result = await pool.query(query);
        
        if (result.rows.length === 0) {
            console.log('❌ Nenhuma chave Bybit encontrada para Érica');
            return null;
        }
        
        const chave = result.rows[0];
        console.log('✅ Chave encontrada:');
        console.log(`   Usuária: ${chave.name}`);
        console.log(`   Email: ${chave.email}`);
        console.log(`   API Key: ${chave.api_key.substring(0, 8)}...`);
        console.log(`   Status: ${chave.validation_status}`);
        console.log(`   Ativa: ${chave.is_active ? 'Sim' : 'Não'}`);
        console.log(`   Criada: ${new Date(chave.created_at).toLocaleString('pt-BR')}\n`);
        
        return chave;
        
    } catch (error) {
        console.error('❌ Erro ao buscar chaves:', error.message);
        return null;
    }
}

/**
 * Testar conectividade com Bybit
 */
async function testarConectividadeBybit(apiKey, secretKey) {
    console.log('🧪 === TESTE DE CONECTIVIDADE BYBIT ===\n');
    
    try {
        console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`);
        console.log(`📍 IP do servidor: ${IP_RAILWAY}`);
        console.log('🔄 Fazendo requisição para Bybit...\n');
        
        // Preparar assinatura
        const timestamp = Date.now().toString();
        const queryString = `timestamp=${timestamp}`;
        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(timestamp + apiKey + '5000' + queryString)
            .digest('hex');
        
        console.log('📡 Detalhes da requisição:');
        console.log(`   Timestamp: ${timestamp}`);
        console.log(`   Signature: ${signature.substring(0, 16)}...`);
        console.log(`   Endpoint: /v5/account/wallet-balance\n`);
        
        // Fazer requisição
        const response = await axios.get('https://api.bybit.com/v5/account/wallet-balance', {
            headers: {
                'X-BAPI-API-KEY': apiKey,
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
        
        console.log('📨 Resposta da Bybit:');
        console.log(`   Código de retorno: ${response.data.retCode}`);
        console.log(`   Mensagem: ${response.data.retMsg}\n`);
        
        if (response.data.retCode === 0) {
            console.log('🎉 SUCESSO! CONECTIVIDADE ESTABELECIDA!\n');
            
            // Exibir saldos se disponíveis
            if (response.data.result && response.data.result.list) {
                console.log('💰 SALDOS DA CONTA:');
                response.data.result.list.forEach(account => {
                    if (account.coin && account.coin.length > 0) {
                        console.log(`   Tipo de conta: ${account.accountType}`);
                        account.coin.forEach(coin => {
                            if (parseFloat(coin.walletBalance) > 0) {
                                console.log(`     ${coin.coin}: ${coin.walletBalance}`);
                            }
                        });
                    }
                });
            }
            
            // Atualizar status no banco
            await atualizarStatusValidacao('validated');
            
            console.log('\n✅ SISTEMA MULTIUSUÁRIO FUNCIONANDO!');
            console.log('🔗 Conectividade com exchange estabelecida');
            console.log('🎯 IP configurado corretamente na Bybit');
            
            return true;
            
        } else {
            console.log('❌ ERRO NA RESPOSTA DA API');
            console.log(`   Código: ${response.data.retCode}`);
            console.log(`   Mensagem: ${response.data.retMsg}\n`);
            
            await atualizarStatusValidacao('error');
            return false;
        }
        
    } catch (error) {
        if (error.response?.data) {
            const errorData = error.response.data;
            console.log('❌ ERRO DA API BYBIT:');
            console.log(`   Código: ${errorData.retCode}`);
            console.log(`   Mensagem: ${errorData.retMsg}\n`);
            
            if (errorData.retCode === 10003) {
                console.log('🚨 ERRO DE AUTENTICAÇÃO - IP NÃO CONFIGURADO!\n');
                console.log('💡 SOLUÇÃO:');
                console.log('1. O IP não foi configurado corretamente na Bybit');
                console.log('2. Configure o IP seguindo as instruções acima');
                console.log('3. Aguarde alguns minutos para propagação');
                console.log('4. Execute este script novamente\n');
                
                await atualizarStatusValidacao('ip_not_configured');
            }
        } else {
            console.log('❌ ERRO DE CONEXÃO:', error.message);
            await atualizarStatusValidacao('connection_error');
        }
        
        return false;
    }
}

/**
 * Atualizar status de validação no banco
 */
async function atualizarStatusValidacao(status) {
    try {
        await pool.query(`
            UPDATE user_api_keys 
            SET 
                validation_status = $1,
                last_validated = NOW(),
                updated_at = NOW()
            WHERE api_key = 'dtbi5nXnYURm7uHnxA';
        `, [status]);
        
        console.log(`📊 Status atualizado para: ${status}`);
    } catch (error) {
        console.log('⚠️ Erro ao atualizar status:', error.message);
    }
}

/**
 * Verificar IP atual
 */
async function verificarIPAtual() {
    console.log('🌐 === VERIFICAÇÃO DE IP ATUAL ===\n');
    
    try {
        const response = await axios.get('https://api.ipify.org?format=json');
        const ipAtual = response.data.ip;
        
        console.log(`📍 IP atual do servidor: ${ipAtual}`);
        console.log(`🎯 IP configurado na Bybit: ${IP_RAILWAY}\n`);
        
        if (ipAtual === IP_RAILWAY) {
            console.log('✅ IPs coincidem - configuração correta\n');
            return true;
        } else {
            console.log('⚠️ IP MUDOU! Precisa atualizar na Bybit:');
            console.log(`   Antigo: ${IP_RAILWAY}`);
            console.log(`   Novo: ${ipAtual}\n`);
            return false;
        }
    } catch (error) {
        console.log('❌ Erro ao verificar IP:', error.message);
        return false;
    }
}

/**
 * Função principal
 */
async function main() {
    console.log('🚀 TESTE FINAL - CONECTIVIDADE BYBIT COM IP FIXO\n');
    console.log('=' .repeat(70));
    
    try {
        // 1. Exibir instruções
        exibirInstrucoesIP();
        
        // 2. Verificar IP atual
        const ipOK = await verificarIPAtual();
        
        // 3. Buscar chaves da Érica
        const chaves = await buscarChavesErica();
        if (!chaves) {
            console.log('❌ Não foi possível encontrar as chaves');
            return;
        }
        
        // 4. Testar conectividade
        const sucesso = await testarConectividadeBybit(chaves.api_key, chaves.secret_key);
        
        console.log('\n' + '=' .repeat(70));
        console.log('📊 RESUMO FINAL:');
        console.log(`👤 Usuária: ${chaves.name}`);
        console.log(`🔑 API Key: ${chaves.api_key.substring(0, 8)}...`);
        console.log(`📍 IP Railway: ${IP_RAILWAY}`);
        console.log(`🌐 IP atual: ${ipOK ? 'Correto' : 'Mudou'}`);
        console.log(`🔗 Conectividade: ${sucesso ? '✅ FUNCIONANDO' : '❌ PENDENTE'}`);
        
        if (sucesso) {
            console.log('\n🎉 PARABÉNS! SISTEMA MULTIUSUÁRIO OPERACIONAL!');
            console.log('✅ Chaves API configuradas corretamente');
            console.log('✅ IP autorizado na Bybit');
            console.log('✅ Conectividade com exchange confirmada');
            console.log('✅ Sistema pronto para produção');
        } else {
            console.log('\n⚠️ PRÓXIMOS PASSOS:');
            console.log('1. Configure o IP na Bybit seguindo as instruções');
            console.log('2. Aguarde 2-5 minutos para propagação');
            console.log('3. Execute este script novamente');
        }
        
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

module.exports = { testarConectividadeBybit, buscarChavesErica };
