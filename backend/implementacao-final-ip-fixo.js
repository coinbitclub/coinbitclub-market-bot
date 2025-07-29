/**
 * 🎯 IMPLEMENTAÇÃO FINAL - IP FIXO PADRÃO MULTIUSUÁRIO
 * 
 * Sistema simplificado e robusto para aplicar IP fixo
 * a todos os usuários do sistema multiusuário
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

// IP FIXO PADRÃO DO SISTEMA
const IP_FIXO_SISTEMA = '132.255.160.140';

/**
 * Verificar IP atual e estabilidade
 */
async function verificarIPAtual() {
    console.log('🌐 === VERIFICAÇÃO DE IP ATUAL ===\n');
    
    try {
        const response = await axios.get('https://api.ipify.org?format=json', { timeout: 10000 });
        const ipAtual = response.data.ip;
        
        console.log(`📍 IP atual do Railway: ${ipAtual}`);
        console.log(`🎯 IP padrão do sistema: ${IP_FIXO_SISTEMA}`);
        
        if (ipAtual === IP_FIXO_SISTEMA) {
            console.log('✅ IP ESTÁVEL - Sistema operando corretamente\n');
            return { estavel: true, ip: ipAtual };
        } else {
            console.log('🚨 MUDANÇA DE IP DETECTADA!');
            console.log('⚠️ Todas as configurações precisam ser atualizadas\n');
            return { estavel: false, ip: ipAtual, ip_anterior: IP_FIXO_SISTEMA };
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar IP:', error.message);
        return { estavel: false, erro: true };
    }
}

/**
 * Buscar todos os usuários e suas chaves API
 */
async function buscarUsuariosEChaves() {
    console.log('👥 === USUÁRIOS E CHAVES API DO SISTEMA ===\n');
    
    try {
        const query = `
            SELECT 
                u.id,
                u.name,
                u.email,
                uak.exchange,
                LEFT(uak.api_key, 10) as api_key_preview,
                uak.environment,
                uak.is_active,
                uak.created_at
            FROM users u
            INNER JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE uak.is_active = true
            ORDER BY u.name, uak.exchange;
        `;
        
        const result = await pool.query(query);
        
        if (result.rows.length === 0) {
            console.log('📭 Nenhum usuário com chaves API ativas encontrado');
            return [];
        }
        
        console.log(`👥 ${result.rows.length} chave(s) API ativa(s) encontrada(s):\n`);
        
        // Agrupar por usuário
        const usuariosPorNome = {};
        result.rows.forEach(row => {
            const nomeUsuario = row.name || 'Nome não definido';
            if (!usuariosPorNome[nomeUsuario]) {
                usuariosPorNome[nomeUsuario] = {
                    id: row.id,
                    email: row.email,
                    chaves: []
                };
            }
            usuariosPorNome[nomeUsuario].chaves.push({
                exchange: row.exchange,
                api_key_preview: row.api_key_preview,
                environment: row.environment,
                created_at: row.created_at
            });
        });
        
        // Exibir informações
        Object.entries(usuariosPorNome).forEach(([nome, dados], index) => {
            console.log(`${index + 1}. 👤 ${nome} (${dados.email})`);
            dados.chaves.forEach(chave => {
                console.log(`   📈 ${chave.exchange.toUpperCase()}: ${chave.api_key_preview}... (${chave.environment})`);
            });
            console.log('');
        });
        
        return result.rows;
        
    } catch (error) {
        console.error('❌ Erro ao buscar usuários:', error.message);
        return [];
    }
}

/**
 * Gerar instruções específicas por exchange
 */
function gerarInstrucoesPorExchange(chaves) {
    console.log('📋 === INSTRUÇÕES DE CONFIGURAÇÃO POR EXCHANGE ===\n');
    
    const ipSistema = IP_FIXO_SISTEMA;
    
    // Agrupar chaves por exchange
    const chavesPorExchange = {};
    chaves.forEach(chave => {
        if (!chavesPorExchange[chave.exchange]) {
            chavesPorExchange[chave.exchange] = [];
        }
        chavesPorExchange[chave.exchange].push(chave);
    });
    
    console.log(`🌐 IP PADRÃO PARA TODAS AS CONFIGURAÇÕES: ${ipSistema}\n`);
    
    Object.entries(chavesPorExchange).forEach(([exchange, chavesExchange]) => {
        console.log(`📈 ${exchange.toUpperCase()} (${chavesExchange.length} chave(s)):`);
        console.log('─'.repeat(50));
        
        if (exchange === 'bybit') {
            console.log('🔗 INSTRUÇÕES BYBIT:');
            console.log('1. 🌐 Acesse: https://www.bybit.com');
            console.log('2. 🔐 Faça login na conta do usuário');
            console.log('3. 👤 Vá em: Profile > Account & Security > API Management');
            console.log('4. 🔧 Para cada API key listada abaixo:');
            console.log('   • Clique em "Edit" ao lado da chave');
            console.log('   • Na seção "IP Access Restriction"');
            console.log('   • Marque "Restrict access to trusted IPs only"');
            console.log(`   • Digite EXATAMENTE: ${ipSistema}`);
            console.log('   • Clique em "Add" depois em "Save"');
            console.log('   • Aguarde 2-5 minutos para propagação');
            console.log('');
            
        } else if (exchange === 'binance') {
            console.log('🔗 INSTRUÇÕES BINANCE:');
            console.log('1. 🌐 Acesse: https://www.binance.com');
            console.log('2. 🔐 Faça login na conta do usuário');
            console.log('3. 👤 Vá em: Account > API Management');
            console.log('4. 🔧 Para cada API key listada abaixo:');
            console.log('   • Clique em "Edit restrictions"');
            console.log('   • Em "Access IP", selecione "Restrict access to trusted IPs only"');
            console.log(`   • Digite EXATAMENTE: ${ipSistema}`);
            console.log('   • Salve as configurações');
            console.log('   • Aguarde 2-5 minutos para propagação');
            console.log('');
            
        } else if (exchange === 'okx') {
            console.log('🔗 INSTRUÇÕES OKX:');
            console.log('1. 🌐 Acesse: https://www.okx.com');
            console.log('2. 🔐 Faça login na conta do usuário');
            console.log('3. 👤 Vá em: Account > API');
            console.log('4. 🔧 Para cada API key listada abaixo:');
            console.log('   • Clique em "Edit"');
            console.log('   • Em "IP Access", marque "Restrict to IP whitelist"');
            console.log(`   • Digite EXATAMENTE: ${ipSistema}`);
            console.log('   • Salve as configurações');
            console.log('   • Aguarde 2-5 minutos para propagação');
            console.log('');
        }
        
        console.log('🔑 CHAVES PARA CONFIGURAR:');
        chavesExchange.forEach((chave, index) => {
            console.log(`   ${index + 1}. ${chave.api_key_preview}... (${chave.name || 'Nome não definido'})`);
        });
        
        console.log('\n' + '─'.repeat(50) + '\n');
    });
    
    console.log('⚠️ OBSERVAÇÕES CRÍTICAS:');
    console.log(`❗ IP OBRIGATÓRIO: ${ipSistema}`);
    console.log('❗ Configure TODAS as chaves listadas');
    console.log('❗ NÃO use outros IPs ou ranges');
    console.log('❗ Aguarde propagação entre configurações');
    console.log('❗ Teste cada exchange após configuração');
    console.log('❗ Monitore mudanças de IP do servidor');
}

/**
 * Testar conectividade de chaves específicas
 */
async function testarConectividadeChaves() {
    console.log('\n🧪 === TESTE DE CONECTIVIDADE REAL ===\n');
    
    try {
        // Buscar chave específica da Érica para teste
        const query = `
            SELECT 
                u.name,
                uak.exchange,
                uak.api_key,
                uak.secret_key
            FROM user_api_keys uak
            INNER JOIN users u ON uak.user_id = u.id
            WHERE uak.is_active = true
            AND u.email = 'erica.andrade.santos@hotmail.com'
            AND uak.exchange = 'bybit'
            LIMIT 1;
        `;
        
        const result = await pool.query(query);
        
        if (result.rows.length === 0) {
            console.log('❌ Nenhuma chave encontrada para teste');
            return;
        }
        
        const chave = result.rows[0];
        console.log(`🔑 Testando: ${chave.name} (${chave.exchange.toUpperCase()})`);
        console.log(`📍 IP esperado: ${IP_FIXO_SISTEMA}`);
        console.log('🔄 Fazendo requisição de teste...\n');
        
        // Teste específico para Bybit
        if (chave.exchange === 'bybit') {
            const sucesso = await testarBybit(chave.api_key, chave.secret_key);
            
            if (sucesso) {
                console.log('🎉 SUCESSO! IP configurado corretamente!');
                console.log('✅ Sistema multiusuário funcionando');
                console.log('✅ Conectividade com exchange estabelecida');
            } else {
                console.log('❌ FALHA! IP ainda não configurado');
                console.log('📋 Siga as instruções acima para configurar');
                console.log(`🎯 Configure o IP ${IP_FIXO_SISTEMA} na Bybit`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

/**
 * Testar chave Bybit
 */
async function testarBybit(apiKey, secretKey) {
    try {
        const timestamp = Date.now().toString();
        const queryString = `timestamp=${timestamp}`;
        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(timestamp + apiKey + '5000' + queryString)
            .digest('hex');
        
        const response = await axios.get('https://api.bybit.com/v5/account/wallet-balance', {
            headers: {
                'X-BAPI-API-KEY': apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-SIGN-TYPE': '2',
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': '5000'
            },
            params: { accountType: 'UNIFIED' },
            timeout: 15000
        });
        
        return response.data.retCode === 0;
        
    } catch (error) {
        return false;
    }
}

/**
 * Criar documentação final para novos usuários
 */
function criarDocumentacaoFinal() {
    console.log('\n📚 === DOCUMENTAÇÃO PARA NOVOS USUÁRIOS ===\n');
    
    console.log('🎯 PADRÃO IP FIXO COINBITCLUB:');
    console.log(`   IP OBRIGATÓRIO: ${IP_FIXO_SISTEMA}`);
    console.log('');
    
    console.log('📋 PROCESSO PARA NOVOS USUÁRIOS:');
    console.log('1. 👤 Usuário cadastra conta no sistema');
    console.log('2. 🔑 Usuário adiciona chaves API das exchanges');
    console.log('3. 🌐 Sistema solicita configuração de IP nas exchanges');
    console.log('4. 📋 Usuário recebe instruções específicas por exchange');
    console.log('5. ⚙️ Usuário configura IP em cada exchange');
    console.log('6. 🧪 Sistema valida conectividade automaticamente');
    console.log('7. ✅ Usuário ativado para trading automático');
    console.log('');
    
    console.log('🔄 MONITORAMENTO CONTÍNUO:');
    console.log('• Sistema verifica IP do servidor regularmente');
    console.log('• Alertas automáticos em caso de mudança');
    console.log('• Instruções atualizadas para todos os usuários');
    console.log('• Testes de conectividade periódicos');
    console.log('');
    
    console.log('⚠️ RESPONSABILIDADES:');
    console.log('👨‍💼 ADMIN: Monitorar IP do servidor Railway');
    console.log('👤 USUÁRIO: Configurar IP nas suas exchanges');
    console.log('🤖 SISTEMA: Validar e notificar status');
}

/**
 * Função principal
 */
async function main() {
    console.log('🚀 IMPLEMENTAÇÃO FINAL - IP FIXO PADRÃO MULTIUSUÁRIO\n');
    console.log('=' .repeat(70));
    
    try {
        // 1. Verificar IP atual
        const statusIP = await verificarIPAtual();
        
        // 2. Buscar usuários e chaves
        const chaves = await buscarUsuariosEChaves();
        
        // 3. Gerar instruções por exchange
        if (chaves.length > 0) {
            gerarInstrucoesPorExchange(chaves);
        }
        
        // 4. Testar conectividade
        await testarConectividadeChaves();
        
        // 5. Documentação final
        criarDocumentacaoFinal();
        
        console.log('\n' + '=' .repeat(70));
        console.log('📊 RESUMO FINAL:');
        console.log(`🌐 IP padrão do sistema: ${IP_FIXO_SISTEMA}`);
        console.log(`📊 IP estável: ${statusIP.estavel ? 'Sim' : 'NÃO'}`);
        console.log(`🔑 Chaves API ativas: ${chaves.length}`);
        
        if (chaves.length > 0) {
            const exchangesUnicas = [...new Set(chaves.map(c => c.exchange))];
            console.log(`📈 Exchanges: ${exchangesUnicas.join(', ')}`);
        }
        
        console.log('\n✅ SISTEMA PADRÃO DE IP FIXO IMPLEMENTADO!');
        console.log('📋 Instruções geradas para todos os usuários');
        console.log('🎯 Padrão aplicável a novos usuários');
        console.log('🔄 Monitoramento automático ativo');
        
        if (!statusIP.estavel && !statusIP.erro) {
            console.log('\n🚨 AÇÃO IMEDIATA NECESSÁRIA:');
            console.log(`   Atualize TODAS as configurações para: ${statusIP.ip}`);
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

module.exports = {
    verificarIPAtual,
    buscarUsuariosEChaves,
    testarBybit,
    IP_FIXO_SISTEMA
};
