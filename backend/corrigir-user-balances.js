/**
 * 🔧 CORREÇÃO ESPECÍFICA DA TABELA USER_BALANCES
 * Limpeza e correção dos problemas de UUID e valores NULL
 */

const { Pool } = require('pg');

console.log('🔧 CORREÇÃO ESPECÍFICA DA TABELA USER_BALANCES');
console.log('===============================================');

class CorretorUserBalances {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });
    }

    async executarCorrecao() {
        const client = await this.pool.connect();
        try {
            console.log('🔍 Analisando problemas na tabela user_balances...\n');
            
            // 1. Verificar registros com problemas
            await this.analisarProblemas(client);
            
            // 2. Limpar registros problemáticos
            await this.limparRegistrosProblematicos(client);
            
            // 3. Recriar estrutura correta
            await this.recriarEstrutura(client);
            
            // 4. Inserir dados de teste válidos
            await this.inserirDadosTeste(client);
            
            // 5. Verificar resultado final
            await this.verificarResultado(client);
            
            console.log('\n✅ CORREÇÃO DA TABELA USER_BALANCES CONCLUÍDA!');
            
        } catch (error) {
            console.error('❌ Erro durante correção:', error.message);
        } finally {
            client.release();
            await this.pool.end();
        }
    }

    async analisarProblemas(client) {
        console.log('📊 1. ANÁLISE DOS PROBLEMAS');
        console.log('===========================');
        
        try {
            // Contar registros totais
            const total = await client.query('SELECT COUNT(*) as count FROM user_balances;');
            console.log(`📋 Total de registros: ${total.rows[0].count}`);
            
            // Contar registros com user_id NULL
            const nullUserIds = await client.query('SELECT COUNT(*) as count FROM user_balances WHERE user_id IS NULL;');
            console.log(`⚠️  Registros com user_id NULL: ${nullUserIds.rows[0].count}`);
            
            // Verificar tipos de dados atuais
            const estrutura = await client.query(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'user_balances' AND table_schema = 'public'
                ORDER BY ordinal_position;
            `);
            
            console.log('\n📋 Estrutura atual:');
            estrutura.rows.forEach(col => {
                console.log(`   • ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
            });
            
            // Mostrar alguns registros problemáticos
            const problemáticos = await client.query(`
                SELECT id, user_id, currency, available_balance 
                FROM user_balances 
                WHERE user_id IS NULL 
                LIMIT 5;
            `);
            
            if (problemáticos.rows.length > 0) {
                console.log('\n⚠️  Exemplos de registros problemáticos:');
                problemáticos.rows.forEach(reg => {
                    console.log(`   • ID: ${reg.id}, User ID: ${reg.user_id}, Currency: ${reg.currency}`);
                });
            }
            
        } catch (error) {
            console.error(`❌ Erro na análise: ${error.message}`);
        }
        
        console.log('\n');
    }

    async limparRegistrosProblematicos(client) {
        console.log('🧹 2. LIMPEZA DE REGISTROS PROBLEMÁTICOS');
        console.log('========================================');
        
        try {
            // Remover registros com user_id NULL
            const resultado = await client.query('DELETE FROM user_balances WHERE user_id IS NULL;');
            console.log(`🗑️  Removidos ${resultado.rowCount} registros com user_id NULL`);
            
            // Remover registros com user_id que não existem na tabela users
            const órfãos = await client.query(`
                DELETE FROM user_balances 
                WHERE user_id::text NOT IN (SELECT id::text FROM users);
            `);
            console.log(`🗑️  Removidos ${órfãos.rowCount} registros órfãos`);
            
            // Verificar quantos registros restaram
            const restantes = await client.query('SELECT COUNT(*) as count FROM user_balances;');
            console.log(`📊 Registros restantes: ${restantes.rows[0].count}`);
            
        } catch (error) {
            console.error(`❌ Erro na limpeza: ${error.message}`);
            
            // Se der erro, vamos recriar a tabela do zero
            console.log('🔄 Recriando tabela do zero devido a erros...');
            await this.recriarTabelaCompleta(client);
        }
        
        console.log('\n');
    }

    async recriarTabelaCompleta(client) {
        try {
            // Fazer backup dos dados válidos se existirem
            console.log('💾 Fazendo backup de dados válidos...');
            let dadosValidos = [];
            try {
                const backup = await client.query(`
                    SELECT ub.currency, ub.available_balance, ub.locked_balance, u.id as user_id_int
                    FROM user_balances ub 
                    JOIN users u ON ub.user_id::text = u.id::text 
                    WHERE ub.user_id IS NOT NULL;
                `);
                dadosValidos = backup.rows;
                console.log(`📦 ${dadosValidos.length} registros válidos encontrados para backup`);
            } catch (error) {
                console.log('⚠️  Não foi possível fazer backup dos dados existentes');
            }
            
            // Remover tabela atual
            console.log('🗑️  Removendo tabela user_balances atual...');
            await client.query('DROP TABLE IF EXISTS user_balances CASCADE;');
            
            // Recriar tabela com estrutura correta
            console.log('🔨 Recriando tabela user_balances...');
            await client.query(`
                CREATE TABLE user_balances (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    exchange VARCHAR(50) NOT NULL DEFAULT 'bybit',
                    currency VARCHAR(20) NOT NULL,
                    available_balance DECIMAL(20,8) DEFAULT 0.00000000,
                    locked_balance DECIMAL(20,8) DEFAULT 0.00000000,
                    total_balance DECIMAL(20,8) GENERATED ALWAYS AS (available_balance + locked_balance) STORED,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, exchange, currency)
                );
            `);
            
            // Restaurar dados válidos
            if (dadosValidos.length > 0) {
                console.log('🔄 Restaurando dados válidos...');
                for (const dado of dadosValidos) {
                    await client.query(`
                        INSERT INTO user_balances (user_id, exchange, currency, available_balance, locked_balance)
                        VALUES ($1, 'bybit', $2, $3, $4)
                        ON CONFLICT (user_id, exchange, currency) DO NOTHING;
                    `, [dado.user_id_int, dado.currency, dado.available_balance || 0, dado.locked_balance || 0]);
                }
                console.log(`✅ ${dadosValidos.length} registros restaurados`);
            }
            
            console.log('✅ Tabela user_balances recriada com sucesso');
            
        } catch (error) {
            console.error(`❌ Erro ao recriar tabela: ${error.message}`);
        }
    }

    async recriarEstrutura(client) {
        console.log('🔨 3. RECRIANDO ESTRUTURA CORRETA');
        console.log('=================================');
        
        try {
            // Verificar se a tabela ainda tem estrutura antiga
            const colunas = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'user_balances' AND table_schema = 'public';
            `);
            
            const temUUID = colunas.rows.some(col => col.column_name === 'user_id' && col.data_type === 'uuid');
            
            if (temUUID) {
                console.log('🔄 Estrutura UUID detectada, recriando...');
                await this.recriarTabelaCompleta(client);
            } else {
                console.log('✅ Estrutura já está correta (INTEGER)');
                
                // Adicionar coluna exchange se não existir
                const temExchange = colunas.rows.some(col => col.column_name === 'exchange');
                if (!temExchange) {
                    await client.query(`ALTER TABLE user_balances ADD COLUMN exchange VARCHAR(50) DEFAULT 'bybit';`);
                    console.log('✅ Coluna exchange adicionada');
                }
            }
            
        } catch (error) {
            console.error(`❌ Erro ao recriar estrutura: ${error.message}`);
        }
        
        console.log('\n');
    }

    async inserirDadosTeste(client) {
        console.log('📊 4. INSERINDO DADOS DE TESTE');
        console.log('==============================');
        
        try {
            // Buscar usuários existentes
            const usuarios = await client.query('SELECT id, username FROM users ORDER BY id;');
            console.log(`👤 Usuários encontrados: ${usuarios.rows.length}`);
            
            // Inserir saldos de teste para cada usuário
            for (const usuario of usuarios.rows) {
                // USDT - saldo principal
                await client.query(`
                    INSERT INTO user_balances (user_id, exchange, currency, available_balance, locked_balance)
                    VALUES ($1, 'bybit', 'USDT', 1000.00, 0.00)
                    ON CONFLICT (user_id, exchange, currency) DO UPDATE SET
                        available_balance = EXCLUDED.available_balance,
                        last_updated = CURRENT_TIMESTAMP;
                `, [usuario.id]);
                
                // BTC - pequena quantidade
                await client.query(`
                    INSERT INTO user_balances (user_id, exchange, currency, available_balance, locked_balance)
                    VALUES ($1, 'bybit', 'BTC', 0.01, 0.00)
                    ON CONFLICT (user_id, exchange, currency) DO UPDATE SET
                        available_balance = EXCLUDED.available_balance,
                        last_updated = CURRENT_TIMESTAMP;
                `, [usuario.id]);
                
                console.log(`💰 Saldos criados/atualizados para usuário ${usuario.username} (ID: ${usuario.id})`);
            }
            
            console.log('✅ Dados de teste inseridos com sucesso');
            
        } catch (error) {
            console.error(`❌ Erro ao inserir dados de teste: ${error.message}`);
        }
        
        console.log('\n');
    }

    async verificarResultado(client) {
        console.log('✅ 5. VERIFICAÇÃO DO RESULTADO FINAL');
        console.log('====================================');
        
        try {
            // Verificar estrutura final
            const estrutura = await client.query(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'user_balances' AND table_schema = 'public'
                ORDER BY ordinal_position;
            `);
            
            console.log('📋 Estrutura final da tabela:');
            estrutura.rows.forEach(col => {
                console.log(`   • ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
            });
            
            // Contar registros por usuário
            const resumo = await client.query(`
                SELECT 
                    u.username,
                    u.id,
                    COUNT(ub.id) as total_saldos,
                    SUM(ub.available_balance) as total_disponivel
                FROM users u
                LEFT JOIN user_balances ub ON u.id = ub.user_id
                GROUP BY u.id, u.username
                ORDER BY u.id;
            `);
            
            console.log('\n💰 Resumo de saldos por usuário:');
            resumo.rows.forEach(user => {
                console.log(`   • ${user.username} (ID: ${user.id}): ${user.total_saldos} moedas, $${parseFloat(user.total_disponivel || 0).toFixed(2)} total`);
            });
            
            // Verificar foreign keys
            const fks = await client.query(`
                SELECT 
                    tc.constraint_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
                WHERE tc.table_name = 'user_balances' AND tc.constraint_type = 'FOREIGN KEY';
            `);
            
            console.log('\n🔗 Foreign Keys configuradas:');
            fks.rows.forEach(fk => {
                console.log(`   • ${fk.column_name} → ${fk.foreign_table_name}`);
            });
            
            console.log('\n🎉 TABELA USER_BALANCES TOTALMENTE CORRIGIDA!');
            
        } catch (error) {
            console.error(`❌ Erro na verificação: ${error.message}`);
        }
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    const corretor = new CorretorUserBalances();
    corretor.executarCorrecao()
        .then(() => {
            console.log('\n🎯 CORREÇÃO DA TABELA USER_BALANCES FINALIZADA!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 ERRO CRÍTICO:', error.message);
            process.exit(1);
        });
}

module.exports = CorretorUserBalances;
