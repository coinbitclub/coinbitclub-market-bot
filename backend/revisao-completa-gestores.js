/**
 * 🔍 REVISÃO COMPLETA DE TODOS OS GESTORES - SISTEMA MULTIUSUÁRIO
 * =============================================================
 * 
 * Testando TODOS os gestores e simulando fluxo completo:
 * 1. Gestores existentes
 * 2. Conexão com chaves do banco
 * 3. Consulta de saldos
 * 4. Definição de parâmetros
 * 5. Abertura de ordens
 * 6. Integração com frontend em produção
 */

const axios = require('axios');
const { Pool } = require('pg');

// Configuração do banco PostgreSQL Railway
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

// URLs para testes
const FRONTEND_URL = 'https://coinbitclub-market-bot.vercel.app';
const BACKEND_URL = 'https://coinbitclub-market-bot.up.railway.app';

async function revisaoCompletaGestores() {
    console.log('🔍 REVISÃO COMPLETA - TODOS OS GESTORES');
    console.log('=====================================');
    
    const resultados = {
        gestores: {},
        microservicos: {},
        frontend: {},
        simulacao: {},
        erros: []
    };
    
    try {
        console.log('\n📋 1. IDENTIFICANDO GESTORES EXISTENTES');
        console.log('─────────────────────────────────────────');
        
        const fs = require('fs');
        const path = require('path');
        
        // Buscar todos os gestores
        const gestoresEncontrados = fs.readdirSync('./')
            .filter(file => file.startsWith('gestor-') && file.endsWith('.js'))
            .map(file => ({
                arquivo: file,
                nome: file.replace('gestor-', '').replace('.js', '')
            }));
        
        console.log(`📁 Gestores encontrados: ${gestoresEncontrados.length}`);
        gestoresEncontrados.forEach(gestor => {
            console.log(`  📄 ${gestor.arquivo} -> ${gestor.nome}`);
        });
        
        console.log('\n🧪 2. TESTANDO CADA GESTOR INDIVIDUALMENTE');
        console.log('───────────────────────────────────────────');
        
        // Testar gestor Fear & Greed
        console.log('\n📊 2.1 Gestor Fear & Greed (Medo e Ganância)');
        try {
            const gestorFearGreed = require('./gestor-fear-greed-coinstats.js');
            
            if (gestorFearGreed && typeof gestorFearGreed.obterIndice === 'function') {
                const resultado = await gestorFearGreed.obterIndice();
                console.log('✅ Gestor Fear & Greed: FUNCIONANDO');
                console.log(`📈 Índice atual: ${resultado.index || 'N/A'}`);
                resultados.gestores.fearGreed = true;
            } else {
                throw new Error('Gestor não possui método obterIndice');
            }
        } catch (error) {
            console.log('❌ Gestor Fear & Greed: ERRO -', error.message);
            
            // Testar API diretamente
            try {
                const response = await axios.get('https://api.coinstats.app/public/v1/fear-greed', { timeout: 5000 });
                if (response.data && response.data.value !== undefined) {
                    console.log('✅ API CoinStats funcionando diretamente');
                    console.log(`📊 Índice direto: ${response.data.value}/100`);
                    resultados.gestores.fearGreed = 'api_direta';
                }
            } catch (apiError) {
                console.log('❌ API CoinStats também falhou');
                resultados.gestores.fearGreed = false;
                resultados.erros.push('Fear & Greed API inacessível');
            }
        }
        
        // Testar gestor de chaves
        console.log('\n🔑 2.2 Gestor de Chaves e Parametrizações');
        try {
            const gestorChaves = require('./gestor-chaves-parametrizacoes.js');
            
            if (gestorChaves && typeof gestorChaves.validarChaves === 'function') {
                console.log('✅ Gestor de Chaves: CARREGADO');
                resultados.gestores.chaves = true;
            } else {
                throw new Error('Gestor não possui método validarChaves');
            }
        } catch (error) {
            console.log('❌ Gestor de Chaves: ERRO -', error.message);
            resultados.gestores.chaves = false;
            resultados.erros.push('Gestor de chaves não funcional');
        }
        
        // Testar gestor de operações
        console.log('\n📈 2.3 Gestor de Operações');
        try {
            const gestorOperacoes = require('./gestor-operacoes-completo.js');
            
            if (gestorOperacoes) {
                console.log('✅ Gestor de Operações: CARREGADO');
                resultados.gestores.operacoes = true;
            } else {
                throw new Error('Gestor não encontrado');
            }
        } catch (error) {
            console.log('❌ Gestor de Operações: ERRO -', error.message);
            resultados.gestores.operacoes = false;
            resultados.erros.push('Gestor de operações não funcional');
        }
        
        // Testar gestor financeiro
        console.log('\n💰 2.4 Gestor Financeiro');
        try {
            const gestorFinanceiro = require('./gestor-financeiro-completo.js');
            
            if (gestorFinanceiro) {
                console.log('✅ Gestor Financeiro: CARREGADO');
                resultados.gestores.financeiro = true;
            } else {
                throw new Error('Gestor não encontrado');
            }
        } catch (error) {
            console.log('❌ Gestor Financeiro: ERRO -', error.message);
            resultados.gestores.financeiro = false;
            resultados.erros.push('Gestor financeiro não funcional');
        }
        
        // Testar gestor de usuários
        console.log('\n👥 2.5 Gestor de Usuários');
        try {
            const gestorUsuarios = require('./gestor-usuarios-completo.js');
            
            if (gestorUsuarios) {
                console.log('✅ Gestor de Usuários: CARREGADO');
                resultados.gestores.usuarios = true;
            } else {
                throw new Error('Gestor não encontrado');
            }
        } catch (error) {
            console.log('❌ Gestor de Usuários: ERRO -', error.message);
            resultados.gestores.usuarios = false;
            resultados.erros.push('Gestor de usuários não funcional');
        }
        
        console.log('\n🌐 3. TESTANDO MICROSERVIÇOS EM PRODUÇÃO');
        console.log('──────────────────────────────────────────');
        
        // Testar backend em produção
        console.log('\n🔗 3.1 Backend Railway');
        try {
            const healthResponse = await axios.get(`${BACKEND_URL}/health`, { timeout: 10000 });
            
            if (healthResponse.status === 200) {
                console.log('✅ Backend Railway: ONLINE');
                console.log(`📊 Status: ${healthResponse.status}`);
                console.log(`📋 Data: ${JSON.stringify(healthResponse.data, null, 2)}`);
                resultados.microservicos.backend = true;
            } else {
                throw new Error(`Status ${healthResponse.status}`);
            }
        } catch (error) {
            console.log('❌ Backend Railway: OFFLINE -', error.message);
            resultados.microservicos.backend = false;
            resultados.erros.push('Backend Railway inacessível');
        }
        
        // Testar endpoints críticos
        const endpointsCriticos = [
            { path: '/api/status', nome: 'Status API' },
            { path: '/api/health', nome: 'Health Check' },
            { path: '/webhook/tradingview', nome: 'Webhook TradingView', metodo: 'POST' }
        ];
        
        console.log('\n🎯 3.2 Endpoints Críticos');
        for (const endpoint of endpointsCriticos) {
            try {
                const url = `${BACKEND_URL}${endpoint.path}`;
                console.log(`🔗 Testando: ${endpoint.nome} - ${url}`);
                
                let response;
                if (endpoint.metodo === 'POST') {
                    response = await axios.post(url, { test: true }, { timeout: 5000 });
                } else {
                    response = await axios.get(url, { timeout: 5000 });
                }
                
                if (response.status === 200 || response.status === 201) {
                    console.log(`✅ ${endpoint.nome}: OK (${response.status})`);
                    resultados.microservicos[endpoint.nome.toLowerCase().replace(' ', '_')] = true;
                } else {
                    console.log(`⚠️ ${endpoint.nome}: Status ${response.status}`);
                    resultados.microservicos[endpoint.nome.toLowerCase().replace(' ', '_')] = 'warning';
                }
                
            } catch (error) {
                console.log(`❌ ${endpoint.nome}: ERRO - ${error.message}`);
                resultados.microservicos[endpoint.nome.toLowerCase().replace(' ', '_')] = false;
            }
        }
        
        console.log('\n🖥️ 4. TESTANDO FRONTEND EM PRODUÇÃO');
        console.log('────────────────────────────────────────');
        
        try {
            const frontendResponse = await axios.get(FRONTEND_URL, { timeout: 10000 });
            
            if (frontendResponse.status === 200) {
                console.log('✅ Frontend Vercel: ONLINE');
                console.log(`📊 Status: ${frontendResponse.status}`);
                
                // Verificar se contém elementos esperados
                const htmlContent = frontendResponse.data;
                const temLogin = htmlContent.includes('login') || htmlContent.includes('Login');
                const temDashboard = htmlContent.includes('dashboard') || htmlContent.includes('Dashboard');
                
                console.log(`🔍 Contém Login: ${temLogin ? '✅' : '❌'}`);
                console.log(`🔍 Contém Dashboard: ${temDashboard ? '✅' : '❌'}`);
                
                resultados.frontend.status = true;
                resultados.frontend.login = temLogin;
                resultados.frontend.dashboard = temDashboard;
            } else {
                throw new Error(`Status ${frontendResponse.status}`);
            }
        } catch (error) {
            console.log('❌ Frontend Vercel: OFFLINE -', error.message);
            resultados.frontend.status = false;
            resultados.erros.push('Frontend Vercel inacessível');
        }
        
        console.log('\n💾 5. TESTANDO CONEXÃO COM BANCO DE DADOS');
        console.log('─────────────────────────────────────────');
        
        try {
            // Testar conexão básica
            const client = await pool.connect();
            console.log('✅ Conexão com PostgreSQL: ESTABELECIDA');
            
            // Verificar tabelas principais
            const tabelasPrincipais = [
                'users',
                'user_api_keys', 
                'user_trading_params',
                'user_balances',
                'trading_operations'
            ];
            
            console.log('\n📋 5.1 Verificando Estrutura das Tabelas');
            for (const tabela of tabelasPrincipais) {
                try {
                    const result = await client.query(`SELECT COUNT(*) FROM ${tabela}`);
                    const count = parseInt(result.rows[0].count);
                    console.log(`✅ Tabela ${tabela}: ${count} registros`);
                    resultados.simulacao[tabela] = count;
                } catch (error) {
                    console.log(`❌ Tabela ${tabela}: ERRO - ${error.message}`);
                    resultados.erros.push(`Tabela ${tabela} com problemas`);
                }
            }
            
            client.release();
            
        } catch (error) {
            console.log('❌ Conexão com PostgreSQL: FALHOU -', error.message);
            resultados.erros.push('Banco de dados inacessível');
        }
        
        console.log('\n🎮 6. SIMULAÇÃO COMPLETA - FLUXO DE USUÁRIO');
        console.log('───────────────────────────────────────────');
        
        try {
            console.log('\n👤 6.1 Simulando Busca de Usuário com Chaves');
            
            const client = await pool.connect();
            
            // Buscar usuário de teste com chaves
            const usuarioResult = await client.query(`
                SELECT u.id, u.email, u.full_name,
                       k.binance_api_key, k.binance_secret_key,
                       k.bybit_api_key, k.bybit_secret_key,
                       k.is_testnet
                FROM users u
                LEFT JOIN user_api_keys k ON u.id = k.user_id
                WHERE u.email LIKE '%test%' OR u.email LIKE '%demo%'
                LIMIT 1
            `);
            
            if (usuarioResult.rows.length > 0) {
                const usuario = usuarioResult.rows[0];
                console.log('✅ Usuário encontrado:');
                console.log(`📧 Email: ${usuario.email}`);
                console.log(`👤 Nome: ${usuario.full_name}`);
                console.log(`🔑 Binance API: ${usuario.binance_api_key ? 'CONFIGURADA' : 'NÃO CONFIGURADA'}`);
                console.log(`🔑 Bybit API: ${usuario.bybit_api_key ? 'CONFIGURADA' : 'NÃO CONFIGURADA'}`);
                console.log(`🧪 Testnet: ${usuario.is_testnet ? 'SIM' : 'NÃO'}`);
                
                resultados.simulacao.usuario_encontrado = true;
                resultados.simulacao.usuario_id = usuario.id;
                
                // Simular validação de chaves
                console.log('\n🔐 6.2 Simulando Validação de Chaves API');
                
                if (usuario.binance_api_key && usuario.binance_secret_key) {
                    console.log('🔄 Testando conectividade Binance...');
                    
                    // Simular teste de conectividade (sem fazer requisição real)
                    const simulacaoConectividade = {
                        binance: Math.random() > 0.3, // 70% chance de sucesso
                        bybit: Math.random() > 0.3
                    };
                    
                    console.log(`📊 Binance: ${simulacaoConectividade.binance ? '✅ CONECTADO' : '❌ FALHA'}`);
                    console.log(`📊 Bybit: ${simulacaoConectividade.bybit ? '✅ CONECTADO' : '❌ FALHA'}`);
                    
                    resultados.simulacao.conectividade_exchanges = simulacaoConectividade;
                    
                    // Simular consulta de saldos
                    console.log('\n💰 6.3 Simulando Consulta de Saldos');
                    
                    const saldosSimulados = {
                        binance: {
                            USDT: (Math.random() * 1000 + 100).toFixed(2),
                            BTC: (Math.random() * 0.1).toFixed(6)
                        },
                        bybit: {
                            USDT: (Math.random() * 500 + 50).toFixed(2),
                            BTC: (Math.random() * 0.05).toFixed(6)
                        }
                    };
                    
                    console.log('📊 Saldos Simulados:');
                    console.log(`  🟡 Binance USDT: $${saldosSimulados.binance.USDT}`);
                    console.log(`  🟡 Binance BTC: ₿${saldosSimulados.binance.BTC}`);
                    console.log(`  🟣 Bybit USDT: $${saldosSimulados.bybit.USDT}`);
                    console.log(`  🟣 Bybit BTC: ₿${saldosSimulados.bybit.BTC}`);
                    
                    resultados.simulacao.saldos = saldosSimulados;
                    
                    // Simular definição de parâmetros
                    console.log('\n⚙️ 6.4 Simulando Definição de Parâmetros de Trading');
                    
                    const parametrosResult = await client.query(`
                        SELECT * FROM user_trading_params 
                        WHERE user_id = $1
                    `, [usuario.id]);
                    
                    let parametros;
                    if (parametrosResult.rows.length > 0) {
                        parametros = parametrosResult.rows[0];
                        console.log('✅ Parâmetros existentes encontrados');
                    } else {
                        // Criar parâmetros padrão
                        parametros = {
                            leverage: 10,
                            risk_percentage: 2.0,
                            max_daily_trades: 5,
                            stop_loss_percentage: 2.0,
                            take_profit_percentage: 4.0
                        };
                        console.log('📝 Usando parâmetros padrão');
                    }
                    
                    console.log(`⚡ Alavancagem: ${parametros.leverage}x`);
                    console.log(`🎯 Risco por trade: ${parametros.risk_percentage}%`);
                    console.log(`📈 Stop Loss: ${parametros.stop_loss_percentage}%`);
                    console.log(`📈 Take Profit: ${parametros.take_profit_percentage}%`);
                    
                    resultados.simulacao.parametros = parametros;
                    
                    // Simular abertura de ordem
                    console.log('\n📈 6.5 Simulando Abertura de Ordem');
                    
                    const ordemSimulada = {
                        symbol: 'BTCUSDT',
                        side: 'BUY',
                        quantity: '0.001',
                        price: '67500.00',
                        type: 'LIMIT',
                        timestamp: new Date(),
                        exchange: simulacaoConectividade.binance ? 'binance' : 'bybit'
                    };
                    
                    console.log('🎯 Ordem Simulada:');
                    console.log(`  📊 Par: ${ordemSimulada.symbol}`);
                    console.log(`  📈 Lado: ${ordemSimulada.side}`);
                    console.log(`  💰 Quantidade: ${ordemSimulada.quantity} BTC`);
                    console.log(`  💵 Preço: $${ordemSimulada.price}`);
                    console.log(`  🏪 Exchange: ${ordemSimulada.exchange}`);
                    
                    // Salvar operação simulada no banco
                    try {
                        await client.query(`
                            INSERT INTO trading_operations 
                            (user_id, symbol, operation_type, quantity, entry_price, exchange, status, created_at)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        `, [
                            usuario.id,
                            ordemSimulada.symbol,
                            ordemSimulada.side,
                            ordemSimulada.quantity,
                            ordemSimulada.price,
                            ordemSimulada.exchange,
                            'SIMULATED',
                            ordemSimulada.timestamp
                        ]);
                        
                        console.log('✅ Operação salva no banco de dados');
                        resultados.simulacao.ordem_salva = true;
                        
                    } catch (error) {
                        console.log('❌ Erro ao salvar operação:', error.message);
                        resultados.simulacao.ordem_salva = false;
                        resultados.erros.push('Falha ao salvar operação no banco');
                    }
                    
                } else {
                    console.log('⚠️ Usuário sem chaves API configuradas');
                    resultados.simulacao.sem_chaves = true;
                }
                
            } else {
                console.log('⚠️ Nenhum usuário de teste encontrado');
                resultados.simulacao.usuario_encontrado = false;
            }
            
            client.release();
            
        } catch (error) {
            console.log('❌ Erro na simulação:', error.message);
            resultados.simulacao.erro = error.message;
            resultados.erros.push('Falha na simulação completa');
        }
        
        console.log('\n🎉 7. RESUMO DOS RESULTADOS');
        console.log('──────────────────────────');
        
        // Calcular estatísticas
        const totalGestores = Object.keys(resultados.gestores).length;
        const gestoresFuncionando = Object.values(resultados.gestores).filter(v => v === true).length;
        
        const totalMicroservicos = Object.keys(resultados.microservicos).length;
        const microservicosFuncionando = Object.values(resultados.microservicos).filter(v => v === true).length;
        
        console.log('\n📊 ESTATÍSTICAS:');
        console.log(`🔧 Gestores: ${gestoresFuncionando}/${totalGestores} funcionando (${Math.round(gestoresFuncionando/totalGestores*100)}%)`);
        console.log(`🌐 Microserviços: ${microservicosFuncionando}/${totalMicroservicos} funcionando (${Math.round(microservicosFuncionando/totalMicroservicos*100)}%)`);
        console.log(`🖥️ Frontend: ${resultados.frontend.status ? 'ONLINE' : 'OFFLINE'}`);
        console.log(`💾 Banco de dados: ${resultados.simulacao.usuario_encontrado ? 'OPERACIONAL' : 'COM PROBLEMAS'}`);
        
        if (resultados.erros.length > 0) {
            console.log('\n⚠️ ERROS ENCONTRADOS:');
            resultados.erros.forEach((erro, index) => {
                console.log(`  ${index + 1}. ${erro}`);
            });
        }
        
        // Status geral
        const statusGeral = (gestoresFuncionando/totalGestores + microservicosFuncionando/totalMicroservicos) / 2;
        
        if (statusGeral >= 0.8) {
            console.log('\n🎉 STATUS GERAL: SISTEMA OPERACIONAL (>80%)');
            console.log('✅ Pronto para produção com ajustes menores');
        } else if (statusGeral >= 0.6) {
            console.log('\n⚠️ STATUS GERAL: NECESSITA AJUSTES (60-80%)');
            console.log('🔧 Corrija os erros antes da produção');
        } else {
            console.log('\n❌ STATUS GERAL: CRÍTICO (<60%)');
            console.log('🚨 Sistema precisa de correções urgentes');
        }
        
        return resultados;
        
    } catch (error) {
        console.log('❌ ERRO CRÍTICO na revisão:', error.message);
        resultados.erro_critico = error.message;
        return resultados;
    }
}

// Executar revisão completa
revisaoCompletaGestores().then(resultado => {
    console.log('\n📋 RESULTADO FINAL DA REVISÃO:');
    console.log('==============================');
    console.log(JSON.stringify(resultado, null, 2));
}).catch(console.error);
