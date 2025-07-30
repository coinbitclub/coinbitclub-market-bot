#!/usr/bin/env node

/**
 * 🔧 CONFIGURADOR FINAL - ALAVANCAGEM/TP/SL
 * 
 * Atualiza todas as configurações do sistema para:
 * - Alavancagem padrão = 5x
 * - Take Profit = 3 × alavancagem = 15%  
 * - Stop Loss = 2 × alavancagem = 10%
 */

const { Pool } = require('pg');

async function atualizarConfiguracoesTPSL() {
    const pool = new Pool({
        connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔧 CONFIGURADOR FINAL: ALAVANCAGEM/TP/SL');
        console.log('==========================================');

        // 1. Atualizar configurações do sistema
        const configuracoes = [
            ['alavancagem_padrao', '5', 'trading', 'Alavancagem padrão = 5x'],
            ['sl_multiplicador', '2', 'trading', 'Stop Loss = 2 × alavancagem'],
            ['tp_multiplicador', '3', 'trading', 'Take Profit = 3 × alavancagem'],
            ['valor_operacao_percentual', '30', 'trading', 'Valor operação = 30% do saldo'],
            ['default_leverage', '5', 'trading', 'Alavancagem padrão para novos usuários'],
            ['max_leverage', '5', 'trading', 'Alavancagem máxima permitida'],
            ['stop_loss_percent', '10', 'trading', 'Stop Loss padrão = 10%'],
            ['take_profit_percent', '15', 'trading', 'Take Profit padrão = 15%']
        ];

        console.log('📊 Atualizando configurações do sistema...');
        
        for (const [key, value, category, description] of configuracoes) {
            await pool.query(`
                INSERT INTO system_configurations (config_key, config_value, category, description, updated_at)
                VALUES ($1, $2, $3, $4, NOW())
                ON CONFLICT (config_key) 
                DO UPDATE SET 
                    config_value = EXCLUDED.config_value,
                    description = EXCLUDED.description,
                    updated_at = NOW()
            `, [key, value, category, description]);
            
            console.log(`   ✅ ${key} = ${value} (${description})`);
        }

        // 2. Atualizar tabela trading_operations para alavancagem padrão
        console.log('\n🔧 Atualizando estrutura trading_operations...');
        
        await pool.query(`
            ALTER TABLE trading_operations 
            ALTER COLUMN leverage SET DEFAULT 5
        `);
        console.log('   ✅ Alavancagem padrão atualizada para 5x na tabela');

        // 3. Atualizar usuários existentes se necessário
        console.log('\n👥 Verificando usuários existentes...');
        
        const usuarios = await pool.query(`
            SELECT id, name, leverage_default 
            FROM users 
            WHERE leverage_default > 5 OR leverage_default IS NULL
            LIMIT 10
        `);

        if (usuarios.rows.length > 0) {
            console.log(`   📋 Encontrados ${usuarios.rows.length} usuários para atualizar`);
            
            for (const usuario of usuarios.rows) {
                await pool.query(`
                    UPDATE users 
                    SET leverage_default = 5
                    WHERE id = $1
                `, [usuario.id]);
                
                console.log(`   ✅ ${usuario.name}: alavancagem atualizada para 5x`);
            }
        } else {
            console.log('   ✅ Todos os usuários já estão com alavancagem 5x');
        }

        // 4. Verificar configurações finais
        console.log('\n🔍 VERIFICAÇÃO FINAL:');
        
        const configVerificacao = await pool.query(`
            SELECT config_key, config_value, description
            FROM system_configurations 
            WHERE category = 'trading' 
            AND config_key IN ('alavancagem_padrao', 'sl_multiplicador', 'tp_multiplicador')
            ORDER BY config_key
        `);

        for (const config of configVerificacao.rows) {
            console.log(`   📊 ${config.config_key}: ${config.config_value}`);
        }

        // 5. Exemplo de cálculo final
        console.log('\n📈 EXEMPLO DE CÁLCULO FINAL:');
        const alavancagem = 5;
        const precoEntrada = 50000;
        const stopLoss = precoEntrada * (1 - ((2 * alavancagem) / 100));
        const takeProfit = precoEntrada * (1 + ((3 * alavancagem) / 100));

        console.log(`   💰 Preço entrada: $${precoEntrada.toLocaleString()}`);
        console.log(`   ⚡ Alavancagem: ${alavancagem}x`);
        console.log(`   🔻 Stop Loss: $${stopLoss.toLocaleString()} (-${2*alavancagem}%)`);
        console.log(`   🎯 Take Profit: $${takeProfit.toLocaleString()} (+${3*alavancagem}%)`);

        console.log('\n✅ CONFIGURAÇÃO CONCLUÍDA!');
        console.log('===========================');
        console.log('🎯 Alavancagem padrão: 5x');
        console.log('🔻 Stop Loss: 2 × 5 = 10%');
        console.log('🎯 Take Profit: 3 × 5 = 15%');
        console.log('💰 Valor operação: 30% do saldo');
        console.log('📋 TP/SL sempre registrados na abertura');

    } catch (error) {
        console.error('❌ Erro na configuração:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar configuração
atualizarConfiguracoesTPSL().catch(console.error);
