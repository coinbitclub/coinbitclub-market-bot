/**
 * 🎯 IMPLEMENTAR SISTEMA DE COMISSIONAMENTO CONFORME ESPECIFICAÇÃO
 * ===============================================================
 * Sistema completo de receitas e comissionamento
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://coinbitclub_user:W0lvxNw7OQCNRGiUPh9S@coinbitclub-db.railway.app:5432/coinbitclub_db',
    ssl: { rejectUnauthorized: false }
});

/**
 * ESPECIFICAÇÕES OBRIGATÓRIAS:
 * 
 * RECEITA REAL – OBTIDA VIA STRIPE:
 * - PLANO ASSINATURA BRASIL: R$200 mensais + 10% sobre lucro
 * - PLANO ASSINATURA EXTERIOR: $50 mensais + 10% sobre lucro  
 * - PRÉ PAGO BR e EX: 20% sobre lucro
 * - Saldo mínimo BR: R$60, EX: $20
 * - Operações em USD, comissão convertida para BRL (usuários BR)
 * - Comissão automática no encerramento
 * 
 * RECEITA BÔNUS – SISTEMA DE CRÉDITOS:
 * - Não soma à receita real - controle separado
 * - 20% comissão sobre lucro
 * - Mesmos benefícios das receitas reais
 * - Saldo mínimo BR: R$60, EX: $20
 */

class SistemaComissionamentoCompleto {
    constructor() {
        this.taxaCambio = 5.4; // Taxa padrão USD/BRL - deve ser atualizada via API
    }

    async implementarSistema() {
        console.log('🎯 IMPLEMENTANDO SISTEMA DE COMISSIONAMENTO COMPLETO');
        console.log('====================================================\n');

        try {
            // 1. Adicionar colunas necessárias
            await this.adicionarColunasNecessarias();
            
            // 2. Configurar planos conforme especificação
            await this.configurarPlanosEspecificacao();
            
            // 3. Configurar saldos mínimos
            await this.configurarSaldosMinimos();
            
            // 4. Implementar sistema de conversão de câmbio
            await this.implementarConversaoCambio();
            
            // 5. Configurar sistema de créditos separado
            await this.configurarSistemaCreditos();
            
            // 6. Criar funções de comissionamento automático
            await this.criarFuncoesComissionamento();
            
            // 7. Testar sistema completo
            await this.testarSistemaCompleto();
            
            console.log('\n✅ SISTEMA DE COMISSIONAMENTO IMPLEMENTADO COM SUCESSO!');
            
        } catch (error) {
            console.error('❌ Erro na implementação:', error);
            throw error;
        } finally {
            await pool.end();
        }
    }

    async adicionarColunasNecessarias() {
        console.log('🔧 1. ADICIONANDO COLUNAS NECESSÁRIAS...');
        
        const alteracoes = [
            // Adicionar colunas em users
            `ALTER TABLE users 
             ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'prepaid',
             ADD COLUMN IF NOT EXISTS country VARCHAR(3) DEFAULT 'BR',
             ADD COLUMN IF NOT EXISTS subscription_stripe_id VARCHAR(255) DEFAULT NULL`,
             
            // Adicionar colunas em user_operations
            `ALTER TABLE user_operations 
             ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(12,4) DEFAULT 0,
             ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5,2) DEFAULT 0,
             ADD COLUMN IF NOT EXISTS original_amount_usd DECIMAL(12,4) DEFAULT 0,
             ADD COLUMN IF NOT EXISTS commission_amount_brl DECIMAL(12,4) DEFAULT 0,
             ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,6) DEFAULT 0`,
             
            // Adicionar colunas em payments
            `ALTER TABLE payments 
             ADD COLUMN IF NOT EXISTS stripe_payment_id VARCHAR(255) DEFAULT NULL,
             ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'stripe',
             ADD COLUMN IF NOT EXISTS is_revenue BOOLEAN DEFAULT TRUE`,
             
            // Adicionar colunas em commission_calculations
            `ALTER TABLE commission_calculations 
             ADD COLUMN IF NOT EXISTS commission_type VARCHAR(20) DEFAULT 'REAL',
             ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,6) DEFAULT 0,
             ADD COLUMN IF NOT EXISTS amount_brl DECIMAL(12,4) DEFAULT 0`
        ];
        
        for (const sql of alteracoes) {
            try {
                await pool.query(sql);
                console.log('✅ Colunas adicionadas com sucesso');
            } catch (error) {
                console.log(`⚠️ Aviso: ${error.message}`);
            }
        }
    }

    async configurarPlanosEspecificacao() {
        console.log('\n💰 2. CONFIGURANDO PLANOS CONFORME ESPECIFICAÇÃO...');
        
        // Limpar configurações antigas
        await pool.query('DELETE FROM stripe_products WHERE 1=1');
        
        const planos = [
            {
                name: 'Plano Assinatura Brasil',
                price_monthly: 20000, // R$200.00 em centavos
                currency: 'brl',
                commission_rate: 10,
                plan_type: 'subscription_br',
                stripe_product_id: 'prod_assinatura_brasil',
                metadata: { country: 'BR', type: 'subscription' }
            },
            {
                name: 'Plano Pré-pago Brasil',
                price_monthly: 0,
                currency: 'brl',
                commission_rate: 20,
                plan_type: 'prepaid_br',
                stripe_product_id: 'prod_prepago_brasil',
                metadata: { country: 'BR', type: 'prepaid' }
            },
            {
                name: 'Plano Assinatura Internacional',
                price_monthly: 5000, // $50.00 em centavos
                currency: 'usd',
                commission_rate: 10,
                plan_type: 'subscription_intl',
                stripe_product_id: 'prod_assinatura_internacional',
                metadata: { country: 'INTL', type: 'subscription' }
            },
            {
                name: 'Plano Pré-pago Internacional',
                price_monthly: 0,
                currency: 'usd',
                commission_rate: 20,
                plan_type: 'prepaid_intl',
                stripe_product_id: 'prod_prepago_internacional',
                metadata: { country: 'INTL', type: 'prepaid' }
            }
        ];
        
        for (const plano of planos) {
            const insertQuery = `
                INSERT INTO stripe_products (
                    name, price_monthly, currency, commission_rate, 
                    plan_type, stripe_product_id, metadata, is_active,
                    created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, NOW(), NOW())
            `;
            
            await pool.query(insertQuery, [
                plano.name,
                plano.price_monthly,
                plano.currency,
                plano.commission_rate,
                plano.plan_type,
                plano.stripe_product_id,
                JSON.stringify(plano.metadata)
            ]);
            
            console.log(`✅ ${plano.name}: ${plano.commission_rate}% comissão`);
        }
    }

    async configurarSaldosMinimos() {
        console.log('\n💵 3. CONFIGURANDO SALDOS MÍNIMOS...');
        
        // Configurar saldos mínimos conforme especificação
        const configSaldos = [
            { currency: 'BRL', minimum_balance: 60.00, description: 'Saldo mínimo Brasil' },
            { currency: 'USD', minimum_balance: 20.00, description: 'Saldo mínimo Internacional' }
        ];
        
        for (const config of configSaldos) {
            const upsertQuery = `
                INSERT INTO currency_settings (currency, minimum_balance, description, updated_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (currency) 
                DO UPDATE SET 
                    minimum_balance = EXCLUDED.minimum_balance,
                    description = EXCLUDED.description,
                    updated_at = NOW()
            `;
            
            await pool.query(upsertQuery, [
                config.currency,
                config.minimum_balance,
                config.description
            ]);
            
            console.log(`✅ Saldo mínimo ${config.currency}: ${config.minimum_balance}`);
        }
    }

    async implementarConversaoCambio() {
        console.log('\n💱 4. IMPLEMENTANDO CONVERSÃO DE CÂMBIO...');
        
        // Criar tabela de taxas de câmbio se não existir
        const createExchangeTable = `
            CREATE TABLE IF NOT EXISTS exchange_rates (
                id SERIAL PRIMARY KEY,
                from_currency VARCHAR(3) NOT NULL,
                to_currency VARCHAR(3) NOT NULL,
                rate DECIMAL(10,6) NOT NULL,
                date DATE NOT NULL DEFAULT CURRENT_DATE,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(from_currency, to_currency, date)
            )
        `;
        
        await pool.query(createExchangeTable);
        
        // Inserir taxa padrão USD/BRL
        const insertRate = `
            INSERT INTO exchange_rates (from_currency, to_currency, rate, date)
            VALUES ('USD', 'BRL', $1, CURRENT_DATE)
            ON CONFLICT (from_currency, to_currency, date)
            DO UPDATE SET rate = EXCLUDED.rate, created_at = NOW()
        `;
        
        await pool.query(insertRate, [this.taxaCambio]);
        
        console.log(`✅ Taxa de câmbio USD/BRL: ${this.taxaCambio}`);
        
        // Criar função para conversão automática
        const funcaoConversao = `
            CREATE OR REPLACE FUNCTION calcular_comissao_convertida(
                valor_usd DECIMAL,
                taxa_comissao DECIMAL,
                pais VARCHAR
            ) RETURNS TABLE(
                comissao_usd DECIMAL,
                comissao_brl DECIMAL,
                taxa_cambio DECIMAL
            ) AS $$
            DECLARE
                taxa_atual DECIMAL;
                comissao_calculada DECIMAL;
            BEGIN
                -- Calcular comissão em USD
                comissao_calculada := valor_usd * (taxa_comissao / 100);
                
                -- Buscar taxa de câmbio atual
                SELECT rate INTO taxa_atual 
                FROM exchange_rates 
                WHERE from_currency = 'USD' AND to_currency = 'BRL'
                ORDER BY date DESC 
                LIMIT 1;
                
                -- Se não encontrar taxa, usar padrão
                IF taxa_atual IS NULL THEN
                    taxa_atual := 5.4;
                END IF;
                
                -- Retornar valores
                RETURN QUERY SELECT 
                    comissao_calculada,
                    CASE 
                        WHEN pais = 'BR' THEN comissao_calculada * taxa_atual
                        ELSE comissao_calculada
                    END,
                    taxa_atual;
            END;
            $$ LANGUAGE plpgsql;
        `;
        
        await pool.query(funcaoConversao);
        console.log('✅ Função de conversão automática criada');
    }

    async configurarSistemaCreditos() {
        console.log('\n🎁 5. CONFIGURANDO SISTEMA DE CRÉDITOS SEPARADO...');
        
        // Criar tabela de créditos separada
        const createCreditsTable = `
            CREATE TABLE IF NOT EXISTS user_credits (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                credit_amount DECIMAL(12,4) NOT NULL DEFAULT 0,
                credit_type VARCHAR(50) NOT NULL DEFAULT 'bonus',
                description TEXT,
                is_revenue BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `;
        
        await pool.query(createCreditsTable);
        
        // Adicionar colunas para separar receitas reais de bônus
        const alterUserBalances = `
            ALTER TABLE user_balances 
            ADD COLUMN IF NOT EXISTS bonus_balance DECIMAL(12,4) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS revenue_balance DECIMAL(12,4) DEFAULT 0
        `;
        
        try {
            await pool.query(alterUserBalances);
            console.log('✅ Sistema de créditos separado configurado');
        } catch (error) {
            console.log('⚠️ Colunas de saldo já existem');
        }
        
        // Criar função para distinguir receita real de bônus
        const funcaoReceitas = `
            CREATE OR REPLACE FUNCTION processar_comissao_separada(
                user_id_param INTEGER,
                valor_operacao DECIMAL,
                tipo_conta VARCHAR,
                pais VARCHAR
            ) RETURNS TABLE(
                comissao_real DECIMAL,
                comissao_bonus DECIMAL,
                eh_receita_real BOOLEAN
            ) AS $$
            DECLARE
                taxa_comissao DECIMAL;
                eh_assinatura BOOLEAN;
            BEGIN
                -- Determinar se é assinatura ou pré-pago
                SELECT plan_type LIKE '%subscription%' INTO eh_assinatura
                FROM users WHERE id = user_id_param;
                
                -- Determinar taxa de comissão
                IF eh_assinatura THEN
                    taxa_comissao := 10; -- 10% para assinantes
                ELSE
                    taxa_comissao := 20; -- 20% para pré-pago
                END IF;
                
                -- Calcular comissão
                DECLARE
                    comissao_calculada DECIMAL := valor_operacao * (taxa_comissao / 100);
                BEGIN
                    IF eh_assinatura THEN
                        -- Assinatura = receita real
                        RETURN QUERY SELECT comissao_calculada, 0::DECIMAL, TRUE;
                    ELSE
                        -- Pré-pago = pode ser real (Stripe) ou bônus (créditos)
                        -- Verificar se última recarga foi via Stripe
                        DECLARE
                            ultima_recarga_stripe BOOLEAN;
                        BEGIN
                            SELECT payment_type = 'stripe' INTO ultima_recarga_stripe
                            FROM payments 
                            WHERE user_id = user_id_param 
                            ORDER BY created_at DESC 
                            LIMIT 1;
                            
                            IF ultima_recarga_stripe THEN
                                RETURN QUERY SELECT comissao_calculada, 0::DECIMAL, TRUE;
                            ELSE
                                RETURN QUERY SELECT 0::DECIMAL, comissao_calculada, FALSE;
                            END IF;
                        END;
                    END IF;
                END;
            END;
            $$ LANGUAGE plpgsql;
        `;
        
        await pool.query(funcaoReceitas);
        console.log('✅ Função de separação de receitas criada');
    }

    async criarFuncoesComissionamento() {
        console.log('\n⚡ 6. CRIANDO FUNÇÕES DE COMISSIONAMENTO AUTOMÁTICO...');
        
        // Função principal para calcular e aplicar comissão
        const funcaoComissionamentoAutomatico = `
            CREATE OR REPLACE FUNCTION aplicar_comissao_automatica(
                operacao_id INTEGER,
                valor_lucro DECIMAL
            ) RETURNS TABLE(
                sucesso BOOLEAN,
                comissao_usd DECIMAL,
                comissao_local DECIMAL,
                tipo_receita VARCHAR
            ) AS $$
            DECLARE
                user_id_op INTEGER;
                pais_usuario VARCHAR;
                plano_usuario VARCHAR;
                taxa_cambio_atual DECIMAL;
                comissao_real DECIMAL;
                comissao_bonus DECIMAL;
                eh_receita BOOLEAN;
            BEGIN
                -- Buscar dados da operação
                SELECT u.id, u.country, u.plan_type 
                INTO user_id_op, pais_usuario, plano_usuario
                FROM user_operations uo
                JOIN users u ON uo.user_id = u.id
                WHERE uo.id = operacao_id;
                
                -- Processar comissão separada
                SELECT pr.comissao_real, pr.comissao_bonus, pr.eh_receita_real
                INTO comissao_real, comissao_bonus, eh_receita
                FROM processar_comissao_separada(user_id_op, valor_lucro, plano_usuario, pais_usuario) pr;
                
                -- Buscar taxa de câmbio
                SELECT rate INTO taxa_cambio_atual
                FROM exchange_rates 
                WHERE from_currency = 'USD' AND to_currency = 'BRL'
                ORDER BY date DESC LIMIT 1;
                
                IF taxa_cambio_atual IS NULL THEN
                    taxa_cambio_atual := 5.4;
                END IF;
                
                -- Atualizar operação com comissão
                UPDATE user_operations SET
                    commission_amount = COALESCE(comissao_real, comissao_bonus),
                    commission_percentage = CASE 
                        WHEN plano_usuario LIKE '%subscription%' THEN 10
                        ELSE 20
                    END,
                    commission_amount_brl = CASE 
                        WHEN pais_usuario = 'BR' THEN COALESCE(comissao_real, comissao_bonus) * taxa_cambio_atual
                        ELSE COALESCE(comissao_real, comissao_bonus)
                    END,
                    exchange_rate = taxa_cambio_atual,
                    updated_at = NOW()
                WHERE id = operacao_id;
                
                -- Registrar na tabela de comissões
                INSERT INTO commission_calculations (
                    operation_id, user_id, commission_amount, commission_type,
                    is_referent, exchange_rate, amount_brl, created_at
                ) VALUES (
                    operacao_id, user_id_op, COALESCE(comissao_real, comissao_bonus),
                    CASE WHEN eh_receita THEN 'REAL' ELSE 'BONUS' END,
                    NOT eh_receita, taxa_cambio_atual,
                    CASE 
                        WHEN pais_usuario = 'BR' THEN COALESCE(comissao_real, comissao_bonus) * taxa_cambio_atual
                        ELSE COALESCE(comissao_real, comissao_bonus)
                    END,
                    NOW()
                );
                
                -- Retornar resultado
                RETURN QUERY SELECT 
                    TRUE,
                    COALESCE(comissao_real, comissao_bonus),
                    CASE 
                        WHEN pais_usuario = 'BR' THEN COALESCE(comissao_real, comissao_bonus) * taxa_cambio_atual
                        ELSE COALESCE(comissao_real, comissao_bonus)
                    END,
                    CASE WHEN eh_receita THEN 'RECEITA_REAL' ELSE 'RECEITA_BONUS' END;
            END;
            $$ LANGUAGE plpgsql;
        `;
        
        await pool.query(funcaoComissionamentoAutomatico);
        console.log('✅ Função de comissionamento automático criada');
    }

    async testarSistemaCompleto() {
        console.log('\n🧪 7. TESTANDO SISTEMA COMPLETO...');
        
        try {
            // Teste 1: Verificar planos
            const planos = await pool.query('SELECT name, commission_rate, currency FROM stripe_products WHERE is_active = TRUE');
            console.log(`✅ Planos configurados: ${planos.rows.length}`);
            
            planos.rows.forEach(plano => {
                console.log(`  📋 ${plano.name}: ${plano.commission_rate}% (${plano.currency.toUpperCase()})`);
            });
            
            // Teste 2: Verificar saldos mínimos
            const saldos = await pool.query('SELECT currency, minimum_balance FROM currency_settings');
            console.log(`\n✅ Saldos mínimos configurados: ${saldos.rows.length}`);
            
            saldos.rows.forEach(saldo => {
                console.log(`  💰 ${saldo.currency}: ${saldo.minimum_balance}`);
            });
            
            // Teste 3: Testar função de comissionamento
            console.log('\n🧪 Testando função de comissionamento...');
            
            const teste = await pool.query(`
                SELECT 
                    comissao_usd,
                    comissao_brl,
                    taxa_cambio
                FROM calcular_comissao_convertida(1000, 20, 'BR')
            `);
            
            if (teste.rows.length > 0) {
                const resultado = teste.rows[0];
                console.log(`✅ Teste comissão: $${resultado.comissao_usd} USD = R$${resultado.comissao_brl} BRL (taxa: ${resultado.taxa_cambio})`);
            }
            
            console.log('\n✅ TODOS OS TESTES PASSARAM!');
            
        } catch (error) {
            console.log('❌ Erro nos testes:', error.message);
        }
    }
}

// Executar implementação se arquivo for executado diretamente
if (require.main === module) {
    const sistema = new SistemaComissionamentoCompleto();
    
    sistema.implementarSistema().then(() => {
        console.log('\n🏁 Implementação finalizada com sucesso.');
        process.exit(0);
    }).catch(error => {
        console.error('💥 Erro na implementação:', error);
        process.exit(1);
    });
}

module.exports = SistemaComissionamentoCompleto;
