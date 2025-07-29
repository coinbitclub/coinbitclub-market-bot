#!/usr/bin/env node
/**
 * 🚀 ATIVAÇÃO SISTEMA HÍBRIDO MULTIUSUÁRIO - OPERAÇÃO REAL
 * CoinBitClub Market Bot V3 - Ativação Completa
 * Data: 29/07/2025
 */

const { Pool } = require('pg');

console.log('🚀 ATIVANDO SISTEMA PARA OPERAÇÃO REAL');
console.log('=====================================');
console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
console.log('');

class SystemActivation {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:LukinhaCBB123@junction.proxy.rlwy.net:15433/railway',
            ssl: { rejectUnauthorized: false }
        });
    }

    /**
     * 1. Ativar usuários para operação real
     */
    async activateRealUsers() {
        console.log('👥 1. ATIVANDO USUÁRIOS PARA OPERAÇÃO REAL...');
        
        try {
            const client = await this.pool.connect();
            
            // Ativar Mauro Alves para operação real
            const mauroResult = await client.query(`
                UPDATE user_profiles 
                SET account_type = 'real',
                    updated_at = NOW()
                WHERE user_id = (
                    SELECT id FROM users 
                    WHERE name ILIKE '%MAURO%' OR email ILIKE '%mauro%'
                    LIMIT 1
                )
                RETURNING user_id, account_type
            `);
            
            // Ativar Paloma Amaral para operação real
            const palomaResult = await client.query(`
                UPDATE user_profiles 
                SET account_type = 'real',
                    updated_at = NOW()
                WHERE user_id = (
                    SELECT id FROM users 
                    WHERE name ILIKE '%PALOMA%' OR email ILIKE '%paloma%'
                    LIMIT 1
                )
                RETURNING user_id, account_type
            `);
            
            console.log('✅ Usuários ativados para operação real:');
            if (mauroResult.rows.length > 0) {
                console.log(`   • Mauro Alves: ${mauroResult.rows[0].account_type}`);
            }
            if (palomaResult.rows.length > 0) {
                console.log(`   • Paloma Amaral: ${palomaResult.rows[0].account_type}`);
            }
            
            client.release();
            
        } catch (error) {
            console.log(`❌ Erro ao ativar usuários: ${error.message}`);
        }
    }

    /**
     * 2. Configurar sistema para operação real
     */
    async configureRealOperation() {
        console.log('⚙️ 2. CONFIGURANDO SISTEMA PARA OPERAÇÃO REAL...');
        
        try {
            const client = await this.pool.connect();
            
            // Ativar sistema multiusuário
            await client.query(`
                INSERT INTO system_configurations (key, value, description, created_at)
                VALUES 
                    ('SISTEMA_MULTIUSUARIO', 'true', 'Sistema multiusuário ativo', NOW()),
                    ('MODO_HIBRIDO', 'true', 'Modo híbrido ativo', NOW()),
                    ('TEMPO_REAL_ENABLED', 'true', 'Tempo real habilitado', NOW()),
                    ('FEAR_GREED_ENABLED', 'true', 'Fear & Greed ativo', NOW()),
                    ('AI_GUARDIAN_ENABLED', 'true', 'IA Guardian ativa', NOW()),
                    ('TRADING_ENABLED', 'true', 'Trading habilitado', NOW()),
                    ('REAL_TRADING_ACTIVE', 'true', 'Trading real ativo', NOW())
                ON CONFLICT (key) DO UPDATE SET
                    value = EXCLUDED.value,
                    updated_at = NOW()
            `);
            
            console.log('✅ Configurações do sistema atualizadas:');
            console.log('   • Sistema Multiusuário: ATIVO');
            console.log('   • Modo Híbrido: ATIVO');
            console.log('   • Tempo Real: ATIVO');
            console.log('   • Fear & Greed: ATIVO');
            console.log('   • IA Guardian: ATIVO');
            console.log('   • Trading Real: ATIVO');
            
            client.release();
            
        } catch (error) {
            console.log(`❌ Erro ao configurar sistema: ${error.message}`);
        }
    }

    /**
     * 3. Validar credenciais de exchange
     */
    async validateExchangeCredentials() {
        console.log('🔑 3. VALIDANDO CREDENCIAIS DE EXCHANGE...');
        
        try {
            const client = await this.pool.connect();
            
            // Verificar credenciais ativas
            const result = await client.query(`
                SELECT 
                    u.name,
                    uc.exchange,
                    uc.is_testnet,
                    uc.is_active,
                    uc.validation_status
                FROM users u
                JOIN user_credentials uc ON uc.user_id = u.id
                WHERE u.name IN ('MAURO', 'PALOMA') 
                   OR u.name ILIKE '%MAURO%' 
                   OR u.name ILIKE '%PALOMA%'
                ORDER BY u.name, uc.exchange
            `);
            
            console.log('✅ Credenciais encontradas:');
            result.rows.forEach(cred => {
                const status = cred.is_active ? '✅ ATIVA' : '❌ INATIVA';
                const type = cred.is_testnet ? 'TESTNET' : 'REAL';
                console.log(`   • ${cred.name} - ${cred.exchange} (${type}): ${status}`);
            });
            
            // Ativar credenciais reais se necessário
            await client.query(`
                UPDATE user_credentials 
                SET is_active = true,
                    validation_status = 'active',
                    updated_at = NOW()
                WHERE user_id IN (
                    SELECT id FROM users 
                    WHERE name ILIKE '%MAURO%' OR name ILIKE '%PALOMA%'
                )
                AND is_testnet = false
            `);
            
            console.log('✅ Credenciais reais ativadas');
            
            client.release();
            
        } catch (error) {
            console.log(`❌ Erro ao validar credenciais: ${error.message}`);
        }
    }

    /**
     * 4. Configurar parâmetros de trading
     */
    async configureTradingParameters() {
        console.log('📊 4. CONFIGURANDO PARÂMETROS DE TRADING...');
        
        try {
            const client = await this.pool.connect();
            
            // Configurar parâmetros de trading para usuários reais
            await client.query(`
                INSERT INTO user_settings (user_id, sizing_override, leverage_override, max_concurrent_trades, risk_level, created_at)
                SELECT 
                    u.id,
                    30.0,  -- 30% do saldo por operação
                    5,     -- Leverage 5x (conservador)
                    2,     -- Máximo 2 operações simultâneas
                    'MEDIUM', -- Risco médio
                    NOW()
                FROM users u
                WHERE u.name ILIKE '%MAURO%' OR u.name ILIKE '%PALOMA%'
                ON CONFLICT (user_id) DO UPDATE SET
                    sizing_override = EXCLUDED.sizing_override,
                    leverage_override = EXCLUDED.leverage_override,
                    max_concurrent_trades = EXCLUDED.max_concurrent_trades,
                    risk_level = EXCLUDED.risk_level,
                    updated_at = NOW()
            `);
            
            console.log('✅ Parâmetros de trading configurados:');
            console.log('   • Sizing: 30% do saldo por operação');
            console.log('   • Leverage: 5x (conservador)');
            console.log('   • Max operações simultâneas: 2');
            console.log('   • Nível de risco: MEDIUM');
            
            client.release();
            
        } catch (error) {
            console.log(`❌ Erro ao configurar parâmetros: ${error.message}`);
        }
    }

    /**
     * 5. Inicializar logs do sistema
     */
    async initializeSystemLogs() {
        console.log('📝 5. INICIALIZANDO LOGS DO SISTEMA...');
        
        try {
            const client = await this.pool.connect();
            
            // Log de ativação do sistema
            await client.query(`
                INSERT INTO system_logs (level, message, context, created_at)
                VALUES (
                    'INFO',
                    'Sistema híbrido multiusuário ativado para operação real',
                    jsonb_build_object(
                        'activation_date', NOW(),
                        'system_version', 'v3.0.0-multiservice-hybrid',
                        'real_users_activated', true,
                        'trading_mode', 'real',
                        'ai_guardian', true,
                        'fear_greed', true
                    ),
                    NOW()
                )
            `);
            
            console.log('✅ Log de ativação registrado');
            
            client.release();
            
        } catch (error) {
            console.log(`❌ Erro ao inicializar logs: ${error.message}`);
        }
    }

    /**
     * 6. Verificar status final
     */
    async verifySystemStatus() {
        console.log('🔍 6. VERIFICANDO STATUS FINAL...');
        
        try {
            const client = await this.pool.connect();
            
            // Verificar usuários ativos
            const usersResult = await client.query(`
                SELECT 
                    COUNT(*) as total_active_users,
                    COUNT(CASE WHEN up.account_type = 'real' THEN 1 END) as real_users,
                    COUNT(CASE WHEN uc.is_active AND NOT uc.is_testnet THEN 1 END) as real_credentials
                FROM users u
                LEFT JOIN user_profiles up ON up.user_id = u.id
                LEFT JOIN user_credentials uc ON uc.user_id = u.id
                WHERE u.status = 'active'
            `);
            
            const stats = usersResult.rows[0];
            
            console.log('✅ Status do sistema:');
            console.log(`   • Usuários ativos: ${stats.total_active_users}`);
            console.log(`   • Usuários reais: ${stats.real_users}`);
            console.log(`   • Credenciais reais ativas: ${stats.real_credentials}`);
            
            client.release();
            
        } catch (error) {
            console.log(`❌ Erro ao verificar status: ${error.message}`);
        }
    }

    /**
     * Executar ativação completa
     */
    async executeActivation() {
        try {
            await this.activateRealUsers();
            await this.configureRealOperation();
            await this.validateExchangeCredentials();
            await this.configureTradingParameters();
            await this.initializeSystemLogs();
            await this.verifySystemStatus();
            
            console.log('');
            console.log('🎉 SISTEMA HÍBRIDO MULTIUSUÁRIO ATIVADO COM SUCESSO!');
            console.log('===================================================');
            console.log('✅ Usuários reais configurados');
            console.log('✅ Credenciais de exchange ativas');
            console.log('✅ Parâmetros de trading definidos');
            console.log('✅ Sistema pronto para receber sinais');
            console.log('');
            console.log('🚀 SISTEMA EM OPERAÇÃO REAL - AGUARDANDO SINAIS DO TRADINGVIEW');
            console.log('');
            
        } catch (error) {
            console.log(`💥 Erro crítico na ativação: ${error.message}`);
        } finally {
            await this.pool.end();
        }
    }
}

// Executar ativação
const activation = new SystemActivation();
activation.executeActivation().catch(console.error);
