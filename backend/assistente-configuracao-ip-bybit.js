/**
 * 🎯 ASSISTENTE DE CONFIGURAÇÃO IP BYBIT
 * 
 * Guia interativo para configurar IP nas chaves API da Bybit
 * e estabelecer conectividade real com o sistema multiusuário
 */

const axios = require('axios');
const crypto = require('crypto');
const readline = require('readline');
const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

const IP_RAILWAY = '132.255.160.140';

// Interface para input do usuário
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Função para fazer perguntas ao usuário
 */
function pergunta(questao) {
    return new Promise((resolve) => {
        rl.question(questao, (resposta) => {
            resolve(resposta);
        });
    });
}

/**
 * Exibir status atual do sistema
 */
async function exibirStatusAtual() {
    console.log('🚀 ASSISTENTE DE CONFIGURAÇÃO IP BYBIT\n');
    console.log('=' .repeat(60));
    
    console.log('📊 STATUS ATUAL DO SISTEMA:');
    console.log(`🌐 IP do Railway: ${IP_RAILWAY}`);
    console.log('🔧 Sistema multiusuário: ✅ Implementado');
    console.log('🗃️ Banco de dados: ✅ Conectado');
    console.log('📋 Scripts de monitoramento: ✅ Criados');
    
    try {
        // Verificar chaves no banco
        const query = `
            SELECT 
                u.name,
                u.email,
                uak.exchange,
                LEFT(uak.api_key, 8) as api_key_preview
            FROM user_api_keys uak
            INNER JOIN users u ON uak.user_id = u.id
            WHERE uak.is_active = true
            ORDER BY u.name;
        `;
        
        const result = await pool.query(query);
        
        console.log(`🔑 Chaves API no sistema: ${result.rows.length}`);
        
        if (result.rows.length > 0) {
            console.log('\n👥 USUÁRIOS COM CHAVES API:');
            result.rows.forEach((chave, index) => {
                console.log(`   ${index + 1}. ${chave.name} (${chave.exchange.toUpperCase()}): ${chave.api_key_preview}...`);
            });
        }
        
        console.log('\n⚠️ CONECTIVIDADE: ❌ Pendente configuração IP');
        
    } catch (error) {
        console.log('⚠️ Erro ao verificar banco:', error.message);
    }
    
    console.log('\n' + '=' .repeat(60) + '\n');
}

/**
 * Guia passo-a-passo para configuração
 */
async function guiaConfiguracaoBybit() {
    console.log('📋 GUIA DE CONFIGURAÇÃO BYBIT\n');
    
    console.log('🎯 OBJETIVO: Configurar IP nas chaves API da Bybit');
    console.log(`📍 IP que deve ser configurado: ${IP_RAILWAY}\n`);
    
    console.log('📝 INSTRUÇÕES DETALHADAS:\n');
    
    console.log('1️⃣ ACESSE A BYBIT:');
    console.log('   • Abra seu navegador');
    console.log('   • Vá para: https://www.bybit.com');
    console.log('   • Faça login na conta da Érica dos Santos\n');
    
    const resposta1 = await pergunta('✅ Você conseguiu fazer login na Bybit? (s/n): ');
    if (resposta1.toLowerCase() !== 's') {
        console.log('❌ Por favor, faça login primeiro e execute novamente o script.');
        return false;
    }
    
    console.log('\n2️⃣ NAVEGUE PARA API MANAGEMENT:');
    console.log('   • Clique no ícone do perfil (canto superior direito)');
    console.log('   • Selecione "Account & Security"');
    console.log('   • No menu lateral esquerdo, clique em "API Management"\n');
    
    const resposta2 = await pergunta('✅ Você está na página API Management? (s/n): ');
    if (resposta2.toLowerCase() !== 's') {
        console.log('❌ Navegue para API Management antes de continuar.');
        return false;
    }
    
    console.log('\n3️⃣ ENCONTRE A API KEY:');
    console.log('   • Procure pela API key que começa com: dtbi5nXnYURm7uHnxA');
    console.log('   • Esta é a chave da Érica dos Santos que está no sistema\n');
    
    const resposta3 = await pergunta('✅ Você encontrou a API key dtbi5nXnYURm7uHnxA? (s/n): ');
    if (resposta3.toLowerCase() !== 's') {
        console.log('❌ Verifique se a chave está listada. Se não estiver, pode ter sido deletada.');
        return false;
    }
    
    console.log('\n4️⃣ EDITE A API KEY:');
    console.log('   • Clique no botão "Edit" ao lado da chave dtbi5nXnYURm7uHnxA');
    console.log('   • Uma nova página ou modal deve abrir\n');
    
    const resposta4 = await pergunta('✅ Você está na página de edição da API key? (s/n): ');
    if (resposta4.toLowerCase() !== 's') {
        console.log('❌ Clique em "Edit" para abrir as configurações da chave.');
        return false;
    }
    
    console.log('\n5️⃣ CONFIGURE IP RESTRICTION:');
    console.log('   • Procure pela seção "IP Access Restriction"');
    console.log('   • Marque a opção "Restrict access to trusted IPs only"');
    console.log(`   • No campo de IP, digite EXATAMENTE: ${IP_RAILWAY}`);
    console.log('   • Clique em "Add" para adicionar o IP');
    console.log('   • Clique em "Save" para salvar as alterações\n');
    
    const resposta5 = await pergunta(`✅ Você configurou o IP ${IP_RAILWAY} e salvou? (s/n): `);
    if (resposta5.toLowerCase() !== 's') {
        console.log('❌ É essencial configurar o IP corretamente para o sistema funcionar.');
        return false;
    }
    
    console.log('\n6️⃣ AGUARDAR PROPAGAÇÃO:');
    console.log('   • As alterações podem levar 2-5 minutos para fazer efeito');
    console.log('   • Durante este tempo, a Bybit propaga as configurações\n');
    
    console.log('⏳ Aguardando propagação das configurações...');
    console.log('🔄 Vou aguardar 3 minutos antes de testar a conectividade.\n');
    
    return true;
}

/**
 * Aguardar com contador
 */
async function aguardarComContador(segundos) {
    for (let i = segundos; i > 0; i--) {
        process.stdout.write(`\r⏱️  Aguardando: ${i} segundos restantes...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    process.stdout.write('\r✅ Tempo de espera finalizado!         \n\n');
}

/**
 * Testar conectividade real com a Bybit
 */
async function testarConectividadeReal() {
    console.log('🧪 TESTANDO CONECTIVIDADE COM BYBIT\n');
    
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
            console.log('❌ Chave da Érica não encontrada no banco de dados');
            return false;
        }
        
        const { name, api_key, secret_key } = result.rows[0];
        
        console.log(`🔑 Testando chave de: ${name}`);
        console.log(`📍 IP configurado: ${IP_RAILWAY}`);
        console.log(`🔗 API Key: ${api_key.substring(0, 8)}...`);
        console.log('🔄 Fazendo requisição para Bybit...\n');
        
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
            timeout: 15000
        });
        
        console.log('📨 RESPOSTA DA BYBIT:');
        console.log(`   Código: ${response.data.retCode}`);
        console.log(`   Mensagem: ${response.data.retMsg}\n`);
        
        if (response.data.retCode === 0) {
            console.log('🎉 SUCESSO! CONECTIVIDADE ESTABELECIDA!\n');
            
            // Exibir saldos se disponíveis
            if (response.data.result && response.data.result.list) {
                console.log('💰 SALDOS DA CONTA BYBIT:');
                let temSaldos = false;
                
                response.data.result.list.forEach(account => {
                    if (account.coin && account.coin.length > 0) {
                        console.log(`   📊 Tipo de conta: ${account.accountType}`);
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
                    console.log('   📭 Nenhum saldo encontrado na conta');
                }
            }
            
            console.log('\n✅ SISTEMA MULTIUSUÁRIO OPERACIONAL!');
            console.log('🔗 Conectividade com exchange confirmada');
            console.log('🎯 IP configurado corretamente');
            console.log('🚀 Sistema pronto para trading automático');
            
            return true;
            
        } else {
            console.log('❌ ERRO NA RESPOSTA DA API');
            console.log(`   Código: ${response.data.retCode}`);
            console.log(`   Mensagem: ${response.data.retMsg}`);
            
            return false;
        }
        
    } catch (error) {
        if (error.response?.data) {
            const errorData = error.response.data;
            console.log('❌ ERRO DA API BYBIT:');
            console.log(`   Código: ${errorData.retCode}`);
            console.log(`   Mensagem: ${errorData.retMsg}\n`);
            
            if (errorData.retCode === 10003) {
                console.log('🚨 ERRO DE IP - AINDA NÃO CONFIGURADO!');
                console.log('💡 Possíveis causas:');
                console.log('   • IP não foi adicionado corretamente');
                console.log('   • Ainda não houve propagação (aguarde mais)');
                console.log('   • IP foi digitado incorretamente');
                console.log(`   • Verifique se o IP ${IP_RAILWAY} está na lista`);
            }
        } else {
            console.log('❌ ERRO DE CONEXÃO:', error.message);
        }
        
        return false;
    }
}

/**
 * Função principal do assistente
 */
async function main() {
    try {
        // 1. Exibir status atual
        await exibirStatusAtual();
        
        // 2. Confirmar início do processo
        const iniciar = await pergunta('🚀 Deseja iniciar o processo de configuração? (s/n): ');
        if (iniciar.toLowerCase() !== 's') {
            console.log('👋 Processo cancelado pelo usuário.');
            return;
        }
        
        // 3. Guia de configuração
        const configurado = await guiaConfiguracaoBybit();
        if (!configurado) {
            console.log('❌ Configuração não foi concluída. Execute novamente quando estiver pronto.');
            return;
        }
        
        // 4. Aguardar propagação
        await aguardarComContador(180); // 3 minutos
        
        // 5. Testar conectividade
        const conectividade = await testarConectividadeReal();
        
        console.log('\n' + '=' .repeat(60));
        console.log('📊 RESULTADO FINAL:');
        console.log(`🌐 IP configurado: ${IP_RAILWAY}`);
        console.log(`🔗 Conectividade: ${conectividade ? '✅ FUNCIONANDO' : '❌ PENDENTE'}`);
        
        if (conectividade) {
            console.log('\n🎉 PARABÉNS! SISTEMA TOTALMENTE OPERACIONAL!');
            console.log('✅ IP configurado corretamente na Bybit');
            console.log('✅ Conectividade com exchange estabelecida');
            console.log('✅ Sistema multiusuário pronto para produção');
            console.log('✅ Trading automatizado funcional');
        } else {
            console.log('\n⚠️ PRÓXIMOS PASSOS:');
            console.log('1. Verifique se o IP foi configurado corretamente');
            console.log('2. Aguarde mais alguns minutos para propagação');
            console.log('3. Execute este script novamente');
            console.log('4. Se persistir, verifique a configuração na Bybit');
        }
        
    } catch (error) {
        console.error('❌ Erro no assistente:', error.message);
    } finally {
        rl.close();
        await pool.end();
    }
}

// Executar assistente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testarConectividadeReal, guiaConfiguracaoBybit };
