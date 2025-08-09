#!/usr/bin/env node

/**
 * 🎯 VERIFICAÇÃO FINAL DO SISTEMA ENTERPRISE
 * ==========================================
 * 
 * Script para verificar status completo do sistema após migração
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
    ssl: { rejectUnauthorized: false }
});

async function verificarSistemaCompleto() {
    console.log('🎯 VERIFICAÇÃO FINAL DO SISTEMA ENTERPRISE');
    console.log('==========================================');

    try {
        // 1. Verificar tabelas enterprise
        console.log('\n📋 ESTRUTURA DO BANCO DE DADOS');
        console.log('==============================');

        const tabelas = await pool.query(`
            SELECT 
                table_name,
                (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as colunas
            FROM information_schema.tables t
            WHERE table_schema = 'public' 
            AND (table_name LIKE '%exchange%' OR table_name LIKE '%balance%' OR table_name LIKE '%enterprise%')
            ORDER BY table_name
        `);

        for (const tabela of tabelas.rows) {
            console.log(`  ✅ ${tabela.table_name.padEnd(35)} (${tabela.colunas} colunas)`);
        }

        // 2. Verificar usuários migrados
        console.log('\n👥 USUÁRIOS MIGRADOS');
        console.log('===================');

        const usuariosMigrados = await pool.query(`
            SELECT 
                u.id,
                u.username,
                u.email,
                COUNT(uec.id) as total_conexoes,
                COUNT(CASE WHEN uec.is_active = true THEN 1 END) as conexoes_ativas,
                STRING_AGG(uec.exchange || '_' || uec.environment, ', ') as exchanges
            FROM users u
            LEFT JOIN user_exchange_connections uec ON u.id = uec.user_id
            WHERE u.is_active = true
            GROUP BY u.id, u.username, u.email
            HAVING COUNT(uec.id) > 0
            ORDER BY u.id
        `);

        if (usuariosMigrados.rows.length > 0) {
            for (const user of usuariosMigrados.rows) {
                console.log(`  👤 ID ${user.id}: ${user.username}`);
                console.log(`     📧 ${user.email}`);
                console.log(`     🔗 ${user.total_conexoes} conexões (${user.conexoes_ativas} ativas)`);
                console.log(`     📊 Exchanges: ${user.exchanges || 'Nenhuma'}`);
                console.log('');
            }
        } else {
            console.log('  ⚠️ Nenhum usuário encontrado com conexões enterprise');
        }

        // 3. Verificar status das exchanges
        console.log('\n🏥 STATUS DAS EXCHANGES');
        console.log('======================');

        const healthStatus = await pool.query(`
            SELECT 
                exchange,
                environment,
                status,
                response_time_ms,
                error_message,
                last_check,
                CASE 
                    WHEN last_check > NOW() - INTERVAL '5 minutes' THEN '🟢 FRESH'
                    WHEN last_check > NOW() - INTERVAL '30 minutes' THEN '🟡 STALE'
                    ELSE '🔴 OUTDATED'
                END as freshness
            FROM exchange_health_monitoring
            ORDER BY exchange, environment
        `);

        for (const status of healthStatus.rows) {
            console.log(`  ${status.freshness} ${status.exchange} ${status.environment}: ${status.status}`);
            if (status.response_time_ms) {
                console.log(`     ⏱️ Tempo resposta: ${status.response_time_ms}ms`);
            }
            if (status.error_message) {
                console.log(`     ❌ Erro: ${status.error_message.substring(0, 80)}...`);
            }
            console.log(`     🕐 Última verificação: ${new Date(status.last_check).toLocaleString()}`);
            console.log('');
        }

        // 4. Verificar logs de operações
        console.log('\n📊 LOGS DE OPERAÇÕES ENTERPRISE');
        console.log('===============================');

        const logs = await pool.query(`
            SELECT 
                operation_type,
                COUNT(*) as total,
                COUNT(CASE WHEN success = true THEN 1 END) as sucessos,
                COUNT(CASE WHEN success = false THEN 1 END) as erros,
                ROUND(AVG(execution_time_ms), 2) as tempo_medio_ms
            FROM enterprise_operation_logs
            WHERE created_at > NOW() - INTERVAL '24 hours'
            GROUP BY operation_type
            ORDER BY total DESC
        `);

        if (logs.rows.length > 0) {
            for (const log of logs.rows) {
                const taxa = ((log.sucessos / log.total) * 100).toFixed(1);
                console.log(`  📋 ${log.operation_type}:`);
                console.log(`     📊 Total: ${log.total} | ✅ Sucessos: ${log.sucessos} | ❌ Erros: ${log.erros}`);
                console.log(`     📈 Taxa sucesso: ${taxa}% | ⏱️ Tempo médio: ${log.tempo_medio_ms}ms`);
                console.log('');
            }
        } else {
            console.log('  ℹ️ Nenhuma operação registrada nas últimas 24h');
        }

        // 5. Verificar views
        console.log('\n📊 VIEWS ENTERPRISE');
        console.log('==================');

        const viewSummary = await pool.query(`
            SELECT * FROM v_user_exchange_summary
            WHERE total_connections > 0
            ORDER BY total_balance_usd DESC
        `);

        if (viewSummary.rows.length > 0) {
            for (const summary of viewSummary.rows) {
                console.log(`  👤 ${summary.username} (${summary.plan_type})`);
                console.log(`     🔗 ${summary.total_connections} conexões (${summary.active_connections} ativas)`);
                console.log(`     📊 Exchanges: ${summary.exchanges || 'Nenhuma'}`);
                console.log(`     💰 Saldo total: $${summary.total_balance_usd || '0.00'} USD`);
                if (summary.last_validation) {
                    console.log(`     🕐 Última validação: ${new Date(summary.last_validation).toLocaleString()}`);
                }
                console.log('');
            }
        } else {
            console.log('  ℹ️ Nenhum usuário na view de summary');
        }

        // 6. Verificar integridade
        console.log('\n🔍 VERIFICAÇÃO DE INTEGRIDADE');
        console.log('============================');

        const integridade = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users WHERE is_active = true) as total_usuarios_ativos,
                (SELECT COUNT(*) FROM user_exchange_connections) as total_conexoes,
                (SELECT COUNT(*) FROM user_exchange_connections WHERE is_active = true) as conexoes_ativas,
                (SELECT COUNT(DISTINCT user_id) FROM user_exchange_connections) as usuarios_com_conexoes,
                (SELECT COUNT(*) FROM exchange_health_monitoring) as exchanges_monitoradas,
                (SELECT COUNT(*) FROM enterprise_operation_logs) as total_logs
        `);

        const stats = integridade.rows[0];
        console.log(`  👥 Usuários ativos: ${stats.total_usuarios_ativos}`);
        console.log(`  🔗 Total de conexões: ${stats.total_conexoes}`);
        console.log(`  ✅ Conexões ativas: ${stats.conexoes_ativas}`);
        console.log(`  👤 Usuários com conexões: ${stats.usuarios_com_conexoes}`);
        console.log(`  📊 Exchanges monitoradas: ${stats.exchanges_monitoradas}`);
        console.log(`  📋 Total de logs: ${stats.total_logs}`);

        // 7. Verificar arquivos de sistema
        console.log('\n📁 ARQUIVOS DO SISTEMA ENTERPRISE');
        console.log('=================================');

        const fs = require('fs');
        const path = require('path');

        const arquivosEssenciais = [
            'enterprise-exchange-connector.js',
            'enterprise-exchange-orchestrator.js',
            'enterprise-integration-manager.js',
            'create-enterprise-tables.js',
            'test-enterprise-system.js',
            'app.js'
        ];

        for (const arquivo of arquivosEssenciais) {
            const caminho = path.join(__dirname, arquivo);
            if (fs.existsSync(caminho)) {
                const stats = fs.statSync(caminho);
                const tamanho = Math.round(stats.size / 1024);
                console.log(`  ✅ ${arquivo.padEnd(35)} (${tamanho}KB)`);
            } else {
                console.log(`  ❌ ${arquivo.padEnd(35)} (AUSENTE)`);
            }
        }

        // 8. Resumo final
        console.log('\n🎯 RESUMO FINAL');
        console.log('==============');

        const resumo = {
            estrutura: tabelas.rows.length > 0,
            usuarios: usuariosMigrados.rows.length > 0,
            exchanges: healthStatus.rows.length > 0,
            arquivos: true
        };

        const totalChecks = Object.keys(resumo).length;
        const passedChecks = Object.values(resumo).filter(Boolean).length;
        const taxa = ((passedChecks / totalChecks) * 100).toFixed(1);

        console.log(`  📊 Verificações: ${passedChecks}/${totalChecks} (${taxa}%)`);
        console.log(`  ✅ Estrutura do banco: ${resumo.estrutura ? 'OK' : 'FALHA'}`);
        console.log(`  👥 Usuários migrados: ${resumo.usuarios ? 'OK' : 'PENDENTE'}`);
        console.log(`  🏥 Monitoramento exchanges: ${resumo.exchanges ? 'OK' : 'FALHA'}`);
        console.log(`  📁 Arquivos sistema: ${resumo.arquivos ? 'OK' : 'FALHA'}`);

        if (taxa >= 75) {
            console.log('\n🎉 SISTEMA ENTERPRISE OPERACIONAL!');
            console.log('✅ Pronto para produção');
        } else {
            console.log('\n⚠️ SISTEMA PRECISA DE AJUSTES');
            console.log('❌ Não está pronto para produção');
        }

    } catch (error) {
        console.error('\n❌ Erro na verificação:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    verificarSistemaCompleto()
        .then(() => {
            console.log('\n✅ VERIFICAÇÃO CONCLUÍDA!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 ERRO:', error.message);
            process.exit(1);
        });
}

module.exports = { verificarSistemaCompleto };
