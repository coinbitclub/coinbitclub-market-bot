/**
 * CENTRAL DE INDICADORES - DEMONSTRAÇÃO OFFLINE
 * =============================================
 * Dashboard personalizado por perfil com operações REAL vs BONUS
 * Versão de demonstração com dados simulados
 */

// Níveis de permissão do sistema
const ACCESS_LEVELS = {
    ADMIN: {
        level: 5,
        name: 'ADMIN',
        description: 'Acesso total ao sistema',
        permissions: ['view_all', 'financial_data', 'user_management', 'system_config', 'affiliate_data']
    },
    GESTOR: {
        level: 4,
        name: 'GESTOR',
        description: 'Gestão operacional',
        permissions: ['view_operations', 'financial_data', 'user_data', 'affiliate_data']
    },
    OPERADOR: {
        level: 3,
        name: 'OPERADOR',
        description: 'Operações e monitoramento',
        permissions: ['view_operations', 'basic_financial', 'user_data']
    },
    AFILIADO: {
        level: 2,
        name: 'AFILIADO',
        description: 'Dashboard de afiliado',
        permissions: ['view_own_data', 'affiliate_earnings', 'referral_data']
    },
    USUARIO: {
        level: 1,
        name: 'USUARIO',
        description: 'Acesso básico ao próprio desempenho',
        permissions: ['view_own_operations']
    }
};

// Dados simulados para demonstração
const MOCK_DATA = {
    operations: [
        { id: 1, user_id: 12, symbol: 'BTCUSDT', profit_loss: 15.50, status: 'closed', revenue_type: 'REAL', created_at: new Date('2025-01-22') },
        { id: 2, user_id: 12, symbol: 'ETHUSDT', profit_loss: -8.20, status: 'closed', revenue_type: 'REAL', created_at: new Date('2025-01-22') },
        { id: 3, user_id: 12, symbol: 'ADAUSDT', profit_loss: 22.80, status: 'closed', revenue_type: 'BONUS', created_at: new Date('2025-01-21') },
        { id: 4, user_id: 12, symbol: 'SOLUSDT', profit_loss: -12.45, status: 'closed', revenue_type: 'BONUS', created_at: new Date('2025-01-21') },
        { id: 5, user_id: 12, symbol: 'DOTUSDT', profit_loss: 0, status: 'open', revenue_type: 'REAL', created_at: new Date('2025-01-22') },
        { id: 6, user_id: 13, symbol: 'BNBUSDT', profit_loss: 18.90, status: 'closed', revenue_type: 'REAL', created_at: new Date('2025-01-22') },
        { id: 7, user_id: 13, symbol: 'XRPUSDT', profit_loss: -5.60, status: 'closed', revenue_type: 'BONUS', created_at: new Date('2025-01-21') },
        { id: 8, user_id: 14, symbol: 'LINKUSDT', profit_loss: 0, status: 'open', revenue_type: 'BONUS', created_at: new Date('2025-01-22') }
    ],
    users: [
        { id: 12, username: 'paloma_trader', account_type: 'VIP', status: 'active', country: 'BR' },
        { id: 13, username: 'luiza_maria', account_type: 'prepaid', status: 'active', country: 'BR' },
        { id: 14, username: 'mauro_santos', account_type: 'prepaid', status: 'active', country: 'BR' },
        { id: 15, username: 'erica_silva', account_type: 'VIP', status: 'active', country: 'BR' }
    ],
    affiliates: [
        { affiliate_id: 12, referral_count: 15, commission_rate: 5.0, vip_status: true, total_earnings: 245.80, created_at: new Date('2024-12-01') },
        { affiliate_id: 13, referral_count: 8, commission_rate: 1.5, vip_status: false, total_earnings: 89.30, created_at: new Date('2024-11-15') }
    ],
    expenses: [
        { category: 'APIS', amount_usd: 200.00, billing_cycle: 'monthly' },
        { category: 'SERVIDOR', amount_usd: 40.00, billing_cycle: 'monthly' },
        { category: 'DOMINIO', amount_usd: 50.00, billing_cycle: 'annual' },
        { category: 'STRIPE_TAXA', amount_usd: 0.00, billing_cycle: 'per-transaction' }
    ]
};

class CentralIndicadoresDemo {
    constructor() {
        this.data = MOCK_DATA;
    }

    // Verificar permissões do usuário
    checkPermission(userLevel, requiredPermission) {
        const levelConfig = ACCESS_LEVELS[userLevel];
        return levelConfig && levelConfig.permissions.includes(requiredPermission);
    }

    // Gerar dashboard personalizado baseado no perfil
    async generatePersonalizedDashboard(userId, accessLevel = 'USUARIO') {
        console.log(`📊 CENTRAL DE INDICADORES - DASHBOARD PERSONALIZADO`);
        console.log(`============================================================`);
        console.log(`👤 Usuário ID: ${userId}`);
        console.log(`🔒 Perfil de acesso: ${accessLevel}`);
        console.log(`📋 Descrição: ${ACCESS_LEVELS[accessLevel]?.description || 'Perfil não definido'}`);
        console.log(`📅 Data: ${new Date().toLocaleDateString('pt-BR')}, ${new Date().toLocaleTimeString('pt-BR')}`);

        // 1. OPERAÇÕES SEPARADAS POR TIPO DE RECEITA (sempre visível)
        await this.mostrarOperacoesPorTipo(userId, accessLevel);

        // 2. INDICADORES FINANCEIROS (conforme permissão)
        if (this.checkPermission(accessLevel, 'financial_data') || this.checkPermission(accessLevel, 'basic_financial')) {
            await this.mostrarIndicadoresFinanceiros(accessLevel);
        }

        // 3. DASHBOARD DE AFILIADOS (conforme permissão)
        if (this.checkPermission(accessLevel, 'affiliate_data') || this.checkPermission(accessLevel, 'affiliate_earnings')) {
            await this.mostrarDashboardAfiliados(userId, accessLevel);
        }

        // 4. INDICADORES DO SISTEMA (apenas admin e gestor)
        if (this.checkPermission(accessLevel, 'view_all') || this.checkPermission(accessLevel, 'view_operations')) {
            await this.mostrarIndicadoresSistema();
        }

        // 5. GESTÃO DE USUÁRIOS (apenas admin e gestor)
        if (this.checkPermission(accessLevel, 'user_management') || this.checkPermission(accessLevel, 'user_data')) {
            await this.mostrarGestaoUsuarios(accessLevel);
        }

        // 6. CONTROLE DE DESPESAS (apenas admin)
        if (this.checkPermission(accessLevel, 'view_all')) {
            await this.mostrarControleDespesas();
        }

        console.log(`🔒 CONTROLE DE ACESSO APLICADO COM SUCESSO`);
        console.log(`✅ Dashboard personalizado gerado conforme perfil`);
    }

    // 1. Operações separadas por tipo de receita
    async mostrarOperacoesPorTipo(userId, accessLevel) {
        console.log(`1️⃣ OPERAÇÕES SEPARADAS POR TIPO DE RECEITA`);
        console.log(`--------------------------------------------------`);

        // Filtrar operações baseado na permissão
        let operations = this.data.operations;
        if (!this.checkPermission(accessLevel, 'view_all') && !this.checkPermission(accessLevel, 'view_operations')) {
            operations = operations.filter(op => op.user_id === userId);
        }

        // Filtrar por período (últimos 7 dias)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        operations = operations.filter(op => new Date(op.created_at) >= sevenDaysAgo);

        // Agrupar por tipo de receita
        const realOperations = operations.filter(op => op.revenue_type === 'REAL');
        const bonusOperations = operations.filter(op => op.revenue_type === 'BONUS');

        console.log(`📊 OPERAÇÕES POR TIPO DE RECEITA (7 DIAS):`);

        // Estatísticas de receita REAL
        if (realOperations.length > 0) {
            const realStats = this.calcularEstatisticas(realOperations);
            console.log(`💳 RECEITA REAL:`);
            console.log(`   📈 Total operações: ${realStats.total}`);
            console.log(`   🔓 Abertas: ${realStats.abertas}`);
            console.log(`   🔒 Fechadas: ${realStats.fechadas}`);
            console.log(`   ✅ Lucrativas: ${realStats.lucrativas}`);
            console.log(`   ❌ Prejuízos: ${realStats.prejuizos}`);
            console.log(`   🎯 Taxa de sucesso: ${realStats.taxaSucesso}%`);
            console.log(`   💰 Lucro médio: $${realStats.lucroMedio}`);
            console.log(`   📉 Prejuízo médio: $${realStats.prejuizoMedio}`);
            console.log(`   📊 Resultado total: $${realStats.resultadoTotal}`);
            console.log(`   💎 Comissões geradas: $${realStats.comissoes}`);
        } else {
            console.log(`💳 RECEITA REAL: Nenhuma operação encontrada`);
        }

        // Estatísticas de receita BONUS
        if (bonusOperations.length > 0) {
            const bonusStats = this.calcularEstatisticas(bonusOperations);
            console.log(`🎁 RECEITA BONUS:`);
            console.log(`   📈 Total operações: ${bonusStats.total}`);
            console.log(`   🔓 Abertas: ${bonusStats.abertas}`);
            console.log(`   🔒 Fechadas: ${bonusStats.fechadas}`);
            console.log(`   ✅ Lucrativas: ${bonusStats.lucrativas}`);
            console.log(`   ❌ Prejuízos: ${bonusStats.prejuizos}`);
            console.log(`   🎯 Taxa de sucesso: ${bonusStats.taxaSucesso}%`);
            console.log(`   💰 Lucro médio: $${bonusStats.lucroMedio}`);
            console.log(`   📉 Prejuízo médio: $${bonusStats.prejuizoMedio}`);
            console.log(`   📊 Resultado total: $${bonusStats.resultadoTotal}`);
            console.log(`   💎 Comissões geradas: $${bonusStats.comissoes}`);
        } else {
            console.log(`🎁 RECEITA BONUS: Nenhuma operação encontrada`);
        }

        // Resumo geral
        const totalStats = this.calcularEstatisticas(operations);
        console.log(`📊 RESUMO GERAL:`);
        console.log(`   📈 Total geral operações: ${totalStats.total}`);
        console.log(`   💰 Resultado total: $${totalStats.resultadoTotal}`);
        console.log(`   💎 Comissões totais: $${totalStats.comissoes}`);
        
        // ⚠️ CONTROLE DE BONUS vs REAL
        console.log(`⚠️ CONTROLE OPERACIONAL:`);
        console.log(`   💳 ${realOperations.length} operações com RECEITA REAL (Stripe)`);
        console.log(`   🎁 ${bonusOperations.length} operações com CRÉDITO BONUS`);
        console.log(`   🔍 Separação automática por método de pagamento`);
    }

    // 2. Indicadores financeiros
    async mostrarIndicadoresFinanceiros(accessLevel) {
        console.log(`2️⃣ INDICADORES FINANCEIROS`);
        console.log(`--------------------------------------------------`);

        // Calcular receitas do mês
        const thisMonth = new Date();
        thisMonth.setDate(1);
        const operationsThisMonth = this.data.operations.filter(op => 
            new Date(op.created_at) >= thisMonth && op.status === 'closed'
        );

        const lucros = operationsThisMonth.filter(op => op.profit_loss > 0).reduce((sum, op) => sum + op.profit_loss, 0);
        const prejuizos = operationsThisMonth.filter(op => op.profit_loss < 0).reduce((sum, op) => sum + op.profit_loss, 0);
        const totalOperacoes = operationsThisMonth.length;
        const resultadoMedio = totalOperacoes > 0 ? (lucros + prejuizos) / totalOperacoes : 0;

        console.log(`💰 RECEITAS DO MÊS ATUAL:`);
        console.log(`   💚 Lucros: $${lucros.toFixed(2)}`);
        console.log(`   💔 Prejuízos: $${prejuizos.toFixed(2)}`);
        console.log(`   📊 Total operações: ${totalOperacoes}`);
        console.log(`   📈 Resultado médio: $${resultadoMedio.toFixed(2)}`);

        // Separação REAL vs BONUS
        const realRevenue = operationsThisMonth
            .filter(op => op.revenue_type === 'REAL')
            .reduce((sum, op) => sum + op.profit_loss, 0);
        const bonusRevenue = operationsThisMonth
            .filter(op => op.revenue_type === 'BONUS')
            .reduce((sum, op) => sum + op.profit_loss, 0);

        console.log(`🔍 SEPARAÇÃO POR TIPO DE RECEITA:`);
        console.log(`   💳 Receita REAL (Stripe): $${realRevenue.toFixed(2)}`);
        console.log(`   🎁 Receita BONUS (Créditos): $${bonusRevenue.toFixed(2)}`);

        // Comissionamentos se tiver permissão total
        if (this.checkPermission(accessLevel, 'financial_data')) {
            const totalAfiliados = this.data.affiliates.length;
            const totalIndicacoes = this.data.affiliates.reduce((sum, a) => sum + a.referral_count, 0);
            const totalComissoes = this.data.affiliates.reduce((sum, a) => sum + a.total_earnings, 0);

            console.log(`💎 SISTEMA DE AFILIADOS:`);
            console.log(`   👥 Total afiliados: ${totalAfiliados}`);
            console.log(`   📈 Total indicações: ${totalIndicacoes}`);
            console.log(`   💰 Comissões pagas: $${totalComissoes.toFixed(2)}`);
            console.log(`   ⭐ Taxa VIP: 5.0% | Taxa Normal: 1.5%`);
        }
    }

    // 3. Dashboard de afiliados
    async mostrarDashboardAfiliados(userId, accessLevel) {
        console.log(`3️⃣ DASHBOARD DE AFILIADOS`);
        console.log(`--------------------------------------------------`);

        // Se for afiliado, mostrar apenas seus dados
        if (accessLevel === 'AFILIADO') {
            const affiliate = this.data.affiliates.find(a => a.affiliate_id === userId);
            
            if (affiliate) {
                console.log(`👤 SEUS DADOS COMO AFILIADO:`);
                console.log(`   🆔 ID Afiliado: ${affiliate.affiliate_id}`);
                console.log(`   👥 Indicações: ${affiliate.referral_count}`);
                console.log(`   💰 Taxa comissão: ${affiliate.commission_rate}%`);
                console.log(`   ⭐ Status VIP: ${affiliate.vip_status ? 'Sim' : 'Não'}`);
                console.log(`   💎 Total ganhos: $${affiliate.total_earnings.toFixed(2)}`);
                console.log(`   📅 Membro desde: ${new Date(affiliate.created_at).toLocaleDateString('pt-BR')}`);
                
                // Comissões do mês
                const monthlyCommission = affiliate.total_earnings * 0.1; // Simular 10% no mês
                console.log(`📊 PERFORMANCE MENSAL:`);
                console.log(`   💰 Comissões do mês: $${monthlyCommission.toFixed(2)}`);
                console.log(`   📈 Média por indicação: $${(affiliate.total_earnings / affiliate.referral_count).toFixed(2)}`);
            } else {
                console.log(`❌ Você não está cadastrado como afiliado`);
                console.log(`💡 Entre em contato para se tornar um afiliado!`);
            }
        } else {
            // Para admin/gestor mostrar resumo geral
            const vipCount = this.data.affiliates.filter(a => a.vip_status).length;
            const totalReferrals = this.data.affiliates.reduce((sum, a) => sum + a.referral_count, 0);
            const totalEarnings = this.data.affiliates.reduce((sum, a) => sum + a.total_earnings, 0);

            console.log(`📊 RESUMO DOS AFILIADOS:`);
            console.log(`   👥 Total afiliados: ${this.data.affiliates.length}`);
            console.log(`   ⭐ Afiliados VIP: ${vipCount}`);
            console.log(`   📈 Total indicações: ${totalReferrals}`);
            console.log(`   💰 Total comissões pagas: $${totalEarnings.toFixed(2)}`);
            console.log(`   💎 Comissão padrão: 1.5%`);
            console.log(`   ⭐ Comissão VIP: 5.0%`);

            // Top afiliados
            const topAffiliates = this.data.affiliates
                .sort((a, b) => b.total_earnings - a.total_earnings)
                .slice(0, 3);

            console.log(`🏆 TOP AFILIADOS:`);
            topAffiliates.forEach((affiliate, index) => {
                console.log(`   ${index + 1}º Afiliado ${affiliate.affiliate_id}: $${affiliate.total_earnings.toFixed(2)} (${affiliate.referral_count} indicações)`);
            });
        }
    }

    // 4. Indicadores do sistema
    async mostrarIndicadoresSistema() {
        console.log(`4️⃣ INDICADORES DO SISTEMA`);
        console.log(`--------------------------------------------------`);

        // Performance do sistema
        const totalUsuarios = this.data.users.length;
        const usuariosAtivos = this.data.users.filter(u => u.status === 'active').length;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const operacoes24h = this.data.operations.filter(op => new Date(op.created_at) >= today).length;
        const operacoesAbertas = this.data.operations.filter(op => op.status === 'open').length;

        console.log(`⚡ PERFORMANCE DO SISTEMA:`);
        console.log(`   👥 Total usuários: ${totalUsuarios}`);
        console.log(`   ✅ Usuários ativos: ${usuariosAtivos}`);
        console.log(`   📊 Operações 24h: ${operacoes24h}`);
        console.log(`   🔓 Operações abertas: ${operacoesAbertas}`);

        // Status dos serviços
        console.log(`🔧 STATUS DOS SERVIÇOS:`);
        console.log(`   ✅ sistema-webhook-automatico.js: Operacional`);
        console.log(`   ✅ gestor-comissionamento-final.js: Operacional`);
        console.log(`   ✅ central-indicadores-corrigida.js: Operacional`);
        console.log(`   ✅ monitor-inteligente-operacoes.js: Operacional`);

        // Configurações críticas
        console.log(`⚙️ CONFIGURAÇÕES CRÍTICAS:`);
        console.log(`   🎯 TP/SL: 2.5x/1.5x leverage (otimizado para 20% sucesso)`);
        console.log(`   ⏰ Timeout sinais: 2 minutos`);
        console.log(`   💰 Comissionamento: Automático (1.5%/5.0%)`);
        console.log(`   🔒 Controle acesso: 5 níveis (Admin→Usuario)`);
        console.log(`   💳 Separação REAL/BONUS: Ativa`);

        // Saúde financeira
        const totalProfit = this.data.operations
            .filter(op => op.status === 'closed')
            .reduce((sum, op) => sum + op.profit_loss, 0);
        
        console.log(`💹 SAÚDE FINANCEIRA:`);
        console.log(`   📊 Resultado total: $${totalProfit.toFixed(2)}`);
        console.log(`   🎯 Taxa sucesso geral: ${this.calcularTaxaSucessoGeral()}%`);
        console.log(`   💰 ROI médio: ${this.calcularROIMedio()}%`);
    }

    // 5. Gestão de usuários
    async mostrarGestaoUsuarios(accessLevel) {
        console.log(`5️⃣ GESTÃO DE USUÁRIOS`);
        console.log(`--------------------------------------------------`);

        // Distribuição por tipo de conta
        const contasPorTipo = this.data.users.reduce((acc, user) => {
            const key = `${user.account_type} - ${user.country}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        console.log(`👥 DISTRIBUIÇÃO DE USUÁRIOS:`);
        Object.entries(contasPorTipo).forEach(([type, count]) => {
            const ativos = this.data.users.filter(u => 
                `${u.account_type} - ${u.country}` === type && u.status === 'active'
            ).length;
            console.log(`   ${type}: ${count} total, ${ativos} ativos`);
        });

        // Atividade dos usuários
        if (this.checkPermission(accessLevel, 'user_management')) {
            const userActivity = this.data.users.map(user => {
                const operacoes = this.data.operations.filter(op => op.user_id === user.id).length;
                const isAffiliate = this.data.affiliates.some(a => a.affiliate_id === user.id);
                return { ...user, operacoes, isAffiliate };
            });

            console.log(`📊 ATIVIDADE DOS USUÁRIOS:`);
            userActivity.forEach(user => {
                console.log(`   ${user.username} (${user.account_type}): ${user.operacoes} ops${user.isAffiliate ? ' 🔗 Afiliado' : ''}`);
            });
        }

        // Controle de acesso
        console.log(`🔒 CONTROLE DE ACESSO ATIVO:`);
        console.log(`   🔴 ADMIN: Acesso total (financial_data, user_management)`);
        console.log(`   🟠 GESTOR: Operações + Financeiro (view_operations, financial_data)`);
        console.log(`   🟡 OPERADOR: Operações básicas (view_operations, basic_financial)`);
        console.log(`   🟢 AFILIADO: Próprios dados + Comissões (affiliate_earnings)`);
        console.log(`   🔵 USUARIO: Apenas próprias operações (view_own_operations)`);
    }

    // 6. Controle de despesas
    async mostrarControleDespesas() {
        console.log(`6️⃣ CONTROLE DE DESPESAS`);
        console.log(`--------------------------------------------------`);

        let totalMensal = 0;
        
        console.log(`💼 DESPESAS POR CATEGORIA (MÊS ATUAL):`);
        this.data.expenses.forEach(expense => {
            console.log(`   ${expense.category}: USD ${expense.amount_usd.toFixed(2)} (${expense.billing_cycle})`);
            
            if (expense.billing_cycle === 'monthly' || expense.billing_cycle === 'per-transaction') {
                totalMensal += expense.amount_usd;
            } else if (expense.billing_cycle === 'annual') {
                totalMensal += expense.amount_usd / 12;
            }
        });

        console.log(`📊 TOTAL MENSAL: ~$${totalMensal.toFixed(2)} USD`);
        console.log(`📈 Projeção anual: ~$${(totalMensal * 12).toFixed(2)} USD`);

        // Análise de eficiência
        const totalRevenue = this.data.operations
            .filter(op => op.status === 'closed' && op.profit_loss > 0)
            .reduce((sum, op) => sum + op.profit_loss, 0);

        console.log(`⚖️ ANÁLISE DE EFICIÊNCIA:`);
        console.log(`   💰 Receita bruta mensal: $${(totalRevenue * 0.3).toFixed(2)} (estimativa)`);
        console.log(`   💸 Gastos operacionais: $${totalMensal.toFixed(2)}`);
        console.log(`   📊 Margem operacional: ${(((totalRevenue * 0.3) - totalMensal) / (totalRevenue * 0.3) * 100).toFixed(1)}%`);
    }

    // Função auxiliar para calcular estatísticas
    calcularEstatisticas(operations) {
        const total = operations.length;
        const abertas = operations.filter(op => op.status === 'open').length;
        const fechadas = operations.filter(op => op.status === 'closed').length;
        const lucrativas = operations.filter(op => op.profit_loss > 0).length;
        const prejuizos = operations.filter(op => op.profit_loss < 0).length;
        const taxaSucesso = fechadas > 0 ? ((lucrativas / fechadas) * 100).toFixed(1) : '0.0';
        
        const lucros = operations.filter(op => op.profit_loss > 0);
        const perdas = operations.filter(op => op.profit_loss < 0);
        
        const lucroMedio = lucros.length > 0 ? 
            (lucros.reduce((sum, op) => sum + op.profit_loss, 0) / lucros.length).toFixed(2) : '0.00';
        
        const prejuizoMedio = perdas.length > 0 ? 
            (perdas.reduce((sum, op) => sum + op.profit_loss, 0) / perdas.length).toFixed(2) : '0.00';
        
        const resultadoTotal = operations.reduce((sum, op) => sum + op.profit_loss, 0).toFixed(2);
        
        // Calcular comissões baseado no tipo de receita
        const realOperations = operations.filter(op => op.revenue_type === 'REAL' && op.profit_loss > 0);
        const comissoes = (realOperations.reduce((sum, op) => sum + op.profit_loss, 0) * 0.015).toFixed(2);

        return {
            total,
            abertas,
            fechadas,
            lucrativas,
            prejuizos,
            taxaSucesso,
            lucroMedio,
            prejuizoMedio,
            resultadoTotal,
            comissoes
        };
    }

    // Auxiliares para indicadores do sistema
    calcularTaxaSucessoGeral() {
        const operacoesFechadas = this.data.operations.filter(op => op.status === 'closed');
        const lucrativas = operacoesFechadas.filter(op => op.profit_loss > 0).length;
        return operacoesFechadas.length > 0 ? 
            ((lucrativas / operacoesFechadas.length) * 100).toFixed(1) : '0.0';
    }

    calcularROIMedio() {
        const operacoesFechadas = this.data.operations.filter(op => op.status === 'closed');
        const resultadoMedio = operacoesFechadas.length > 0 ?
            operacoesFechadas.reduce((sum, op) => sum + op.profit_loss, 0) / operacoesFechadas.length : 0;
        return (resultadoMedio * 2).toFixed(1); // Simular ROI baseado no resultado
    }
}

// Demonstração do sistema
async function demonstrarSistema() {
    const dashboard = new CentralIndicadoresDemo();
    
    console.log('🚀 DEMONSTRAÇÃO DA CENTRAL DE INDICADORES COM CONTROLE DE ACESSO');
    console.log('=' .repeat(80));
    
    // Demonstrar diferentes perfis
    console.log('🔹 EXEMPLO: Dashboard para ADMIN');
    await dashboard.generatePersonalizedDashboard(12, 'ADMIN');
    
    console.log('\n' + '='.repeat(80));
    console.log('🔹 EXEMPLO: Dashboard para GESTOR');
    await dashboard.generatePersonalizedDashboard(12, 'GESTOR');
    
    console.log('\n' + '='.repeat(80));
    console.log('🔹 EXEMPLO: Dashboard para AFILIADO');
    await dashboard.generatePersonalizedDashboard(12, 'AFILIADO');
    
    console.log('\n' + '='.repeat(80));
    console.log('🔹 EXEMPLO: Dashboard para USUÁRIO');
    await dashboard.generatePersonalizedDashboard(12, 'USUARIO');

    console.log('\n' + '='.repeat(80));
    console.log('✅ DEMONSTRAÇÃO CONCLUÍDA');
    console.log('🎯 RECURSOS IMPLEMENTADOS:');
    console.log('   🔒 5 níveis de acesso com controle granular');
    console.log('   💳 Separação REAL vs BONUS em todas as operações');
    console.log('   📊 Dashboard personalizado por perfil de usuário');
    console.log('   💰 Sistema de comissionamento (1.5% normal / 5% VIP)');
    console.log('   📈 Indicadores financeiros com controle de visibilidade');
    console.log('   👥 Gestão de usuários baseada em permissões');
    console.log('   💸 Controle de despesas operacionais');
    console.log('   📱 Interface responsiva com emojis para melhor UX');
}

// Executar demonstração
demonstrarSistema();
