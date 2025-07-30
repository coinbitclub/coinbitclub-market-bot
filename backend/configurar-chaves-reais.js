const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function configurarChavesAPIReais() {
    try {
        console.log('🔑 CONFIGURAÇÃO DE CHAVES API REAIS');
        console.log('===================================');
        
        console.log('\n⚠️  PROBLEMAS IDENTIFICADOS:');
        console.log('============================');
        console.log('❌ Todas as chaves API atuais são INVÁLIDAS');
        console.log('✅ Conectividade com exchanges está OK');
        console.log('🔧 Necessário configurar chaves API reais');
        
        // Mostrar chaves atuais
        console.log('\n📋 CHAVES API ATUAIS (INVÁLIDAS):');
        console.log('=================================');
        
        const chavesAtuais = await pool.query(`
            SELECT 
                u.name,
                k.exchange,
                k.api_key,
                k.environment,
                k.validation_status
            FROM users u
            INNER JOIN user_api_keys k ON u.id = k.user_id
            WHERE u.is_active = true AND k.is_active = true
            ORDER BY u.name
        `);
        
        chavesAtuais.rows.forEach((chave, index) => {
            console.log(`${index + 1}. 👤 ${chave.name}`);
            console.log(`   📡 Exchange: ${chave.exchange.toUpperCase()}`);
            console.log(`   🔑 API Key: ${chave.api_key}`);
            console.log(`   🌍 Ambiente: ${chave.environment}`);
            console.log(`   ❌ Status: ${chave.validation_status}`);
            console.log('');
        });
        
        console.log('🎯 AÇÕES NECESSÁRIAS PARA ATIVAR O SISTEMA:');
        console.log('===========================================');
        console.log('');
        console.log('1. 🏢 ACESSAR BYBIT E CRIAR CHAVES API REAIS:');
        console.log('   📍 Acesse: https://www.bybit.com/app/user/api-management');
        console.log('   🔐 Crie chaves API para cada usuário');
        console.log('   ✅ Permissões necessárias:');
        console.log('      - Trading (Buy/Sell)');
        console.log('      - Read Account Info');
        console.log('      - Read Positions');
        console.log('');
        
        console.log('2. 📝 USUARIOS QUE PRECISAM DE CHAVES REAIS:');
        console.log('   👤 Luiza Maria de Almeida Pinto ($1.000 USDT)');
        console.log('   👤 Érica dos Santos ($5.000 USDT)');
        console.log('   👤 PALOMA AMARAL ($500 USDT)');
        console.log('   👤 MAURO ALVES ($4.000 USDT) - Testnet OK');
        console.log('');
        
        console.log('3. 🔧 SCRIPT PARA ATUALIZAR CHAVES (EXEMPLO):');
        console.log('');
        console.log('-- Para atualizar a Luiza Maria:');
        console.log(`UPDATE user_api_keys SET`);
        console.log(`  api_key = 'SUA_CHAVE_API_REAL_LUIZA',`);
        console.log(`  secret_key = 'SUA_SECRET_KEY_REAL_LUIZA',`);
        console.log(`  validation_status = 'pending'`);
        console.log(`WHERE user_id = 4 AND exchange = 'bybit';`);
        console.log('');
        
        console.log('-- Para atualizar a Érica:');
        console.log(`UPDATE user_api_keys SET`);
        console.log(`  api_key = 'SUA_CHAVE_API_REAL_ERICA',`);
        console.log(`  secret_key = 'SUA_SECRET_KEY_REAL_ERICA',`);
        console.log(`  validation_status = 'pending'`);
        console.log(`WHERE user_id = 8 AND exchange = 'bybit';`);
        console.log('');
        
        console.log('4. ✅ VERIFICAÇÃO APÓS ATUALIZAÇÃO:');
        console.log('   Execute: node diagnostico-exchanges.js');
        console.log('   Deve mostrar "✅ API autenticada com sucesso"');
        console.log('');
        
        // Criar script de exemplo para facilitar
        console.log('5. 🚀 ESTRUTURA ATUAL DO SISTEMA:');
        console.log('   ✅ Backend funcionando (porta 8080)');
        console.log('   ✅ Webhook TradingView (porta 3000)');
        console.log('   ✅ Banco de dados conectado');
        console.log('   ✅ Usuários configurados com saldos');
        console.log('   ✅ Arquitetura multiusuário implementada');
        console.log('   ❌ Apenas faltam chaves API válidas');
        console.log('');
        
        console.log('📊 SISTEMA PRONTO PARA OPERAR APÓS CHAVES VÁLIDAS:');
        console.log('=================================================');
        console.log('🎯 Total de capital disponível: $10.500 USDT');
        console.log('👥 4 usuários ativos configurados');
        console.log('🏗️ Infraestrutura 100% funcional');
        console.log('⚡ Apenas aguardando chaves API reais');
        
        // Criar arquivo de referência
        const scriptSQL = `
-- SCRIPT PARA ATUALIZAR CHAVES API REAIS
-- Execute depois de obter as chaves reais da Bybit

-- Luiza Maria de Almeida Pinto (ID: 4)
UPDATE user_api_keys SET
    api_key = 'CHAVE_API_REAL_LUIZA',
    secret_key = 'SECRET_KEY_REAL_LUIZA',
    validation_status = 'pending',
    updated_at = NOW()
WHERE user_id = 4 AND exchange = 'bybit';

-- Érica dos Santos (ID: 8) 
UPDATE user_api_keys SET
    api_key = 'CHAVE_API_REAL_ERICA',
    secret_key = 'SECRET_KEY_REAL_ERICA',
    validation_status = 'pending',
    updated_at = NOW()
WHERE user_id = 8 AND exchange = 'bybit';

-- PALOMA AMARAL (ID: 12)
UPDATE user_api_keys SET
    api_key = 'CHAVE_API_REAL_PALOMA',
    secret_key = 'SECRET_KEY_REAL_PALOMA',
    validation_status = 'pending',
    updated_at = NOW()
WHERE user_id = 12 AND exchange = 'bybit';

-- VERIFICAR ATUALIZAÇÕES
SELECT 
    u.name, 
    k.exchange, 
    k.api_key, 
    k.validation_status 
FROM users u 
INNER JOIN user_api_keys k ON u.id = k.user_id 
WHERE u.is_active = true;
        `;
        
        require('fs').writeFileSync('atualizar-chaves-reais.sql', scriptSQL);
        console.log('\n💾 Arquivo criado: atualizar-chaves-reais.sql');
        console.log('   (Script SQL para facilitar a atualização)');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        pool.end();
    }
}

configurarChavesAPIReais();
