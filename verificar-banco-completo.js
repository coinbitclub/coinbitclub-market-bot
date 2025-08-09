/**
 * 🔧 VERIFICAÇÃO COMPLETA DO BANCO DE DADOS
 * 
 * Script para verificar todas as tabelas e estrutura necessária
 * para o sistema CoinBitClub funcionar a 100%
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 VERIFICAÇÃO COMPLETA DO BANCO DE DADOS');
console.log('=========================================');

async function verificarEstruturaBanco() {
    try {
        // 1. Verificar conexão
        console.log('\n📊 1. TESTANDO CONEXÃO:');
        const connectionTest = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
        console.log('✅ Conexão estabelecida com sucesso');
        console.log(`   🕐 Hora atual: ${connectionTest.rows[0].current_time}`);
        console.log(`   📊 PostgreSQL: ${connectionTest.rows[0].postgres_version.split(' ')[1]}`);

        // 2. Listar todas as tabelas
        console.log('\n📋 2. TABELAS EXISTENTES:');
        const tablesQuery = `
            SELECT schemaname, tablename, tableowner 
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename;
        `;
        const tables = await pool.query(tablesQuery);
        
        console.log(`   📊 Total de tabelas: ${tables.rows.length}`);
        tables.rows.forEach((table, index) => {
            console.log(`   ${index + 1}. ${table.tablename} (owner: ${table.tableowner})`);
        });

        // 3. Verificar tabelas essenciais
        console.log('\n🎯 3. VERIFICAÇÃO DE TABELAS ESSENCIAIS:');
        const tabelasEssenciais = [
            'users',
            'user_api_keys', 
            'signals',
            'btc_dominance'
        ];

        const tabelasExistentes = tables.rows.map(t => t.tablename);
        
        for (const tabela of tabelasEssenciais) {
            if (tabelasExistentes.includes(tabela)) {
                console.log(`   ✅ ${tabela} - EXISTE`);
                
                // Contar registros
                const count = await pool.query(`SELECT COUNT(*) as total FROM ${tabela}`);
                console.log(`      📊 Registros: ${count.rows[0].total}`);
                
                // Mostrar estrutura
                const estrutura = await pool.query(`
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_name = $1 AND table_schema = 'public'
                    ORDER BY ordinal_position;
                `, [tabela]);
                
                console.log(`      📋 Colunas: ${estrutura.rows.length}`);
                estrutura.rows.forEach(col => {
                    console.log(`         • ${col.column_name} (${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''})`);
                });
                
            } else {
                console.log(`   ❌ ${tabela} - NÃO EXISTE`);
            }
        }

        // 4. Verificar dados dos usuários
        console.log('\n👥 4. VERIFICAÇÃO DE USUÁRIOS:');
        try {
            const usuarios = await pool.query(`
                SELECT id, name, email, user_type, is_active, created_at
                FROM users 
                ORDER BY created_at DESC
                LIMIT 10;
            `);
            
            console.log(`   📊 Total de usuários: ${usuarios.rows.length}`);
            usuarios.rows.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.name} (${user.email})`);
                console.log(`      🆔 ID: ${user.id}`);
                console.log(`      👤 Tipo: ${user.user_type || 'N/A'}`);
                console.log(`      ✅ Ativo: ${user.is_active}`);
                console.log(`      📅 Criado: ${new Date(user.created_at).toLocaleDateString('pt-BR')}`);
            });
        } catch (error) {
            console.log(`   ❌ Erro ao verificar usuários: ${error.message}`);
        }

        // 5. Verificar chaves API
        console.log('\n🔑 5. VERIFICAÇÃO DE CHAVES API:');
        try {
            const chaves = await pool.query(`
                SELECT uak.*, u.name as user_name
                FROM user_api_keys uak
                LEFT JOIN users u ON uak.user_id = u.id
                ORDER BY uak.created_at DESC;
            `);
            
            console.log(`   📊 Total de chaves: ${chaves.rows.length}`);
            chaves.rows.forEach((chave, index) => {
                console.log(`   ${index + 1}. ${chave.user_name || 'Usuário desconhecido'}`);
                console.log(`      🏢 Exchange: ${chave.exchange}`);
                console.log(`      🌍 Ambiente: ${chave.environment}`);
                console.log(`      ✅ Ativa: ${chave.is_active}`);
                console.log(`      📊 Status: ${chave.validation_status || 'Não validada'}`);
            });
        } catch (error) {
            console.log(`   ❌ Erro ao verificar chaves: ${error.message}`);
        }

        // 6. Verificar sinais
        console.log('\n📈 6. VERIFICAÇÃO DE SINAIS:');
        try {
            const sinais = await pool.query(`
                SELECT strategy, action, COUNT(*) as total,
                       MAX(created_at) as ultimo_sinal
                FROM signals 
                GROUP BY strategy, action
                ORDER BY ultimo_sinal DESC;
            `);
            
            console.log(`   📊 Tipos de sinais: ${sinais.rows.length}`);
            sinais.rows.forEach((sinal, index) => {
                console.log(`   ${index + 1}. ${sinal.strategy} - ${sinal.action}`);
                console.log(`      📊 Total: ${sinal.total}`);
                console.log(`      🕐 Último: ${new Date(sinal.ultimo_sinal).toLocaleString('pt-BR')}`);
            });
        } catch (error) {
            console.log(`   ❌ Erro ao verificar sinais: ${error.message}`);
        }

        // 7. Verificar dominância BTC
        console.log('\n₿ 7. VERIFICAÇÃO DE DOMINÂNCIA BTC:');
        try {
            const dominancia = await pool.query(`
                SELECT COUNT(*) as total,
                       MAX(timestamp) as ultimo_update,
                       AVG(btc_dominance) as dominancia_media
                FROM btc_dominance 
                WHERE timestamp > NOW() - INTERVAL '24 hours';
            `);
            
            if (dominancia.rows[0].total > 0) {
                console.log(`   📊 Registros (24h): ${dominancia.rows[0].total}`);
                console.log(`   🕐 Último update: ${new Date(dominancia.rows[0].ultimo_update).toLocaleString('pt-BR')}`);
                console.log(`   📈 Dominância média: ${parseFloat(dominancia.rows[0].dominancia_media).toFixed(2)}%`);
            } else {
                console.log('   ❌ Nenhum dado de dominância nas últimas 24h');
            }
        } catch (error) {
            console.log(`   ❌ Erro ao verificar dominância: ${error.message}`);
        }

        // 8. Criar tabelas faltantes
        console.log('\n🔧 8. CRIANDO TABELAS FALTANTES:');
        
        // Tabela de dominância BTC (se não existir)
        if (!tabelasExistentes.includes('btc_dominance')) {
            console.log('   🔄 Criando tabela btc_dominance...');
            await pool.query(`
                CREATE TABLE btc_dominance (
                    id SERIAL PRIMARY KEY,
                    ticker VARCHAR(20) DEFAULT 'BTC.D',
                    btc_dominance DECIMAL(5,2) NOT NULL,
                    ema_7 DECIMAL(5,2),
                    diff_pct DECIMAL(6,3),
                    sinal VARCHAR(10),
                    timestamp TIMESTAMP DEFAULT NOW(),
                    raw_data JSONB,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `);
            console.log('   ✅ Tabela btc_dominance criada');
        }

        // Tabela de sinais CoinBitClub detalhada (se não existir)
        if (!tabelasExistentes.includes('coinbitclub_signals')) {
            console.log('   🔄 Criando tabela coinbitclub_signals...');
            await pool.query(`
                CREATE TABLE coinbitclub_signals (
                    id SERIAL PRIMARY KEY,
                    signal_id INTEGER REFERENCES signals(id),
                    symbol VARCHAR(20),
                    signal_type VARCHAR(50),
                    signal_strength VARCHAR(20),
                    diff_btc_ema7 DECIMAL(10,4),
                    ema9_30 DECIMAL(15,8),
                    rsi_4h DECIMAL(5,2),
                    rsi_15 DECIMAL(5,2),
                    momentum_15 DECIMAL(15,8),
                    atr_30 DECIMAL(15,8),
                    atr_pct_30 DECIMAL(5,2),
                    volume_30 DECIMAL(20,8),
                    volume_ma_30 DECIMAL(20,8),
                    crossed_above_ema9 BOOLEAN,
                    crossed_below_ema9 BOOLEAN,
                    golden_cross_30 BOOLEAN,
                    death_cross_30 BOOLEAN,
                    source_time TIMESTAMP,
                    raw_data JSONB,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `);
            console.log('   ✅ Tabela coinbitclub_signals criada');
        }

        // 9. Resumo e recomendações
        console.log('\n📊 9. RESUMO E STATUS:');
        console.log('=====================');
        
        const statusSistema = {
            banco_conectado: true,
            usuarios_existem: tabelasExistentes.includes('users'),
            chaves_api_existem: tabelasExistentes.includes('user_api_keys'),
            sinais_existem: tabelasExistentes.includes('signals'),
            dominancia_existe: tabelasExistentes.includes('btc_dominance'),
            coinbitclub_detalhado: tabelasExistentes.includes('coinbitclub_signals')
        };

        Object.entries(statusSistema).forEach(([item, status]) => {
            console.log(`   ${status ? '✅' : '❌'} ${item.replace(/_/g, ' ')}: ${status ? 'OK' : 'PENDENTE'}`);
        });

        const problemas = Object.values(statusSistema).filter(s => !s).length;
        
        if (problemas === 0) {
            console.log('\n🎉 SISTEMA 100% CONFIGURADO!');
            console.log('   ✅ Todas as tabelas essenciais existem');
            console.log('   ✅ Banco de dados está pronto');
            console.log('   ✅ CoinBitClub pode funcionar a 100%');
        } else {
            console.log(`\n⚠️ SISTEMA ${Math.round(((Object.keys(statusSistema).length - problemas) / Object.keys(statusSistema).length) * 100)}% CONFIGURADO`);
            console.log(`   🔧 ${problemas} item(s) precisam de atenção`);
        }

    } catch (error) {
        console.error('❌ Erro na verificação:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

// Executar verificação
verificarEstruturaBanco().catch(console.error);
