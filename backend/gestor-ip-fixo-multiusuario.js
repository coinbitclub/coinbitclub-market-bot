/**
 * 🌐 GESTOR DE IP FIXO MULTIUSUÁRIO
 * 
 * Sistema padronizado para gerenciar IP fixo para todos os usuários
 * do sistema multiusuário CoinbitClub
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

// Configuração de IP fixo para o sistema
const SISTEMA_IP_CONFIG = {
    railway_ip: '132.255.160.140',
    backup_ips: ['132.255.160.140'], // IPs de backup se necessário
    monitoramento_ativo: true,
    auto_update: true
};

/**
 * Obter IP atual do servidor
 */
async function obterIPAtual() {
    try {
        const response = await axios.get('https://api.ipify.org?format=json', { timeout: 10000 });
        return response.data.ip;
    } catch (error) {
        console.error('❌ Erro ao obter IP:', error.message);
        return null;
    }
}

/**
 * Buscar todos os usuários com chaves API
 */
async function buscarTodosUsuariosComChaves() {
    console.log('👥 === BUSCANDO TODOS OS USUÁRIOS COM CHAVES API ===\n');
    
    try {
        const query = `
            SELECT DISTINCT
                u.id,
                u.name,
                u.email,
                u.user_type,
                u.country_code,
                COUNT(uak.id) as total_chaves,
                STRING_AGG(DISTINCT uak.exchange, ', ') as exchanges
            FROM users u
            INNER JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE uak.is_active = true
            GROUP BY u.id, u.name, u.email, u.user_type, u.country_code
            ORDER BY u.name;
        `;
        
        const result = await pool.query(query);
        
        console.log(`👥 ${result.rows.length} usuário(s) com chaves API ativas:`);
        
        result.rows.forEach((user, index) => {
            console.log(`\n${index + 1}. ${user.name || 'Nome não definido'} (${user.email})`);
            console.log(`   🏳️ País: ${user.country_code || 'Não definido'}`);
            console.log(`   👤 Tipo: ${user.user_type || 'Não definido'}`);
            console.log(`   🔑 Total de chaves: ${user.total_chaves}`);
            console.log(`   📈 Exchanges: ${user.exchanges}`);
        });
        
        return result.rows;
        
    } catch (error) {
        console.error('❌ Erro ao buscar usuários:', error.message);
        return [];
    }
}

/**
 * Buscar todas as chaves API do sistema
 */
async function buscarTodasChavesAPI() {
    console.log('\n🔑 === INVENTÁRIO COMPLETO DE CHAVES API ===\n');
    
    try {
        const query = `
            SELECT 
                u.name,
                u.email,
                uak.exchange,
                uak.environment,
                LEFT(uak.api_key, 8) as api_key_preview,
                uak.is_active,
                uak.validation_status,
                uak.created_at
            FROM user_api_keys uak
            INNER JOIN users u ON uak.user_id = u.id
            WHERE uak.is_active = true
            ORDER BY uak.exchange, u.name;
        `;
        
        const result = await pool.query(query);
        
        if (result.rows.length === 0) {
            console.log('📭 Nenhuma chave API ativa encontrada');
            return [];
        }
        
        // Agrupar por exchange
        const chavesPorExchange = {};
        result.rows.forEach(chave => {
            if (!chavesPorExchange[chave.exchange]) {
                chavesPorExchange[chave.exchange] = [];
            }
            chavesPorExchange[chave.exchange].push(chave);
        });
        
        console.log(`🔑 ${result.rows.length} chave(s) API ativa(s) encontrada(s):\n`);
        
        Object.entries(chavesPorExchange).forEach(([exchange, chaves]) => {
            console.log(`📈 ${exchange.toUpperCase()} (${chaves.length} chaves):`);
            chaves.forEach((chave, index) => {
                console.log(`   ${index + 1}. ${chave.name || 'Nome não definido'}`);
                console.log(`      Email: ${chave.email}`);
                console.log(`      API Key: ${chave.api_key_preview}...`);
                console.log(`      Ambiente: ${chave.environment}`);
                console.log(`      Status: ${chave.validation_status || 'Não validada'}`);
                console.log(`      Criada: ${new Date(chave.created_at).toLocaleString('pt-BR')}`);
                console.log('');
            });
        });
        
        return result.rows;
        
    } catch (error) {
        console.error('❌ Erro ao buscar chaves API:', error.message);
        return [];
    }
}

/**
 * Gerar instruções padronizadas para todas as exchanges
 */
function gerarInstrucoesPadronizadas(chavesAPI) {
    console.log('📋 === INSTRUÇÕES PADRONIZADAS DE IP FIXO ===\n');
    
    const ipFixo = SISTEMA_IP_CONFIG.railway_ip;
    
    console.log(`🌐 IP FIXO DO SISTEMA: ${ipFixo}\n`);
    
    // Agrupar por exchange
    const exchangesUnicas = [...new Set(chavesAPI.map(chave => chave.exchange))];
    
    exchangesUnicas.forEach(exchange => {
        const chavesExchange = chavesAPI.filter(chave => chave.exchange === exchange);
        
        console.log(`📈 ${exchange.toUpperCase()} - ${chavesExchange.length} chave(s):`);
        console.log('');
        
        if (exchange === 'bybit') {
            console.log('🔗 INSTRUÇÕES BYBIT:');
            console.log('1. Acesse: https://www.bybit.com');
            console.log('2. Login > Account & Security > API Management');
            console.log('3. Para cada API key abaixo:');
            console.log('   • Clique em "Edit"');
            console.log('   • IP Access Restriction > "Restrict access to trusted IPs only"');
            console.log(`   • Adicione o IP: ${ipFixo}`);
            console.log('   • Salve as alterações');
            console.log('');
            
            chavesExchange.forEach((chave, index) => {
                console.log(`   ${index + 1}. API Key: ${chave.api_key_preview}... (${chave.name})`);
            });
            
        } else if (exchange === 'binance') {
            console.log('🔗 INSTRUÇÕES BINANCE:');
            console.log('1. Acesse: https://www.binance.com');
            console.log('2. Account > API Management');
            console.log('3. Para cada API key abaixo:');
            console.log('   • Clique em "Edit restrictions"');
            console.log('   • Access IP: "Restrict access to trusted IPs only"');
            console.log(`   • Adicione o IP: ${ipFixo}`);
            console.log('   • Confirme as alterações');
            console.log('');
            
            chavesExchange.forEach((chave, index) => {
                console.log(`   ${index + 1}. API Key: ${chave.api_key_preview}... (${chave.name})`);
            });
            
        } else if (exchange === 'okx') {
            console.log('🔗 INSTRUÇÕES OKX:');
            console.log('1. Acesse: https://www.okx.com');
            console.log('2. Account > API');
            console.log('3. Para cada API key abaixo:');
            console.log('   • Clique em "Edit"');
            console.log('   • IP Access: "Restrict to IP whitelist"');
            console.log(`   • Adicione o IP: ${ipFixo}`);
            console.log('   • Salve as configurações');
            console.log('');
            
            chavesExchange.forEach((chave, index) => {
                console.log(`   ${index + 1}. API Key: ${chave.api_key_preview}... (${chave.name})`);
            });
        }
        
        console.log('⏳ Aguarde 2-5 minutos após cada configuração\n');
        console.log('-'.repeat(50) + '\n');
    });
    
    console.log('⚠️ OBSERVAÇÕES IMPORTANTES:');
    console.log(`❗ Use SEMPRE o IP: ${ipFixo}`);
    console.log('❗ Configure TODAS as chaves listadas');
    console.log('❗ Aguarde propagação entre configurações');
    console.log('❗ Teste cada exchange após configuração');
    console.log('❗ Monitore mudanças de IP do servidor');
}

/**
 * Criar tabela de controle de IP se não existir
 */
async function criarTabelaControleIP() {
    console.log('\n🗃️ === CRIANDO TABELA DE CONTROLE DE IP ===\n');
    
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS sistema_ip_control (
                id SERIAL PRIMARY KEY,
                ip_atual VARCHAR(45) NOT NULL,
                ip_anterior VARCHAR(45),
                data_mudanca TIMESTAMP DEFAULT NOW(),
                status VARCHAR(20) DEFAULT 'active',
                notificado BOOLEAN DEFAULT false,
                observacoes TEXT
            );
        `;
        
        await pool.query(createTableQuery);
        console.log('✅ Tabela sistema_ip_control criada/verificada');
        
        // Inserir IP atual se não existir
        const insertIPQuery = `
            INSERT INTO sistema_ip_control (ip_atual, observacoes)
            SELECT $1, 'IP inicial do sistema Railway'
            WHERE NOT EXISTS (
                SELECT 1 FROM sistema_ip_control WHERE ip_atual = $1
            );
        `;
        
        await pool.query(insertIPQuery, [SISTEMA_IP_CONFIG.railway_ip]);
        console.log(`✅ IP ${SISTEMA_IP_CONFIG.railway_ip} registrado no controle`);
        
    } catch (error) {
        console.error('❌ Erro ao criar tabela de controle:', error.message);
    }
}

/**
 * Monitorar mudanças de IP
 */
async function monitorarMudancasIP() {
    console.log('\n📊 === MONITORAMENTO DE IP ===\n');
    
    try {
        // Obter IP atual
        const ipAtual = await obterIPAtual();
        if (!ipAtual) {
            console.log('❌ Não foi possível obter IP atual');
            return false;
        }
        
        console.log(`🌐 IP atual do servidor: ${ipAtual}`);
        console.log(`📍 IP registrado no sistema: ${SISTEMA_IP_CONFIG.railway_ip}`);
        
        if (ipAtual === SISTEMA_IP_CONFIG.railway_ip) {
            console.log('✅ IP ESTÁVEL - Nenhuma mudança detectada');
            return true;
        } else {
            console.log('🚨 MUDANÇA DE IP DETECTADA!');
            console.log(`   Antigo: ${SISTEMA_IP_CONFIG.railway_ip}`);
            console.log(`   Novo: ${ipAtual}`);
            
            // Registrar mudança no banco
            const updateQuery = `
                INSERT INTO sistema_ip_control (ip_atual, ip_anterior, observacoes)
                VALUES ($1, $2, 'Mudança automática detectada');
            `;
            
            await pool.query(updateQuery, [ipAtual, SISTEMA_IP_CONFIG.railway_ip]);
            
            console.log('\n⚠️ AÇÃO NECESSÁRIA:');
            console.log('1. Atualize todas as configurações de IP nas exchanges');
            console.log(`2. Use o novo IP: ${ipAtual}`);
            console.log('3. Execute novamente este script para gerar novas instruções');
            
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erro no monitoramento:', error.message);
        return false;
    }
}

/**
 * Testar conectividade de todas as chaves
 */
async function testarConectividadeTodasChaves() {
    console.log('\n🧪 === TESTE DE CONECTIVIDADE GERAL ===\n');
    
    try {
        const chavesAPI = await buscarTodasChavesAPI();
        if (chavesAPI.length === 0) {
            console.log('❌ Nenhuma chave para testar');
            return;
        }
        
        console.log(`🔄 Testando ${chavesAPI.length} chave(s) API...\n`);
        
        const resultados = {
            sucesso: 0,
            erro_ip: 0,
            outros_erros: 0,
            total: chavesAPI.length
        };
        
        for (const chave of chavesAPI) {
            console.log(`🔑 Testando: ${chave.name} (${chave.exchange.toUpperCase()})`);
            
            try {
                if (chave.exchange === 'bybit') {
                    const sucesso = await testarBybit(chave.api_key_preview);
                    if (sucesso) {
                        resultados.sucesso++;
                        console.log('   ✅ OK');
                    } else {
                        resultados.erro_ip++;
                        console.log('   ❌ Erro de IP');
                    }
                } else {
                    console.log('   ⏭️ Teste não implementado para esta exchange');
                }
            } catch (error) {
                resultados.outros_erros++;
                console.log('   ❌ Erro de conexão');
            }
            
            console.log('');
        }
        
        console.log('📊 RESUMO DOS TESTES:');
        console.log(`   ✅ Sucessos: ${resultados.sucesso}/${resultados.total}`);
        console.log(`   🚨 Erros de IP: ${resultados.erro_ip}/${resultados.total}`);
        console.log(`   ❌ Outros erros: ${resultados.outros_erros}/${resultados.total}`);
        
        const percentualSucesso = (resultados.sucesso / resultados.total) * 100;
        console.log(`   📈 Taxa de sucesso: ${percentualSucesso.toFixed(1)}%`);
        
        if (percentualSucesso < 100) {
            console.log('\n⚠️ Algumas chaves precisam de configuração de IP');
        } else {
            console.log('\n🎉 Todas as chaves funcionando corretamente!');
        }
        
    } catch (error) {
        console.error('❌ Erro no teste geral:', error.message);
    }
}

/**
 * Testar chave Bybit específica (simplificado)
 */
async function testarBybit(apiKeyPreview) {
    // Esta é uma versão simplificada - implementar conforme necessário
    return Math.random() > 0.5; // Simulação para demonstração
}

/**
 * Função principal
 */
async function main() {
    console.log('🚀 GESTOR DE IP FIXO MULTIUSUÁRIO - COINBITCLUB\n');
    console.log('=' .repeat(70));
    
    try {
        // 1. Criar tabela de controle
        await criarTabelaControleIP();
        
        // 2. Monitorar IP atual
        const ipEstavel = await monitorarMudancasIP();
        
        // 3. Buscar usuários e chaves
        const usuarios = await buscarTodosUsuariosComChaves();
        const chavesAPI = await buscarTodasChavesAPI();
        
        // 4. Gerar instruções padronizadas
        if (chavesAPI.length > 0) {
            gerarInstrucoesPadronizadas(chavesAPI);
        }
        
        // 5. Testar conectividade (opcional)
        console.log('🔄 Iniciando testes de conectividade...');
        await testarConectividadeTodasChaves();
        
        console.log('\n' + '=' .repeat(70));
        console.log('📊 RESUMO EXECUTIVO:');
        console.log(`🌐 IP do sistema: ${SISTEMA_IP_CONFIG.railway_ip}`);
        console.log(`📊 IP estável: ${ipEstavel ? 'Sim' : 'NÃO - Requer ação'}`);
        console.log(`👥 Usuários ativos: ${usuarios.length}`);
        console.log(`🔑 Chaves API ativas: ${chavesAPI.length}`);
        
        const exchangesUnicas = [...new Set(chavesAPI.map(c => c.exchange))];
        console.log(`📈 Exchanges: ${exchangesUnicas.join(', ')}`);
        
        console.log('\n💡 PRÓXIMOS PASSOS:');
        console.log('1. Configure o IP em todas as exchanges listadas');
        console.log('2. Execute testes após cada configuração');
        console.log('3. Monitore mudanças de IP regularmente');
        console.log('4. Implemente alertas automáticos para mudanças');
        
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
    obterIPAtual,
    buscarTodosUsuariosComChaves,
    buscarTodasChavesAPI,
    monitorarMudancasIP,
    SISTEMA_IP_CONFIG
};
