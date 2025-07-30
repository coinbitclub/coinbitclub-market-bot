#!/usr/bin/env node

/**
 * 🔄 ATUALIZADOR DE USUÁRIOS - PLANOS E SALDOS
 * 
 * Atualiza usuários existentes com:
 * - Planos apropriados (standard, vip, premium, elite)
 * - Saldos bônus para quem tem saldo
 * - Luiza Maria como afiliado VIP
 * - Paloma Amaral como usuário normal
 */

const { Pool } = require('pg');

class AtualizadorUsuarios {
    constructor() {
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });
    }

    async executarAtualizacoes() {
        try {
            console.log('🔄 ATUALIZADOR DE USUÁRIOS - PLANOS E SALDOS');
            console.log('===========================================');

            // 1. Verificar usuários existentes
            await this.verificarUsuariosExistentes();

            // 2. Atualizar planos baseado nos perfis
            await this.atualizarPlanosUsuarios();

            // 3. Configurar saldos bônus
            await this.configurarSaldosBonus();

            // 4. Configurar afiliados
            await this.configurarAfiliados();

            // 5. Verificação final
            await this.verificacaoFinal();

            console.log('\n✅ ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!');

        } catch (error) {
            console.error('❌ Erro na atualização:', error.message);
        } finally {
            await this.pool.end();
        }
    }

    async verificarUsuariosExistentes() {
        console.log('\n📋 Verificando usuários existentes...');
        
        const result = await this.pool.query(`
            SELECT 
                id, name, email, plan_type, balance_usd, vip_status, affiliate_level,
                created_at
            FROM users 
            ORDER BY id
        `);

        console.log(`📊 Total de usuários: ${result.rows.length}`);
        
        for (const user of result.rows) {
            console.log(`   👤 ${user.name} (${user.email}) - Plano: ${user.plan_type} - Saldo: $${user.balance_usd || 0}`);
        }

        return result.rows;
    }

    async atualizarPlanosUsuarios() {
        console.log('\n⚙️ Atualizando planos dos usuários...');

        const atualizacoes = [
            // Configurações específicas por usuário
            {
                criterio: "name ILIKE '%luiza%' AND name ILIKE '%maria%'",
                plano: 'vip',
                vip_status: true,
                affiliate_level: 'vip',
                descricao: 'Luiza Maria - Afiliado VIP'
            },
            {
                criterio: "name ILIKE '%paloma%' AND name ILIKE '%amaral%'",
                plano: 'standard',
                vip_status: false,
                affiliate_level: 'basic',
                descricao: 'Paloma Amaral - Usuário normal'
            },
            // Usuários com saldo alto = Elite
            {
                criterio: "balance_usd > 5000",
                plano: 'elite',
                vip_status: true,
                affiliate_level: 'elite',
                descricao: 'Usuários com saldo alto - Elite'
            },
            // Usuários com saldo médio = Premium
            {
                criterio: "balance_usd BETWEEN 1000 AND 5000",
                plano: 'premium',
                vip_status: true,
                affiliate_level: 'premium',
                descricao: 'Usuários com saldo médio - Premium'
            },
            // Usuários com algum saldo = VIP
            {
                criterio: "balance_usd BETWEEN 100 AND 999",
                plano: 'vip',
                vip_status: true,
                affiliate_level: 'vip',
                descricao: 'Usuários com saldo baixo - VIP'
            },
            // Demais usuários = Standard
            {
                criterio: "balance_usd < 100 OR balance_usd IS NULL",
                plano: 'standard',
                vip_status: false,
                affiliate_level: 'basic',
                descricao: 'Demais usuários - Standard'
            }
        ];

        for (const atualizacao of atualizacoes) {
            console.log(`\n📝 ${atualizacao.descricao}:`);
            
            const updateQuery = `
                UPDATE users SET 
                    plan_type = $1,
                    vip_status = $2,
                    affiliate_level = $3,
                    updated_at = NOW()
                WHERE ${atualizacao.criterio}
                  AND (plan_type != $1 OR vip_status != $2 OR affiliate_level != $3 OR 
                       plan_type IS NULL OR vip_status IS NULL OR affiliate_level IS NULL)
            `;

            const result = await this.pool.query(updateQuery, [
                atualizacao.plano,
                atualizacao.vip_status,
                atualizacao.affiliate_level
            ]);

            console.log(`   ✅ ${result.rowCount} usuário(s) atualizado(s) para ${atualizacao.plano}`);
        }
    }

    async configurarSaldosBonus() {
        console.log('\n💰 Configurando saldos bônus...');

        // Verificar se coluna de saldo bônus existe
        try {
            await this.pool.query(`SELECT credit_bonus FROM users LIMIT 1`);
        } catch (error) {
            console.log('⚠️ Criando coluna credit_bonus...');
            await this.pool.query(`
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS credit_bonus DECIMAL(20,8) DEFAULT 0
            `);
        }

        // Usuários que têm saldo recebem saldo bônus equivalente
        const result = await this.pool.query(`
            UPDATE users SET 
                credit_bonus = CASE 
                    WHEN balance_usd > 0 THEN balance_usd * 0.5  -- 50% de bônus
                    ELSE 0 
                END,
                updated_at = NOW()
            WHERE balance_usd > 0
        `);

        console.log(`✅ ${result.rowCount} usuário(s) receberam saldo bônus`);

        // Mostrar saldos atualizados
        const saldos = await this.pool.query(`
            SELECT name, balance_usd, credit_bonus, plan_type
            FROM users 
            WHERE balance_usd > 0 OR credit_bonus > 0
            ORDER BY balance_usd DESC
        `);

        console.log('\n💵 Saldos configurados:');
        for (const user of saldos.rows) {
            console.log(`   👤 ${user.name} (${user.plan_type}): $${user.balance_usd} + $${user.credit_bonus} bônus`);
        }
    }

    async configurarAfiliados() {
        console.log('\n👥 Configurando sistema de afiliados...');

        // Configurar taxas de comissão por nível
        const comissoes = {
            'basic': 0.015,    // 1.5%
            'vip': 0.05,       // 5%
            'premium': 0.075,  // 7.5%
            'elite': 0.10      // 10%
        };

        for (const [nivel, taxa] of Object.entries(comissoes)) {
            const result = await this.pool.query(`
                UPDATE users SET 
                    commission_rate = $1,
                    updated_at = NOW()
                WHERE affiliate_level = $2
            `, [taxa, nivel]);

            console.log(`   ✅ ${result.rowCount} afiliado(s) ${nivel} - taxa ${(taxa * 100).toFixed(1)}%`);
        }

        // Configuração especial para Luiza Maria (afiliado VIP)
        const luizaResult = await this.pool.query(`
            UPDATE users SET 
                affiliate_level = 'vip',
                commission_rate = 0.05,  -- 5%
                vip_status = true,
                plan_type = 'vip',
                updated_at = NOW()
            WHERE name ILIKE '%luiza%' AND name ILIKE '%maria%'
        `);

        if (luizaResult.rowCount > 0) {
            console.log('   ⭐ Luiza Maria configurada como afiliado VIP (5% comissão)');
        }

        // Configuração para Paloma Amaral (usuário normal)
        const palomaResult = await this.pool.query(`
            UPDATE users SET 
                affiliate_level = 'basic',
                commission_rate = 0.015,  -- 1.5%
                vip_status = false,
                plan_type = 'standard',
                updated_at = NOW()
            WHERE name ILIKE '%paloma%' AND name ILIKE '%amaral%'
        `);

        if (palomaResult.rowCount > 0) {
            console.log('   👤 Paloma Amaral configurada como usuário normal (1.5% comissão)');
        }
    }

    async verificacaoFinal() {
        console.log('\n🔍 VERIFICAÇÃO FINAL:');
        console.log('=====================');

        const usuarios = await this.pool.query(`
            SELECT 
                name, email, plan_type, vip_status, affiliate_level,
                balance_usd, credit_bonus, commission_rate,
                custom_leverage, allow_custom_params
            FROM users 
            ORDER BY 
                CASE plan_type 
                    WHEN 'elite' THEN 1
                    WHEN 'premium' THEN 2  
                    WHEN 'vip' THEN 3
                    WHEN 'standard' THEN 4
                    ELSE 5
                END,
                balance_usd DESC
        `);

        console.log('\n📊 USUÁRIOS CONFIGURADOS:');
        console.log('========================');

        const estatisticas = {
            standard: 0,
            vip: 0,
            premium: 0,
            elite: 0,
            totalSaldo: 0,
            totalBonus: 0
        };

        for (const user of usuarios.rows) {
            const saldo = parseFloat(user.balance_usd || 0);
            const bonus = parseFloat(user.credit_bonus || 0);
            const comissao = parseFloat(user.commission_rate || 0) * 100;

            console.log(`\n👤 ${user.name}`);
            console.log(`   📧 ${user.email}`);
            console.log(`   🏷️  Plano: ${user.plan_type.toUpperCase()}`);
            console.log(`   ⭐ VIP: ${user.vip_status ? 'Sim' : 'Não'}`);
            console.log(`   👥 Afiliado: ${user.affiliate_level} (${comissao.toFixed(1)}%)`);
            console.log(`   💰 Saldo: $${saldo.toFixed(2)}`);
            console.log(`   🎁 Bônus: $${bonus.toFixed(2)}`);
            console.log(`   ⚡ Alavancagem: ${user.custom_leverage || 5}x`);
            console.log(`   🎛️  Personalização: ${user.allow_custom_params ? 'Ativa' : 'Padrão'}`);

            // Atualizar estatísticas
            estatisticas[user.plan_type]++;
            estatisticas.totalSaldo += saldo;
            estatisticas.totalBonus += bonus;
        }

        console.log('\n📈 ESTATÍSTICAS FINAIS:');
        console.log('======================');
        console.log(`👥 Total de usuários: ${usuarios.rows.length}`);
        console.log(`🏷️  Standard: ${estatisticas.standard}`);
        console.log(`⭐ VIP: ${estatisticas.vip}`);
        console.log(`💎 Premium: ${estatisticas.premium}`);
        console.log(`👑 Elite: ${estatisticas.elite}`);
        console.log(`💰 Saldo total: $${estatisticas.totalSaldo.toFixed(2)}`);
        console.log(`🎁 Bônus total: $${estatisticas.totalBonus.toFixed(2)}`);

        // Verificar configurações de trading personalizadas
        console.log('\n🎛️ CONFIGURAÇÕES DE TRADING:');
        console.log('============================');

        const configTrading = await this.pool.query(`
            SELECT plan_type, COUNT(*) as total,
                   AVG(custom_leverage) as avg_leverage,
                   COUNT(*) FILTER (WHERE allow_custom_params = true) as custom_enabled
            FROM users 
            GROUP BY plan_type
            ORDER BY 
                CASE plan_type 
                    WHEN 'elite' THEN 1
                    WHEN 'premium' THEN 2  
                    WHEN 'vip' THEN 3
                    WHEN 'standard' THEN 4
                    ELSE 5
                END
        `);

        for (const config of configTrading.rows) {
            const avgLeverage = parseFloat(config.avg_leverage || 5);
            console.log(`📊 ${config.plan_type.toUpperCase()}: ${config.total} usuários`);
            console.log(`   ⚡ Alavancagem média: ${avgLeverage.toFixed(1)}x`);
            console.log(`   🎛️  Personalização ativa: ${config.custom_enabled}/${config.total}`);
        }
    }
}

// Executar atualizações
if (require.main === module) {
    const atualizador = new AtualizadorUsuarios();
    atualizador.executarAtualizacoes().catch(console.error);
}

module.exports = AtualizadorUsuarios;
