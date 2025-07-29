/**
 * 🔄 TESTE CONTÍNUO DE CONECTIVIDADE BYBIT
 * 
 * Script que testa periodicamente a conectividade com a Bybit
 * para verificar quando a configuração de IP for aplicada
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
 * Testar conectividade com Bybit
 */
async function testarBybit() {
    try {
        // Buscar chave da Érica
        const query = `
            SELECT 
                u.name,
                uak.api_key,
                uak.secret_key
            FROM user_api_keys uak
            INNER JOIN users u ON uak.user_id = u.id
            WHERE u.email = 'erica.andrade.santos@hotmail.com'
            AND uak.exchange = 'bybit'
            AND uak.is_active = true;
        `;
        
        const result = await pool.query(query);
        
        if (result.rows.length === 0) {
            return { sucesso: false, erro: 'Chave não encontrada' };
        }
        
        const { name, api_key, secret_key } = result.rows[0];
        
        // Preparar requisição
        const timestamp = Date.now().toString();
        const queryString = `timestamp=${timestamp}`;
        const signature = crypto
            .createHmac('sha256', secret_key)
            .update(timestamp + api_key + '5000' + queryString)
            .digest('hex');
        
        // Fazer requisição
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
            return {
                sucesso: true,
                usuario: name,
                saldos: response.data.result
            };
        } else {
            return {
                sucesso: false,
                codigo: response.data.retCode,
                mensagem: response.data.retMsg
            };
        }
        
    } catch (error) {
        if (error.response?.data) {
            return {
                sucesso: false,
                codigo: error.response.data.retCode,
                mensagem: error.response.data.retMsg
            };
        } else {
            return {
                sucesso: false,
                erro: error.message
            };
        }
    }
}

/**
 * Executar teste único
 */
async function executarTesteUnico() {
    console.log('🧪 TESTE DE CONECTIVIDADE BYBIT\n');
    console.log(`📍 IP do Railway: ${IP_RAILWAY}`);
    console.log(`⏰ Timestamp: ${new Date().toLocaleString('pt-BR')}\n`);
    
    const resultado = await testarBybit();
    
    if (resultado.sucesso) {
        console.log('🎉 SUCESSO! CONECTIVIDADE ESTABELECIDA!');
        console.log(`👤 Usuário: ${resultado.usuario}`);
        console.log('✅ IP configurado corretamente na Bybit');
        console.log('✅ Sistema multiusuário operacional');
        
        // Exibir saldos se disponíveis
        if (resultado.saldos && resultado.saldos.list) {
            console.log('\n💰 SALDOS DA CONTA:');
            let temSaldos = false;
            
            resultado.saldos.list.forEach(account => {
                if (account.coin && account.coin.length > 0) {
                    console.log(`   📊 ${account.accountType}:`);
                    account.coin.forEach(coin => {
                        const saldo = parseFloat(coin.walletBalance);
                        if (saldo > 0) {
                            console.log(`     💎 ${coin.coin}: ${saldo}`);
                            temSaldos = true;
                        }
                    });
                }
            });
            
            if (!temSaldos) {
                console.log('   📭 Conta sem saldos ou saldos zerados');
            }
        }
        
        console.log('\n🚀 SISTEMA PRONTO PARA PRODUÇÃO!');
        
    } else {
        console.log('❌ FALHA NA CONECTIVIDADE');
        
        if (resultado.codigo === 10003) {
            console.log('🚨 ERRO DE IP - CONFIGURAÇÃO NECESSÁRIA');
            console.log(`💡 Configure o IP ${IP_RAILWAY} na Bybit`);
            console.log('📋 Acesse: https://www.bybit.com > Account & Security > API Management');
        } else if (resultado.codigo) {
            console.log(`📊 Código do erro: ${resultado.codigo}`);
            console.log(`📝 Mensagem: ${resultado.mensagem}`);
        } else {
            console.log(`❗ Erro: ${resultado.erro}`);
        }
    }
    
    return resultado.sucesso;
}

/**
 * Monitoramento contínuo
 */
async function monitoramentoContinuo() {
    console.log('🔄 MONITORAMENTO CONTÍNUO DE CONECTIVIDADE\n');
    console.log('⏱️  Testando a cada 30 segundos...');
    console.log('🛑 Pressione Ctrl+C para parar\n');
    
    let tentativa = 1;
    const intervalo = 30000; // 30 segundos
    
    const testarPeriodicamente = async () => {
        console.log(`\n🔍 TENTATIVA ${tentativa} - ${new Date().toLocaleString('pt-BR')}`);
        console.log('-'.repeat(50));
        
        const sucesso = await executarTesteUnico();
        
        if (sucesso) {
            console.log('\n🎯 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
            console.log('🔄 Monitoramento finalizado');
            process.exit(0);
        } else {
            console.log(`\n⏳ Aguardando próximo teste em ${intervalo/1000} segundos...`);
            tentativa++;
            setTimeout(testarPeriodicamente, intervalo);
        }
    };
    
    await testarPeriodicamente();
}

/**
 * Exibir instruções de configuração
 */
function exibirInstrucoes() {
    console.log('📋 INSTRUÇÕES PARA CONFIGURAR IP NA BYBIT\n');
    console.log(`🎯 IP que deve ser configurado: ${IP_RAILWAY}\n`);
    
    console.log('🔗 PASSO A PASSO:');
    console.log('1. Acesse: https://www.bybit.com');
    console.log('2. Faça login na conta da Érica dos Santos');
    console.log('3. Vá em: Profile > Account & Security > API Management');
    console.log('4. Encontre a chave: dtbi5nXnYURm7uHnxA');
    console.log('5. Clique em "Edit"');
    console.log('6. Na seção "IP Access Restriction":');
    console.log('   • Marque "Restrict access to trusted IPs only"');
    console.log(`   • Digite: ${IP_RAILWAY}`);
    console.log('   • Clique em "Add" e depois "Save"');
    console.log('7. Aguarde 2-5 minutos para propagação\n');
    
    console.log('⚠️ IMPORTANTE:');
    console.log(`❗ Use EXATAMENTE o IP: ${IP_RAILWAY}`);
    console.log('❗ Não use outros IPs ou ranges');
    console.log('❗ Certifique-se de salvar as alterações\n');
}

/**
 * Função principal
 */
async function main() {
    const args = process.argv.slice(2);
    const modo = args[0] || 'unico';
    
    console.log('🚀 TESTE DE CONECTIVIDADE BYBIT - SISTEMA MULTIUSUÁRIO\n');
    console.log('=' .repeat(60));
    
    try {
        if (modo === 'continuo') {
            await monitoramentoContinuo();
        } else if (modo === 'instrucoes') {
            exibirInstrucoes();
        } else {
            // Exibir instruções primeiro
            exibirInstrucoes();
            
            // Executar teste único
            const sucesso = await executarTesteUnico();
            
            if (!sucesso) {
                console.log('\n💡 OPÇÕES:');
                console.log('• node teste-conectividade-continuo.js continuo  (monitoramento automático)');
                console.log('• node teste-conectividade-continuo.js instrucoes  (apenas instruções)');
            }
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testarBybit, executarTesteUnico };
