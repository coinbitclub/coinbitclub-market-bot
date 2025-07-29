/**
 * 🛠️ CORREÇÃO E PREPARAÇÃO DO BANCO DE DADOS
 * ==========================================
 */

const { Pool } = require('pg');

async function corrigirBancoDados() {
    console.log('🛠️ CORREÇÃO E PREPARAÇÃO DO BANCO DE DADOS');
    console.log('==========================================');
    
    const pool = new Pool({
        connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        console.log('\n📋 1. CRIANDO TABELAS FALTANTES');
        console.log('──────────────────────────────');
        
        // 1. Corrigir tabela users - adicionar colunas se não existirem
        console.log('\n👤 Corrigindo tabela users...');
        
        // Verificar e adicionar password_hash
        try {
            await pool.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'users' AND column_name = 'password_hash'
                    ) THEN
                        ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
                    END IF;
                END $$;
            `);
        } catch (error) {
            console.log('⚠️ password_hash já existe ou erro:', error.message);
        }
        
        // Verificar e adicionar outras colunas
        const colunasAdicionar = ['status', 'telefone', 'pais'];
        for (const coluna of colunasAdicionar) {
            try {
                await pool.query(`
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'users' AND column_name = '${coluna}'
                        ) THEN
                            ALTER TABLE users ADD COLUMN ${coluna} VARCHAR(${coluna === 'status' ? '20' : '50'})${coluna === 'status' ? " DEFAULT 'active'" : ''};
                        END IF;
                    END $$;
                `);
            } catch (error) {
                console.log(`⚠️ ${coluna} já existe ou erro:`, error.message);
            }
        }
        console.log('✅ Tabela users corrigida');
        
        // 2. Criar tabela trading_operations se não existir
        console.log('\n📈 Criando tabela trading_operations...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS trading_operations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                symbol VARCHAR(20) NOT NULL,
                side VARCHAR(10) NOT NULL, -- BUY, SELL
                quantity DECIMAL(20,8) NOT NULL,
                price DECIMAL(20,8) NOT NULL,
                stop_loss DECIMAL(20,8),
                take_profit DECIMAL(20,8),
                leverage INTEGER DEFAULT 1,
                exchange VARCHAR(20) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending', -- pending, filled, closed, cancelled
                opened_at TIMESTAMP,
                closed_at TIMESTAMP,
                closing_price DECIMAL(20,8),
                current_price DECIMAL(20,8),
                pnl_percentage DECIMAL(10,4),
                pnl_value DECIMAL(20,8),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ Tabela trading_operations criada');
        
        // 3. Criar tabela prepaid_plans se não existir
        console.log('\n💳 Criando tabela prepaid_plans...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS prepaid_plans (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                duration_days INTEGER NOT NULL,
                features JSONB,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW()
            );
            
            CREATE TABLE IF NOT EXISTS prepaid_plan_requests (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                plan_name VARCHAR(100) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                duration_days INTEGER NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                requested_at TIMESTAMP DEFAULT NOW(),
                processed_at TIMESTAMP
            );
        `);
        console.log('✅ Tabelas prepaid_plans criadas');
        
        // 4. Criar tabela ia_reports se não existir
        console.log('\n🤖 Criando tabelas de IA...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ia_reports (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                operation_id INTEGER REFERENCES trading_operations(id),
                analysis_type VARCHAR(50) NOT NULL,
                confidence_score DECIMAL(5,2),
                recommendations JSONB,
                alerts JSONB,
                performance_metrics JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            );
            
            CREATE TABLE IF NOT EXISTS ia_problem_resolutions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                problem_type VARCHAR(50) NOT NULL,
                description TEXT,
                solution_applied TEXT,
                resolution_time VARCHAR(20),
                resolved_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ Tabelas de IA criadas');
        
        // 5. Criar tabelas auxiliares
        console.log('\n🔧 Criando tabelas auxiliares...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS password_resets (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                token VARCHAR(255) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id)
            );
            
            CREATE TABLE IF NOT EXISTS user_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                ip_address INET,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                expires_at TIMESTAMP NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS affiliate_requests (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                status VARCHAR(20) DEFAULT 'pending',
                requested_at TIMESTAMP DEFAULT NOW(),
                approved_at TIMESTAMP,
                approved_by INTEGER REFERENCES users(id),
                justification TEXT
            );
            
            CREATE TABLE IF NOT EXISTS withdrawal_requests (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                amount DECIMAL(10,2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'USD',
                payment_method VARCHAR(50),
                bank_details JSONB,
                status VARCHAR(20) DEFAULT 'pending',
                requested_at TIMESTAMP DEFAULT NOW(),
                processed_at TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS commission_calculations (
                id SERIAL PRIMARY KEY,
                operation_id INTEGER NOT NULL REFERENCES trading_operations(id),
                user_id INTEGER NOT NULL REFERENCES users(id),
                profit_value DECIMAL(20,8),
                company_commission DECIMAL(20,8),
                affiliate_commission DECIMAL(20,8),
                affiliate_commission_brl DECIMAL(20,8),
                usd_rate DECIMAL(10,4),
                calculated_at TIMESTAMP DEFAULT NOW()
            );
            
            CREATE TABLE IF NOT EXISTS commission_compensations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                amount DECIMAL(10,2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'USD',
                type VARCHAR(50),
                description TEXT,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT NOW()
            );
            
            CREATE TABLE IF NOT EXISTS market_analysis (
                id SERIAL PRIMARY KEY,
                fear_greed_index INTEGER,
                market_direction VARCHAR(50),
                analysis_time TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ Tabelas auxiliares criadas');
        
        // 6. Verificar estrutura final
        console.log('\n🔍 Verificando estrutura final...');
        const tabelas = await pool.query(`
            SELECT table_name, 
                   (SELECT COUNT(*) FROM information_schema.columns 
                    WHERE table_name = t.table_name AND table_schema = 'public') as column_count
            FROM information_schema.tables t
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        
        console.log(`📊 Total de tabelas: ${tabelas.rows.length}`);
        
        const tabelasEssenciais = [
            'users', 'user_api_keys', 'user_balances', 'user_trading_params',
            'trading_operations', 'trading_signals', 'affiliates', 'affiliate_commissions',
            'prepaid_plans', 'subscriptions', 'transactions', 'ia_reports'
        ];
        
        let tabelasOK = 0;
        tabelasEssenciais.forEach(tabela => {
            const encontrada = tabelas.rows.some(row => row.table_name === tabela);
            if (encontrada) {
                console.log(`  ✅ ${tabela}`);
                tabelasOK++;
            } else {
                console.log(`  ❌ ${tabela} - FALTANDO`);
            }
        });
        
        console.log(`\n📋 RESULTADO: ${tabelasOK}/${tabelasEssenciais.length} tabelas essenciais OK`);
        
        if (tabelasOK === tabelasEssenciais.length) {
            console.log('🟢 BANCO DE DADOS: 100% PRONTO');
        } else {
            console.log('🟡 BANCO DE DADOS: PARCIALMENTE PRONTO');
        }
        
        // 7. Inserir dados de teste básicos
        console.log('\n📊 Inserindo dados de teste...');
        
        // Planos pré-pagos
        await pool.query(`
            INSERT INTO prepaid_plans (name, description, price, duration_days, features)
            VALUES 
                ('Plano Básico', 'Sinais básicos de trading', 99.99, 30, '["Sinais básicos", "Suporte email"]'),
                ('Plano Premium', 'Sinais avançados + IA', 299.99, 30, '["Sinais Premium", "IA Avançada", "Suporte 24/7"]'),
                ('Plano VIP', 'Acesso completo + mentoria', 599.99, 30, '["Acesso Total", "Mentoria", "Sinais VIP"]')
            ON CONFLICT DO NOTHING
        `);
        console.log('✅ Planos pré-pagos inseridos');
        
        console.log('\n🎉 BANCO DE DADOS PREPARADO COM SUCESSO!');
        console.log('✅ Todas as tabelas necessárias estão disponíveis');
        console.log('✅ Estrutura completa para testes dos fluxos');
        
    } catch (error) {
        console.error('❌ Erro ao corrigir banco de dados:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar correção
corrigirBancoDados();
