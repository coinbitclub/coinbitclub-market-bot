/**
 * 🔍 VERIFICAR CONFIGURAÇÕES DE TRADING PADRÃO
 * 
 * Buscar as configurações padrão do sistema de trading
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function verificarConfiguracoesPadrao() {
    try {
        console.log('🔍 VERIFICANDO CONFIGURAÇÕES DE TRADING PADRÃO');
        console.log('='.repeat(60));
        
        // 1. Verificar se existe tabela de configurações
        const checkConfigTable = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'trading_config'
            );
        `;
        
        const configTableExists = await pool.query(checkConfigTable);
        console.log(`📊 Tabela trading_config existe: ${configTableExists.rows[0].exists}`);
        
        // 2. Verificar se existe tabela de parâmetros de usuário
        const checkParamsTable = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'user_trading_params'
            );
        `;
        
        const paramsTableExists = await pool.query(checkParamsTable);
        console.log(`📊 Tabela user_trading_params existe: ${paramsTableExists.rows[0].exists}`);
        
        // 3. Buscar configurações existentes
        if (paramsTableExists.rows[0].exists) {
            console.log('\n📋 PARÂMETROS EXISTENTES DE USUÁRIOS:');
            
            const existingParams = `
                SELECT 
                    u.name,
                    u.email,
                    utp.*
                FROM user_trading_params utp
                INNER JOIN users u ON u.id = utp.user_id
                ORDER BY utp.created_at DESC;
            `;
            
            const params = await pool.query(existingParams);
            
            if (params.rows.length > 0) {
                params.rows.forEach((param, index) => {
                    console.log(`\n${index + 1}. 👤 ${param.name} (${param.email})`);
                    console.log(`   📈 Take Profit: ${param.take_profit_percent}%`);
                    console.log(`   📉 Stop Loss: ${param.stop_loss_percent}%`);
                    console.log(`   💵 Min Trade: $${param.min_trade_amount}`);
                    console.log(`   💰 Max Trade: $${param.max_trade_amount}`);
                    console.log(`   📊 Max Trades/Dia: ${param.max_daily_trades}`);
                    console.log(`   🛡️ Max Perda/Dia: $${param.max_daily_loss}`);
                    console.log(`   🕒 Horário: ${param.trading_start_time} - ${param.trading_end_time}`);
                    console.log(`   🌍 Timezone: ${param.timezone}`);
                    console.log(`   📅 Criado: ${param.created_at}`);
                });
            } else {
                console.log('   ℹ️ Nenhum parâmetro configurado ainda');
            }
        }
        
        // 4. Verificar arquivos de configuração do sistema
        console.log('\n📁 BUSCANDO ARQUIVOS DE CONFIGURAÇÃO...');
        
        const fs = require('fs');
        const path = require('path');
        
        const configFiles = [
            'config.json',
            'trading-config.json', 
            'default-settings.json',
            'parametros-default.json',
            'gestor-chaves-parametrizacoes.js'
        ];
        
        configFiles.forEach(file => {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                console.log(`   ✅ Encontrado: ${file}`);
                try {
                    if (file.endsWith('.json')) {
                        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        console.log(`      📊 Conteúdo:`, JSON.stringify(content, null, 2));
                    }
                } catch (error) {
                    console.log(`      ⚠️ Erro ao ler ${file}: ${error.message}`);
                }
            } else {
                console.log(`   ❌ Não encontrado: ${file}`);
            }
        });
        
        // 5. Sugerir configurações padrão baseadas no sistema
        console.log('\n💡 CONFIGURAÇÕES SUGERIDAS BASEADAS NO SISTEMA:');
        console.log('─'.repeat(50));
        
        console.log('📈 Take Profit: 1.5% (padrão conservador)');
        console.log('📉 Stop Loss: 0.8% (padrão conservador)');
        console.log('💵 Min Trade: R$ 20 (valor mínimo seguro)');
        console.log('💰 Max Trade: R$ 100 (20% do saldo inicial R$ 500)');
        console.log('📊 Max Trades/Dia: 5 (conservador para iniciantes)');
        console.log('🛡️ Max Perda/Dia: R$ 50 (10% do saldo inicial)');
        console.log('🕒 Horário: 09:30 - 16:30 (horário ativo do mercado)');
        console.log('🌍 Timezone: America/Sao_Paulo');
        console.log('⏱️ Cooldown após perda: 600 segundos (10 min)');
        console.log('🎯 Meta lucro/dia: R$ 75 (15% do saldo)');
        
        console.log('\n❓ AGUARDANDO CONFIRMAÇÃO DAS CONFIGURAÇÕES CORRETAS...');
        
    } catch (error) {
        console.error('❌ Erro ao verificar configurações:', error.message);
    } finally {
        await pool.end();
    }
}

verificarConfiguracoesPadrao();
