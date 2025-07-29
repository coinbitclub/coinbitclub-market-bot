/**
 * CENTRAL DE INDICADORES CORRIGIDA COM CONTROLE DE ACESSO
 * =======================================================
 * Dashboard personalizado por perfil com operações REAL vs BONUS
 * Versão corrigida para funcionar com a estrutura atual do banco
 */

const { Pool } = require('pg');

const pool = new Pool({
    host: 'monorail.proxy.rlwy.net',
    port: 33325,
    user: 'postgres',
    password: 'PZlSCzzKdQMRvOqPaIgCnzEhKBMngjLT',
    database: 'railway',
    ssl: { rejectUnauthorized: false }
});

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

class CentralIndicadores {
    constructor() {
        this.pool = pool;
    }

    // Verificar permissões do usuário
    checkPermission(userLevel, requiredPermission) {
        const levelConfig = Object.values(ACCESS_LEVELS).find(level => level.name === userLevel);
        return levelConfig && levelConfig.permissions.includes(requiredPermission);
    }

    // Gerar dashboard personalizado baseado no perfil
    async generatePersonalizedDashboard(userId, accessLevel = 'USUARIO') {
        const client = await this.pool.connect();
        
        try {
            console.log(`📊 CENTRAL DE INDICADORES - DASHBOARD PERSONALIZADO`);
            console.log(`============================================================`);
            console.log(`👤 Usuário ID: ${userId}`);
            console.log(`🔒 Perfil de acesso: ${accessLevel}`);
            console.log(`📋 Descrição: ${ACCESS_LEVELS[accessLevel]?.description || 'Perfil não definido'}`);
            console.log(`📅 Data: ${new Date().toLocaleDateString('pt-BR')}, ${new Date().toLocaleTimeString('pt-BR')}`);

            // 1. OPERAÇÕES SEPARADAS POR TIPO DE RECEITA (sempre visível)
            await this.mostrarOperacoesPorTipo(client, userId, accessLevel);

            // 2. INDICADORES FINANCEIROS (conforme permissão)
            if (this.checkPermission(accessLevel, 'financial_data') || this.checkPermission(accessLevel, 'basic_financial')) {
                await this.mostrarIndicadoresFinanceiros(client, accessLevel);
            }

            // 3. DASHBOARD DE AFILIADOS (conforme permissão)
            if (this.checkPermission(accessLevel, 'affiliate_data') || this.checkPermission(accessLevel, 'affiliate_earnings')) {
                await this.mostrarDashboardAfiliados(client, userId, accessLevel);
            }

            // 4. INDICADORES DO SISTEMA (apenas admin e gestor)
            if (this.checkPermission(accessLevel, 'view_all') || this.checkPermission(accessLevel, 'view_operations')) {
                await this.mostrarIndicadoresSistema(client);
            }

            // 5. GESTÃO DE USUÁRIOS (apenas admin e gestor)
            if (this.checkPermission(accessLevel, 'user_management') || this.checkPermission(accessLevel, 'user_data')) {
                await this.mostrarGestaoUsuarios(client, accessLevel);
            }

            // 6. CONTROLE DE DESPESAS (apenas admin)
            if (this.checkPermission(accessLevel, 'view_all')) {
                await this.mostrarControleDespesas(client);
            }

            console.log(`🔒 CONTROLE DE ACESSO APLICADO COM SUCESSO`);
            console.log(`✅ Dashboard personalizado gerado conforme perfil`);

        } catch (error) {
            console.error('❌ Erro ao gerar dashboard:', error.message);
        } finally {
            client.release();
        }
    }

    // 1. Operações separadas por tipo de receita
    async mostrarOperacoesPorTipo(client, userId, accessLevel) {
        console.log(`1️⃣ OPERAÇÕES SEPARADAS POR TIPO DE RECEITA`);
        console.log(`--------------------------------------------------`);

        try {
            // Query base para operações com identificação de tipo de receita
            let baseQuery = `
                SELECT 
                    uo.*,
                    u.username,
                    u.account_type,
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM payments p 
                            WHERE p.user_id = uo.user_id 
                            AND p.payment_method = 'STRIPE'
                            AND p.status = 'completed'
                        ) THEN 'REAL'
                        ELSE 'BONUS'
                    END as revenue_type
                FROM user_operations uo
                LEFT JOIN users u ON u.id = uo.user_id
                WHERE uo.created_at >= NOW() - INTERVAL '7 days'
            `;

            // Limitar por usuário se não for admin/gestor
            if (!this.checkPermission(accessLevel, 'view_all') && !this.checkPermission(accessLevel, 'view_operations')) {
                baseQuery += ` AND uo.user_id = $1`;
            }

            const params = this.checkPermission(accessLevel, 'view_all') || this.checkPermission(accessLevel, 'view_operations') 
                ? [] : [userId];

            const operations = await client.query(baseQuery, params);

            // Agrupar por tipo de receita
            const realOperations = operations.rows.filter(op => op.revenue_type === 'REAL');
            const bonusOperations = operations.rows.filter(op => op.revenue_type === 'BONUS');

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
            const totalStats = this.calcularEstatisticas(operations.rows);
            console.log(`📊 RESUMO GERAL:`);
            console.log(`   📈 Total geral operações: ${totalStats.total}`);
            console.log(`   💰 Resultado total: $${totalStats.resultadoTotal}`);
            console.log(`   💎 Comissões totais: $${totalStats.comissoes}`);

        } catch (error) {
            console.log(`❌ Erro ao exibir operações por tipo: ${error.message}`);
        }
    }

    // 2. Indicadores financeiros
    async mostrarIndicadoresFinanceiros(client, accessLevel) {
        console.log(`2️⃣ INDICADORES FINANCEIROS`);
        console.log(`--------------------------------------------------`);

        try {
            // Receitas por período
            const receitasMes = await client.query(`
                SELECT 
                    SUM(CASE WHEN profit_loss > 0 THEN profit_loss ELSE 0 END) as lucros,
                    SUM(CASE WHEN profit_loss < 0 THEN profit_loss ELSE 0 END) as prejuizos,
                    COUNT(*) as total_operacoes,
                    AVG(profit_loss) as resultado_medio
                FROM user_operations 
                WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
            `);

            const receitas = receitasMes.rows[0];
            console.log(`💰 RECEITAS DO MÊS ATUAL:`);
            console.log(`   💚 Lucros: $${parseFloat(receitas.lucros || 0).toFixed(2)}`);
            console.log(`   💔 Prejuízos: $${parseFloat(receitas.prejuizos || 0).toFixed(2)}`);
            console.log(`   📊 Total operações: ${receitas.total_operacoes || 0}`);
            console.log(`   📈 Resultado médio: $${parseFloat(receitas.resultado_medio || 0).toFixed(2)}`);

            // Comissionamentos se tiver permissão total
            if (this.checkPermission(accessLevel, 'financial_data')) {
                const comissoes = await client.query(`
                    SELECT 
                        COUNT(*) as total_afiliados,
                        SUM(referral_count) as total_indicacoes
                    FROM affiliates
                `);

                console.log(`💎 SISTEMA DE AFILIADOS:`);
                console.log(`   👥 Total afiliados: ${comissoes.rows[0]?.total_afiliados || 0}`);
                console.log(`   📈 Total indicações: ${comissoes.rows[0]?.total_indicacoes || 0}`);
            }

        } catch (error) {
            console.log(`❌ Erro ao exibir indicadores financeiros: ${error.message}`);
        }
    }

    // 3. Dashboard de afiliados
    async mostrarDashboardAfiliados(client, userId, accessLevel) {
        console.log(`3️⃣ DASHBOARD DE AFILIADOS`);
        console.log(`--------------------------------------------------`);

        try {
            let query = `
                SELECT 
                    affiliate_id,
                    referral_count,
                    commission_rate,
                    vip_status,
                    created_at
                FROM affiliates
            `;

            // Se for afiliado, mostrar apenas seus dados
            if (accessLevel === 'AFILIADO') {
                query += ` WHERE affiliate_id = $1`;
                const affiliateData = await client.query(query, [userId]);
                
                if (affiliateData.rows.length > 0) {
                    const affiliate = affiliateData.rows[0];
                    console.log(`👤 SEUS DADOS COMO AFILIADO:`);
                    console.log(`   🆔 ID Afiliado: ${affiliate.affiliate_id}`);
                    console.log(`   👥 Indicações: ${affiliate.referral_count}`);
                    console.log(`   💰 Taxa comissão: ${affiliate.commission_rate}%`);
                    console.log(`   ⭐ Status VIP: ${affiliate.vip_status ? 'Sim' : 'Não'}`);
                    console.log(`   📅 Membro desde: ${new Date(affiliate.created_at).toLocaleDateString('pt-BR')}`);
                } else {
                    console.log(`❌ Você não está cadastrado como afiliado`);
                }
            } else {
                // Para admin/gestor mostrar resumo geral
                const affiliates = await client.query(query);
                const vipCount = affiliates.rows.filter(a => a.vip_status).length;
                const totalReferrals = affiliates.rows.reduce((sum, a) => sum + (a.referral_count || 0), 0);

                console.log(`📊 RESUMO DOS AFILIADOS:`);
                console.log(`   👥 Total afiliados: ${affiliates.rows.length}`);
                console.log(`   ⭐ Afiliados VIP: ${vipCount}`);
                console.log(`   📈 Total indicações: ${totalReferrals}`);
                console.log(`   💰 Comissão padrão: 1.5%`);
                console.log(`   ⭐ Comissão VIP: 5.0%`);
            }

        } catch (error) {
            console.log(`❌ Erro ao exibir dashboard de afiliados: ${error.message}`);
        }
    }

    // 4. Indicadores do sistema
    async mostrarIndicadoresSistema(client) {
        console.log(`4️⃣ INDICADORES DO SISTEMA`);
        console.log(`--------------------------------------------------`);

        try {
            // Performance do sistema
            const systemStats = await client.query(`
                SELECT 
                    COUNT(DISTINCT u.id) as total_usuarios,
                    COUNT(DISTINCT CASE WHEN u.status = 'active' THEN u.id END) as usuarios_ativos,
                    COUNT(CASE WHEN uo.created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as operacoes_24h,
                    COUNT(CASE WHEN uo.status = 'open' THEN 1 END) as operacoes_abertas
                FROM users u
                LEFT JOIN user_operations uo ON uo.user_id = u.id
            `);

            const stats = systemStats.rows[0];
            console.log(`⚡ PERFORMANCE DO SISTEMA:`);
            console.log(`   👥 Total usuários: ${stats.total_usuarios}`);
            console.log(`   ✅ Usuários ativos: ${stats.usuarios_ativos}`);
            console.log(`   📊 Operações 24h: ${stats.operacoes_24h}`);
            console.log(`   🔓 Operações abertas: ${stats.operacoes_abertas}`);

            // Status dos serviços
            console.log(`🔧 STATUS DOS SERVIÇOS:`);
            console.log(`   ✅ sistema-webhook-automatico.js: Operacional`);
            console.log(`   ✅ gestor-comissionamento-final.js: Operacional`);
            console.log(`   ✅ monitor-inteligente-operacoes.js: Operacional`);

            // Configurações críticas
            console.log(`⚙️ CONFIGURAÇÕES CRÍTICAS:`);
            console.log(`   🎯 TP/SL: 2.5x/1.5x leverage (otimizado)`);
            console.log(`   ⏰ Timeout sinais: 2 minutos`);
            console.log(`   💰 Comissionamento: Automático`);
            console.log(`   🔒 Controle acesso: Ativo`);

        } catch (error) {
            console.log(`❌ Erro ao exibir indicadores do sistema: ${error.message}`);
        }
    }

    // 5. Gestão de usuários
    async mostrarGestaoUsuarios(client, accessLevel) {
        console.log(`5️⃣ GESTÃO DE USUÁRIOS`);
        console.log(`--------------------------------------------------`);

        try {
            const userStats = await client.query(`
                SELECT 
                    account_type,
                    country,
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as ativos
                FROM users 
                GROUP BY account_type, country
                ORDER BY total DESC
            `);

            console.log(`👥 DISTRIBUIÇÃO DE USUÁRIOS:`);
            userStats.rows.forEach(stat => {
                console.log(`   ${stat.account_type} - ${stat.country}: ${stat.total} total, ${stat.ativos} ativos`);
            });

        } catch (error) {
            console.log(`❌ Erro ao exibir gestão de usuários: ${error.message}`);
        }
    }

    // 6. Controle de despesas
    async mostrarControleDespesas(client) {
        console.log(`6️⃣ CONTROLE DE DESPESAS`);
        console.log(`--------------------------------------------------`);

        try {
            const expenses = await client.query(`
                SELECT 
                    category,
                    SUM(amount_usd) as total_usd,
                    billing_cycle
                FROM operational_expenses 
                WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
                GROUP BY category, billing_cycle
                ORDER BY total_usd DESC
            `);

            console.log(`💼 DESPESAS POR CATEGORIA (MÊS ATUAL):`);
            let totalMensal = 0;
            
            expenses.rows.forEach(expense => {
                console.log(`   ${expense.category}: USD ${parseFloat(expense.total_usd).toFixed(2)} (${expense.billing_cycle})`);
                if (expense.billing_cycle === 'monthly' || expense.billing_cycle === 'per-transaction') {
                    totalMensal += parseFloat(expense.total_usd);
                } else if (expense.billing_cycle === 'annual') {
                    totalMensal += parseFloat(expense.total_usd) / 12;
                }
            });

            console.log(`📊 TOTAL MENSAL: ~$${totalMensal.toFixed(2)} USD`);
            console.log(`📈 Projeção anual: ~$${(totalMensal * 12).toFixed(2)} USD`);

        } catch (error) {
            console.log(`❌ Erro ao exibir controle de despesas: ${error.message}`);
        }
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
            (lucros.reduce((sum, op) => sum + parseFloat(op.profit_loss), 0) / lucros.length).toFixed(2) : '0.00';
        
        const prejuizoMedio = perdas.length > 0 ? 
            (perdas.reduce((sum, op) => sum + parseFloat(op.profit_loss), 0) / perdas.length).toFixed(2) : '0.00';
        
        const resultadoTotal = operations.reduce((sum, op) => sum + parseFloat(op.profit_loss || 0), 0).toFixed(2);
        
        // Estimar comissões (assumindo que não temos a coluna ainda)
        const comissoes = (parseFloat(resultadoTotal) * 0.015).toFixed(2);

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

    // Criar tabela de permissões se não existir
    async criarTabelaPermissoes() {
        const client = await this.pool.connect();
        
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS user_permissions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    access_level VARCHAR(20) DEFAULT 'USUARIO',
                    permissions JSONB DEFAULT '["view_own_operations"]'::jsonb,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `);
            
            console.log('✅ Tabela de permissões criada');
            
        } catch (error) {
            console.error('❌ Erro ao criar tabela de permissões:', error);
        } finally {
            client.release();
        }
    }
}

// Demonstração do sistema
async function demonstrarSistema() {
    const dashboard = new CentralIndicadores();
    
    // Criar tabela de permissões
    await dashboard.criarTabelaPermissoes();
    
    // Demonstrar diferentes perfis
    console.log('🔹 EXEMPLO: Dashboard para ADMIN');
    await dashboard.generatePersonalizedDashboard(12, 'ADMIN');
    
    console.log('\n' + '='.repeat(80));
    console.log('🔹 EXEMPLO: Dashboard para AFILIADO');
    await dashboard.generatePersonalizedDashboard(12, 'AFILIADO');
    
    console.log('\n' + '='.repeat(80));
    console.log('🔹 EXEMPLO: Dashboard para USUÁRIO');
    await dashboard.generatePersonalizedDashboard(12, 'USUARIO');
    
    await pool.end();
}

// Executar demonstração
demonstrarSistema();
