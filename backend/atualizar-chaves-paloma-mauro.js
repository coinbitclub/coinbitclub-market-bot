/**
 * 🔄 ATUALIZAR CHAVES API - PALOMA E MAURO
 * 
 * Atualizar o banco de dados com as chaves corretas fornecidas pelo usuário
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

/**
 * Dados dos usuários com as chaves corretas
 */
const usuariosParaAtualizar = [
    {
        nome: "PALOMA AMARAL",
        email: "pamaral15@hotmail.com",
        senha: "Diogo1520",
        telefone: "+55 21 98221-8182",
        tipo: "comum", // Usuário comum
        saldo_inicial: 500.00,
        // Chaves Bybit Produção
        bybit_api_key: "AfFEGdxLuYPnSFaXEJ",
        bybit_secret: "kxCAy7yDenRFKKrHinGfysmP2wknmvRk16Wb",
        environment: "mainnet"
    },
    {
        nome: "MAURO ALVES",
        email: "mauroalves150391@gmail.com",
        senha: "M@urovilhoso",
        telefone: "+55 32 9139-9571",
        tipo: "vip", // Afiliado VIP
        saldo_inicial: 4000.00,
        // Chaves Bybit Testnet
        bybit_api_key: "JQVNAD0aCqNqPLvo25",
        bybit_secret: "rQ1Qle81XBKeL5NrvSIOLqpT60rbZ7wA0dYk",
        environment: "testnet"
    }
];

/**
 * Verificar usuários existentes
 */
async function verificarUsuariosExistentes() {
    try {
        console.log('🔍 VERIFICANDO USUÁRIOS EXISTENTES...');
        
        const emails = usuariosParaAtualizar.map(u => u.email);
        const query = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.user_type,
                u.created_at,
                uak.id as key_id,
                uak.api_key,
                uak.secret_key,
                uak.exchange,
                uak.environment,
                ub.id as balance_id,
                ub.balance_brl
            FROM users u
            LEFT JOIN user_api_keys uak ON u.id = uak.user_id
            LEFT JOIN user_balances ub ON u.id = ub.user_id
            WHERE u.email = ANY($1)
            ORDER BY u.name;
        `;
        
        const result = await pool.query(query, [emails]);
        
        console.log(`📊 ${result.rows.length} registro(s) encontrado(s):`);
        result.rows.forEach(row => {
            console.log(`   👤 ${row.name} (${row.email})`);
            console.log(`      ID: ${row.id}`);
            console.log(`      Tipo: ${row.user_type || 'não definido'}`);
            console.log(`      Chave API: ${row.api_key || 'não cadastrada'}`);
            console.log(`      Exchange: ${row.exchange || 'não definida'}`);
            console.log(`      Environment: ${row.environment || 'não definido'}`);
            console.log(`      Saldo: R$ ${row.balance_brl || '0.00'}`);
            console.log('');
        });
        
        return result.rows;
        
    } catch (error) {
        console.error('❌ Erro ao verificar usuários:', error.message);
        return [];
    }
}

/**
 * Cadastrar ou atualizar usuário
 */
async function cadastrarOuAtualizarUsuario(dadosUsuario) {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log(`🔄 PROCESSANDO: ${dadosUsuario.nome}`);
        
        // Hash da senha
        const senhaHash = await bcrypt.hash(dadosUsuario.senha, 10);
        
        // 1. Inserir ou atualizar usuário
        const userQuery = `
            INSERT INTO users (name, email, password_hash, user_type, phone, is_active, created_at)
            VALUES ($1, $2, $3, $4, $5, true, NOW())
            ON CONFLICT (email) 
            DO UPDATE SET
                name = EXCLUDED.name,
                user_type = EXCLUDED.user_type,
                phone = EXCLUDED.phone,
                updated_at = NOW()
            RETURNING id, name, email;
        `;
        
        const userResult = await client.query(userQuery, [
            dadosUsuario.nome,
            dadosUsuario.email,
            senhaHash,
            dadosUsuario.tipo,
            dadosUsuario.telefone
        ]);
        
        const userId = userResult.rows[0].id;
        console.log(`   ✅ Usuário: ${userResult.rows[0].name} (ID: ${userId})`);
        
        // 2. Inserir ou atualizar chaves API Bybit
        const keyQuery = `
            INSERT INTO user_api_keys (user_id, exchange, api_key, secret_key, environment, is_active, created_at)
            VALUES ($1, $2, $3, $4, $5, true, NOW())
            ON CONFLICT (user_id, exchange, environment)
            DO UPDATE SET
                api_key = EXCLUDED.api_key,
                secret_key = EXCLUDED.secret_key,
                is_active = EXCLUDED.is_active,
                updated_at = NOW()
            RETURNING id, exchange, environment;
        `;
        
        const keyResult = await client.query(keyQuery, [
            userId,
            'bybit',
            dadosUsuario.bybit_api_key,
            dadosUsuario.bybit_secret,
            dadosUsuario.environment
        ]);
        
        console.log(`   🔑 Chave API: Bybit ${dadosUsuario.environment} (ID: ${keyResult.rows[0].id})`);
        
        // 3. Inserir ou atualizar saldo
        const balanceQuery = `
            INSERT INTO user_balances (user_id, balance_brl, balance_usd, created_at)
            VALUES ($1, $2, 0.00, NOW())
            ON CONFLICT (user_id)
            DO UPDATE SET
                balance_brl = EXCLUDED.balance_brl,
                updated_at = NOW()
            RETURNING id, balance_brl;
        `;
        
        const balanceResult = await client.query(balanceQuery, [
            userId,
            dadosUsuario.saldo_inicial
        ]);
        
        console.log(`   💰 Saldo: R$ ${balanceResult.rows[0].balance_brl} (ID: ${balanceResult.rows[0].id})`);
        
        await client.query('COMMIT');
        console.log(`   ✅ ${dadosUsuario.nome} processado com sucesso!`);
        
        return {
            sucesso: true,
            userId: userId,
            dados: userResult.rows[0]
        };
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`   ❌ Erro ao processar ${dadosUsuario.nome}:`, error.message);
        return {
            sucesso: false,
            erro: error.message
        };
    } finally {
        client.release();
    }
}

/**
 * Executar atualização dos usuários
 */
async function executarAtualizacao() {
    try {
        console.log('🔄 ATUALIZAÇÃO DE CHAVES API - PALOMA E MAURO');
        console.log('='.repeat(60));
        console.log('📅 Data: 29 de Julho de 2025');
        console.log('🎯 Objetivo: Atualizar chaves API corretas no banco');
        console.log('');
        
        // ⚠️ AVISO IMPORTANTE
        console.log('⚠️ ATENÇÃO: SUBSTITUA AS CHAVES ANTES DE EXECUTAR!');
        console.log('   📝 Edite este arquivo e substitua:');
        console.log('   • YOUR_BYBIT_API_KEY_PALOMA');
        console.log('   • YOUR_BYBIT_SECRET_PALOMA');
        console.log('   • YOUR_BYBIT_TESTNET_API_KEY_MAURO');
        console.log('   • YOUR_BYBIT_TESTNET_SECRET_MAURO');
        console.log('');
        
        // Verificar se as chaves foram substituídas
        const chavesNaoSubstituidas = usuariosParaAtualizar.some(user => 
            user.bybit_api_key.includes('YOUR_') || user.bybit_secret.includes('YOUR_')
        );
        
        if (chavesNaoSubstituidas) {
            console.log('❌ ERRO: Chaves ainda não foram substituídas!');
            console.log('💡 Edite o arquivo e substitua as chaves antes de executar.');
            return;
        }
        
        // Verificar usuários existentes
        await verificarUsuariosExistentes();
        
        // Processar cada usuário
        console.log('🚀 INICIANDO ATUALIZAÇÃO...');
        const resultados = [];
        
        for (const usuario of usuariosParaAtualizar) {
            const resultado = await cadastrarOuAtualizarUsuario(usuario);
            resultados.push({
                nome: usuario.nome,
                email: usuario.email,
                ...resultado
            });
            console.log('');
        }
        
        // Resumo final
        console.log('📊 RESUMO DA ATUALIZAÇÃO:');
        console.log('='.repeat(40));
        
        const sucessos = resultados.filter(r => r.sucesso);
        const falhas = resultados.filter(r => !r.sucesso);
        
        console.log(`✅ Sucessos: ${sucessos.length}`);
        console.log(`❌ Falhas: ${falhas.length}`);
        
        if (sucessos.length > 0) {
            console.log('\n✅ USUÁRIOS ATUALIZADOS:');
            sucessos.forEach(s => {
                console.log(`   • ${s.nome} (${s.email})`);
            });
        }
        
        if (falhas.length > 0) {
            console.log('\n❌ USUÁRIOS COM ERRO:');
            falhas.forEach(f => {
                console.log(`   • ${f.nome}: ${f.erro}`);
            });
        }
        
        if (sucessos.length === resultados.length) {
            console.log('\n🎉 ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!');
            console.log('🔑 Todas as chaves API foram atualizadas');
            console.log('💰 Saldos iniciais configurados');
            console.log('🚀 Usuários prontos para testes');
        }
        
    } catch (error) {
        console.error('❌ ERRO NA ATUALIZAÇÃO:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar apenas se as chaves foram substituídas
if (require.main === module) {
    executarAtualizacao();
}

module.exports = {
    usuariosParaAtualizar,
    cadastrarOuAtualizarUsuario,
    verificarUsuariosExistentes
};
