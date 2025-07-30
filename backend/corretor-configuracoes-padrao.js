#!/usr/bin/env node

/**
 * 🔄 CORRETOR DE CONFIGURAÇÕES PADRÃO
 * 
 * Garante que todos os usuários usem configurações PADRÃO por default:
 * - Alavancagem: 5x
 * - Take Profit: 15% (3 × 5)
 * - Stop Loss: 10% (2 × 5)
 * - Tamanho posição: 30%
 * - Personalização: DESATIVADA por padrão
 */

const { Pool } = require('pg');

class CorretorConfiguracoesPadrao {
    constructor() {
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });
    }

    async executarCorrecao() {
        try {
            console.log('🔄 CORRETOR DE CONFIGURAÇÕES PADRÃO');
            console.log('===================================');

            // 1. Resetar TODOS os usuários para configurações padrão
            await this.resetarTodosUsuarios();

            // 2. Demonstrar como ativar personalização explicitamente
            await this.demonstrarPersonalizacaoExplicita();

            // 3. Verificar estado final
            await this.verificarEstadoFinal();

            console.log('\n✅ CORREÇÃO CONCLUÍDA!');

        } catch (error) {
            console.error('❌ Erro na correção:', error.message);
        } finally {
            await this.pool.end();
        }
    }

    async resetarTodosUsuarios() {
        console.log('\n🔄 Resetando TODOS os usuários para configurações PADRÃO...');

        // Resetar todos para padrões do sistema
        const result = await this.pool.query(`
            UPDATE users SET 
                custom_leverage = 5.00,
                custom_stop_loss_percent = 10.00,
                custom_take_profit_percent = 15.00,
                custom_position_size_percent = 30.00,
                allow_custom_params = false,  -- ✅ DESATIVAR personalização por padrão
                trading_preferences = '{}'::jsonb,
                updated_at = NOW()
        `);

        console.log(`✅ ${result.rowCount} usuário(s) resetados para configurações PADRÃO`);
        console.log('📋 Configurações aplicadas:');
        console.log('   ⚡ Alavancagem: 5x (padrão)');
        console.log('   🔻 Stop Loss: 10% (2 × 5)');
        console.log('   🎯 Take Profit: 15% (3 × 5)');
        console.log('   💰 Tamanho posição: 30%');
        console.log('   🎛️ Personalização: DESATIVADA');
    }

    async demonstrarPersonalizacaoExplicita() {
        console.log('\n🎛️ DEMONSTRANDO PERSONALIZAÇÃO EXPLÍCITA...');

        const UserManager = require('./user-manager-v2');
        const userManager = new UserManager();
        await userManager.inicializar();

        // Exemplo 1: Usuário VIP (Luiza Maria) - SEM personalização explícita
        console.log('\n👤 TESTE 1: Luiza Maria (VIP) - Configurações padrão');
        try {
            const configPadrao = await userManager.obterParametrosTradingUsuario(4); // Luiza Maria ID
            console.log('📊 Resultado:');
            console.log(`   ⚡ Alavancagem: ${configPadrao.leverage}x`);
            console.log(`   🔻 Stop Loss: ${configPadrao.stopLoss}%`);
            console.log(`   🎯 Take Profit: ${configPadrao.takeProfit}%`);
            console.log(`   🎛️ Personalização: ${configPadrao.isCustom ? 'ATIVA' : 'PADRÃO'}`);
        } catch (error) {
            console.log(`❌ Erro: ${error.message}`);
        }

        // Exemplo 2: Tentar personalizar SEM ativar explicitamente
        console.log('\n👤 TESTE 2: Tentativa de personalização SEM ativar explicitamente');
        try {
            await userManager.configurarParametrosTradingUsuario(4, {
                leverage: 8,
                stopLoss: 12,
                takeProfit: 25
                // ❌ NÃO está definindo ativarPersonalizacao=true
            });
        } catch (error) {
            console.log(`✅ Bloqueado corretamente: ${error.message}`);
        }

        // Exemplo 3: Personalizar COM ativação explícita
        console.log('\n👤 TESTE 3: Personalização COM ativação explícita');
        try {
            const configPersonalizada = await userManager.configurarParametrosTradingUsuario(4, {
                leverage: 8,
                stopLoss: 12,
                takeProfit: 25,
                positionSize: 45,
                ativarPersonalizacao: true // ✅ EXPLICITAMENTE ativando
            });
            
            console.log('✅ Personalização aplicada:');
            console.log(`   ⚡ Alavancagem: ${configPersonalizada.leverage}x`);
            console.log(`   🔻 Stop Loss: ${configPersonalizada.stopLoss}%`);
            console.log(`   🎯 Take Profit: ${configPersonalizada.takeProfit}%`);
            console.log(`   🎛️ Personalização: ${configPersonalizada.isCustom ? 'ATIVA' : 'PADRÃO'}`);
        } catch (error) {
            console.log(`❌ Erro: ${error.message}`);
        }

        // Exemplo 4: Verificar se personalização está ativa
        console.log('\n👤 TESTE 4: Verificando configurações após personalização');
        const configAtual = await userManager.obterParametrosTradingUsuario(4);
        console.log('📊 Configurações atuais:');
        console.log(`   ⚡ Alavancagem: ${configAtual.leverage}x`);
        console.log(`   🔻 Stop Loss: ${configAtual.stopLoss}%`);
        console.log(`   🎯 Take Profit: ${configAtual.takeProfit}%`);
        console.log(`   🎛️ Personalização: ${configAtual.isCustom ? 'ATIVA' : 'PADRÃO'}`);

        // Exemplo 5: Resetar para padrão
        console.log('\n👤 TESTE 5: Resetando para padrão');
        await userManager.resetarParametrosUsuario(4);
        const configResetada = await userManager.obterParametrosTradingUsuario(4);
        console.log('📊 Após reset:');
        console.log(`   ⚡ Alavancagem: ${configResetada.leverage}x`);
        console.log(`   🔻 Stop Loss: ${configResetada.stopLoss}%`);
        console.log(`   🎯 Take Profit: ${configResetada.takeProfit}%`);
        console.log(`   🎛️ Personalização: ${configResetada.isCustom ? 'ATIVA' : 'PADRÃO'}`);

        await userManager.finalizar();
    }

    async verificarEstadoFinal() {
        console.log('\n🔍 VERIFICAÇÃO FINAL DO ESTADO:');
        console.log('===============================');

        const usuarios = await this.pool.query(`
            SELECT 
                id, name, plan_type,
                custom_leverage, custom_stop_loss_percent, custom_take_profit_percent,
                custom_position_size_percent, allow_custom_params
            FROM users 
            WHERE name IS NOT NULL
            ORDER BY id
            LIMIT 10
        `);

        for (const user of usuarios.rows) {
            console.log(`\n👤 ${user.name} (${user.plan_type}):`);
            console.log(`   ⚡ Alavancagem: ${user.custom_leverage}x`);
            console.log(`   🔻 Stop Loss: ${user.custom_stop_loss_percent}%`);
            console.log(`   🎯 Take Profit: ${user.custom_take_profit_percent}%`);
            console.log(`   💰 Posição: ${user.custom_position_size_percent}%`);
            console.log(`   🎛️ Personalização: ${user.allow_custom_params ? 'ATIVA' : 'PADRÃO'}`);
        }

        // Estatísticas gerais
        const stats = await this.pool.query(`
            SELECT 
                COUNT(*) as total_usuarios,
                COUNT(*) FILTER (WHERE allow_custom_params = true) as usuarios_personalizados,
                COUNT(*) FILTER (WHERE allow_custom_params = false OR allow_custom_params IS NULL) as usuarios_padrao
            FROM users
        `);

        const { total_usuarios, usuarios_personalizados, usuarios_padrao } = stats.rows[0];
        
        console.log('\n📈 ESTATÍSTICAS FINAIS:');
        console.log('=======================');
        console.log(`👥 Total de usuários: ${total_usuarios}`);
        console.log(`🎛️ Com personalização: ${usuarios_personalizados}`);
        console.log(`📋 Usando padrão: ${usuarios_padrao}`);
        console.log(`📊 % Padrão: ${((usuarios_padrao / total_usuarios) * 100).toFixed(1)}%`);

        if (usuarios_padrao === parseInt(total_usuarios)) {
            console.log('✅ PERFEITO: Todos os usuários estão usando configurações PADRÃO!');
        }
    }
}

// Executar correção
if (require.main === module) {
    const corretor = new CorretorConfiguracoesPadrao();
    corretor.executarCorrecao().catch(console.error);
}

module.exports = CorretorConfiguracoesPadrao;
