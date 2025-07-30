/**
 * 🤖 IA SUPERVISOR FINANCEIRO - SISTEMA COMPLETO
 * 
 * FUNÇÃO: SUPERVISOR que monitora, calcula e emite ordens
 * 
 * ❌ NÃO EXECUTA: Trading, Pagamentos, Transferências
 * ✅ EXECUTA APENAS: Atualização de dados em tempo real
 * 
 * RESPONSABILIDADES:
 * - Supervisionar cálculos de comissão
 * - Monitorar comissionamento de afiliados
 * - Acompanhar contabilização
 * - Emitir ordens para microserviços responsáveis
 * - Manter informações atualizadas em tempo real
 */

const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:LukinhaCBB123@junction.proxy.rlwy.net:15433/railway',
    ssl: { rejectUnauthorized: false }
});

class IASupervisorFinanceiroBackoffice {
    constructor() {
        this.isActive = false;
        this.monitoringIntervals = [];
        this.microservicesEndpoints = {
            robotFinanceiro: 'http://localhost:3001/financial-robot',
            comissaoAfiliado: 'http://localhost:3002/affiliate-commission',
            contabilizacao: 'http://localhost:3003/accounting',
            tradingBot: 'http://localhost:3004/trading-bot',
            pagamentos: 'http://localhost:3005/payments'
        };
        
        // Estado dos microserviços
        this.microservicesStatus = {};
        
        // Dados em tempo real
        this.realtimeData = {
            operationsActive: [],
            commissionsCalculated: [],
            affiliatePayments: [],
            accountingEntries: [],
            lastUpdate: null
        };
    }

    async iniciarSupervisao() {
        console.log('🤖 INICIANDO IA SUPERVISOR FINANCEIRO');
        console.log('='.repeat(60));
        console.log('👁️ MODO: Supervisor - Emite ordens, NÃO executa');
        console.log('📊 SUPERVISIONA:');
        console.log('   • Robô Financeiro (cálculos)');
        console.log('   • Comissionamento de Afiliados');
        console.log('   • Contabilização automática');
        console.log('   • Status de microserviços');
        console.log('');
        console.log('✅ EXECUTA APENAS:');
        console.log('   • Atualização de dados em tempo real');
        console.log('   • Manutenção de informações');
        console.log('   • Logs e registros');
        console.log('');
        console.log('❌ NÃO EXECUTA:');
        console.log('   • Trading direto');
        console.log('   • Pagamentos');
        console.log('   • Transferências');
        console.log('   • Alterações financeiras');
        console.log('');

        try {
            // 1. Verificar conectividade com microserviços
            await this.verificarMicroservicos();

            // 2. Inicializar monitoramento contínuo
            await this.iniciarMonitoramentoContinuo();

            // 3. Sincronizar dados iniciais
            await this.sincronizarDadosIniciais();

            this.isActive = true;
            console.log('✅ IA SUPERVISOR FINANCEIRO ATIVO');
            console.log('🔄 Supervisão iniciada com sucesso');

            return { success: true, message: 'Supervisor financeiro ativo' };

        } catch (error) {
            console.error('❌ Erro na inicialização:', error.message);
            return { success: false, error: error.message };
        }
    }

    async verificarMicroservicos() {
        console.log('🔍 VERIFICANDO MICROSERVIÇOS...');
        
        for (const [serviceName, endpoint] of Object.entries(this.microservicesEndpoints)) {
            try {
                const response = await axios.get(`${endpoint}/health`, { timeout: 5000 });
                this.microservicesStatus[serviceName] = {
                    status: 'online',
                    lastCheck: new Date(),
                    endpoint: endpoint,
                    version: response.data.version || '1.0.0'
                };
                console.log(`   ✅ ${serviceName}: Online`);
            } catch (error) {
                this.microservicesStatus[serviceName] = {
                    status: 'offline',
                    lastCheck: new Date(),
                    endpoint: endpoint,
                    error: error.message
                };
                console.log(`   ❌ ${serviceName}: Offline (${error.message})`);
            }
        }
    }

    async iniciarMonitoramentoContinuo() {
        console.log('🔄 CONFIGURANDO MONITORAMENTO COMPLETO DE BACKOFFICE...');

        // === MONITORAMENTO OPERACIONAL ===
        
        // Monitor de operações (a cada 30 segundos)
        const operationsMonitor = setInterval(async () => {
            await this.supervisionarOperacoes();
        }, 30000);

        // Monitor de comissões (a cada 1 minuto)
        const commissionsMonitor = setInterval(async () => {
            await this.supervisionarComissoes();
        }, 60000);

        // Monitor de afiliados (a cada 2 minutos)
        const affiliatesMonitor = setInterval(async () => {
            await this.supervisionarAfiliados();
        }, 120000);

        // Monitor de contabilização (a cada 5 minutos)
        const accountingMonitor = setInterval(async () => {
            await this.supervisionarContabilizacao();
        }, 300000);

        // === MONITORAMENTO DE BACKOFFICE ===

        // 1. Gestão de Usuários (a cada 10 minutos)
        const userManagementMonitor = setInterval(async () => {
            await this.supervisionarGestaoUsuarios();
        }, 600000);

        // 2. Gestão Financeira e Contábil (a cada 15 minutos)
        const financialManagementMonitor = setInterval(async () => {
            await this.supervisionarGestaoFinanceira();
        }, 900000);

        // 3. Gerenciamento de Ordens (a cada 2 minutos)
        const orderManagementMonitor = setInterval(async () => {
            await this.supervisionarGerenciamentoOrdens();
        }, 120000);

        // 4. Ciclo de Pagamento (diário às 6h e 18h)
        const paymentCycleMonitor = setInterval(async () => {
            await this.supervisionarCicloPagamento();
        }, 60000 * 60 * 12); // A cada 12 horas

        // 5. Limpeza de Dados (a cada 1 hora)
        const dataCleanupMonitor = setInterval(async () => {
            await this.supervisionarLimpezaDados();
        }, 3600000);

        // 6. Relatórios e Indicadores (a cada 30 minutos)
        const reportsMonitor = setInterval(async () => {
            await this.supervisionarRelatorios();
        }, 1800000);

        // 7. Suporte e Atendimento (a cada 5 minutos)
        const supportMonitor = setInterval(async () => {
            await this.supervisionarSuporteAtendimento();
        }, 300000);

        // 8. Controle de Logs (a cada 10 minutos)
        const logsMonitor = setInterval(async () => {
            await this.supervisionarControleLogs();
        }, 600000);

        // Health check de microserviços (a cada 1 minuto)
        const healthMonitor = setInterval(async () => {
            await this.verificarMicroservicos();
        }, 60000);

        this.monitoringIntervals = [
            // Operacionais
            operationsMonitor,
            commissionsMonitor,
            affiliatesMonitor,
            accountingMonitor,
            healthMonitor,
            // Backoffice
            userManagementMonitor,
            financialManagementMonitor,
            orderManagementMonitor,
            paymentCycleMonitor,
            dataCleanupMonitor,
            reportsMonitor,
            supportMonitor,
            logsMonitor
        ];

        console.log('   ✅ OPERACIONAL:');
        console.log('      • Operações: 30s');
        console.log('      • Comissões: 1min');
        console.log('      • Afiliados: 2min');
        console.log('      • Contabilização: 5min');
        console.log('      • Health Check: 1min');
        console.log('');
        console.log('   ✅ BACKOFFICE:');
        console.log('      • Gestão Usuários: 10min');
        console.log('      • Gestão Financeira: 15min');
        console.log('      • Gerenciamento Ordens: 2min');
        console.log('      • Ciclo Pagamento: 12h');
        console.log('      • Limpeza Dados: 1h');
        console.log('      • Relatórios: 30min');
        console.log('      • Suporte: 5min');
        console.log('      • Controle Logs: 10min');
    }

    async supervisionarOperacoes() {
        try {
            console.log('\n👁️ SUPERVISÃO: Operações de Trading');
            
            // Buscar operações ativas
            const query = `
                SELECT 
                    uo.id, uo.user_id, uo.symbol, uo.side, 
                    uo.entry_price, uo.current_price, uo.quantity,
                    uo.take_profit_price, uo.stop_loss_price,
                    uo.status, uo.created_at,
                    u.name as user_name,
                    u.affiliate_id
                FROM user_operations uo
                JOIN users u ON uo.user_id = u.id
                WHERE uo.status IN ('OPEN', 'PENDING')
                ORDER BY uo.created_at DESC
            `;

            const result = await pool.query(query);
            const operationsActive = result.rows;

            this.realtimeData.operationsActive = operationsActive;
            this.realtimeData.lastUpdate = new Date();

            if (operationsActive.length > 0) {
                console.log(`   📊 ${operationsActive.length} operações ativas supervisionadas`);
                
                // Para cada operação, verificar se precisa de ação
                for (const operation of operationsActive) {
                    await this.analisarOperacao(operation);
                }
            } else {
                console.log('   📊 Nenhuma operação ativa');
            }

            // APENAS ATUALIZAR DADOS - NÃO EXECUTAR AÇÕES
            await this.atualizarDadosOperacoes(operationsActive);

        } catch (error) {
            console.log('❌ Erro na supervisão de operações:', error.message);
        }
    }

    async analisarOperacao(operation) {
        try {
            // Verificar se operação precisa de atenção
            const tempoAberta = Date.now() - new Date(operation.created_at).getTime();
            const minutosAberta = Math.floor(tempoAberta / 60000);

            if (minutosAberta > 60) { // Mais de 1 hora aberta
                console.log(`   ⚠️ Operação ${operation.id} aberta há ${minutosAberta} minutos`);
                
                // EMITIR ORDEM para robô financeiro - NÃO EXECUTAR
                await this.emitirOrdemParaRoboFinanceiro({
                    action: 'ANALYZE_LONG_OPERATION',
                    operationId: operation.id,
                    userId: operation.user_id,
                    symbol: operation.symbol,
                    minutesOpen: minutosAberta,
                    supervisor: 'IA_FINANCIAL'
                });
            }

            // Verificar se há afiliado para calcular comissão potencial
            if (operation.affiliate_id) {
                await this.calcularComissaoPotencial(operation);
            }

        } catch (error) {
            console.log(`❌ Erro na análise da operação ${operation.id}:`, error.message);
        }
    }

    async calcularComissaoPotencial(operation) {
        try {
            // Calcular lucro/prejuízo atual (se tiver preço atual)
            if (operation.current_price && operation.entry_price) {
                const isLong = operation.side === 'LONG';
                const priceChange = operation.current_price - operation.entry_price;
                const profitLoss = isLong ? priceChange : -priceChange;
                const profitLossPercent = (profitLoss / operation.entry_price) * 100;

                if (profitLossPercent > 0) { // Operação em lucro
                    const potentialCommission = profitLoss * 0.015; // 1.5% comissão padrão

                    console.log(`   💰 Operação ${operation.id} em lucro: ${profitLossPercent.toFixed(2)}%`);
                    console.log(`   🎯 Comissão potencial: $${potentialCommission.toFixed(2)}`);

                    // EMITIR ORDEM para sistema de comissões - NÃO EXECUTAR
                    await this.emitirOrdemParaComissaoAfiliado({
                        action: 'CALCULATE_POTENTIAL_COMMISSION',
                        operationId: operation.id,
                        affiliateId: operation.affiliate_id,
                        userId: operation.user_id,
                        currentProfit: profitLoss,
                        potentialCommission: potentialCommission,
                        supervisor: 'IA_FINANCIAL'
                    });
                }
            }

        } catch (error) {
            console.log('❌ Erro no cálculo de comissão potencial:', error.message);
        }
    }

    async supervisionarComissoes() {
        try {
            console.log('\n💰 SUPERVISÃO: Comissões e Afiliados');

            // Buscar comissões pendentes de cálculo
            const query = `
                SELECT 
                    uo.id as operation_id,
                    uo.user_id,
                    uo.symbol,
                    uo.profit_usd,
                    uo.closed_at,
                    u.affiliate_id,
                    u.name as user_name,
                    af.name as affiliate_name
                FROM user_operations uo
                JOIN users u ON uo.user_id = u.id
                LEFT JOIN users af ON u.affiliate_id = af.id
                WHERE uo.status = 'CLOSED' 
                  AND uo.profit_usd > 0
                  AND uo.closed_at > NOW() - INTERVAL '24 hours'
                  AND NOT EXISTS (
                      SELECT 1 FROM affiliate_commissions ac 
                      WHERE ac.operation_id = uo.id
                  )
                  AND u.affiliate_id IS NOT NULL
                ORDER BY uo.closed_at DESC
            `;

            const result = await pool.query(query);
            const commissionsToCalculate = result.rows;

            if (commissionsToCalculate.length > 0) {
                console.log(`   📊 ${commissionsToCalculate.length} comissões para calcular`);

                for (const commission of commissionsToCalculate) {
                    // EMITIR ORDEM para calcular comissão - NÃO EXECUTAR
                    await this.emitirOrdemParaComissaoAfiliado({
                        action: 'CALCULATE_COMMISSION',
                        operationId: commission.operation_id,
                        userId: commission.user_id,
                        affiliateId: commission.affiliate_id,
                        profit: commission.profit_usd,
                        symbol: commission.symbol,
                        supervisor: 'IA_FINANCIAL'
                    });

                    console.log(`   💰 Ordem emitida: Comissão para ${commission.affiliate_name} (Op: ${commission.operation_id})`);
                }
            } else {
                console.log('   📊 Nenhuma comissão pendente de cálculo');
            }

            // APENAS ATUALIZAR DADOS
            this.realtimeData.commissionsCalculated = commissionsToCalculate;

        } catch (error) {
            console.log('❌ Erro na supervisão de comissões:', error.message);
        }
    }

    async supervisionarAfiliados() {
        try {
            console.log('\n🤝 SUPERVISÃO: Pagamentos de Afiliados');

            // Buscar comissões aprovadas pendentes de pagamento
            const query = `
                SELECT 
                    ac.affiliate_id,
                    af.name as affiliate_name,
                    af.email as affiliate_email,
                    COUNT(ac.id) as commission_count,
                    SUM(ac.commission_amount) as total_amount,
                    MIN(ac.created_at) as oldest_commission,
                    MAX(ac.created_at) as newest_commission
                FROM affiliate_commissions ac
                JOIN users af ON ac.affiliate_id = af.id
                WHERE ac.status = 'approved'
                  AND ac.created_at > NOW() - INTERVAL '30 days'
                GROUP BY ac.affiliate_id, af.name, af.email
                HAVING SUM(ac.commission_amount) >= 50 -- Mínimo $50 para pagamento
                ORDER BY total_amount DESC
            `;

            const result = await pool.query(query);
            const affiliatePayments = result.rows;

            if (affiliatePayments.length > 0) {
                console.log(`   📊 ${affiliatePayments.length} afiliados com pagamentos pendentes`);

                for (const payment of affiliatePayments) {
                    console.log(`   💳 ${payment.affiliate_name}: $${payment.total_amount} (${payment.commission_count} comissões)`);

                    // EMITIR ORDEM para sistema de pagamentos - NÃO EXECUTAR
                    await this.emitirOrdemParaPagamentos({
                        action: 'PREPARE_AFFILIATE_PAYMENT',
                        affiliateId: payment.affiliate_id,
                        affiliateName: payment.affiliate_name,
                        totalAmount: payment.total_amount,
                        commissionCount: payment.commission_count,
                        supervisor: 'IA_FINANCIAL'
                    });
                }
            } else {
                console.log('   📊 Nenhum pagamento de afiliado pendente');
            }

            // APENAS ATUALIZAR DADOS
            this.realtimeData.affiliatePayments = affiliatePayments;

        } catch (error) {
            console.log('❌ Erro na supervisão de afiliados:', error.message);
        }
    }

    async supervisionarContabilizacao() {
        try {
            console.log('\n📚 SUPERVISÃO: Contabilização');

            // Buscar operações fechadas sem registro contábil
            const query = `
                SELECT 
                    uo.id as operation_id,
                    uo.user_id,
                    uo.symbol,
                    uo.side,
                    uo.profit_usd,
                    uo.closed_at,
                    u.name as user_name
                FROM user_operations uo
                JOIN users u ON uo.user_id = u.id
                WHERE uo.status = 'CLOSED'
                  AND uo.closed_at > NOW() - INTERVAL '7 days'
                  AND NOT EXISTS (
                      SELECT 1 FROM company_financial cf
                      WHERE cf.reference_operation = uo.id
                  )
                ORDER BY uo.closed_at DESC
                LIMIT 50
            `;

            const result = await pool.query(query);
            const accountingEntries = result.rows;

            if (accountingEntries.length > 0) {
                console.log(`   📊 ${accountingEntries.length} operações para contabilizar`);

                for (const entry of accountingEntries) {
                    // EMITIR ORDEM para sistema contábil - NÃO EXECUTAR
                    await this.emitirOrdemParaContabilizacao({
                        action: 'CREATE_ACCOUNTING_ENTRY',
                        operationId: entry.operation_id,
                        userId: entry.user_id,
                        profit: entry.profit_usd,
                        symbol: entry.symbol,
                        side: entry.side,
                        supervisor: 'IA_FINANCIAL'
                    });

                    console.log(`   📝 Ordem emitida: Contabilizar ${entry.symbol} (${entry.side}) - $${entry.profit_usd}`);
                }
            } else {
                console.log('   📊 Contabilização em dia');
            }

            // APENAS ATUALIZAR DADOS
            this.realtimeData.accountingEntries = accountingEntries;

        } catch (error) {
            console.log('❌ Erro na supervisão de contabilização:', error.message);
        }
    }

    // ==========================================
    // SUPERVISÃO DE BACKOFFICE
    // ==========================================

    // 🔐 1. GESTÃO DE USUÁRIOS E ACESSOS
    async supervisionarGestaoUsuarios() {
        try {
            console.log('\n🔐 SUPERVISÃO: Gestão de Usuários e Acessos');

            // Verificar usuários com status inconsistente
            const statusQuery = `
                SELECT 
                    u.id, u.name, u.email, u.is_active, u.created_at,
                    s.status as subscription_status,
                    EXTRACT(HOURS FROM (NOW() - u.created_at)) as hours_since_registration
                FROM users u
                LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
                WHERE u.created_at > NOW() - INTERVAL '48 hours'
                  AND u.affiliate_id IS NULL
                  AND EXISTS (
                      SELECT 1 FROM users af WHERE af.id != u.id AND af.is_affiliate = true
                  )
                ORDER BY u.created_at DESC
            `;

            const result = await pool.query(statusQuery);
            const usersNeedingAffiliateLink = result.rows;

            if (usersNeedingAffiliateLink.length > 0) {
                console.log(`   📊 ${usersNeedingAffiliateLink.length} usuários precisam de vinculação de afiliado`);

                for (const user of usersNeedingAffiliateLink) {
                    if (user.hours_since_registration < 48) {
                        // EMITIR ORDEM para sistema de usuários
                        await this.emitirOrdemParaGestaoUsuarios({
                            action: 'PENDING_AFFILIATE_LINK',
                            userId: user.id,
                            userName: user.name,
                            email: user.email,
                            hoursSinceRegistration: user.hours_since_registration,
                            supervisor: 'IA_BACKOFFICE'
                        });

                        console.log(`   👤 ${user.name}: ${user.hours_since_registration.toFixed(1)}h desde registro`);
                    }
                }
            } else {
                console.log('   📊 Todas as vinculações de afiliado em dia');
            }

            // Verificar logs de autenticação suspeitos
            await this.verificarLogsAutenticacao();

        } catch (error) {
            console.log('❌ Erro na supervisão de usuários:', error.message);
        }
    }

    // 💸 2. GESTÃO FINANCEIRA E CONTÁBIL
    async supervisionarGestaoFinanceira() {
        try {
            console.log('\n💸 SUPERVISÃO: Gestão Financeira e Contábil');

            // Apuração de lucro líquido por operação
            const lucroQuery = `
                SELECT 
                    DATE(uo.closed_at) as operation_date,
                    COUNT(*) as total_operations,
                    SUM(CASE WHEN uo.profit_usd > 0 THEN uo.profit_usd ELSE 0 END) as total_profit,
                    SUM(CASE WHEN uo.profit_usd < 0 THEN ABS(uo.profit_usd) ELSE 0 END) as total_loss,
                    SUM(uo.profit_usd) as net_profit
                FROM user_operations uo
                WHERE uo.status = 'CLOSED'
                  AND uo.closed_at > NOW() - INTERVAL '24 hours'
                GROUP BY DATE(uo.closed_at)
                ORDER BY operation_date DESC
            `;

            const result = await pool.query(lucroQuery);
            const dailyProfits = result.rows;

            if (dailyProfits.length > 0) {
                for (const day of dailyProfits) {
                    console.log(`   📊 ${day.operation_date}: ${day.total_operations} ops, $${day.net_profit} lucro líquido`);

                    // EMITIR ORDEM para contabilização
                    await this.emitirOrdemParaContabilizacao({
                        action: 'CALCULATE_DAILY_PROFIT',
                        date: day.operation_date,
                        totalOperations: day.total_operations,
                        totalProfit: day.total_profit,
                        totalLoss: day.total_loss,
                        netProfit: day.net_profit,
                        supervisor: 'IA_BACKOFFICE'
                    });
                }
            }

            // Verificar conversão de moeda BRL/USD
            await this.verificarConversaoMoeda();

            // Verificar despesas operacionais
            await this.verificarDespesasOperacionais();

        } catch (error) {
            console.log('❌ Erro na supervisão financeira:', error.message);
        }
    }

    // 📦 3. GERENCIAMENTO DE OPERAÇÕES E ORDENS
    async supervisionarGerenciamentoOrdens() {
        try {
            console.log('\n📦 SUPERVISÃO: Gerenciamento de Ordens');

            // Verificar ordens abertas vs sinais de entrada
            const ordensAbertas = `
                SELECT 
                    uo.id, uo.symbol, uo.side, uo.status,
                    uo.created_at, uo.entry_price,
                    EXTRACT(MINUTES FROM (NOW() - uo.created_at)) as minutes_open,
                    u.name as user_name
                FROM user_operations uo
                JOIN users u ON uo.user_id = u.id
                WHERE uo.status IN ('OPEN', 'PENDING')
                ORDER BY uo.created_at ASC
            `;

            const result = await pool.query(ordensAbertas);
            const openOrders = result.rows;

            if (openOrders.length > 0) {
                console.log(`   📊 ${openOrders.length} ordens abertas monitoradas`);

                for (const order of openOrders) {
                    // Verificar se ordem está aberta há muito tempo
                    if (order.minutes_open > 120) { // Mais de 2 horas
                        console.log(`   ⚠️ Ordem ${order.id} (${order.symbol}) aberta há ${order.minutes_open} min`);

                        // EMITIR ORDEM para verificação
                        await this.emitirOrdemParaRoboFinanceiro({
                            action: 'CHECK_LONG_OPEN_ORDER',
                            orderId: order.id,
                            symbol: order.symbol,
                            side: order.side,
                            minutesOpen: order.minutes_open,
                            supervisor: 'IA_BACKOFFICE'
                        });
                    }
                }
            } else {
                console.log('   📊 Nenhuma ordem aberta no momento');
            }

            // Verificar sinais não executados
            await this.verificarSinaisNaoExecutados();

        } catch (error) {
            console.log('❌ Erro na supervisão de ordens:', error.message);
        }
    }

    // 🔄 9. CICLO DE PAGAMENTO E COMISSÃO
    async supervisionarCicloPagamento() {
        try {
            console.log('\n🔄 SUPERVISÃO: Ciclo de Pagamento e Comissão');

            const hoje = new Date();
            const dia = hoje.getDate();

            // Processamento automático nos dias 5 e 20
            if (dia === 5 || dia === 20) {
                console.log(`   📅 Dia ${dia}: Período de processamento automático`);

                // Cálculo de comissões pendentes
                const commissoesQuery = `
                    SELECT 
                        ac.affiliate_id,
                        af.name as affiliate_name,
                        COUNT(ac.id) as total_commissions,
                        SUM(ac.commission_amount) as total_amount,
                        af.is_vip,
                        CASE WHEN af.is_vip THEN 0.05 ELSE 0.015 END as commission_rate
                    FROM affiliate_commissions ac
                    JOIN users af ON ac.affiliate_id = af.id
                    WHERE ac.status = 'approved'
                      AND ac.created_at <= NOW() - INTERVAL '5 days'
                    GROUP BY ac.affiliate_id, af.name, af.is_vip
                    HAVING SUM(ac.commission_amount) >= 50
                    ORDER BY total_amount DESC
                `;

                const result = await pool.query(commissoesQuery);
                const comissoesPendentes = result.rows;

                if (comissoesPendentes.length > 0) {
                    console.log(`   💰 ${comissoesPendentes.length} afiliados com comissões para processar`);

                    for (const comissao of comissoesPendentes) {
                        const taxa = comissao.is_vip ? '5% VIP' : '1.5% Normal';
                        console.log(`   💳 ${comissao.affiliate_name}: $${comissao.total_amount} (${taxa})`);

                        // EMITIR ORDEM para processamento em lote
                        await this.emitirOrdemParaPagamentos({
                            action: 'BATCH_PROCESS_COMMISSION',
                            affiliateId: comissao.affiliate_id,
                            affiliateName: comissao.affiliate_name,
                            totalAmount: comissao.total_amount,
                            commissionCount: comissao.total_commissions,
                            commissionRate: comissao.commission_rate,
                            isVip: comissao.is_vip,
                            processDate: hoje.toISOString().split('T')[0],
                            supervisor: 'IA_BACKOFFICE'
                        });
                    }
                }
            }

            // Verificar créditos não sacados (90 dias)
            await this.verificarCreditosNaoSacados();

            // Verificar reversão de créditos (180 dias inativos)
            await this.verificarReversaoCreditos();

        } catch (error) {
            console.log('❌ Erro na supervisão do ciclo de pagamento:', error.message);
        }
    }

    // 🧹 10. LIMPEZA E RETENÇÃO DE DADOS
    async supervisionarLimpezaDados() {
        try {
            console.log('\n🧹 SUPERVISÃO: Limpeza e Retenção de Dados');

            // Webhooks crus após 72h
            const webhooksLimpeza = `
                SELECT COUNT(*) as count
                FROM webhook_logs 
                WHERE created_at < NOW() - INTERVAL '72 hours'
                  AND status IN ('processed', 'ignored')
            `;

            const webhooksResult = await pool.query(webhooksLimpeza);
            const webhooksParaLimpar = webhooksResult.rows[0].count;

            if (webhooksParaLimpar > 0) {
                console.log(`   🗑️ ${webhooksParaLimpar} webhooks para limpeza (>72h)`);

                // EMITIR ORDEM para limpeza
                await this.emitirOrdemParaLimpezaDados({
                    action: 'CLEANUP_OLD_WEBHOOKS',
                    count: webhooksParaLimpar,
                    cutoffHours: 72,
                    supervisor: 'IA_BACKOFFICE'
                });
            }

            // Logs de IA não críticos após 72h
            const logsIALimpeza = `
                SELECT COUNT(*) as count
                FROM ai_analysis 
                WHERE created_at < NOW() - INTERVAL '72 hours'
                  AND analysis_type NOT IN ('CRITICAL_ERROR', 'SECURITY_ALERT', 'FINANCIAL_ANOMALY')
            `;

            const logsResult = await pool.query(logsIALimpeza);
            const logsParaLimpar = logsResult.rows[0].count;

            if (logsParaLimpar > 0) {
                console.log(`   🗑️ ${logsParaLimpar} logs de IA para limpeza (>72h)`);

                // EMITIR ORDEM para limpeza
                await this.emitirOrdemParaLimpezaDados({
                    action: 'CLEANUP_OLD_AI_LOGS',
                    count: logsParaLimpar,
                    cutoffHours: 72,
                    supervisor: 'IA_BACKOFFICE'
                });
            }

            // Contas testnet inativas após 8 dias
            await this.verificarContasTestnetInativas();

        } catch (error) {
            console.log('❌ Erro na supervisão de limpeza:', error.message);
        }
    }

    // 📊 5. RELATÓRIOS E INDICADORES
    async supervisionarRelatorios() {
        try {
            console.log('\n📊 SUPERVISÃO: Relatórios e Indicadores');

            // Receita por plano
            const receitaPorPlano = `
                SELECT 
                    p.name as plan_name,
                    p.price,
                    COUNT(s.id) as active_subscriptions,
                    SUM(p.price) as monthly_revenue
                FROM plans p
                LEFT JOIN subscriptions s ON p.id = s.plan_id AND s.status = 'active'
                GROUP BY p.id, p.name, p.price
                ORDER BY monthly_revenue DESC
            `;

            const result = await pool.query(receitaPorPlano);
            const revenueByPlan = result.rows;

            if (revenueByPlan.length > 0) {
                console.log('   📈 Receita por plano:');
                for (const plan of revenueByPlan) {
                    console.log(`      ${plan.plan_name}: ${plan.active_subscriptions} assinantes = $${plan.monthly_revenue}`);
                }

                // EMITIR ORDEM para atualização de dashboard
                await this.emitirOrdemParaDashboard({
                    action: 'UPDATE_REVENUE_DASHBOARD',
                    data: revenueByPlan,
                    timestamp: new Date().toISOString(),
                    supervisor: 'IA_BACKOFFICE'
                });
            }

            // Performance da IA
            await this.calcularPerformanceIA();

            // Evolução de afiliados
            await this.calcularEvolucaoAfiliados();

        } catch (error) {
            console.log('❌ Erro na supervisão de relatórios:', error.message);
        }
    }

    // 📞 6. SUPORTE E ATENDIMENTO
    async supervisionarSuporteAtendimento() {
        try {
            console.log('\n📞 SUPERVISÃO: Suporte e Atendimento');

            // Verificar chamados administrativos pendentes
            const chamadosQuery = `
                SELECT 
                    st.id, st.user_id, st.subject, st.status,
                    st.created_at, st.priority,
                    u.name as user_name, u.email
                FROM support_tickets st
                JOIN users u ON st.user_id = u.id
                WHERE st.status IN ('open', 'pending')
                  AND st.created_at < NOW() - INTERVAL '2 hours'
                ORDER BY st.priority DESC, st.created_at ASC
            `;

            const result = await pool.query(chamadosQuery);
            const ticketsPendentes = result.rows;

            if (ticketsPendentes.length > 0) {
                console.log(`   📧 ${ticketsPendentes.length} chamados pendentes >2h`);

                for (const ticket of ticketsPendentes) {
                    const horas = Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60));
                    console.log(`   🎫 #${ticket.id}: ${ticket.subject} (${horas}h pendente)`);

                    // EMITIR ORDEM para atendimento
                    await this.emitirOrdemParaSuporteAtendimento({
                        action: 'ESCALATE_SUPPORT_TICKET',
                        ticketId: ticket.id,
                        userId: ticket.user_id,
                        subject: ticket.subject,
                        hoursWaiting: horas,
                        priority: ticket.priority,
                        supervisor: 'IA_BACKOFFICE'
                    });
                }
            } else {
                console.log('   📧 Nenhum chamado pendente');
            }

            // Verificar pagamentos pendentes Stripe
            await this.verificarPagamentosPendentesStripe();

            // Verificar notificações não entregues
            await this.verificarNotificacoesNaoEntregues();

        } catch (error) {
            console.log('❌ Erro na supervisão de suporte:', error.message);
        }
    }

    // 📥 7. CONTROLE DE DOCUMENTOS E LOGS
    async supervisionarControleLogs() {
        try {
            console.log('\n📥 SUPERVISÃO: Controle de Logs');

            // Verificar logs de webhooks com erro
            const webhookErrorsQuery = `
                SELECT 
                    DATE(created_at) as error_date,
                    COUNT(*) as error_count,
                    service_name
                FROM webhook_logs 
                WHERE status = 'error'
                  AND created_at > NOW() - INTERVAL '24 hours'
                GROUP BY DATE(created_at), service_name
                ORDER BY error_count DESC
            `;

            const result = await pool.query(webhookErrorsQuery);
            const webhookErrors = result.rows;

            if (webhookErrors.length > 0) {
                console.log('   📊 Erros de webhook nas últimas 24h:');
                for (const error of webhookErrors) {
                    console.log(`      ${error.service_name}: ${error.error_count} erros`);
                }

                // EMITIR ORDEM para análise de logs
                await this.emitirOrdemParaControleLogs({
                    action: 'ANALYZE_WEBHOOK_ERRORS',
                    errors: webhookErrors,
                    period: '24h',
                    supervisor: 'IA_BACKOFFICE'
                });
            }

            // Verificar aceite de termos
            await this.verificarAceiteTermos();

            // Backup de documentos importantes
            await this.verificarBackupDocumentos();

        } catch (error) {
            console.log('❌ Erro na supervisão de logs:', error.message);
        }
    }

    // ==========================================
    // MÉTODOS AUXILIARES DE BACKOFFICE
    // ==========================================

    async verificarLogsAutenticacao() {
        const suspiciousLogins = `
            SELECT user_id, COUNT(*) as login_attempts, ip_address
            FROM user_sessions 
            WHERE created_at > NOW() - INTERVAL '1 hour'
            GROUP BY user_id, ip_address
            HAVING COUNT(*) > 5
        `;

        try {
            const result = await pool.query(suspiciousLogins);
            if (result.rows.length > 0) {
                console.log(`   🔒 ${result.rows.length} IPs com tentativas suspeitas de login`);
                for (const suspicious of result.rows) {
                    await this.emitirOrdemParaSeguranca({
                        action: 'SUSPICIOUS_LOGIN_ATTEMPTS',
                        userId: suspicious.user_id,
                        ipAddress: suspicious.ip_address,
                        attempts: suspicious.login_attempts,
                        supervisor: 'IA_BACKOFFICE'
                    });
                }
            }
        } catch (error) {
            console.log('   ❌ Erro na verificação de logs de autenticação:', error.message);
        }
    }

    async verificarConversaoMoeda() {
        try {
            // Verificar se há taxa de câmbio atualizada para hoje
            const taxaCambioQuery = `
                SELECT * FROM exchange_rates 
                WHERE currency_pair = 'USD_BRL' 
                  AND date = CURRENT_DATE
            `;
            
            const result = await pool.query(taxaCambioQuery);
            if (result.rows.length === 0) {
                await this.emitirOrdemParaGestaoFinanceira({
                    action: 'UPDATE_EXCHANGE_RATE',
                    currencyPair: 'USD_BRL',
                    date: new Date().toISOString().split('T')[0],
                    supervisor: 'IA_BACKOFFICE'
                });
                console.log('   💱 Ordem emitida: Atualizar taxa de câmbio USD/BRL');
            }
        } catch (error) {
            console.log('   ❌ Erro na verificação de conversão de moeda:', error.message);
        }
    }

    async verificarDespesasOperacionais() {
        const despesasQuery = `
            SELECT 
                category,
                SUM(amount) as total_amount,
                COUNT(*) as transaction_count
            FROM company_expenses 
            WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
            GROUP BY category
            ORDER BY total_amount DESC
        `;

        try {
            const result = await pool.query(despesasQuery);
            if (result.rows.length > 0) {
                console.log('   💸 Despesas operacionais do mês:');
                for (const expense of result.rows) {
                    console.log(`      ${expense.category}: $${expense.total_amount}`);
                }
            }
        } catch (error) {
            console.log('   ❌ Erro na verificação de despesas:', error.message);
        }
    }

    async verificarSinaisNaoExecutados() {
        const sinaisQuery = `
            SELECT 
                ws.id, ws.signal_data, ws.created_at,
                EXTRACT(MINUTES FROM (NOW() - ws.created_at)) as minutes_ago
            FROM webhook_signals ws
            LEFT JOIN user_operations uo ON uo.signal_id = ws.id
            WHERE ws.created_at > NOW() - INTERVAL '30 minutes'
              AND uo.id IS NULL
              AND ws.signal_data->>'action' IN ('SINAL_LONG', 'SINAL_SHORT')
        `;

        try {
            const result = await pool.query(sinaisQuery);
            if (result.rows.length > 0) {
                console.log(`   ⚠️ ${result.rows.length} sinais não executados nos últimos 30min`);
                for (const signal of result.rows) {
                    await this.emitirOrdemParaRoboFinanceiro({
                        action: 'INVESTIGATE_MISSED_SIGNAL',
                        signalId: signal.id,
                        signalData: signal.signal_data,
                        minutesAgo: signal.minutes_ago,
                        supervisor: 'IA_BACKOFFICE'
                    });
                }
            }
        } catch (error) {
            console.log('   ❌ Erro na verificação de sinais não executados:', error.message);
        }
    }

    async verificarCreditosNaoSacados() {
        const creditosQuery = `
            SELECT 
                af.affiliate_id,
                u.name,
                SUM(af.commission_amount) as total_unswitched
            FROM affiliate_commissions af
            JOIN users u ON af.affiliate_id = u.id
            WHERE af.status = 'paid'
              AND af.withdrawn = false
              AND af.paid_at < NOW() - INTERVAL '90 days'
            GROUP BY af.affiliate_id, u.name
            HAVING SUM(af.commission_amount) > 0
        `;

        try {
            const result = await pool.query(creditosQuery);
            if (result.rows.length > 0) {
                console.log(`   💰 ${result.rows.length} afiliados com créditos não sacados >90 dias`);
                for (const credit of result.rows) {
                    await this.emitirOrdemParaPagamentos({
                        action: 'CONVERT_TO_PREPAID',
                        affiliateId: credit.affiliate_id,
                        affiliateName: credit.name,
                        amount: credit.total_unswitched,
                        reason: 'UNSWITCHED_90_DAYS',
                        supervisor: 'IA_BACKOFFICE'
                    });
                }
            }
        } catch (error) {
            console.log('   ❌ Erro na verificação de créditos não sacados:', error.message);
        }
    }

    async verificarReversaoCreditos() {
        const reversaoQuery = `
            SELECT 
                u.id, u.name, u.last_login,
                SUM(af.commission_amount) as total_to_reverse
            FROM users u
            JOIN affiliate_commissions af ON u.id = af.affiliate_id
            WHERE u.last_login < NOW() - INTERVAL '180 days'
              AND af.status = 'paid'
              AND af.withdrawn = false
            GROUP BY u.id, u.name, u.last_login
        `;

        try {
            const result = await pool.query(reversaoQuery);
            if (result.rows.length > 0) {
                console.log(`   🔄 ${result.rows.length} contas inativas >180 dias para reversão`);
                for (const reversal of result.rows) {
                    await this.emitirOrdemParaPagamentos({
                        action: 'REVERSE_INACTIVE_CREDITS',
                        userId: reversal.id,
                        userName: reversal.name,
                        amount: reversal.total_to_reverse,
                        lastLogin: reversal.last_login,
                        supervisor: 'IA_BACKOFFICE'
                    });
                }
            }
        } catch (error) {
            console.log('   ❌ Erro na verificação de reversão de créditos:', error.message);
        }
    }

    async verificarContasTestnetInativas() {
        const testnetQuery = `
            SELECT 
                u.id, u.name, u.email, u.created_at
            FROM users u
            WHERE u.account_type = 'testnet'
              AND u.last_login < NOW() - INTERVAL '8 days'
              AND u.created_at < NOW() - INTERVAL '8 days'
        `;

        try {
            const result = await pool.query(testnetQuery);
            if (result.rows.length > 0) {
                console.log(`   🧪 ${result.rows.length} contas testnet inativas >8 dias para exclusão`);
                for (const testnet of result.rows) {
                    await this.emitirOrdemParaLimpezaDados({
                        action: 'DELETE_INACTIVE_TESTNET',
                        userId: testnet.id,
                        userName: testnet.name,
                        email: testnet.email,
                        createdAt: testnet.created_at,
                        supervisor: 'IA_BACKOFFICE'
                    });
                }
            }
        } catch (error) {
            console.log('   ❌ Erro na verificação de contas testnet:', error.message);
        }
    }

    async calcularPerformanceIA() {
        const performanceQuery = `
            SELECT 
                analysis_type,
                COUNT(*) as total_analyses,
                AVG(EXTRACT(SECONDS FROM (updated_at - created_at))) as avg_response_time
            FROM ai_analysis 
            WHERE created_at > NOW() - INTERVAL '24 hours'
            GROUP BY analysis_type
            ORDER BY total_analyses DESC
        `;

        try {
            const result = await pool.query(performanceQuery);
            if (result.rows.length > 0) {
                console.log('   🤖 Performance IA (24h):');
                for (const perf of result.rows) {
                    console.log(`      ${perf.analysis_type}: ${perf.total_analyses} análises, ${perf.avg_response_time?.toFixed(2)}s tempo médio`);
                }
            }
        } catch (error) {
            console.log('   ❌ Erro no cálculo de performance da IA:', error.message);
        }
    }

    async calcularEvolucaoAfiliados() {
        const evolucaoQuery = `
            SELECT 
                DATE_TRUNC('week', u.created_at) as week,
                COUNT(*) as new_affiliates
            FROM users u
            WHERE u.is_affiliate = true
              AND u.created_at > NOW() - INTERVAL '4 weeks'
            GROUP BY DATE_TRUNC('week', u.created_at)
            ORDER BY week DESC
        `;

        try {
            const result = await pool.query(evolucaoQuery);
            if (result.rows.length > 0) {
                console.log('   📈 Novos afiliados por semana:');
                for (const week of result.rows) {
                    console.log(`      ${week.week.toISOString().split('T')[0]}: ${week.new_affiliates} novos`);
                }
            }
        } catch (error) {
            console.log('   ❌ Erro no cálculo de evolução de afiliados:', error.message);
        }
    }

    async verificarPagamentosPendentesStripe() {
        // Esta verificação seria feita via API do Stripe
        console.log('   💳 Verificação de pagamentos Stripe pendentes...');
        
        await this.emitirOrdemParaPagamentos({
            action: 'CHECK_STRIPE_PENDING_PAYMENTS',
            timestamp: new Date().toISOString(),
            supervisor: 'IA_BACKOFFICE'
        });
    }

    async verificarNotificacoesNaoEntregues() {
        const notificacoesQuery = `
            SELECT 
                notification_type,
                COUNT(*) as failed_count
            FROM notification_logs 
            WHERE status = 'failed'
              AND created_at > NOW() - INTERVAL '24 hours'
            GROUP BY notification_type
        `;

        try {
            const result = await pool.query(notificacoesQuery);
            if (result.rows.length > 0) {
                console.log('   📧 Notificações falharam (24h):');
                for (const notification of result.rows) {
                    console.log(`      ${notification.notification_type}: ${notification.failed_count} falhas`);
                    
                    await this.emitirOrdemParaSuporteAtendimento({
                        action: 'RETRY_FAILED_NOTIFICATIONS',
                        notificationType: notification.notification_type,
                        failedCount: notification.failed_count,
                        supervisor: 'IA_BACKOFFICE'
                    });
                }
            }
        } catch (error) {
            console.log('   ❌ Erro na verificação de notificações:', error.message);
        }
    }

    async verificarAceiteTermos() {
        const termosQuery = `
            SELECT COUNT(*) as users_without_terms
            FROM users u
            LEFT JOIN user_terms_acceptance uta ON u.id = uta.user_id
            WHERE u.created_at > NOW() - INTERVAL '7 days'
              AND uta.id IS NULL
        `;

        try {
            const result = await pool.query(termosQuery);
            const usersWithoutTerms = result.rows[0].users_without_terms;
            
            if (usersWithoutTerms > 0) {
                console.log(`   📋 ${usersWithoutTerms} usuários sem aceite de termos`);
                
                await this.emitirOrdemParaControleLogs({
                    action: 'REQUEST_TERMS_ACCEPTANCE',
                    usersCount: usersWithoutTerms,
                    supervisor: 'IA_BACKOFFICE'
                });
            }
        } catch (error) {
            console.log('   ❌ Erro na verificação de aceite de termos:', error.message);
        }
    }

    async verificarBackupDocumentos() {
        // Verificar se backup foi feito nas últimas 24h
        console.log('   💾 Verificando backup de documentos...');
        
        await this.emitirOrdemParaControleLogs({
            action: 'VERIFY_DOCUMENT_BACKUP',
            timestamp: new Date().toISOString(),
            supervisor: 'IA_BACKOFFICE'
        });
    }

    // ==========================================
    // NOVOS MÉTODOS DE EMISSÃO DE ORDENS BACKOFFICE
    // ==========================================

    async emitirOrdemParaGestaoUsuarios(ordem) {
        return await this.emitirOrdemGenerica('userManagement', ordem);
    }

    async emitirOrdemParaGestaoFinanceira(ordem) {
        return await this.emitirOrdemGenerica('financialManagement', ordem);
    }

    async emitirOrdemParaDashboard(ordem) {
        return await this.emitirOrdemGenerica('dashboard', ordem);
    }

    async emitirOrdemParaSuporteAtendimento(ordem) {
        return await this.emitirOrdemGenerica('supportService', ordem);
    }

    async emitirOrdemParaControleLogs(ordem) {
        return await this.emitirOrdemGenerica('logControl', ordem);
    }

    async emitirOrdemParaLimpezaDados(ordem) {
        return await this.emitirOrdemGenerica('dataCleanup', ordem);
    }

    async emitirOrdemParaSeguranca(ordem) {
        return await this.emitirOrdemGenerica('security', ordem);
    }

    async emitirOrdemGenerica(microservice, ordem) {
        try {
            const endpoint = this.microservicesEndpoints[microservice] || `http://localhost:3010/${microservice}`;
            
            if (this.microservicesStatus[microservice]?.status === 'online') {
                const response = await axios.post(`${endpoint}/orders`, {
                    ...ordem,
                    timestamp: new Date().toISOString(),
                    supervisor: 'IA_BACKOFFICE'
                }, { timeout: 5000 });

                console.log(`   📤 Ordem enviada para ${microservice}: ${ordem.action}`);
                return response.data;
            } else {
                console.log(`   ⚠️ ${microservice} offline - Ordem registrada para reenvio`);
                await this.registrarOrdemPendente(microservice, ordem);
            }
        } catch (error) {
            console.log(`   ❌ Erro ao enviar ordem para ${microservice}: ${error.message}`);
            await this.registrarOrdemPendente(microservice, ordem);
        }
    }

    // ==========================================
    // MÉTODOS DE EMISSÃO DE ORDENS OPERACIONAIS
    // ==========================================

    async emitirOrdemParaRoboFinanceiro(ordem) {
        try {
            if (this.microservicesStatus.robotFinanceiro?.status === 'online') {
                const response = await axios.post(`${this.microservicesEndpoints.robotFinanceiro}/orders`, {
                    ...ordem,
                    timestamp: new Date().toISOString(),
                    supervisor: 'IA_FINANCIAL'
                }, { timeout: 5000 });

                console.log(`   📤 Ordem enviada para Robô Financeiro: ${ordem.action}`);
                return response.data;
            } else {
                console.log(`   ⚠️ Robô Financeiro offline - Ordem registrada para reenvio`);
                await this.registrarOrdemPendente('robotFinanceiro', ordem);
            }
        } catch (error) {
            console.log(`   ❌ Erro ao enviar ordem para Robô Financeiro: ${error.message}`);
            await this.registrarOrdemPendente('robotFinanceiro', ordem);
        }
    }

    async emitirOrdemParaComissaoAfiliado(ordem) {
        try {
            if (this.microservicesStatus.comissaoAfiliado?.status === 'online') {
                const response = await axios.post(`${this.microservicesEndpoints.comissaoAfiliado}/orders`, {
                    ...ordem,
                    timestamp: new Date().toISOString(),
                    supervisor: 'IA_FINANCIAL'
                }, { timeout: 5000 });

                console.log(`   📤 Ordem enviada para Comissão Afiliado: ${ordem.action}`);
                return response.data;
            } else {
                console.log(`   ⚠️ Sistema Comissão offline - Ordem registrada para reenvio`);
                await this.registrarOrdemPendente('comissaoAfiliado', ordem);
            }
        } catch (error) {
            console.log(`   ❌ Erro ao enviar ordem para Comissão: ${error.message}`);
            await this.registrarOrdemPendente('comissaoAfiliado', ordem);
        }
    }

    async emitirOrdemParaPagamentos(ordem) {
        try {
            if (this.microservicesStatus.pagamentos?.status === 'online') {
                const response = await axios.post(`${this.microservicesEndpoints.pagamentos}/orders`, {
                    ...ordem,
                    timestamp: new Date().toISOString(),
                    supervisor: 'IA_FINANCIAL'
                }, { timeout: 5000 });

                console.log(`   📤 Ordem enviada para Pagamentos: ${ordem.action}`);
                return response.data;
            } else {
                console.log(`   ⚠️ Sistema Pagamentos offline - Ordem registrada para reenvio`);
                await this.registrarOrdemPendente('pagamentos', ordem);
            }
        } catch (error) {
            console.log(`   ❌ Erro ao enviar ordem para Pagamentos: ${error.message}`);
            await this.registrarOrdemPendente('pagamentos', ordem);
        }
    }

    async emitirOrdemParaContabilizacao(ordem) {
        try {
            if (this.microservicesStatus.contabilizacao?.status === 'online') {
                const response = await axios.post(`${this.microservicesEndpoints.contabilizacao}/orders`, {
                    ...ordem,
                    timestamp: new Date().toISOString(),
                    supervisor: 'IA_FINANCIAL'
                }, { timeout: 5000 });

                console.log(`   📤 Ordem enviada para Contabilização: ${ordem.action}`);
                return response.data;
            } else {
                console.log(`   ⚠️ Sistema Contabilização offline - Ordem registrada para reenvio`);
                await this.registrarOrdemPendente('contabilizacao', ordem);
            }
        } catch (error) {
            console.log(`   ❌ Erro ao enviar ordem para Contabilização: ${error.message}`);
            await this.registrarOrdemPendente('contabilizacao', ordem);
        }
    }

    // ==========================================
    // MÉTODOS DE ATUALIZAÇÃO (ÚNICA EXECUÇÃO PERMITIDA)
    // ==========================================

    async atualizarDadosOperacoes(operationsActive) {
        try {
            // APENAS ATUALIZAR registros de log - SEM EXECUTAR AÇÕES FINANCEIRAS
            const query = `
                INSERT INTO ai_analysis (
                    analysis_type,
                    analysis_data,
                    created_at
                ) VALUES (
                    'OPERATIONS_SUPERVISION',
                    $1,
                    NOW()
                )
            `;

            const analysisData = {
                activeOperations: operationsActive.length,
                supervisedBy: 'IA_FINANCIAL_SUPERVISOR',
                timestamp: new Date().toISOString(),
                operations: operationsActive.map(op => ({
                    id: op.id,
                    symbol: op.symbol,
                    side: op.side,
                    status: op.status
                }))
            };

            await pool.query(query, [JSON.stringify(analysisData)]);
            console.log('   📝 Dados atualizados: log de supervisão registrado');

        } catch (error) {
            console.log('❌ Erro na atualização de dados:', error.message);
        }
    }

    async sincronizarDadosIniciais() {
        try {
            console.log('🔄 SINCRONIZANDO DADOS INICIAIS...');

            // Carregar dados atuais
            await this.supervisionarOperacoes();
            await this.supervisionarComissoes();
            await this.supervisionarAfiliados();

            console.log('   ✅ Sincronização inicial completa');

        } catch (error) {
            console.log('❌ Erro na sincronização inicial:', error.message);
        }
    }

    async registrarOrdemPendente(microservice, ordem) {
        try {
            const query = `
                INSERT INTO pending_orders (
                    microservice,
                    order_data,
                    status,
                    created_at
                ) VALUES (
                    $1, $2, 'PENDING', NOW()
                )
            `;

            await pool.query(query, [microservice, JSON.stringify(ordem)]);
            console.log(`   📝 Ordem pendente registrada para ${microservice}`);

        } catch (error) {
            console.log('❌ Erro ao registrar ordem pendente:', error.message);
        }
    }

    async gerarRelatorioSupervisao() {
        const timestamp = new Date().toISOString();
        
        return {
            supervisor: 'IA_FINANCIAL',
            timestamp: timestamp,
            status: this.isActive ? 'ACTIVE' : 'INACTIVE',
            microservices: this.microservicesStatus,
            monitoring: {
                operationsActive: this.realtimeData.operationsActive.length,
                commissionsCalculated: this.realtimeData.commissionsCalculated.length,
                affiliatePayments: this.realtimeData.affiliatePayments.length,
                accountingEntries: this.realtimeData.accountingEntries.length
            },
            lastUpdate: this.realtimeData.lastUpdate,
            
            // Resumo das responsabilidades
            responsibilities: {
                executes: [
                    'Atualização de dados em tempo real',
                    'Manutenção de informações',
                    'Logs e registros de supervisão'
                ],
                doesNotExecute: [
                    'Trading direto',
                    'Pagamentos financeiros',
                    'Transferências bancárias',
                    'Alterações em saldos'
                ],
                supervises: [
                    'Robô Financeiro',
                    'Sistema de Comissões',
                    'Contabilização',
                    'Pagamentos de Afiliados'
                ]
            }
        };
    }

    async pararSupervisao() {
        console.log('\n🛑 PARANDO IA SUPERVISOR FINANCEIRO');
        
        this.isActive = false;
        
        // Parar todos os monitoramentos
        this.monitoringIntervals.forEach(interval => {
            clearInterval(interval);
        });
    }
        
    // ==========================================
    // MÉTODOS UTILITÁRIOS FINAIS
    // ==========================================

    async configurarEndpointsMicroservices() {
        this.microservicesEndpoints = {
            userManagement: 'http://localhost:3020/user-management',
            financialManagement: 'http://localhost:3021/financial-management',
            dashboard: 'http://localhost:3022/dashboard',
            supportService: 'http://localhost:3023/support',
            logControl: 'http://localhost:3024/log-control',
            dataCleanup: 'http://localhost:3025/data-cleanup',
            security: 'http://localhost:3026/security',
            robotFinanceiro: 'http://localhost:3027/robot-financeiro',
            gestaoAfiliados: 'http://localhost:3028/affiliate-management',
            contabilidade: 'http://localhost:3029/accounting',
            pagamentos: 'http://localhost:3030/payments'
        };

        console.log('   ⚙️ Endpoints de microserviços configurados');
    }

    async registrarOrdemPendente(microservice, ordem) {
        try {
            await pool.query(`
                INSERT INTO pending_orders (microservice, order_data, created_at, status)
                VALUES ($1, $2, NOW(), 'pending')
            `, [microservice, JSON.stringify(ordem)]);
            
            console.log(`   📝 Ordem pendente registrada para ${microservice}`);
        } catch (error) {
            console.log(`   ❌ Erro ao registrar ordem pendente: ${error.message}`);
        }
    }

    async reenviarOrdensPendentes() {
        try {
            const ordensQuery = `
                SELECT id, microservice, order_data 
                FROM pending_orders 
                WHERE status = 'pending' 
                  AND created_at > NOW() - INTERVAL '1 hour'
                ORDER BY created_at ASC
            `;
            
            const result = await pool.query(ordensQuery);
            
            if (result.rows.length > 0) {
                console.log(`   🔄 Reenviando ${result.rows.length} ordens pendentes...`);
                
                for (const ordem of result.rows) {
                    try {
                        await this.emitirOrdemGenerica(ordem.microservice, JSON.parse(ordem.order_data));
                        
                        await pool.query(`
                            UPDATE pending_orders 
                            SET status = 'sent', updated_at = NOW() 
                            WHERE id = $1
                        `, [ordem.id]);
                        
                    } catch (error) {
                        console.log(`   ❌ Falha no reenvio da ordem ${ordem.id}: ${error.message}`);
                    }
                }
            }
        } catch (error) {
            console.log(`   ❌ Erro no reenvio de ordens pendentes: ${error.message}`);
        }
    }

    async gerarRelatorioSupervisaoBackoffice() {
        const relatorio = {
            timestamp: new Date().toISOString(),
            supervisor: 'IA_BACKOFFICE_COMPLETO',
            summary: {
                ordensEmitidas: this.contadores?.ordensEmitidas || 0,
                microservicesOnline: Object.values(this.microservicesStatus || {}).filter(s => s.status === 'online').length,
                microservicesTotal: Object.keys(this.microservicesStatus || {}).length,
                ultimaVerificacao: this.ultimaVerificacao
            },
            activities: {
                financeiro: this.contadores?.supervisaoFinanceiro || 0,
                afiliados: this.contadores?.supervisaoAfiliados || 0,
                backoffice: this.contadores?.supervisaoBackoffice || 0,
                usuarios: this.contadores?.supervisaoUsuarios || 0,
                gestaoOperacoes: this.contadores?.gestaoOperacoes || 0,
                relatorios: this.contadores?.relatorios || 0,
                suporte: this.contadores?.suporte || 0,
                controleDocumentos: this.contadores?.controleDocumentos || 0,
                ciclosPagamento: this.contadores?.ciclosPagamento || 0,
                limpezaDados: this.contadores?.limpezaDados || 0
            }
        };

        try {
            await pool.query(`
                INSERT INTO supervisor_reports (report_type, report_data, created_at)
                VALUES ('BACKOFFICE_COMPLETE', $1, NOW())
            `, [JSON.stringify(relatorio)]);
            
            console.log('   📊 Relatório completo de supervisão backoffice gerado e salvo');
        } catch (error) {
            console.log(`   ❌ Erro ao gerar relatório backoffice: ${error.message}`);
        }

        return relatorio;
    }

    async pararMonitoramento() {
        console.log('\n🛑 PARANDO IA SUPERVISOR FINANCEIRO E BACKOFFICE...\n');
        
        // Parar todos os intervalos de monitoramento
        Object.values(this.intervalos || {}).forEach(interval => {
            if (interval) clearInterval(interval);
        });
        
        console.log('✅ Supervisão financeira e backoffice parada');
        console.log('📊 Relatório final gerado');
        
        return await this.gerarRelatorioSupervisaoBackoffice();
    }
}

// Função principal para inicializar o supervisor completo
async function iniciarSupervisorFinanceiroBackoffice() {
    console.log('🤖 INICIANDO SISTEMA SUPERVISOR FINANCEIRO E BACKOFFICE COMPLETO');
    console.log('='.repeat(80));
    console.log('📅 Data:', new Date().toISOString());
    console.log('🎯 Objetivo: Supervisão inteligente sem execução direta');
    console.log('🏢 Cobertura: Financeiro + Completo Backoffice');
    console.log('');

    const supervisor = new IASupervisorFinanceiroBackoffice();
    
    try {
        const result = await supervisor.inicializar();
        
        if (result.success) {
            console.log('\n🎉 IA SUPERVISOR FINANCEIRO E BACKOFFICE ATIVO!');
            console.log('='.repeat(80));
            console.log('👁️ Modo: Supervisão inteligente completa');
            console.log('📡 Status: Monitorando todos os microserviços');
            console.log('🔄 Atualizações: Tempo real');
            console.log('🏢 Cobertura: 100% do backoffice');
            console.log('');
            console.log('✅ SISTEMA PRONTO PARA SUPERVISÃO COMPLETA!');
            
            // Manter supervisor rodando
            process.on('SIGINT', async () => {
                console.log('\n\n🛑 Recebido sinal de parada...');
                const relatorio = await supervisor.pararMonitoramento();
                console.log('\n📊 RELATÓRIO FINAL COMPLETO:');
                console.log(JSON.stringify(relatorio, null, 2));
                process.exit(0);
            });
            
            // Relatório de status a cada 15 minutos
            setInterval(async () => {
                const relatorio = await supervisor.gerarRelatorioSupervisaoBackoffice();
                console.log('\n📊 RELATÓRIO DE SUPERVISÃO COMPLETA:');
                console.log('🤖 Status:', relatorio.status || 'ATIVO');
                console.log('� Atividades backoffice:', Object.values(relatorio.activities).reduce((a, b) => a + b, 0));
                console.log('🏢 Microserviços online:', relatorio.summary.microservicesOnline);
                console.log('� Ordens emitidas:', relatorio.summary.ordensEmitidas);
            }, 15 * 60 * 1000);
            
        } else {
            console.log('\n❌ FALHA NA INICIALIZAÇÃO:', result.error);
        }
        
    } catch (error) {
        console.error('\n❌ ERRO CRÍTICO:', error.message);
    }
}

// Exportar para uso como módulo
module.exports = IASupervisorFinanceiroBackoffice;

// Executar se chamado diretamente
if (require.main === module) {
    iniciarSupervisorFinanceiroBackoffice();
}
