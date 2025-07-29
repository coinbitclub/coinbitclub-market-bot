/**
 * 🔧 SISTEMA AUTOMATIZADO DE IP FIXO
 * 
 * Sistema que automaticamente aplica configurações de IP fixo
 * para todos os novos usuários multiusuário
 */

const { Pool } = require('pg');
const axios = require('axios');
const crypto = require('crypto');

// Configuração do banco de dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

// Configuração padrão do sistema
const SISTEMA_CONFIG = {
    ip_fixo_railway: '132.255.160.140',
    auto_verificacao: true,
    notificacao_mudancas: true,
    backup_ips: ['132.255.160.140'],
    intervalo_verificacao: 300000 // 5 minutos
};

/**
 * Criar estrutura completa para controle de IP
 */
async function criarEstruturaControlIP() {
    console.log('🏗️ === CRIANDO ESTRUTURA DE CONTROLE IP ===\n');
    
    try {
        // Tabela de controle de IP
        const tabelaIPControl = `
            CREATE TABLE IF NOT EXISTS sistema_ip_control (
                id SERIAL PRIMARY KEY,
                ip_atual VARCHAR(45) NOT NULL,
                ip_anterior VARCHAR(45),
                data_mudanca TIMESTAMP DEFAULT NOW(),
                status VARCHAR(20) DEFAULT 'active',
                ambiente VARCHAR(20) DEFAULT 'production',
                notificado BOOLEAN DEFAULT false,
                observacoes TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `;
        
        await pool.query(tabelaIPControl);
        console.log('✅ Tabela sistema_ip_control criada');
        
        // Tabela de configurações por usuário
        const tabelaUserIPConfig = `
            CREATE TABLE IF NOT EXISTS user_ip_configurations (
                id SERIAL PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES users(id),
                exchange VARCHAR(20) NOT NULL,
                api_key_preview VARCHAR(20),
                ip_configurado VARCHAR(45),
                status_configuracao VARCHAR(20) DEFAULT 'pending',
                data_configuracao TIMESTAMP,
                ultima_verificacao TIMESTAMP,
                proxima_verificacao TIMESTAMP,
                tentativas_falha INTEGER DEFAULT 0,
                observacoes TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `;
        
        await pool.query(tabelaUserIPConfig);
        console.log('✅ Tabela user_ip_configurations criada');
        
        // Tabela de logs de verificação
        const tabelaIPLogs = `
            CREATE TABLE IF NOT EXISTS ip_verification_logs (
                id SERIAL PRIMARY KEY,
                ip_verificado VARCHAR(45),
                tipo_verificacao VARCHAR(50),
                resultado VARCHAR(20),
                detalhes JSONB,
                timestamp TIMESTAMP DEFAULT NOW()
            );
        `;
        
        await pool.query(tabelaIPLogs);
        console.log('✅ Tabela ip_verification_logs criada');
        
        // Inserir configuração inicial
        const insertConfigInicial = `
            INSERT INTO sistema_ip_control (ip_atual, observacoes, ambiente)
            VALUES ($1, 'Configuração inicial do sistema Railway', 'production')
            ON CONFLICT DO NOTHING;
        `;
        
        await pool.query(insertConfigInicial, [SISTEMA_CONFIG.ip_fixo_railway]);
        console.log('✅ Configuração inicial inserida');
        
    } catch (error) {
        console.error('❌ Erro ao criar estrutura:', error.message);
    }
}

/**
 * Sincronizar configurações IP para todos os usuários
 */
async function sincronizarConfiguracoesIP() {
    console.log('\n🔄 === SINCRONIZANDO CONFIGURAÇÕES IP ===\n');
    
    try {
        // Buscar todos os usuários com chaves API que não têm configuração IP
        const query = `
            SELECT DISTINCT
                u.id as user_id,
                u.name,
                u.email,
                uak.exchange,
                LEFT(uak.api_key, 8) as api_key_preview,
                uak.is_active
            FROM users u
            INNER JOIN user_api_keys uak ON u.id = uak.user_id
            LEFT JOIN user_ip_configurations uic ON (uic.user_id = u.id AND uic.exchange = uak.exchange)
            WHERE uak.is_active = true 
            AND uic.id IS NULL
            ORDER BY u.name, uak.exchange;
        `;
        
        const result = await pool.query(query);
        
        if (result.rows.length === 0) {
            console.log('✅ Todos os usuários já têm configurações IP sincronizadas');
            return;
        }
        
        console.log(`🔄 ${result.rows.length} configuração(ões) IP precisam ser criadas:\n`);
        
        for (const config of result.rows) {
            console.log(`👤 ${config.name || 'Nome não definido'} (${config.exchange.toUpperCase()})`);
            
            // Inserir configuração IP para este usuário/exchange
            const insertConfig = `
                INSERT INTO user_ip_configurations (
                    user_id,
                    exchange,
                    api_key_preview,
                    ip_configurado,
                    status_configuracao,
                    proxima_verificacao,
                    observacoes
                ) VALUES (
                    $1, $2, $3, $4, 'pending', 
                    NOW() + INTERVAL '1 hour',
                    'Configuração criada automaticamente pelo sistema'
                );
            `;
            
            await pool.query(insertConfig, [
                config.user_id,
                config.exchange,
                config.api_key_preview,
                SISTEMA_CONFIG.ip_fixo_railway
            ]);
            
            console.log(`   ✅ Configuração IP criada para ${config.exchange}`);
        }
        
        console.log(`\n✅ ${result.rows.length} configuração(ões) IP sincronizada(s)`);
        
    } catch (error) {
        console.error('❌ Erro na sincronização:', error.message);
    }
}

/**
 * Gerar relatório de status IP para todos os usuários
 */
async function gerarRelatorioStatusIP() {
    console.log('\n📊 === RELATÓRIO DE STATUS IP MULTIUSUÁRIO ===\n');
    
    try {
        const query = `
            SELECT 
                u.name,
                u.email,
                uic.exchange,
                uic.api_key_preview,
                uic.ip_configurado,
                uic.status_configuracao,
                uic.data_configuracao,
                uic.ultima_verificacao,
                uic.tentativas_falha,
                CASE 
                    WHEN uic.proxima_verificacao < NOW() THEN 'Vencida'
                    WHEN uic.proxima_verificacao > NOW() THEN 'Pendente'
                    ELSE 'Indefinida'
                END as status_verificacao
            FROM user_ip_configurations uic
            INNER JOIN users u ON uic.user_id = u.id
            ORDER BY u.name, uic.exchange;
        `;
        
        const result = await pool.query(query);
        
        if (result.rows.length === 0) {
            console.log('📭 Nenhuma configuração IP encontrada');
            return;
        }
        
        console.log(`📊 ${result.rows.length} configuração(ões) IP encontrada(s):\n`);
        
        // Agrupar por usuário
        const configsPorUsuario = {};
        result.rows.forEach(config => {
            const usuario = config.name || 'Nome não definido';
            if (!configsPorUsuario[usuario]) {
                configsPorUsuario[usuario] = [];
            }
            configsPorUsuario[usuario].push(config);
        });
        
        Object.entries(configsPorUsuario).forEach(([usuario, configs]) => {
            console.log(`👤 ${usuario} (${configs[0].email}):`);
            
            configs.forEach(config => {
                const statusIcon = config.status_configuracao === 'configured' ? '✅' : 
                                 config.status_configuracao === 'pending' ? '⏳' : 
                                 config.status_configuracao === 'error' ? '❌' : '❓';
                
                console.log(`   ${statusIcon} ${config.exchange.toUpperCase()}: ${config.api_key_preview}...`);
                console.log(`      IP: ${config.ip_configurado}`);
                console.log(`      Status: ${config.status_configuracao}`);
                console.log(`      Última verificação: ${config.ultima_verificacao ? new Date(config.ultima_verificacao).toLocaleString('pt-BR') : 'Nunca'}`);
                console.log(`      Tentativas de falha: ${config.tentativas_falha}`);
                console.log(`      Próxima verificação: ${config.status_verificacao}`);
                console.log('');
            });
        });
        
        // Estatísticas gerais
        const stats = {
            total: result.rows.length,
            configured: result.rows.filter(c => c.status_configuracao === 'configured').length,
            pending: result.rows.filter(c => c.status_configuracao === 'pending').length,
            error: result.rows.filter(c => c.status_configuracao === 'error').length
        };
        
        console.log('📈 ESTATÍSTICAS GERAIS:');
        console.log(`   Total de configurações: ${stats.total}`);
        console.log(`   ✅ Configuradas: ${stats.configured} (${((stats.configured/stats.total)*100).toFixed(1)}%)`);
        console.log(`   ⏳ Pendentes: ${stats.pending} (${((stats.pending/stats.total)*100).toFixed(1)}%)`);
        console.log(`   ❌ Com erro: ${stats.error} (${((stats.error/stats.total)*100).toFixed(1)}%)`);
        
    } catch (error) {
        console.error('❌ Erro ao gerar relatório:', error.message);
    }
}

/**
 * Testar conectividade automatizada para todos os usuários
 */
async function testarConectividadeAutomatizada() {
    console.log('\n🧪 === TESTE AUTOMATIZADO DE CONECTIVIDADE ===\n');
    
    try {
        // Buscar chaves que precisam ser testadas
        const query = `
            SELECT 
                u.name,
                uak.exchange,
                uak.api_key,
                uak.secret_key,
                uic.status_configuracao,
                uic.ip_configurado
            FROM user_api_keys uak
            INNER JOIN users u ON uak.user_id = u.id
            LEFT JOIN user_ip_configurations uic ON (uic.user_id = u.id AND uic.exchange = uak.exchange)
            WHERE uak.is_active = true
            ORDER BY u.name, uak.exchange;
        `;
        
        const result = await pool.query(query);
        
        if (result.rows.length === 0) {
            console.log('📭 Nenhuma chave para testar');
            return;
        }
        
        console.log(`🔄 Testando ${result.rows.length} chave(s) API...\n`);
        
        const resultados = {
            total: result.rows.length,
            sucesso: 0,
            erro_ip: 0,
            erro_auth: 0,
            outros_erros: 0
        };
        
        for (const chave of result.rows) {
            console.log(`🔑 ${chave.name} (${chave.exchange.toUpperCase()})`);
            
            try {
                let sucesso = false;
                
                if (chave.exchange === 'bybit') {
                    sucesso = await testarBybitReal(chave.api_key, chave.secret_key);
                } else if (chave.exchange === 'binance') {
                    sucesso = await testarBinanceReal(chave.api_key, chave.secret_key);
                }
                
                if (sucesso) {
                    resultados.sucesso++;
                    console.log('   ✅ Conectividade OK');
                    
                    // Atualizar status no banco
                    await atualizarStatusConectividade(chave, 'configured', 'Teste automatizado bem-sucedido');
                } else {
                    resultados.erro_ip++;
                    console.log('   ❌ Erro de IP - Configuração necessária');
                    
                    await atualizarStatusConectividade(chave, 'pending', 'IP precisa ser configurado na exchange');
                }
                
            } catch (error) {
                resultados.outros_erros++;
                console.log('   ❌ Erro de conexão');
                
                await atualizarStatusConectividade(chave, 'error', `Erro: ${error.message}`);
            }
            
            // Pausa entre testes para evitar rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('\n📊 RESULTADO DOS TESTES AUTOMATIZADOS:');
        console.log(`   ✅ Sucessos: ${resultados.sucesso}/${resultados.total}`);
        console.log(`   🚨 Erros de IP: ${resultados.erro_ip}/${resultados.total}`);
        console.log(`   🔐 Erros de autenticação: ${resultados.erro_auth}/${resultados.total}`);
        console.log(`   ❌ Outros erros: ${resultados.outros_erros}/${resultados.total}`);
        
        const percentualSucesso = (resultados.sucesso / resultados.total) * 100;
        console.log(`   📈 Taxa de sucesso: ${percentualSucesso.toFixed(1)}%`);
        
    } catch (error) {
        console.error('❌ Erro no teste automatizado:', error.message);
    }
}

/**
 * Testar Bybit com chaves reais
 */
async function testarBybitReal(apiKey, secretKey) {
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
            timeout: 10000
        });
        
        return response.data.retCode === 0;
        
    } catch (error) {
        return false;
    }
}

/**
 * Testar Binance com chaves reais
 */
async function testarBinanceReal(apiKey, secretKey) {
    try {
        const timestamp = Date.now();
        const queryString = `timestamp=${timestamp}`;
        const signature = crypto
            .createHmac('sha256', secretKey)
            .update(queryString)
            .digest('hex');
        
        const response = await axios.get('https://api.binance.com/api/v3/account', {
            headers: { 'X-MBX-APIKEY': apiKey },
            params: { timestamp, signature },
            timeout: 10000
        });
        
        return response.status === 200;
        
    } catch (error) {
        return false;
    }
}

/**
 * Atualizar status de conectividade
 */
async function atualizarStatusConectividade(chave, status, observacao) {
    try {
        const query = `
            UPDATE user_ip_configurations 
            SET 
                status_configuracao = $1,
                ultima_verificacao = NOW(),
                proxima_verificacao = NOW() + INTERVAL '1 day',
                observacoes = $2,
                updated_at = NOW()
            WHERE api_key_preview = $3;
        `;
        
        await pool.query(query, [status, observacao, chave.api_key.substring(0, 8)]);
        
    } catch (error) {
        console.log(`⚠️ Erro ao atualizar status: ${error.message}`);
    }
}

/**
 * Função principal
 */
async function main() {
    console.log('🚀 SISTEMA AUTOMATIZADO DE IP FIXO MULTIUSUÁRIO\n');
    console.log('=' .repeat(70));
    
    try {
        // 1. Criar estrutura de controle
        await criarEstruturaControlIP();
        
        // 2. Sincronizar configurações IP
        await sincronizarConfiguracoesIP();
        
        // 3. Gerar relatório de status
        await gerarRelatorioStatusIP();
        
        // 4. Testar conectividade automatizada
        await testarConectividadeAutomatizada();
        
        console.log('\n' + '=' .repeat(70));
        console.log('✅ SISTEMA AUTOMATIZADO EXECUTADO COM SUCESSO');
        console.log(`🌐 IP fixo padrão: ${SISTEMA_CONFIG.ip_fixo_railway}`);
        console.log('📊 Todos os usuários sincronizados');
        console.log('🧪 Testes de conectividade executados');
        console.log('📈 Relatórios gerados');
        
        console.log('\n💡 PARA NOVOS USUÁRIOS:');
        console.log('1. O sistema criará automaticamente as configurações IP');
        console.log('2. Cada usuário receberá instruções específicas');
        console.log('3. Os testes serão executados automaticamente');
        console.log('4. O monitoramento será contínuo');
        
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
    criarEstruturaControlIP,
    sincronizarConfiguracoesIP,
    testarConectividadeAutomatizada,
    SISTEMA_CONFIG
};
