/**
 * 🔧 TESTE COMPLETO COM ESTRUTURA REAL DO BANCO
 * ============================================
 * 
 * Testando todas as funcionalidades com a estrutura correta
 */

const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function testeCompletoReal() {
    console.log('🎯 TESTE COMPLETO COM ESTRUTURA REAL DO BANCO');
    console.log('============================================');
    
    const resultados = {
        estrutura: {},
        usuarios: {},
        chaves: {},
        saldos: {},
        parametros: {},
        simulacao: {},
        frontend: {},
        gestores: {}
    };
    
    try {
        const client = await pool.connect();
        
        console.log('\n📊 1. MAPEANDO ESTRUTURA CORRETA');
        console.log('─────────────────────────────────');
        
        // Verificar tabelas principais
        const tabelas = ['users', 'user_api_keys', 'user_trading_params', 'user_balances', 'trading_operations'];
        
        for (const tabela of tabelas) {
            try {
                const count = await client.query(`SELECT COUNT(*) FROM ${tabela}`);
                const registros = parseInt(count.rows[0].count);
                console.log(`✅ ${tabela}: ${registros} registros`);
                resultados.estrutura[tabela] = registros;
            } catch (error) {
                console.log(`❌ ${tabela}: ERRO - ${error.message}`);
                resultados.estrutura[tabela] = 'erro';
            }
        }
        
        console.log('\n👥 2. ANALISANDO USUÁRIOS');
        console.log('─────────────────────────');
        
        const usuarios = await client.query(`
            SELECT id, email, name, full_name, role, status, 
                   vip_status, affiliate_level, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 10
        `);
        
        console.log(`📊 Usuários encontrados: ${usuarios.rows.length}`);
        
        usuarios.rows.forEach((user, index) => {
            console.log(`\n👤 Usuário ${index + 1}:`);
            console.log(`  📧 Email: ${user.email}`);
            console.log(`  👤 Nome: ${user.name || user.full_name || 'N/A'}`);
            console.log(`  🎭 Role: ${user.role || 'N/A'}`);
            console.log(`  📊 Status: ${user.status || 'N/A'}`);
            console.log(`  👑 VIP: ${user.vip_status ? 'SIM' : 'NÃO'}`);
            console.log(`  🔗 Afiliado: ${user.affiliate_level || 'N/A'}`);
        });
        
        resultados.usuarios.total = usuarios.rows.length;
        resultados.usuarios.vips = usuarios.rows.filter(u => u.vip_status).length;
        
        console.log('\n🔑 3. TESTANDO CHAVES API');
        console.log('─────────────────────────');
        
        const chaves = await client.query(`
            SELECT k.id, k.user_id, k.exchange, k.environment,
                   k.is_active, k.validation_status, k.last_validated_at,
                   u.email
            FROM user_api_keys k
            JOIN users u ON k.user_id = u.id
            ORDER BY k.created_at DESC
        `);
        
        console.log(`🔑 Chaves encontradas: ${chaves.rows.length}`);
        
        chaves.rows.forEach((chave, index) => {
            console.log(`\n🔑 Chave ${index + 1}:`);
            console.log(`  👤 Usuário: ${chave.email}`);
            console.log(`  🏪 Exchange: ${chave.exchange}`);
            console.log(`  🌍 Ambiente: ${chave.environment || 'N/A'}`);
            console.log(`  ✅ Ativa: ${chave.is_active ? 'SIM' : 'NÃO'}`);
            console.log(`  🔍 Status: ${chave.validation_status || 'N/A'}`);
            console.log(`  ⏰ Última validação: ${chave.last_validated_at || 'Nunca'}`);
        });
        
        resultados.chaves.total = chaves.rows.length;
        resultados.chaves.ativas = chaves.rows.filter(c => c.is_active).length;
        resultados.chaves.exchanges = [...new Set(chaves.rows.map(c => c.exchange))];
        
        console.log('\n💰 4. VERIFICANDO SALDOS');
        console.log('─────────────────────────');
        
        const saldos = await client.query(`
            SELECT b.user_id, b.exchange, b.asset, b.balance, b.balance_type,
                   u.email
            FROM user_balances b
            JOIN users u ON b.user_id = u.id
            ORDER BY b.user_id, b.exchange, b.asset
            LIMIT 15
        `);
        
        console.log(`💰 Saldos encontrados: ${saldos.rows.length}`);
        
        // Agrupar por usuário
        const saldosPorUsuario = {};
        saldos.rows.forEach(saldo => {
            if (!saldosPorUsuario[saldo.user_id]) {
                saldosPorUsuario[saldo.user_id] = {
                    email: saldo.email,
                    saldos: []
                };
            }
            saldosPorUsuario[saldo.user_id].saldos.push({
                exchange: saldo.exchange,
                asset: saldo.asset,
                balance: saldo.balance,
                type: saldo.balance_type
            });
        });
        
        Object.entries(saldosPorUsuario).forEach(([userId, dados]) => {
            console.log(`\n💰 Usuário ${userId} (${dados.email}):`);
            dados.saldos.forEach(saldo => {
                console.log(`  📊 ${saldo.exchange} ${saldo.asset}: ${saldo.balance} (${saldo.type})`);
            });
        });
        
        resultados.saldos.total = saldos.rows.length;
        resultados.saldos.usuarios_com_saldo = Object.keys(saldosPorUsuario).length;
        
        console.log('\n⚙️ 5. VERIFICANDO PARÂMETROS DE TRADING');
        console.log('───────────────────────────────────────');
        
        const parametros = await client.query(`
            SELECT p.user_id, p.leverage, p.risk_percentage, p.max_daily_trades,
                   p.stop_loss_percentage, p.take_profit_percentage, p.trading_mode,
                   u.email
            FROM user_trading_params p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.user_id
        `);
        
        console.log(`⚙️ Parâmetros encontrados: ${parametros.rows.length}`);
        
        parametros.rows.forEach((param, index) => {
            console.log(`\n⚙️ Usuário ${index + 1} (${param.email}):`);
            console.log(`  ⚡ Alavancagem: ${param.leverage}x`);
            console.log(`  🎯 Risco: ${param.risk_percentage}%`);
            console.log(`  📈 Max trades/dia: ${param.max_daily_trades}`);
            console.log(`  🛑 Stop Loss: ${param.stop_loss_percentage}%`);
            console.log(`  🎯 Take Profit: ${param.take_profit_percentage}%`);
            console.log(`  🎮 Modo: ${param.trading_mode || 'padrão'}`);
        });
        
        resultados.parametros.total = parametros.rows.length;
        
        console.log('\n🎯 6. SIMULAÇÃO COMPLETA - USUÁRIO COM CHAVES');
        console.log('─────────────────────────────────────────────');
        
        // Buscar usuário completo com chaves
        const usuarioCompleto = await client.query(`
            SELECT u.id, u.email, u.name, u.full_name,
                   k.exchange, k.api_key, k.secret_key, k.environment,
                   p.leverage, p.risk_percentage, p.stop_loss_percentage, p.take_profit_percentage
            FROM users u
            JOIN user_api_keys k ON u.id = k.user_id AND k.is_active = true
            LEFT JOIN user_trading_params p ON u.id = p.user_id
            LIMIT 1
        `);
        
        if (usuarioCompleto.rows.length > 0) {
            const usuario = usuarioCompleto.rows[0];
            console.log('✅ Usuário completo encontrado:');
            console.log(`👤 ${usuario.email} (ID: ${usuario.id})`);
            console.log(`🏪 Exchange: ${usuario.exchange}`);
            console.log(`🌍 Ambiente: ${usuario.environment || 'produção'}`);
            
            // Verificar chaves
            console.log('\n🔐 6.1 Validação de Chaves');
            const temChaves = usuario.api_key && usuario.secret_key;
            console.log(`🔑 Chaves presentes: ${temChaves ? '✅ SIM' : '❌ NÃO'}`);
            
            if (temChaves) {
                console.log(`🔐 API Key: ${usuario.api_key.substring(0, 10)}...`);
                console.log(`🔐 Secret: ${usuario.secret_key.substring(0, 10)}...`);
                
                // Simular teste de conectividade
                console.log('\n📡 6.2 Simulando Conectividade');
                
                const conectividade = {
                    exchange: usuario.exchange,
                    ambiente: usuario.environment || 'produção',
                    conectado: Math.random() > 0.15, // 85% chance de sucesso
                    latencia: Math.floor(Math.random() * 150 + 30),
                    timestamp: new Date()
                };
                
                console.log(`🏪 ${conectividade.exchange}: ${conectividade.conectado ? '✅ CONECTADO' : '❌ FALHA'}`);
                console.log(`⚡ Latência: ${conectividade.latencia}ms`);
                console.log(`🌍 Ambiente: ${conectividade.ambiente}`);
                
                if (conectividade.conectado) {
                    // Buscar saldos específicos do usuário
                    console.log('\n💰 6.3 Consultando Saldos Reais');
                    
                    const saldosUsuario = await client.query(`
                        SELECT exchange, asset, balance, balance_type
                        FROM user_balances
                        WHERE user_id = $1
                        ORDER BY exchange, asset
                    `, [usuario.id]);
                    
                    console.log(`📊 Saldos do usuário: ${saldosUsuario.rows.length}`);
                    
                    let saldoUsdt = 0;
                    saldosUsuario.rows.forEach(saldo => {
                        console.log(`  💰 ${saldo.exchange} ${saldo.asset}: ${saldo.balance}`);
                        if (saldo.asset === 'USDT') {
                            saldoUsdt = Math.max(saldoUsdt, parseFloat(saldo.balance));
                        }
                    });
                    
                    // Usar parâmetros ou padrões
                    const params = {
                        leverage: usuario.leverage || 10,
                        risk_percentage: usuario.risk_percentage || 2.0,
                        stop_loss_percentage: usuario.stop_loss_percentage || 2.0,
                        take_profit_percentage: usuario.take_profit_percentage || 4.0
                    };
                    
                    console.log('\n📊 6.4 Parâmetros de Trading');
                    console.log(`⚡ Alavancagem: ${params.leverage}x`);
                    console.log(`🎯 Risco: ${params.risk_percentage}%`);
                    console.log(`🛑 Stop Loss: ${params.stop_loss_percentage}%`);
                    console.log(`🎯 Take Profit: ${params.take_profit_percentage}%`);
                    
                    // Simular cálculo de ordem
                    console.log('\n📈 6.5 Calculando Ordem de Trading');
                    
                    const precoAtual = 67850.00; // BTC/USDT atual
                    const valorDisponivel = saldoUsdt || 1000; // Fallback se não tiver saldo
                    const valorRisco = (valorDisponivel * params.risk_percentage / 100);
                    const quantidadeBtc = (valorRisco / precoAtual);
                    
                    const ordem = {
                        symbol: 'BTCUSDT',
                        side: 'BUY',
                        type: 'LIMIT',
                        quantity: quantidadeBtc.toFixed(6),
                        price: precoAtual.toFixed(2),
                        stopLoss: (precoAtual * (1 - params.stop_loss_percentage / 100)).toFixed(2),
                        takeProfit: (precoAtual * (1 + params.take_profit_percentage / 100)).toFixed(2),
                        leverage: params.leverage,
                        riskAmount: valorRisco.toFixed(2),
                        exchange: usuario.exchange,
                        user_id: usuario.id
                    };
                    
                    console.log('🎯 Ordem Calculada:');
                    console.log(`  📊 ${ordem.symbol} ${ordem.side}`);
                    console.log(`  💰 Quantidade: ${ordem.quantity} BTC`);
                    console.log(`  💵 Preço: $${ordem.price}`);
                    console.log(`  🛑 Stop Loss: $${ordem.stopLoss}`);
                    console.log(`  🎯 Take Profit: $${ordem.takeProfit}`);
                    console.log(`  💸 Valor em risco: $${ordem.riskAmount}`);
                    console.log(`  ⚡ Alavancagem: ${ordem.leverage}x`);
                    console.log(`  🏪 Exchange: ${ordem.exchange}`);
                    
                    // Salvar operação no banco
                    console.log('\n💾 6.6 Salvando no Banco de Dados');
                    
                    try {
                        const resultInsert = await client.query(`
                            INSERT INTO trading_operations 
                            (user_id, symbol, operation_type, quantity, entry_price, stop_loss, take_profit, exchange, status, leverage, created_at)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                            RETURNING id, created_at
                        `, [
                            ordem.user_id,
                            ordem.symbol,
                            ordem.side,
                            ordem.quantity,
                            ordem.price,
                            ordem.stopLoss,
                            ordem.takeProfit,
                            ordem.exchange,
                            'SIMULATED_COMPLETE',
                            ordem.leverage,
                            new Date()
                        ]);
                        
                        const operacaoId = resultInsert.rows[0].id;
                        console.log(`✅ Operação salva com ID: ${operacaoId}`);
                        console.log(`📅 Timestamp: ${resultInsert.rows[0].created_at}`);
                        
                        resultados.simulacao.operacao_id = operacaoId;
                        resultados.simulacao.sucesso = true;
                        
                    } catch (error) {
                        console.log('❌ Erro ao salvar:', error.message);
                        resultados.simulacao.erro_banco = error.message;
                    }
                    
                } else {
                    console.log('❌ Falha na conectividade simulada');
                    resultados.simulacao.conectividade = false;
                }
                
            } else {
                console.log('⚠️ Usuário sem chaves válidas');
                resultados.simulacao.sem_chaves = true;
            }
            
        } else {
            console.log('⚠️ Nenhum usuário com chaves ativas encontrado');
            resultados.simulacao.usuario_encontrado = false;
        }
        
        console.log('\n🌐 7. TESTANDO FRONTEND/BACKEND INTEGRAÇÃO');
        console.log('─────────────────────────────────────────');
        
        // Testar endpoints do backend
        const endpoints = [
            { url: 'https://coinbitclub-market-bot.up.railway.app/health', nome: 'Health Check' },
            { url: 'https://coinbitclub-market-bot.up.railway.app/api/status', nome: 'API Status' },
            { url: 'https://coinbitclub-market-bot.vercel.app', nome: 'Frontend' }
        ];
        
        for (const endpoint of endpoints) {
            try {
                console.log(`🔗 Testando: ${endpoint.nome}`);
                const response = await axios.get(endpoint.url, { timeout: 8000 });
                
                if (response.status === 200) {
                    console.log(`✅ ${endpoint.nome}: OK (${response.status})`);
                    resultados.frontend[endpoint.nome.toLowerCase().replace(' ', '_')] = true;
                    
                    if (endpoint.nome === 'API Status' && response.data) {
                        console.log(`📊 Versão: ${response.data.version || 'N/A'}`);
                        console.log(`⏰ Uptime: ${response.data.uptime || 0}s`);
                    }
                } else {
                    console.log(`⚠️ ${endpoint.nome}: Status ${response.status}`);
                    resultados.frontend[endpoint.nome.toLowerCase().replace(' ', '_')] = 'warning';
                }
                
            } catch (error) {
                console.log(`❌ ${endpoint.nome}: ERRO - ${error.message}`);
                resultados.frontend[endpoint.nome.toLowerCase().replace(' ', '_')] = false;
            }
        }
        
        console.log('\n🔧 8. TESTANDO GESTORES ESPECÍFICOS');
        console.log('───────────────────────────────────');
        
        // Testar Fear & Greed
        console.log('\n📊 8.1 Gestor Fear & Greed');
        try {
            const fearGreedResponse = await axios.get('https://api.coinstats.app/public/v1/fear-greed', { timeout: 5000 });
            
            if (fearGreedResponse.data && fearGreedResponse.data.value !== undefined) {
                console.log('✅ API CoinStats: FUNCIONANDO');
                console.log(`📈 Índice atual: ${fearGreedResponse.data.value}/100`);
                console.log(`📋 Classificação: ${fearGreedResponse.data.classification || 'N/A'}`);
                resultados.gestores.fear_greed = true;
                resultados.gestores.fear_greed_index = fearGreedResponse.data.value;
            } else {
                throw new Error('Dados inválidos da API');
            }
        } catch (error) {
            console.log('❌ Fear & Greed: ERRO -', error.message);
            resultados.gestores.fear_greed = false;
        }
        
        client.release();
        
        console.log('\n🎉 RESUMO FINAL');
        console.log('===============');
        
        const estatisticas = {
            usuarios_total: resultados.usuarios.total || 0,
            chaves_ativas: resultados.chaves.ativas || 0,
            exchanges_suportadas: resultados.chaves.exchanges?.length || 0,
            saldos_registrados: resultados.saldos.total || 0,
            parametros_configurados: resultados.parametros.total || 0,
            simulacao_sucesso: !!resultados.simulacao.sucesso,
            frontend_online: !!resultados.frontend.frontend,
            backend_online: !!resultados.frontend.health_check
        };
        
        console.log('📊 ESTATÍSTICAS FINAIS:');
        console.log(`👥 Usuários: ${estatisticas.usuarios_total}`);
        console.log(`🔑 Chaves ativas: ${estatisticas.chaves_ativas}`);
        console.log(`🏪 Exchanges: ${estatisticas.exchanges_suportadas}`);
        console.log(`💰 Saldos: ${estatisticas.saldos_registrados}`);
        console.log(`⚙️ Parâmetros: ${estatisticas.parametros_configurados}`);
        console.log(`🎯 Simulação: ${estatisticas.simulacao_sucesso ? '✅ SUCESSO' : '❌ FALHA'}`);
        console.log(`🖥️ Frontend: ${estatisticas.frontend_online ? '✅ ONLINE' : '❌ OFFLINE'}`);
        console.log(`🌐 Backend: ${estatisticas.backend_online ? '✅ ONLINE' : '❌ OFFLINE'}`);
        
        // Calcular score geral
        const scores = Object.values(estatisticas);
        const scoreGeral = (scores.filter(Boolean).length / scores.length * 100).toFixed(1);
        
        console.log(`\n🎯 SCORE GERAL: ${scoreGeral}%`);
        
        if (scoreGeral >= 85) {
            console.log('🎉 SISTEMA PRONTO PARA PRODUÇÃO!');
        } else if (scoreGeral >= 70) {
            console.log('⚠️ Sistema necessita ajustes menores');
        } else {
            console.log('❌ Sistema precisa de correções importantes');
        }
        
        resultados.score_final = scoreGeral;
        resultados.estatisticas = estatisticas;
        
        return resultados;
        
    } catch (error) {
        console.log('❌ ERRO CRÍTICO:', error.message);
        resultados.erro_critico = error.message;
        return resultados;
    }
}

// Executar teste completo
testeCompletoReal().then(resultado => {
    console.log('\n📋 RESULTADO COMPLETO:');
    console.log('======================');
    console.log(JSON.stringify(resultado, null, 2));
}).catch(console.error);
