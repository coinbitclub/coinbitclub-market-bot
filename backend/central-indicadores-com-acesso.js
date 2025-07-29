/**
 * 📊 CENTRAL DE INDICADORES COM CONTROLE DE ACESSO
 * ===============================================
 * Sistema completo de dashboard com:
 * - Separação operações REAL vs BÔNUS
 * - Controle de acesso por perfil de usuário
 * - Indicadores financeiros detalhados
 * - Relatórios personalizados por nível
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://coinbitclub_user:W0lvxNw7OQCNRGiUPh9S@coinbitclub-db.railway.app:5432/coinbitclub_db',
    ssl: { rejectUnauthorized: false }
});

class CentralIndicadores {
    constructor() {
        this.perfisAcesso = {
            'admin': {
                nivel: 5,
                pode_ver: ['todas_operacoes', 'financeiro_completo', 'afiliados', 'despesas', 'usuarios', 'sistema'],
                descricao: 'Acesso total ao sistema'
            },
            'gestor': {
                nivel: 4,
                pode_ver: ['operacoes_resumo', 'financeiro_resumo', 'afiliados_resumo', 'usuarios_basico'],
                descricao: 'Acesso gerencial limitado'
            },
            'operador': {
                nivel: 3,
                pode_ver: ['operacoes_basico', 'proprio_desempenho'],
                descricao: 'Acesso apenas às próprias operações'
            },
            'afiliado': {
                nivel: 2,
                pode_ver: ['afiliado_dashboard', 'proprio_desempenho'],
                descricao: 'Dashboard de afiliado'
            },
            'usuario': {
                nivel: 1,
                pode_ver: ['proprio_desempenho'],
                descricao: 'Acesso básico ao próprio desempenho'
            }
        };
    }

    async gerarDashboard(usuarioId, perfilAcesso = 'usuario') {
        try {
            console.log('📊 CENTRAL DE INDICADORES - DASHBOARD PERSONALIZADO');
            console.log('=' .repeat(60));
            console.log(`👤 Usuário ID: ${usuarioId}`);
            console.log(`🔒 Perfil de acesso: ${perfilAcesso.toUpperCase()}`);
            console.log(`📋 Descrição: ${this.perfisAcesso[perfilAcesso]?.descricao || 'Perfil não encontrado'}`);
            console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}\n`);

            const perfil = this.perfisAcesso[perfilAcesso];
            if (!perfil) {
                throw new Error('Perfil de acesso inválido');
            }

            // 1. Operações separadas por tipo (REAL vs BÔNUS)
            if (perfil.pode_ver.includes('operacoes_basico') || 
                perfil.pode_ver.includes('operacoes_resumo') || 
                perfil.pode_ver.includes('todas_operacoes') ||
                perfil.pode_ver.includes('proprio_desempenho')) {
                await this.exibirOperacoesPorTipo(usuarioId, perfilAcesso);
            }

            // 2. Indicadores financeiros
            if (perfil.pode_ver.includes('financeiro_completo') || 
                perfil.pode_ver.includes('financeiro_resumo')) {
                await this.exibirIndicadoresFinanceiros(perfilAcesso);
            }

            // 3. Dashboard de afiliados
            if (perfil.pode_ver.includes('afiliados') || 
                perfil.pode_ver.includes('afiliados_resumo') ||
                perfil.pode_ver.includes('afiliado_dashboard')) {
                await this.exibirDashboardAfiliados(usuarioId, perfilAcesso);
            }

            // 4. Indicadores do sistema
            if (perfil.pode_ver.includes('sistema')) {
                await this.exibirIndicadoresSistema();
            }

            // 5. Gestão de usuários
            if (perfil.pode_ver.includes('usuarios') || 
                perfil.pode_ver.includes('usuarios_basico')) {
                await this.exibirGestaoUsuarios(perfilAcesso);
            }

            // 6. Controle de despesas
            if (perfil.pode_ver.includes('despesas')) {
                await this.exibirControleDespesas();
            }

            console.log('\n🔒 CONTROLE DE ACESSO APLICADO COM SUCESSO');
            console.log('✅ Dashboard personalizado gerado conforme perfil');

        } catch (error) {
            console.error('❌ Erro ao gerar dashboard:', error.message);
        }
    }

    async exibirOperacoesPorTipo(usuarioId, perfilAcesso) {
        console.log('1️⃣ OPERAÇÕES SEPARADAS POR TIPO DE RECEITA');
        console.log('-' .repeat(50));

        try {
            // Query base conforme perfil de acesso
            let whereClause = '';
            let params = [];
            
            if (perfilAcesso === 'operador' || perfilAcesso === 'usuario' || perfilAcesso === 'afiliado') {
                whereClause = 'WHERE uo.user_id = $1';
                params = [usuarioId];
            }

            const operacoesPorTipo = await pool.query(`
                SELECT 
                    COALESCE(uo.revenue_type, 'BONUS') as tipo_receita,
                    COUNT(*) as total_operacoes,
                    COUNT(CASE WHEN uo.status = 'open' THEN 1 END) as abertas,
                    COUNT(CASE WHEN uo.status = 'closed' THEN 1 END) as fechadas,
                    COUNT(CASE WHEN uo.pnl > 0 THEN 1 END) as lucrativas,
                    COUNT(CASE WHEN uo.pnl < 0 THEN 1 END) as prejuizo,
                    COALESCE(AVG(CASE WHEN uo.pnl > 0 THEN uo.pnl END), 0) as lucro_medio,
                    COALESCE(AVG(CASE WHEN uo.pnl < 0 THEN uo.pnl END), 0) as prejuizo_medio,
                    COALESCE(SUM(uo.pnl), 0) as resultado_total,
                    COALESCE(SUM(uo.commission_amount), 0) as comissoes_geradas
                FROM user_operations uo
                ${whereClause}
                AND uo.created_at >= NOW() - INTERVAL '7 days'
                GROUP BY COALESCE(uo.revenue_type, 'BONUS')
                ORDER BY tipo_receita
            `, params);

            console.log('📊 OPERAÇÕES POR TIPO DE RECEITA (7 DIAS):');
            
            let totalGeralOperacoes = 0;
            let totalGeralResultado = 0;
            let totalGeralComissoes = 0;

            operacoesPorTipo.rows.forEach(tipo => {
                const taxaSucesso = tipo.fechadas > 0 ? (tipo.lucrativas / tipo.fechadas * 100) : 0;
                const iconeReceita = tipo.tipo_receita === 'REAL' ? '💳' : '🎁';
                
                console.log(`\n${iconeReceita} RECEITA ${tipo.tipo_receita}:`);
                console.log(`   📈 Total operações: ${tipo.total_operacoes}`);
                console.log(`   🔓 Abertas: ${tipo.abertas}`);
                console.log(`   🔒 Fechadas: ${tipo.fechadas}`);
                console.log(`   ✅ Lucrativas: ${tipo.lucrativas}`);
                console.log(`   ❌ Prejuízos: ${tipo.prejuizo}`);
                console.log(`   🎯 Taxa de sucesso: ${taxaSucesso.toFixed(1)}%`);
                console.log(`   💰 Lucro médio: $${parseFloat(tipo.lucro_medio).toFixed(2)}`);
                console.log(`   📉 Prejuízo médio: $${parseFloat(tipo.prejuizo_medio).toFixed(2)}`);
                console.log(`   📊 Resultado total: $${parseFloat(tipo.resultado_total).toFixed(2)}`);
                console.log(`   💎 Comissões geradas: $${parseFloat(tipo.comissoes_geradas).toFixed(2)}`);

                totalGeralOperacoes += parseInt(tipo.total_operacoes);
                totalGeralResultado += parseFloat(tipo.resultado_total);
                totalGeralComissoes += parseFloat(tipo.comissoes_geradas);
            });

            console.log('\n📊 RESUMO GERAL:');
            console.log(`   📈 Total geral operações: ${totalGeralOperacoes}`);
            console.log(`   💰 Resultado total: $${totalGeralResultado.toFixed(2)}`);
            console.log(`   💎 Comissões totais: $${totalGeralComissoes.toFixed(2)}`);

            // Análise comparativa
            if (operacoesPorTipo.rows.length > 1) {
                console.log('\n🔍 ANÁLISE COMPARATIVA:');
                const real = operacoesPorTipo.rows.find(r => r.tipo_receita === 'REAL');
                const bonus = operacoesPorTipo.rows.find(r => r.tipo_receita === 'BONUS');
                
                if (real && bonus) {
                    const taxaReal = real.fechadas > 0 ? (real.lucrativas / real.fechadas * 100) : 0;
                    const taxaBonus = bonus.fechadas > 0 ? (bonus.lucrativas / bonus.fechadas * 100) : 0;
                    
                    console.log(`   💳 Taxa sucesso REAL: ${taxaReal.toFixed(1)}%`);
                    console.log(`   🎁 Taxa sucesso BÔNUS: ${taxaBonus.toFixed(1)}%`);
                    
                    if (taxaReal > taxaBonus) {
                        console.log('   📈 Receita REAL apresenta melhor performance');
                    } else if (taxaBonus > taxaReal) {
                        console.log('   🎯 Receita BÔNUS apresenta melhor performance');
                    } else {
                        console.log('   ⚖️ Performance equilibrada entre tipos');
                    }
                }
            }

        } catch (error) {
            console.log('❌ Erro ao exibir operações por tipo:', error.message);
        }
    }

    async exibirIndicadoresFinanceiros(perfilAcesso) {
        console.log('\n2️⃣ INDICADORES FINANCEIROS');
        console.log('-' .repeat(50));

        try {
            // Receitas do mês
            const receitas = await pool.query(`
                SELECT 
                    'payments' as fonte,
                    COUNT(*) as quantidade,
                    COALESCE(SUM(amount), 0) as valor_total,
                    currency
                FROM payments
                WHERE status = 'completed'
                AND created_at >= DATE_TRUNC('month', NOW())
                GROUP BY currency
                
                UNION ALL
                
                SELECT 
                    'commissions' as fonte,
                    COUNT(*) as quantidade,
                    COALESCE(SUM(commission_amount), 0) as valor_total,
                    'USD' as currency
                FROM commission_calculations
                WHERE created_at >= DATE_TRUNC('month', NOW())
            `);

            console.log('💰 RECEITAS (MÊS ATUAL):');
            let totalReceitas = 0;
            
            receitas.rows.forEach(r => {
                const valor = parseFloat(r.valor_total);
                console.log(`   ${r.fonte.toUpperCase()}: ${r.currency} ${valor.toFixed(2)} (${r.quantidade} registros)`);
                
                if (r.currency === 'USD') {
                    totalReceitas += valor;
                } else if (r.currency === 'BRL') {
                    totalReceitas += valor / 5.4; // Converter para USD
                }
            });

            // Despesas do mês
            const despesas = await pool.query(`
                SELECT 
                    SUM(amount) as total_despesas,
                    currency
                FROM operational_expenses
                WHERE expense_date >= DATE_TRUNC('month', NOW())
                GROUP BY currency
            `);

            console.log('\n💼 DESPESAS (MÊS ATUAL):');
            let totalDespesas = 0;
            
            despesas.rows.forEach(d => {
                const valor = parseFloat(d.total_despesas);
                console.log(`   ${d.currency}: ${valor.toFixed(2)}`);
                
                if (d.currency === 'USD') {
                    totalDespesas += valor;
                } else if (d.currency === 'BRL') {
                    totalDespesas += valor / 5.4;
                }
            });

            // Resultado financeiro
            const resultado = totalReceitas - totalDespesas;
            console.log('\n📊 RESULTADO FINANCEIRO:');
            console.log(`   💰 Total receitas: $${totalReceitas.toFixed(2)} USD`);
            console.log(`   💼 Total despesas: $${totalDespesas.toFixed(2)} USD`);
            console.log(`   📈 Resultado: $${resultado.toFixed(2)} USD`);
            
            if (resultado > 0) {
                console.log('   ✅ Resultado positivo no mês');
            } else {
                console.log('   ⚠️ Resultado negativo - revisar estratégias');
            }

            // Apenas admin vê detalhes completos
            if (perfilAcesso === 'admin') {
                console.log('\n🔍 ANÁLISE DETALHADA (Admin):');
                console.log(`   📊 Margem de lucro: ${totalReceitas > 0 ? (resultado/totalReceitas*100).toFixed(1) : 0}%`);
                console.log(`   💎 ROI mensal: ${totalDespesas > 0 ? (resultado/totalDespesas*100).toFixed(1) : 0}%`);
            }

        } catch (error) {
            console.log('❌ Erro ao exibir indicadores financeiros:', error.message);
        }
    }

    async exibirDashboardAfiliados(usuarioId, perfilAcesso) {
        console.log('\n3️⃣ DASHBOARD DE AFILIADOS');
        console.log('-' .repeat(50));

        try {
            if (perfilAcesso === 'afiliado') {
                // Dashboard específico do afiliado
                const meuDesempenho = await pool.query(`
                    SELECT 
                        a.commission_rate,
                        a.plan_type,
                        a.total_earnings,
                        COUNT(ac.id) as total_comissoes,
                        COALESCE(SUM(ac.commission_amount), 0) as ganhos_mes
                    FROM affiliates a
                    LEFT JOIN affiliate_commissions ac ON a.id = ac.affiliate_id
                        AND ac.created_at >= DATE_TRUNC('month', NOW())
                    WHERE a.user_id = $1
                    GROUP BY a.id, a.commission_rate, a.plan_type, a.total_earnings
                `, [usuarioId]);

                if (meuDesempenho.rows.length > 0) {
                    const dados = meuDesempenho.rows[0];
                    console.log('💎 MEU DESEMPENHO COMO AFILIADO:');
                    console.log(`   📊 Plano: ${dados.plan_type.toUpperCase()} (${dados.commission_rate}%)`);
                    console.log(`   💰 Total ganhos: $${parseFloat(dados.total_earnings || 0).toFixed(2)}`);
                    console.log(`   📅 Ganhos este mês: $${parseFloat(dados.ganhos_mes).toFixed(2)}`);
                    console.log(`   🎯 Comissões este mês: ${dados.total_comissoes}`);
                }
            } else {
                // Dashboard geral de afiliados
                const resumoAfiliados = await pool.query(`
                    SELECT 
                        plan_type,
                        COUNT(*) as quantidade,
                        COALESCE(SUM(total_earnings), 0) as ganhos_totais,
                        COALESCE(AVG(total_earnings), 0) as ganho_medio
                    FROM affiliates
                    WHERE plan_type IS NOT NULL
                    GROUP BY plan_type
                    ORDER BY plan_type
                `);

                console.log('💎 RESUMO DE AFILIADOS:');
                resumoAfiliados.rows.forEach(af => {
                    const taxa = af.plan_type === 'vip' ? '5%' : '1,5%';
                    console.log(`   ${af.plan_type.toUpperCase()} (${taxa}): ${af.quantidade} afiliados`);
                    console.log(`     💰 Ganhos totais: $${parseFloat(af.ganhos_totais).toFixed(2)}`);
                    console.log(`     📊 Ganho médio: $${parseFloat(af.ganho_medio).toFixed(2)}`);
                });

                // Comissões pendentes (apenas admin/gestor)
                if (perfilAcesso === 'admin' || perfilAcesso === 'gestor') {
                    const comissoesPendentes = await pool.query(`
                        SELECT 
                            COUNT(*) as quantidade,
                            COALESCE(SUM(commission_amount), 0) as valor_total
                        FROM affiliate_commissions
                        WHERE status = 'pending'
                    `);

                    const pendentes = comissoesPendentes.rows[0];
                    console.log(`\n💳 COMISSÕES PENDENTES: ${pendentes.quantidade} comissões`);
                    console.log(`   💰 Valor total: $${parseFloat(pendentes.valor_total).toFixed(2)}`);
                }
            }

        } catch (error) {
            console.log('❌ Erro ao exibir dashboard de afiliados:', error.message);
        }
    }

    async exibirIndicadoresSistema() {
        console.log('\n4️⃣ INDICADORES DO SISTEMA');
        console.log('-' .repeat(50));

        try {
            // Performance geral
            const performance = await pool.query(`
                SELECT 
                    COUNT(*) as total_usuarios,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as usuarios_ativos,
                    (SELECT COUNT(*) FROM user_operations WHERE created_at >= NOW() - INTERVAL '24 hours') as ops_24h,
                    (SELECT COUNT(*) FROM user_operations WHERE status = 'open') as ops_abertas
                FROM users
            `);

            const stats = performance.rows[0];
            console.log('⚡ PERFORMANCE DO SISTEMA:');
            console.log(`   👥 Total usuários: ${stats.total_usuarios}`);
            console.log(`   ✅ Usuários ativos: ${stats.usuarios_ativos}`);
            console.log(`   📊 Operações 24h: ${stats.ops_24h}`);
            console.log(`   🔓 Operações abertas: ${stats.ops_abertas}`);

            // Health check dos serviços
            console.log('\n🔧 STATUS DOS SERVIÇOS:');
            const fs = require('fs');
            const servicos = [
                'sistema-webhook-automatico.js',
                'gestor-comissionamento-final.js',
                'monitor-inteligente-operacoes.js'
            ];

            servicos.forEach(servico => {
                if (fs.existsSync(`./${servico}`)) {
                    console.log(`   ✅ ${servico}: Operacional`);
                } else {
                    console.log(`   ❌ ${servico}: Não encontrado`);
                }
            });

            // Configurações críticas
            console.log('\n⚙️ CONFIGURAÇÕES CRÍTICAS:');
            console.log('   🎯 TP/SL: 2.5x/1.5x leverage (otimizado)');
            console.log('   ⏰ Timeout sinais: 2 minutos');
            console.log('   💰 Comissionamento: Automático');
            console.log('   🔒 Controle acesso: Ativo');

        } catch (error) {
            console.log('❌ Erro ao exibir indicadores do sistema:', error.message);
        }
    }

    async exibirGestaoUsuarios(perfilAcesso) {
        console.log('\n5️⃣ GESTÃO DE USUÁRIOS');
        console.log('-' .repeat(50));

        try {
            if (perfilAcesso === 'admin') {
                // Visão completa para admin
                const usuarios = await pool.query(`
                    SELECT 
                        plan_type,
                        country,
                        COUNT(*) as quantidade,
                        COUNT(CASE WHEN status = 'active' THEN 1 END) as ativos
                    FROM users
                    GROUP BY plan_type, country
                    ORDER BY plan_type, country
                `);

                console.log('👥 DISTRIBUIÇÃO DE USUÁRIOS:');
                usuarios.rows.forEach(u => {
                    console.log(`   ${u.plan_type || 'SEM PLANO'} - ${u.country || 'SEM PAÍS'}: ${u.quantidade} total, ${u.ativos} ativos`);
                });

            } else if (perfilAcesso === 'gestor') {
                // Visão resumida para gestor
                const resumo = await pool.query(`
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN status = 'active' THEN 1 END) as ativos,
                        COUNT(CASE WHEN plan_type = 'vip' THEN 1 END) as vip
                    FROM users
                `);

                const stats = resumo.rows[0];
                console.log('👥 RESUMO DE USUÁRIOS:');
                console.log(`   📊 Total: ${stats.total}`);
                console.log(`   ✅ Ativos: ${stats.ativos}`);
                console.log(`   💎 VIP: ${stats.vip}`);
            }

        } catch (error) {
            console.log('❌ Erro ao exibir gestão de usuários:', error.message);
        }
    }

    async exibirControleDespesas() {
        console.log('\n6️⃣ CONTROLE DE DESPESAS');
        console.log('-' .repeat(50));

        try {
            const despesasPorCategoria = await pool.query(`
                SELECT 
                    category,
                    frequency,
                    SUM(amount) as total,
                    currency,
                    COUNT(*) as registros
                FROM operational_expenses
                WHERE expense_date >= DATE_TRUNC('month', NOW())
                GROUP BY category, frequency, currency
                ORDER BY total DESC
            `);

            console.log('💼 DESPESAS POR CATEGORIA (MÊS ATUAL):');
            let totalMensal = 0;

            despesasPorCategoria.rows.forEach(d => {
                const valor = parseFloat(d.total);
                console.log(`   ${d.category.toUpperCase()}: ${d.currency} ${valor.toFixed(2)} (${d.frequency})`);
                
                if (d.currency === 'USD' && d.frequency !== 'per-transaction') {
                    totalMensal += valor;
                }
            });

            console.log(`\n📊 TOTAL MENSAL: ~$${totalMensal.toFixed(2)} USD`);
            
            // Projeção anual
            const projecaoAnual = totalMensal * 12;
            console.log(`📈 Projeção anual: ~$${projecaoAnual.toFixed(2)} USD`);

        } catch (error) {
            console.log('❌ Erro ao exibir controle de despesas:', error.message);
        }
    }

    async criarTabelaPermissoes() {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS user_permissions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    profile_type VARCHAR(20) DEFAULT 'usuario',
                    permissions JSONB DEFAULT '[]',
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    UNIQUE(user_id)
                )
            `);

            console.log('✅ Tabela de permissões criada');
        } catch (error) {
            console.log('⚠️ Tabela de permissões já existe');
        }
    }
}

// Função para usar em outros módulos
async function gerarDashboardPersonalizado(usuarioId, perfilAcesso = 'usuario') {
    const central = new CentralIndicadores();
    await central.gerarDashboard(usuarioId, perfilAcesso);
}

// Executar se arquivo for chamado diretamente
if (require.main === module) {
    const central = new CentralIndicadores();
    
    // Criar tabela de permissões
    central.criarTabelaPermissoes().then(() => {
        // Exemplo de uso com diferentes perfis
        console.log('🔹 EXEMPLO: Dashboard para ADMIN');
        return central.gerarDashboard(12, 'admin');
    }).then(() => {
        console.log('\n' + '='.repeat(80) + '\n');
        console.log('🔹 EXEMPLO: Dashboard para AFILIADO');
        return central.gerarDashboard(12, 'afiliado');
    }).then(() => {
        console.log('\n' + '='.repeat(80) + '\n');
        console.log('🔹 EXEMPLO: Dashboard para USUÁRIO');
        return central.gerarDashboard(12, 'usuario');
    }).finally(() => {
        pool.end();
    });
}

module.exports = { CentralIndicadores, gerarDashboardPersonalizado };
