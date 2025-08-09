const { Pool } = require('pg');

// Testar diferentes configurações de conexão
async function testarConexaoBanco() {
    console.log('🔍 TESTANDO CONEXÕES COM BANCO DE DADOS');
    console.log('=======================================\n');

    // Tentar com DATABASE_URL se existir
    if (process.env.DATABASE_URL) {
        console.log('📊 Testando com DATABASE_URL...');
        const pool1 = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        try {
            const result = await pool1.query('SELECT NOW() as current_time, version() as db_version');
            console.log('✅ SUCESSO com DATABASE_URL!');
            console.log(`   Horário: ${result.rows[0].current_time}`);
            console.log(`   Versão: ${result.rows[0].db_version.split(' ')[0]}`);
            
            // Testar tabelas principais
            await testarTabelas(pool1);
            await pool1.end();
            return true;
        } catch (error) {
            console.log(`❌ Falha com DATABASE_URL: ${error.message}`);
            await pool1.end();
        }
    }

    // Tentar configurações alternativas
    const configs = [
        {
            name: 'Configuração Railway',
            config: {
                host: process.env.PGHOST || 'localhost',
                port: process.env.PGPORT || 5432,
                database: process.env.PGDATABASE || 'coinbitclub',
                user: process.env.PGUSER || 'postgres',
                password: process.env.PGPASSWORD || '',
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
            }
        },
        {
            name: 'Configuração Local',
            config: {
                host: 'localhost',
                port: 5432,
                database: 'coinbitclub',
                user: 'postgres',
                password: '',
                ssl: false
            }
        }
    ];

    for (const { name, config } of configs) {
        console.log(`\n📊 Testando ${name}...`);
        console.log(`   Host: ${config.host}:${config.port}`);
        console.log(`   Database: ${config.database}`);
        console.log(`   User: ${config.user}`);
        
        const pool = new Pool(config);
        
        try {
            const result = await pool.query('SELECT NOW() as current_time');
            console.log(`✅ SUCESSO com ${name}!`);
            console.log(`   Horário: ${result.rows[0].current_time}`);
            
            await testarTabelas(pool);
            await pool.end();
            return true;
        } catch (error) {
            console.log(`❌ Falha com ${name}: ${error.message}`);
            await pool.end();
        }
    }

    console.log('\n❌ NENHUMA CONEXÃO FOI BEM-SUCEDIDA');
    console.log('\n💡 SOLUÇÕES:');
    console.log('1. Verificar variáveis de ambiente:');
    console.log('   - DATABASE_URL');
    console.log('   - PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD');
    console.log('2. Verificar se PostgreSQL está rodando');
    console.log('3. Verificar credenciais de acesso');
    console.log('4. Verificar configurações de SSL/firewall');
    
    return false;
}

async function testarTabelas(pool) {
    console.log('   📋 Testando tabelas principais...');
    
    const tabelas = [
        'users',
        'user_api_keys', 
        'trading_signals',
        'trade_executions',
        'active_positions',
        'aguia_news_radars'
    ];

    for (const tabela of tabelas) {
        try {
            const result = await pool.query(`SELECT COUNT(*) as total FROM ${tabela}`);
            console.log(`   ✅ ${tabela}: ${result.rows[0].total} registros`);
        } catch (error) {
            console.log(`   ❌ ${tabela}: ${error.message}`);
        }
    }
}

// Verificar variáveis de ambiente
console.log('🔧 VARIÁVEIS DE AMBIENTE ATUAIS:');
console.log('================================');
console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '[DEFINIDA]' : '[NÃO DEFINIDA]'}`);
console.log(`PGHOST: ${process.env.PGHOST || '[NÃO DEFINIDA]'}`);
console.log(`PGPORT: ${process.env.PGPORT || '[NÃO DEFINIDA]'}`);
console.log(`PGDATABASE: ${process.env.PGDATABASE || '[NÃO DEFINIDA]'}`);
console.log(`PGUSER: ${process.env.PGUSER || '[NÃO DEFINIDA]'}`);
console.log(`PGPASSWORD: ${process.env.PGPASSWORD ? '[DEFINIDA]' : '[NÃO DEFINIDA]'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || '[NÃO DEFINIDA]'}\n`);

// Executar teste
testarConexaoBanco()
    .then(sucesso => {
        if (sucesso) {
            console.log('\n🎉 CONEXÃO COM BANCO DE DADOS CONFIGURADA COM SUCESSO!');
            console.log('📊 O dashboard pode ser executado com dados reais.');
        } else {
            console.log('\n⚠️  EXECUTANDO EM MODO OFFLINE');
            console.log('📊 O dashboard funcionará com dados de exemplo.');
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Erro inesperado:', error);
        process.exit(1);
    });
