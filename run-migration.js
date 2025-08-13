const { Pool } = require('pg');
const fs = require('fs');

// Configuração de conexão Railway com a string correta
const pool = new Pool({
    connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigration() {
    let client;
    
    try {
        console.log('🚀 Iniciando migração enterprise professional...');
        
        // Conectar ao banco
        client = await pool.connect();
        console.log('✅ Conectado ao Railway Database');
        
        // Ler arquivo de migração CORRIGIDO
        const migrationSQL = fs.readFileSync('./database/migration-enterprise-v6-fixed.sql', 'utf8');
        console.log('📄 Script de migração carregado (' + migrationSQL.length + ' caracteres)');
        
        // Executar migração
        console.log('⚡ Executando migração...');
        await client.query(migrationSQL);
        console.log('✅ Migração executada com sucesso!');
        
        // Verificar resultados
        console.log('🔍 Verificando tabelas criadas...');
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%enterprise%'
            ORDER BY table_name
        `);
        
        console.log('📊 Tabelas enterprise criadas:');
        tables.rows.forEach(row => console.log('   ✓', row.table_name));
        
        // Verificar planos
        console.log('💰 Verificando planos...');
        const plans = await client.query('SELECT plan_code, name, monthly_price, currency FROM plans_enterprise ORDER BY plan_code');
        console.log('📋 Planos configurados:');
        plans.rows.forEach(plan => {
            const price = plan.monthly_price === '0.00' ? 'Gratuito' : `${plan.currency} ${plan.monthly_price}`;
            console.log(`   ✓ ${plan.plan_code}: ${plan.name} - ${price}`);
        });
        
        // Verificar valor do Brasil PRO
        const brasilPro = plans.rows.find(p => p.plan_code === 'brasil_pro');
        if (brasilPro && brasilPro.monthly_price === '297.00') {
            console.log('✅ Brasil PRO configurado corretamente: R$ 297,00');
        } else {
            console.log('❌ ERRO: Brasil PRO não está com o valor correto!');
        }
        
        console.log('🎉 Migração enterprise concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na migração:', error.message);
        if (error.detail) console.error('📋 Detalhes:', error.detail);
        if (error.hint) console.error('💡 Dica:', error.hint);
        process.exit(1);
    } finally {
        if (client) {
            client.release();
        }
        await pool.end();
    }
}

// Executar migração
runMigration();
