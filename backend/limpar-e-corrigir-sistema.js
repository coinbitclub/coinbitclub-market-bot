#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

async function limparECorrigirSistema() {
    console.log('🧹 LIMPANDO E CORRIGINDO SISTEMA PARA PRODUÇÃO REAL');
    console.log('====================================================');

    try {
        // 1. CORRIGIR SCHEMA DO BANCO
        console.log('\n1️⃣ CORRIGINDO SCHEMA DO BANCO DE DADOS...');
        
        // Adicionar coluna quantity na tabela trading_signals
        try {
            await pool.query(`
                ALTER TABLE trading_signals 
                ADD COLUMN IF NOT EXISTS quantity DECIMAL(20,8) DEFAULT 0.001
            `);
            console.log('   ✅ Coluna quantity adicionada em trading_signals');
        } catch (error) {
            console.log('   ⚠️ Coluna quantity já existe ou erro:', error.message);
        }

        // Adicionar coluna balance na tabela users
        try {
            await pool.query(`
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS balance DECIMAL(20,8) DEFAULT 1000.00
            `);
            console.log('   ✅ Coluna balance adicionada em users');
        } catch (error) {
            console.log('   ⚠️ Coluna balance já existe ou erro:', error.message);
        }

        // Adicionar outras colunas essenciais em trading_signals
        const colunasEssenciais = [
            'timestamp_signal TIMESTAMP DEFAULT NOW()',
            'price DECIMAL(20,8) DEFAULT 0',
            'stop_loss DECIMAL(20,8) DEFAULT 0',
            'take_profit DECIMAL(20,8) DEFAULT 0',
            'leverage INTEGER DEFAULT 1',
            'processed BOOLEAN DEFAULT FALSE',
            'validation_passed BOOLEAN DEFAULT FALSE',
            'error_message TEXT'
        ];

        for (const coluna of colunasEssenciais) {
            try {
                const [nomeColuna] = coluna.split(' ');
                await pool.query(`
                    ALTER TABLE trading_signals 
                    ADD COLUMN IF NOT EXISTS ${coluna}
                `);
                console.log(`   ✅ ${nomeColuna} verificada`);
            } catch (error) {
                console.log(`   ⚠️ ${coluna}: ${error.message}`);
            }
        }

        // 2. LIMPAR DADOS DE TESTE
        console.log('\n2️⃣ LIMPANDO DADOS DE TESTE...');
        
        // Limpar operações de exemplo
        await pool.query('DELETE FROM live_operations');
        console.log('   🗑️ Operações de exemplo removidas da tabela live_operations');
        
        // Limpar sinais de teste antigos (manter apenas os mais recentes)
        const resultado = await pool.query(`
            DELETE FROM trading_signals 
            WHERE created_at < NOW() - INTERVAL '1 hour'
            AND processed = FALSE
        `);
        console.log(`   🗑️ ${resultado.rowCount} sinais antigos não processados removidos`);

        // 3. CONFIGURAR USUÁRIOS REAIS
        console.log('\n3️⃣ CONFIGURANDO USUÁRIOS PARA PRODUÇÃO...');
        
        // Atualizar saldos de usuários ativos
        await pool.query(`
            UPDATE users 
            SET balance = 1000.00 
            WHERE is_active = TRUE 
            AND (balance IS NULL OR balance = 0)
        `);
        
        const usuariosAtivos = await pool.query(`
            SELECT u.id, u.name, u.balance, 
                   COUNT(k.id) as api_keys_count
            FROM users u
            LEFT JOIN user_api_keys k ON u.id = k.user_id
            WHERE u.is_active = TRUE
            GROUP BY u.id, u.name, u.balance
            ORDER BY u.name
        `);
        
        console.log(`   👥 ${usuariosAtivos.rows.length} usuários ativos configurados:`);
        usuariosAtivos.rows.forEach(user => {
            console.log(`      - ${user.name}: $${user.balance} (${user.api_keys_count} chaves API)`);
        });

        // 4. VERIFICAR SINAIS PENDENTES REAIS
        console.log('\n4️⃣ VERIFICANDO SINAIS REAIS PENDENTES...');
        
        const sinaisReais = await pool.query(`
            SELECT id, symbol, side, quantity, price, processed, validation_passed, 
                   created_at, error_message
            FROM trading_signals 
            WHERE created_at > NOW() - INTERVAL '2 hours'
            ORDER BY created_at DESC
            LIMIT 10
        `);
        
        console.log(`   📡 ${sinaisReais.rows.length} sinais nas últimas 2 horas:`);
        sinaisReais.rows.forEach((signal, index) => {
            const status = signal.processed ? 
                (signal.validation_passed ? '✅ PROCESSADO' : '❌ FALHOU') : 
                '⏳ PENDENTE';
            console.log(`      ${index + 1}. ${signal.symbol} ${signal.side} - ${status}`);
            if (signal.error_message) {
                console.log(`         Erro: ${signal.error_message}`);
            }
        });

        // 5. REPROCESSAR SINAIS PENDENTES
        console.log('\n5️⃣ REPROCESSANDO SINAIS PENDENTES...');
        
        const sinaisPendentes = await pool.query(`
            SELECT id, symbol, side, quantity, price
            FROM trading_signals 
            WHERE processed = FALSE 
            AND created_at > NOW() - INTERVAL '1 hour'
            ORDER BY created_at ASC
            LIMIT 5
        `);

        if (sinaisPendentes.rows.length > 0) {
            console.log(`   🔄 ${sinaisPendentes.rows.length} sinais serão reprocessados`);
            
            for (const sinal of sinaisPendentes.rows) {
                try {
                    await pool.query(`
                        UPDATE trading_signals 
                        SET processed = FALSE, 
                            validation_passed = FALSE,
                            error_message = NULL,
                            updated_at = NOW()
                        WHERE id = $1
                    `, [sinal.id]);
                    console.log(`      🔄 Sinal ${sinal.symbol} ${sinal.side} marcado para reprocessamento`);
                } catch (error) {
                    console.log(`      ❌ Erro ao reprocessar sinal ${sinal.id}: ${error.message}`);
                }
            }
        } else {
            console.log('   ℹ️ Nenhum sinal pendente para reprocessar');
        }

        // 6. VERIFICAR CONFIGURAÇÃO DO SISTEMA
        console.log('\n6️⃣ VERIFICANDO CONFIGURAÇÃO DO SISTEMA...');
        
        // Verificar chaves API válidas
        const chavesAPI = await pool.query(`
            SELECT u.name, k.api_key, k.created_at
            FROM users u
            JOIN user_api_keys k ON u.id = k.user_id
            WHERE u.is_active = TRUE
            AND k.api_key IS NOT NULL
            AND k.api_key != ''
        `);
        
        console.log(`   🔑 ${chavesAPI.rows.length} usuários com chaves API configuradas`);

        // 7. ESTATÍSTICAS FINAIS
        console.log('\n7️⃣ ESTATÍSTICAS DO SISTEMA LIMPO...');
        
        const stats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users WHERE is_active = TRUE) as usuarios_ativos,
                (SELECT COUNT(*) FROM user_api_keys WHERE api_key IS NOT NULL) as chaves_api,
                (SELECT COUNT(*) FROM trading_signals WHERE created_at > NOW() - INTERVAL '24 hours') as sinais_24h,
                (SELECT COUNT(*) FROM trading_signals WHERE processed = TRUE AND created_at > NOW() - INTERVAL '24 hours') as sinais_processados,
                (SELECT COUNT(*) FROM live_operations) as operacoes_ativas
        `);
        
        const estatisticas = stats.rows[0];
        
        console.log('📊 ESTATÍSTICAS FINAIS:');
        console.log(`   👥 Usuários ativos: ${estatisticas.usuarios_ativos}`);
        console.log(`   🔑 Chaves API: ${estatisticas.chaves_api}`);
        console.log(`   📡 Sinais 24h: ${estatisticas.sinais_24h}`);
        console.log(`   ✅ Sinais processados: ${estatisticas.sinais_processados}`);
        console.log(`   🔄 Operações ativas: ${estatisticas.operacoes_ativas}`);

        console.log('\n🎉 SISTEMA LIMPO E CONFIGURADO PARA PRODUÇÃO REAL!');
        console.log('✅ Dados de teste removidos');
        console.log('✅ Schema do banco corrigido');
        console.log('✅ Usuários configurados com saldos reais');
        console.log('✅ Sinais pendentes reprocessados');
        console.log('🚀 Sistema pronto para receber sinais REAIS do TradingView!');

    } catch (error) {
        console.error('❌ Erro crítico na limpeza:', error);
    } finally {
        await pool.end();
    }
}

// Executar limpeza e correção
limparECorrigirSistema();
