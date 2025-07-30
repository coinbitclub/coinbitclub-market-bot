#!/usr/bin/env node

/**
 * 🎯 DEMONSTRAÇÃO REAL - CONFIGURAÇÕES PERSONALIZADAS
 * 
 * Demonstra como usuários reais podem configurar seus parâmetros:
 * - Luiza Maria (VIP) - Afiliado com personalização
 * - Paloma Amaral (Standard) - Usuário normal com padrões
 * - Érica dos Santos (Premium) - Usuário com saldo alto
 * - Mauro Alves (Premium) - Usuário experiente
 */

const UserManager = require('./user-manager-v2');

class DemonstracaoConfiguracoesReais {
    constructor() {
        this.userManager = new UserManager();
    }

    async executarDemonstracao() {
        console.log('🎯 DEMONSTRAÇÃO REAL - CONFIGURAÇÕES PERSONALIZADAS');
        console.log('===================================================');
        
        await this.userManager.inicializar();
        
        // Obter usuários reais do banco
        const usuariosReais = await this.obterUsuariosReais();
        
        // Demonstrar configurações para cada usuário
        for (const usuario of usuariosReais) {
            await this.demonstrarConfiguracaoUsuario(usuario);
        }

        await this.userManager.finalizar();
    }

    async obterUsuariosReais() {
        const result = await this.userManager.pool.query(`
            SELECT 
                id, name, email, plan_type, balance_usd, credit_bonus,
                vip_status, affiliate_level, commission_rate
            FROM users 
            WHERE name IS NOT NULL 
              AND (balance_usd > 0 OR name ILIKE '%luiza%' OR name ILIKE '%paloma%')
            ORDER BY balance_usd DESC
        `);

        return result.rows;
    }

    async demonstrarConfiguracaoUsuario(usuario) {
        console.log(`\n👤 USUÁRIO: ${usuario.name}`);
        console.log('═'.repeat(60));
        console.log(`📧 Email: ${usuario.email}`);
        console.log(`🏷️  Plano: ${usuario.plan_type.toUpperCase()}`);
        console.log(`💰 Saldo: $${parseFloat(usuario.balance_usd || 0).toFixed(2)}`);
        console.log(`🎁 Bônus: $${parseFloat(usuario.credit_bonus || 0).toFixed(2)}`);
        console.log(`⭐ VIP: ${usuario.vip_status ? 'Sim' : 'Não'}`);
        console.log(`👥 Afiliado: ${usuario.affiliate_level} (${(parseFloat(usuario.commission_rate || 0) * 100).toFixed(1)}%)`);

        // 1. Mostrar configurações padrão atuais
        console.log('\n📊 CONFIGURAÇÕES ATUAIS:');
        const configAtual = await this.userManager.obterParametrosTradingUsuario(usuario.id);
        this.mostrarConfiguracao(configAtual);

        // 2. Tentar personalização baseada no plano
        await this.tentarPersonalizacao(usuario);

        // 3. Simular operação com configurações
        await this.simularOperacaoUsuario(usuario);
    }

    mostrarConfiguracao(config) {
        console.log(`   ⚡ Alavancagem: ${config.leverage}x`);
        console.log(`   🔻 Stop Loss: ${config.stopLoss}%`);
        console.log(`   🎯 Take Profit: ${config.takeProfit}%`);
        console.log(`   💰 Tamanho posição: ${config.positionSize}%`);
        console.log(`   🎛️  Personalização: ${config.isCustom ? 'Ativa' : 'Padrão'}`);
        console.log(`   📋 Plano: ${config.planType}`);
    }

    async tentarPersonalizacao(usuario) {
        console.log('\n⚙️ TESTANDO PERSONALIZAÇÃO:');
        
        // Configurações diferentes baseadas no plano
        let configTeste;
        
        switch (usuario.plan_type) {
            case 'standard':
                configTeste = {
                    leverage: 3,
                    stopLoss: 8,
                    takeProfit: 12,
                    positionSize: 25,
                    riskManagement: 'conservative'
                };
                console.log('📝 Tentativa (Standard): Configuração conservadora');
                break;
                
            case 'vip':
                configTeste = {
                    leverage: 8,
                    stopLoss: 12,
                    takeProfit: 25,
                    positionSize: 45,
                    riskManagement: 'moderate'
                };
                console.log('📝 Tentativa (VIP): Configuração moderada');
                break;
                
            case 'premium':
                configTeste = {
                    leverage: 15,
                    stopLoss: 18,
                    takeProfit: 40,
                    positionSize: 60,
                    riskManagement: 'aggressive'
                };
                console.log('📝 Tentativa (Premium): Configuração agressiva');
                break;
                
            case 'elite':
                configTeste = {
                    leverage: 30,
                    stopLoss: 25,
                    takeProfit: 75,
                    positionSize: 80,
                    riskManagement: 'expert'
                };
                console.log('📝 Tentativa (Elite): Configuração expert');
                break;
                
            default:
                configTeste = {
                    leverage: 5,
                    stopLoss: 10,
                    takeProfit: 15,
                    positionSize: 30,
                    riskManagement: 'conservative'
                };
                break;
        }

        console.log(`   ⚡ Solicitado - Alavancagem: ${configTeste.leverage}x`);
        console.log(`   🔻 Solicitado - Stop Loss: ${configTeste.stopLoss}%`);
        console.log(`   🎯 Solicitado - Take Profit: ${configTeste.takeProfit}%`);
        console.log(`   💰 Solicitado - Posição: ${configTeste.positionSize}%`);

        try {
            const configAplicada = await this.userManager.configurarParametrosTradingUsuario(
                usuario.id, 
                configTeste
            );
            
            console.log('\n✅ CONFIGURAÇÃO APLICADA:');
            this.mostrarConfiguracao(configAplicada);
            
            // Mostrar diferenças
            this.mostrarAjustes(configTeste, configAplicada);
            
        } catch (error) {
            console.log(`\n❌ PERSONALIZAÇÃO BLOQUEADA: ${error.message}`);
            console.log('💡 Usando configurações padrão do sistema');
        }
    }

    mostrarAjustes(solicitado, aplicado) {
        const ajustes = [];
        
        if (solicitado.leverage !== aplicado.leverage) {
            ajustes.push(`Alavancagem: ${solicitado.leverage}x → ${aplicado.leverage}x`);
        }
        if (solicitado.stopLoss !== aplicado.stopLoss) {
            ajustes.push(`Stop Loss: ${solicitado.stopLoss}% → ${aplicado.stopLoss}%`);
        }
        if (solicitado.takeProfit !== aplicado.takeProfit) {
            ajustes.push(`Take Profit: ${solicitado.takeProfit}% → ${aplicado.takeProfit}%`);
        }
        if (solicitado.positionSize !== aplicado.positionSize) {
            ajustes.push(`Posição: ${solicitado.positionSize}% → ${aplicado.positionSize}%`);
        }

        if (ajustes.length > 0) {
            console.log('\n⚠️ AJUSTES APLICADOS (limites do plano):');
            ajustes.forEach(ajuste => console.log(`   📝 ${ajuste}`));
        } else {
            console.log('\n✅ Todas as configurações aceitas sem ajustes');
        }
    }

    async simularOperacaoUsuario(usuario) {
        console.log('\n🧮 SIMULAÇÃO DE OPERAÇÃO REAL:');
        
        const saldo = parseFloat(usuario.balance_usd || 0) + parseFloat(usuario.credit_bonus || 0);
        const config = await this.userManager.obterParametrosTradingUsuario(usuario.id);
        
        if (saldo === 0) {
            console.log('   ⚠️ Usuário sem saldo - operação em TESTNET');
            return;
        }

        const precoEntrada = 45000; // Bitcoin exemplo
        const valorOperacao = (saldo * config.positionSize) / 100;
        const quantidade = valorOperacao / precoEntrada;
        
        // Calcular TP/SL
        const takeProfitPrice = precoEntrada * (1 + (config.takeProfit / 100));
        const stopLossPrice = precoEntrada * (1 - (config.stopLoss / 100));
        
        // Calcular lucros/perdas potenciais
        const lucroTP = valorOperacao * config.leverage * (config.takeProfit / 100);
        const prejuizoSL = valorOperacao * config.leverage * (config.stopLoss / 100);
        
        // Calcular comissão do afiliado (se aplicável)
        const comissaoAfiliado = lucroTP * parseFloat(usuario.commission_rate || 0);

        console.log(`   💰 Saldo total: $${saldo.toFixed(2)} (principal + bônus)`);
        console.log(`   📈 Preço entrada: $${precoEntrada.toLocaleString()}`);
        console.log(`   📊 Valor operação: $${valorOperacao.toFixed(2)} (${config.positionSize}%)`);
        console.log(`   📏 Quantidade: ${quantidade.toFixed(6)} BTC`);
        console.log(`   ⚡ Alavancagem: ${config.leverage}x`);
        console.log(`   🎯 Take Profit: $${takeProfitPrice.toLocaleString()} (+${config.takeProfit}%)`);
        console.log(`   🔻 Stop Loss: $${stopLossPrice.toLocaleString()} (-${config.stopLoss}%)`);
        console.log(`   💵 Lucro potencial: +$${lucroTP.toFixed(2)}`);
        console.log(`   💸 Risco máximo: -$${prejuizoSL.toFixed(2)}`);
        console.log(`   ⚖️ Relação R/R: 1:${(lucroTP / prejuizoSL).toFixed(2)}`);
        
        if (comissaoAfiliado > 0) {
            console.log(`   💼 Comissão afiliado: $${comissaoAfiliado.toFixed(2)} (${(parseFloat(usuario.commission_rate) * 100).toFixed(1)}%)`);
        }
    }
}

// Executar demonstração
if (require.main === module) {
    const demo = new DemonstracaoConfiguracoesReais();
    demo.executarDemonstracao().catch(console.error);
}

module.exports = DemonstracaoConfiguracoesReais;
