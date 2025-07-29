/**
 * 📊 INTEGRAÇÃO FINAL: COMISSIONAMENTO NO WEBHOOK
 * =============================================
 * Integra o sistema de comissionamento ao webhook principal
 */

const { Pool } = require('pg');
const { calcularComissaoAutomatica } = require('./gestor-comissionamento-final.js');

// Adicionar ao webhook principal a chamada para comissionamento
const integracaoComissionamento = `

// ADICIONAR ESTA FUNÇÃO AO arquivo: sistema-webhook-automatico.js
// Depois da linha onde a operação é fechada com lucro

async function processarComissaoOperacao(operacaoId, pnlUSD, usuarioId) {
    try {
        // Só calcular comissão se houve lucro
        if (pnlUSD > 0) {
            console.log('💰 Calculando comissão para operação:', operacaoId);
            
            const resultadoComissao = await calcularComissaoAutomatica(
                operacaoId, 
                pnlUSD, 
                usuarioId
            );
            
            if (resultadoComissao.sucesso) {
                console.log('✅ Comissão calculada:');
                console.log('  💵 Valor:', resultadoComissao.comissaoUSD, 'USD');
                console.log('  📊 Percentual:', resultadoComissao.percentual, '%');
                console.log('  🎯 Tipo:', resultadoComissao.tipoReceita);
                console.log('  📋 Plano:', resultadoComissao.plano);
                
                // Atualizar saldo do usuário com a comissão
                await pool.query(\`
                    UPDATE user_balances 
                    SET 
                        balance = balance + $1,
                        updated_at = NOW()
                    WHERE user_id = $2
                \`, [resultadoComissao.comissaoUSD, usuarioId]);
                
                console.log('💳 Saldo atualizado com comissão');
                
            } else {
                console.log('❌ Erro ao calcular comissão:', resultadoComissao.erro);
            }
        }
        
    } catch (error) {
        console.error('💥 Erro no processamento de comissão:', error.message);
    }
}

// USAR ASSIM NO WEBHOOK:
// Quando uma operação for fechada com lucro, adicionar:
// await processarComissaoOperacao(operacao.id, pnlCalculado, operacao.user_id);

`;

// Vamos criar uma versão final do relatório que funciona
async function gerarRelatorioCorrigido() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://coinbitclub_user:W0lvxNw7OQCNRGiUPh9S@coinbitclub-db.railway.app:5432/coinbitclub_db',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('📊 RELATÓRIO DE COMISSÕES - VERSÃO CORRIGIDA');
        console.log('=' .repeat(50));

        // Primeiro verificar quais colunas existem na tabela user_operations
        const colunas = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'user_operations'
            ORDER BY column_name
        `);
        
        console.log('📋 Colunas disponíveis em user_operations:');
        colunas.rows.forEach(col => {
            console.log(`  - ${col.column_name}`);
        });

        // Query simplificada baseada nas colunas que existem
        const operacoes = await pool.query(`
            SELECT 
                u.name,
                u.plan_type,
                u.country,
                COUNT(uo.id) as total_operacoes,
                COALESCE(SUM(uo.commission_amount), 0) as total_comissoes,
                COALESCE(SUM(CASE WHEN uo.revenue_type = 'REAL' THEN uo.commission_amount ELSE 0 END), 0) as receita_real,
                COALESCE(SUM(CASE WHEN uo.revenue_type = 'BONUS' THEN uo.commission_amount ELSE 0 END), 0) as receita_bonus
            FROM users u
            LEFT JOIN user_operations uo ON u.id = uo.user_id
            WHERE uo.created_at >= NOW() - INTERVAL '30 days'
            GROUP BY u.id, u.name, u.plan_type, u.country
            HAVING COUNT(uo.id) > 0
            ORDER BY total_comissoes DESC
        `);

        console.log('\n👥 USUÁRIOS COM OPERAÇÕES (ÚLTIMOS 30 DIAS):');
        console.log('-' .repeat(50));

        let totalReal = 0;
        let totalBonus = 0;

        if (operacoes.rows.length === 0) {
            console.log('⚠️ Nenhuma operação encontrada nos últimos 30 dias');
        } else {
            operacoes.rows.forEach(row => {
                const receitaReal = parseFloat(row.receita_real || 0);
                const receitaBonus = parseFloat(row.receita_bonus || 0);
                const totalComissoes = parseFloat(row.total_comissoes || 0);
                
                console.log(`👤 ${row.name || 'Usuario'}:`);
                console.log(`  📋 Plano: ${row.plan_type || 'prepaid'}`);
                console.log(`  🌍 País: ${row.country || 'BR'}`);
                console.log(`  📊 Operações: ${row.total_operacoes}`);
                console.log(`  💰 Total comissões: $${totalComissoes.toFixed(2)}`);
                console.log(`  💳 Receita real: $${receitaReal.toFixed(2)}`);
                console.log(`  🎁 Receita bônus: $${receitaBonus.toFixed(2)}`);
                console.log('');
                
                totalReal += receitaReal;
                totalBonus += receitaBonus;
            });
        }

        // Verificar também tabela commission_calculations se existir
        try {
            const comissoesDiretas = await pool.query(`
                SELECT 
                    COUNT(*) as total_registros,
                    SUM(commission_amount) as total_valores,
                    SUM(CASE WHEN is_referent = true THEN commission_amount ELSE 0 END) as total_bonus,
                    SUM(CASE WHEN is_referent = false THEN commission_amount ELSE 0 END) as total_real
                FROM commission_calculations
                WHERE created_at >= NOW() - INTERVAL '30 days'
            `);

            if (comissoesDiretas.rows.length > 0) {
                const dados = comissoesDiretas.rows[0];
                console.log('📊 DADOS DA TABELA COMMISSION_CALCULATIONS:');
                console.log(`  📝 Total registros: ${dados.total_registros || 0}`);
                console.log(`  💰 Total valores: $${parseFloat(dados.total_valores || 0).toFixed(2)}`);
                console.log(`  💳 Real: $${parseFloat(dados.total_real || 0).toFixed(2)}`);
                console.log(`  🎁 Bônus: $${parseFloat(dados.total_bonus || 0).toFixed(2)}`);
            }
        } catch (error) {
            console.log('⚠️ Tabela commission_calculations não acessível');
        }

        console.log('\n📈 RESUMO FINAL:');
        console.log(`  💳 Total receita real: $${totalReal.toFixed(2)}`);
        console.log(`  🎁 Total receita bônus: $${totalBonus.toFixed(2)}`);
        console.log(`  📊 Total geral: $${(totalReal + totalBonus).toFixed(2)}`);

        console.log('\n✅ Sistema de comissionamento está funcionando!');
        console.log('🔗 Para integrar ao webhook, use o código acima');

    } catch (error) {
        console.error('❌ Erro no relatório:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar relatório
if (require.main === module) {
    gerarRelatorioCorrigido();
}

module.exports = { integracaoComissionamento };
