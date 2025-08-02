#!/usr/bin/env node

/**
 * 🔧 CORRETOR DE SCHEMA DA TABELA USERS
 * 
 * Este script adiciona as colunas necessárias na tabela users
 * e cria os gestores corretamente
 */

const { Pool } = require('pg');

// Conexão PostgreSQL Railway
const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function corrigirSchemaUsers() {
    console.log('🔧 CORRETOR DE SCHEMA DA TABELA USERS');
    console.log('=====================================');
    console.log(`📅 ${new Date().toLocaleDateString('pt-BR')} - ${new Date().toLocaleTimeString('pt-BR')}`);
    console.log('');

    try {
        // 1. Verificar estrutura atual da tabela users
        console.log('🔍 Verificando estrutura atual da tabela users...');
        
        const colunas = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        `);

        console.log('📊 Colunas atuais:');
        colunas.rows.forEach(col => {
            console.log(`   📋 ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
        });

        // 2. Adicionar colunas necessárias se não existirem
        const colunasNecessarias = [
            {
                nome: 'user_type',
                tipo: 'VARCHAR(20)',
                padrao: "'user'",
                descricao: 'Tipo do usuário (user, admin, gestor)'
            },
            {
                nome: 'role',
                tipo: 'VARCHAR(50)',
                padrao: "'USER'",
                descricao: 'Função do usuário no sistema'
            },
            {
                nome: 'last_login',
                tipo: 'TIMESTAMP',
                padrao: 'NOW()',
                descricao: 'Último login do usuário'
            },
            {
                nome: 'vip_status',
                tipo: 'BOOLEAN',
                padrao: 'false',
                descricao: 'Status VIP do usuário'
            }
        ];

        console.log('');
        console.log('🔨 Adicionando colunas necessárias...');

        for (const coluna of colunasNecessarias) {
            try {
                const existe = colunas.rows.find(c => c.column_name === coluna.nome);
                
                if (!existe) {
                    console.log(`   ➕ Adicionando coluna ${coluna.nome}...`);
                    
                    await pool.query(`
                        ALTER TABLE users 
                        ADD COLUMN ${coluna.nome} ${coluna.tipo} DEFAULT ${coluna.padrao}
                    `);
                    
                    console.log(`   ✅ ${coluna.nome}: Adicionada (${coluna.descricao})`);
                } else {
                    console.log(`   ✅ ${coluna.nome}: Já existe`);
                }
            } catch (error) {
                console.log(`   ⚠️ ${coluna.nome}: Erro - ${error.message}`);
            }
        }

        // 3. Criar os gestores com as colunas corretas
        console.log('');
        console.log('👨‍💼 Criando gestores do sistema...');

        const gestores = [
            {
                name: 'signals_manager',
                email: 'signals@coinbitclub.com',
                password: 'gestor_signals_2025',
                user_type: 'admin',
                role: 'SIGNALS_MANAGER',
                status: 'active'
            },
            {
                name: 'operations_manager',
                email: 'operations@coinbitclub.com',
                password: 'gestor_operations_2025',
                user_type: 'admin',
                role: 'OPERATIONS_MANAGER',
                status: 'active'
            },
            {
                name: 'fear_greed_manager',
                email: 'feargreed@coinbitclub.com',
                password: 'gestor_feargreed_2025',
                user_type: 'admin',
                role: 'FEAR_GREED_MANAGER',
                status: 'active'
            },
            {
                name: 'financial_supervisor',
                email: 'financial@coinbitclub.com',
                password: 'supervisor_financial_2025',
                user_type: 'admin',
                role: 'FINANCIAL_SUPERVISOR',
                status: 'active'
            },
            {
                name: 'trade_supervisor',
                email: 'trade@coinbitclub.com',
                password: 'supervisor_trade_2025',
                user_type: 'admin',
                role: 'TRADE_SUPERVISOR',
                status: 'active'
            },
            {
                name: 'users_manager',
                email: 'users@coinbitclub.com',
                password: 'gestor_users_2025',
                user_type: 'admin',
                role: 'USERS_MANAGER',
                status: 'active'
            },
            {
                name: 'risk_manager',
                email: 'risk@coinbitclub.com',
                password: 'gestor_risk_2025',
                user_type: 'admin',
                role: 'RISK_MANAGER',
                status: 'active'
            },
            {
                name: 'analytics_manager',
                email: 'analytics@coinbitclub.com',
                password: 'gestor_analytics_2025',
                user_type: 'admin',
                role: 'ANALYTICS_MANAGER',
                status: 'active'
            }
        ];

        for (const gestor of gestores) {
            try {
                // Verificar se gestor já existe
                const existe = await pool.query(`
                    SELECT id FROM users WHERE name = $1 OR email = $2
                `, [gestor.name, gestor.email]);

                if (existe.rows.length === 0) {
                    console.log(`   👤 Criando ${gestor.name}...`);
                    
                    await pool.query(`
                        INSERT INTO users (
                            name, email, password, user_type, role, status, 
                            vip_status, last_login, created_at, updated_at
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, 
                            true, NOW(), NOW(), NOW()
                        )
                    `, [
                        gestor.name,
                        gestor.email,
                        gestor.password,
                        gestor.user_type,
                        gestor.role,
                        gestor.status
                    ]);
                    
                    console.log(`   ✅ ${gestor.name}: Criado com sucesso`);
                } else {
                    console.log(`   ✅ ${gestor.name}: Já existe`);
                    
                    // Atualizar dados se necessário
                    await pool.query(`
                        UPDATE users 
                        SET user_type = $1, role = $2, status = $3, updated_at = NOW()
                        WHERE name = $4
                    `, [gestor.user_type, gestor.role, gestor.status, gestor.name]);
                    
                    console.log(`   🔄 ${gestor.name}: Dados atualizados`);
                }
            } catch (error) {
                console.log(`   ❌ ${gestor.name}: Erro - ${error.message}`);
            }
        }

        // 4. Verificar resultado final
        console.log('');
        console.log('📊 Verificação final...');
        
        const gestoresFinais = await pool.query(`
            SELECT name, email, user_type, role, status 
            FROM users 
            WHERE user_type = 'admin'
            ORDER BY name
        `);

        console.log(`📈 Total de gestores: ${gestoresFinais.rows.length}`);
        gestoresFinais.rows.forEach(g => {
            console.log(`   👨‍💼 ${g.name}: ${g.role} (${g.status})`);
        });

        console.log('');
        console.log('✅ Schema da tabela users corrigido com sucesso!');
        console.log('🎉 Todos os gestores foram criados!');

    } catch (error) {
        console.error('❌ Erro ao corrigir schema:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

// Executar correção
if (require.main === module) {
    corrigirSchemaUsers().catch(error => {
        console.error('❌ ERRO FATAL:', error.message);
        process.exit(1);
    });
}

module.exports = corrigirSchemaUsers;
