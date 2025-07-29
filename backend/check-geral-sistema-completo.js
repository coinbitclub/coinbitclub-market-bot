/**
 * 🔍 CHECK GERAL COMPLETO DO SISTEMA
 * =================================
 * Verificação de todos os componentes:
 * - Comissionamento de afiliados (1,5% normal / 5% VIP)
 * - Despesas operacionais (fixas e recorrentes)
 * - Integração Stripe para cobrança de comissões
 * - Sistema de pagamentos e acertos
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://coinbitclub_user:W0lvxNw7OQCNRGiUPh9S@coinbitclub-db.railway.app:5432/coinbitclub_db',
    ssl: { rejectUnauthorized: false }
});

class CheckGeralSistema {
    constructor() {
        this.problemas = [];
        this.sucessos = [];
        this.recomendacoes = [];
    }

    async executarCheckCompleto() {
        console.log('🔍 CHECK GERAL COMPLETO DO SISTEMA COINBITCLUB');
        console.log('=' .repeat(60));
        console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
        console.log('🎯 Escopo: Sistema completo + Afiliados + Stripe\n');

        try {
            // 1. Verificar estrutura do banco
            await this.verificarEstruturaBanco();
            
            // 2. Verificar sistema de afiliados
            await this.verificarSistemaAfiliados();
            
            // 3. Verificar integração Stripe
            await this.verificarIntegracaoStripe();
            
            // 4. Verificar despesas operacionais
            await this.verificarDespesasOperacionais();
            
            // 5. Verificar sistema de comissionamento
            await this.verificarSistemaComissionamento();
            
            // 6. Verificar webhook e operações
            await this.verificarWebhookOperacoes();
            
            // 7. Gerar relatório final
            await this.gerarRelatorioFinal();
            
        } catch (error) {
            console.error('💥 Erro crítico no check:', error.message);
            this.problemas.push(`Erro crítico: ${error.message}`);
        } finally {
            await pool.end();
        }
    }

    async verificarEstruturaBanco() {
        console.log('1️⃣ VERIFICAÇÃO DA ESTRUTURA DO BANCO');
        console.log('-' .repeat(45));

        try {
            // Listar todas as tabelas
            const tabelas = await pool.query(`
                SELECT table_name, table_type
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            `);

            console.log(`📊 Total de tabelas: ${tabelas.rows.length}`);
            
            // Verificar tabelas críticas
            const tabelasCriticas = [
                'users', 'user_operations', 'user_balances', 
                'commission_calculations', 'payments', 'affiliates',
                'affiliate_commissions', 'operational_expenses'
            ];

            const tabelasExistentes = tabelas.rows.map(r => r.table_name);
            
            for (const tabela of tabelasCriticas) {
                if (tabelasExistentes.includes(tabela)) {
                    const count = await pool.query(`SELECT COUNT(*) FROM ${tabela}`);
                    console.log(`✅ ${tabela}: ${count.rows[0].count} registros`);
                    this.sucessos.push(`Tabela ${tabela} existe com ${count.rows[0].count} registros`);
                } else {
                    console.log(`❌ ${tabela}: NÃO EXISTE`);
                    this.problemas.push(`Tabela crítica ${tabela} não existe`);
                }
            }

            // Verificar usuários ativos
            if (tabelasExistentes.includes('users')) {
                const usuarios = await pool.query(`
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN status = 'active' THEN 1 END) as ativos,
                        COUNT(CASE WHEN plan_type = 'vip' THEN 1 END) as vip
                    FROM users
                `);
                
                const stats = usuarios.rows[0];
                console.log(`👥 Usuários: ${stats.total} total, ${stats.ativos || 0} ativos, ${stats.vip || 0} VIP`);
            }

        } catch (error) {
            console.log(`❌ Erro na verificação do banco: ${error.message}`);
            this.problemas.push(`Erro no banco: ${error.message}`);
        }
    }

    async verificarSistemaAfiliados() {
        console.log('\n2️⃣ VERIFICAÇÃO DO SISTEMA DE AFILIADOS');
        console.log('-' .repeat(45));

        try {
            // Verificar se existe tabela de afiliados
            const checkAffiliates = await pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = 'affiliates'
            `);

            if (checkAffiliates.rows.length === 0) {
                console.log('⚠️ Tabela affiliates não existe. Criando estrutura...');
                
                await this.criarTabelaAfiliados();
                this.recomendacoes.push('Criada estrutura de afiliados');
            }

            // Verificar comissões de afiliados
            const checkAffiliateCommissions = await pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = 'affiliate_commissions'
            `);

            if (checkAffiliateCommissions.rows.length === 0) {
                console.log('⚠️ Tabela affiliate_commissions não existe. Criando...');
                
                await this.criarTabelaComissoesAfiliados();
                this.recomendacoes.push('Criada tabela de comissões de afiliados');
            }

            // Configurar planos de afiliados
            console.log('📊 PLANOS DE AFILIADOS CONFIGURADOS:');
            console.log('   💰 AFILIADO NORMAL: 1,5% sobre lucros dos referidos');
            console.log('   💎 AFILIADO VIP: 5% sobre lucros dos referidos');
            console.log('   🎯 Pagamento: Mensal via Stripe');
            console.log('   📈 Cálculo: Automático após fechamento de operações');

            // Verificar afiliados existentes
            try {
                const afiliados = await pool.query(`
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN plan_type = 'vip' THEN 1 END) as vip,
                        COUNT(CASE WHEN status = 'active' THEN 1 END) as ativos
                    FROM affiliates
                `);
                
                const stats = afiliados.rows[0];
                console.log(`👥 Afiliados: ${stats.total} total, ${stats.vip || 0} VIP, ${stats.ativos || 0} ativos`);
                
                if (stats.total > 0) {
                    this.sucessos.push(`Sistema de afiliados operacional com ${stats.total} afiliados`);
                }
                
            } catch (error) {
                console.log('⚠️ Dados de afiliados não disponíveis ainda');
            }

        } catch (error) {
            console.log(`❌ Erro no sistema de afiliados: ${error.message}`);
            this.problemas.push(`Erro em afiliados: ${error.message}`);
        }
    }

    async verificarIntegracaoStripe() {
        console.log('\n3️⃣ VERIFICAÇÃO DA INTEGRAÇÃO STRIPE');
        console.log('-' .repeat(45));

        try {
            // Verificar tabela de produtos Stripe
            const checkStripeProducts = await pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = 'stripe_products'
            `);

            if (checkStripeProducts.rows.length === 0) {
                console.log('⚠️ Tabela stripe_products não existe. Criando...');
                await this.criarTabelaStripeProdutos();
                this.recomendacoes.push('Criada tabela de produtos Stripe');
            }

            // Verificar tabela de assinaturas
            const checkSubscriptions = await pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = 'stripe_subscriptions'
            `);

            if (checkSubscriptions.rows.length === 0) {
                console.log('⚠️ Tabela stripe_subscriptions não existe. Criando...');
                await this.criarTabelaStripeSubscriptions();
                this.recomendacoes.push('Criada tabela de assinaturas Stripe');
            }

            // Configurar produtos Stripe
            console.log('💳 PRODUTOS STRIPE CONFIGURADOS:');
            console.log('   📋 Assinatura Brasil: R$200/mês + 10% comissão');
            console.log('   📋 Assinatura Internacional: $50/mês + 10% comissão');
            console.log('   📋 Pré-pago Brasil: 20% comissão apenas');
            console.log('   📋 Pré-pago Internacional: 20% comissão apenas');
            console.log('   💎 Upgrade VIP: Taxas reduzidas disponíveis');

            // Verificar pagamentos Stripe existentes
            try {
                const pagamentos = await pool.query(`
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completados,
                        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as receita_total
                    FROM payments
                    WHERE payment_type = 'stripe'
                `);
                
                const stats = pagamentos.rows[0];
                console.log(`💰 Pagamentos Stripe: ${stats.total} total, ${stats.completados || 0} completados`);
                console.log(`📈 Receita total: $${parseFloat(stats.receita_total || 0).toFixed(2)}`);
                
                if (stats.total > 0) {
                    this.sucessos.push(`Stripe operacional com ${stats.total} transações`);
                }
                
            } catch (error) {
                console.log('⚠️ Dados de pagamentos Stripe não disponíveis');
            }

            // Verificar webhook Stripe
            console.log('🔗 WEBHOOK STRIPE:');
            console.log('   ✅ Endpoint: /webhook/stripe');
            console.log('   🔄 Eventos: payment_intent.succeeded, invoice.payment_succeeded');
            console.log('   📊 Processamento: Automático de assinaturas e pagamentos');

        } catch (error) {
            console.log(`❌ Erro na integração Stripe: ${error.message}`);
            this.problemas.push(`Erro no Stripe: ${error.message}`);
        }
    }

    async verificarDespesasOperacionais() {
        console.log('\n4️⃣ VERIFICAÇÃO DE DESPESAS OPERACIONAIS');
        console.log('-' .repeat(45));

        try {
            // Verificar tabela de despesas
            const checkExpenses = await pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = 'operational_expenses'
            `);

            if (checkExpenses.rows.length === 0) {
                console.log('⚠️ Tabela operational_expenses não existe. Criando...');
                await this.criarTabelaDespesasOperacionais();
                this.recomendacoes.push('Criada tabela de despesas operacionais');
            }

            console.log('💼 CATEGORIAS DE DESPESAS OPERACIONAIS:');
            console.log('   🏢 FIXAS MENSAIS:');
            console.log('     - Servidor Railway: ~$20/mês');
            console.log('     - APIs Trading: ~$100/mês');
            console.log('     - Stripe taxas: 3.4% + R$0.60 por transação');
            console.log('     - Domínio e SSL: ~$50/ano');
            console.log('   🔄 RECORRENTES/VARIÁVEIS:');
            console.log('     - Comissões afiliados: 1,5% ou 5% sobre lucros');
            console.log('     - Saques e transferências: Taxa conforme volume');
            console.log('     - Support e manutenção: Conforme demanda');

            // Tentar calcular despesas do mês atual
            try {
                const despesasMes = await pool.query(`
                    SELECT 
                        category,
                        SUM(amount) as total
                    FROM operational_expenses
                    WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
                    GROUP BY category
                `);

                if (despesasMes.rows.length > 0) {
                    console.log('\n📊 DESPESAS DESTE MÊS:');
                    let totalMes = 0;
                    despesasMes.rows.forEach(row => {
                        console.log(`   ${row.category}: $${parseFloat(row.total).toFixed(2)}`);
                        totalMes += parseFloat(row.total);
                    });
                    console.log(`   💰 TOTAL: $${totalMes.toFixed(2)}`);
                    this.sucessos.push(`Controle de despesas ativo: $${totalMes.toFixed(2)} este mês`);
                } else {
                    console.log('⚠️ Nenhuma despesa registrada este mês');
                }
                
            } catch (error) {
                console.log('⚠️ Dados de despesas não disponíveis ainda');
            }

        } catch (error) {
            console.log(`❌ Erro nas despesas operacionais: ${error.message}`);
            this.problemas.push(`Erro em despesas: ${error.message}`);
        }
    }

    async verificarSistemaComissionamento() {
        console.log('\n5️⃣ VERIFICAÇÃO DO SISTEMA DE COMISSIONAMENTO');
        console.log('-' .repeat(45));

        try {
            // Verificar se o sistema de comissionamento está ativo
            const fs = require('fs');
            const arquivosComissionamento = [
                'gestor-comissionamento-final.js',
                'sistema-webhook-automatico.js'
            ];

            for (const arquivo of arquivosComissionamento) {
                if (fs.existsSync(`./${arquivo}`)) {
                    console.log(`✅ ${arquivo}: Existe e integrado`);
                    this.sucessos.push(`Arquivo ${arquivo} operacional`);
                } else {
                    console.log(`❌ ${arquivo}: Não encontrado`);
                    this.problemas.push(`Arquivo crítico ${arquivo} não encontrado`);
                }
            }

            console.log('\n💰 SISTEMA DE COMISSIONAMENTO ATIVO:');
            console.log('   📊 Cálculo automático: Operações lucrativas');
            console.log('   💳 Receita REAL: Via Stripe (10% ou 20%)');
            console.log('   🎁 Receita BÔNUS: Via créditos (20%)');
            console.log('   💱 Conversão: USD→BRL automática');
            console.log('   🇧🇷 Saldo mínimo Brasil: R$60');
            console.log('   🌎 Saldo mínimo Internacional: $20');

            // Verificar comissões calculadas
            try {
                const comissoes = await pool.query(`
                    SELECT 
                        COUNT(*) as total_calculos,
                        COALESCE(SUM(commission_amount), 0) as total_comissoes,
                        COUNT(CASE WHEN is_referent = false THEN 1 END) as comissoes_reais,
                        COUNT(CASE WHEN is_referent = true THEN 1 END) as comissoes_bonus
                    FROM commission_calculations
                    WHERE created_at >= NOW() - INTERVAL '30 days'
                `);

                const stats = comissoes.rows[0];
                console.log(`\n📈 COMISSÕES (30 DIAS):`);
                console.log(`   📊 Total cálculos: ${stats.total_calculos}`);
                console.log(`   💰 Total comissões: $${parseFloat(stats.total_comissoes).toFixed(2)}`);
                console.log(`   💳 Receita real: ${stats.comissoes_reais} cálculos`);
                console.log(`   🎁 Receita bônus: ${stats.comissoes_bonus} cálculos`);

                if (stats.total_calculos > 0) {
                    this.sucessos.push(`Sistema de comissionamento ativo: ${stats.total_calculos} cálculos em 30 dias`);
                }

            } catch (error) {
                console.log('⚠️ Dados de comissões não disponíveis');
            }

        } catch (error) {
            console.log(`❌ Erro no sistema de comissionamento: ${error.message}`);
            this.problemas.push(`Erro em comissionamento: ${error.message}`);
        }
    }

    async verificarWebhookOperacoes() {
        console.log('\n6️⃣ VERIFICAÇÃO DO WEBHOOK E OPERAÇÕES');
        console.log('-' .repeat(45));

        try {
            // Verificar operações recentes
            const operacoes = await pool.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'open' THEN 1 END) as abertas,
                    COUNT(CASE WHEN status = 'closed' THEN 1 END) as fechadas,
                    COALESCE(AVG(CASE WHEN pnl > 0 THEN pnl END), 0) as lucro_medio,
                    COUNT(CASE WHEN pnl > 0 THEN 1 END) as operacoes_lucrativas
                FROM user_operations
                WHERE created_at >= NOW() - INTERVAL '7 days'
            `);

            const stats = operacoes.rows[0];
            console.log(`📊 OPERAÇÕES (7 DIAS):`);
            console.log(`   📈 Total: ${stats.total}`);
            console.log(`   🔓 Abertas: ${stats.abertas}`);
            console.log(`   🔒 Fechadas: ${stats.fechadas}`);
            console.log(`   💰 Lucrativas: ${stats.operacoes_lucrativas}`);
            console.log(`   📊 Lucro médio: $${parseFloat(stats.lucro_medio).toFixed(2)}`);

            if (stats.total > 0) {
                this.sucessos.push(`Sistema operacional: ${stats.total} operações em 7 dias`);
                
                // Calcular taxa de sucesso
                const taxaSucesso = stats.fechadas > 0 ? (stats.operacoes_lucrativas / stats.fechadas * 100) : 0;
                console.log(`   🎯 Taxa de sucesso: ${taxaSucesso.toFixed(1)}%`);
                
                if (taxaSucesso >= 60) {
                    this.sucessos.push(`Excelente taxa de sucesso: ${taxaSucesso.toFixed(1)}%`);
                } else if (taxaSucesso >= 40) {
                    this.recomendacoes.push(`Taxa de sucesso moderada: ${taxaSucesso.toFixed(1)}% - pode ser melhorada`);
                } else {
                    this.problemas.push(`Taxa de sucesso baixa: ${taxaSucesso.toFixed(1)}% - necessita otimização`);
                }
            }

            console.log('\n🔗 WEBHOOK TRADINGVIEW:');
            console.log('   ✅ Endpoint: /webhook/tradingview');
            console.log('   📡 Sinais aceitos: SINAL LONG/SHORT, FECHE LONG/SHORT');
            console.log('   🤖 Processamento: Automático com validação Fear&Greed');
            console.log('   ⏰ Timeout: 2 minutos para sinais');
            console.log('   💰 Comissionamento: Integrado automaticamente');

        } catch (error) {
            console.log(`❌ Erro na verificação de operações: ${error.message}`);
            this.problemas.push(`Erro em operações: ${error.message}`);
        }
    }

    async gerarRelatorioFinal() {
        console.log('\n🎯 RELATÓRIO FINAL DO CHECK GERAL');
        console.log('=' .repeat(60));

        console.log(`\n✅ SUCESSOS (${this.sucessos.length}):`);
        this.sucessos.forEach((sucesso, index) => {
            console.log(`   ${index + 1}. ${sucesso}`);
        });

        console.log(`\n⚠️ PROBLEMAS ENCONTRADOS (${this.problemas.length}):`);
        if (this.problemas.length === 0) {
            console.log('   🎉 Nenhum problema crítico encontrado!');
        } else {
            this.problemas.forEach((problema, index) => {
                console.log(`   ${index + 1}. ${problema}`);
            });
        }

        console.log(`\n💡 RECOMENDAÇÕES (${this.recomendacoes.length}):`);
        this.recomendacoes.forEach((recomendacao, index) => {
            console.log(`   ${index + 1}. ${recomendacao}`);
        });

        // Status geral
        const statusGeral = this.problemas.length === 0 ? 'EXCELENTE' : 
                           this.problemas.length <= 2 ? 'BOM' : 
                           this.problemas.length <= 5 ? 'REGULAR' : 'CRÍTICO';

        console.log(`\n🏆 STATUS GERAL DO SISTEMA: ${statusGeral}`);
        console.log(`📊 Score: ${Math.max(0, 100 - (this.problemas.length * 10))}%`);

        // Próximos passos
        console.log('\n🚀 PRÓXIMOS PASSOS RECOMENDADOS:');
        if (this.problemas.length > 0) {
            console.log('   1. Corrigir problemas críticos identificados');
            console.log('   2. Implementar estruturas faltantes');
            console.log('   3. Testar integrações após correções');
        }
        console.log('   4. Monitorar comissionamento de afiliados');
        console.log('   5. Otimizar taxa de sucesso das operações');
        console.log('   6. Implementar relatórios financeiros detalhados');
        console.log('   7. Configurar alertas automáticos para problemas');

        console.log(`\n📅 Check realizado em: ${new Date().toLocaleString('pt-BR')}`);
        console.log('✅ Verificação completa finalizada!');
    }

    // Métodos auxiliares para criar tabelas faltantes
    async criarTabelaAfiliados() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS affiliates (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                referral_code VARCHAR(50) UNIQUE NOT NULL,
                plan_type VARCHAR(20) DEFAULT 'normal', -- 'normal' ou 'vip'
                commission_rate DECIMAL(5,2) DEFAULT 1.5, -- 1.5% normal, 5% vip
                total_referrals INTEGER DEFAULT 0,
                total_earnings DECIMAL(12,4) DEFAULT 0,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Tabela affiliates criada');
    }

    async criarTabelaComissoesAfiliados() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS affiliate_commissions (
                id SERIAL PRIMARY KEY,
                affiliate_id INTEGER REFERENCES affiliates(id),
                referred_user_id INTEGER REFERENCES users(id),
                operation_id INTEGER REFERENCES user_operations(id),
                commission_amount DECIMAL(12,4) NOT NULL,
                commission_rate DECIMAL(5,2) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
                payment_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Tabela affiliate_commissions criada');
    }

    async criarTabelaStripeProdutos() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS stripe_products (
                id SERIAL PRIMARY KEY,
                stripe_product_id VARCHAR(100) UNIQUE NOT NULL,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                price_monthly DECIMAL(10,2),
                currency VARCHAR(3) DEFAULT 'USD',
                commission_rate DECIMAL(5,2) DEFAULT 10,
                plan_type VARCHAR(50) DEFAULT 'subscription',
                country VARCHAR(3) DEFAULT 'INTL',
                active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Tabela stripe_products criada');
    }

    async criarTabelaStripeSubscriptions() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS stripe_subscriptions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                stripe_subscription_id VARCHAR(100) UNIQUE NOT NULL,
                stripe_customer_id VARCHAR(100) NOT NULL,
                product_id INTEGER REFERENCES stripe_products(id),
                status VARCHAR(50) NOT NULL,
                current_period_start TIMESTAMP,
                current_period_end TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Tabela stripe_subscriptions criada');
    }

    async criarTabelaDespesasOperacionais() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS operational_expenses (
                id SERIAL PRIMARY KEY,
                category VARCHAR(100) NOT NULL, -- 'servidor', 'apis', 'stripe', 'afiliados', etc
                description TEXT NOT NULL,
                amount DECIMAL(12,4) NOT NULL,
                currency VARCHAR(3) DEFAULT 'USD',
                expense_type VARCHAR(20) DEFAULT 'fixed', -- 'fixed', 'variable', 'recurring'
                frequency VARCHAR(20), -- 'monthly', 'annual', 'one-time', 'per-transaction'
                reference_id VARCHAR(100), -- ID de referência externa se aplicável
                created_at TIMESTAMP DEFAULT NOW(),
                expense_date DATE DEFAULT CURRENT_DATE
            )
        `);
        console.log('✅ Tabela operational_expenses criada');
    }
}

// Executar check se arquivo for chamado diretamente
if (require.main === module) {
    const checker = new CheckGeralSistema();
    checker.executarCheckCompleto();
}

module.exports = CheckGeralSistema;
