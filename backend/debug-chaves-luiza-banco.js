/**
 * 🔍 VERIFICAR CHAVES BANCO VS IMAGEM
 * Comparar chaves armazenadas com as da imagem da Luiza
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

// CHAVES CORRETAS DA IMAGEM DA LUIZA
const CHAVES_CORRETAS = {
    'luizamaria@coinbitclub.com': {
        api_key: '9HZy9BiUW95iXprVRl',
        secret: 'QUjDXNmSI0qiqaKTUk7FHAHZnjiEN8AaRKQO'
    }
};

async function verificarChavesBanco() {
    console.log('🔍 VERIFICANDO CHAVES NO BANCO DE DADOS');
    console.log('='.repeat(60));
    
    try {
        console.log('📊 Conectando ao banco...');
        
        // Buscar todas as chaves API com informações dos usuários
        const result = await pool.query(`
            SELECT uk.*, u.full_name, u.email
            FROM user_api_keys uk
            LEFT JOIN users u ON u.id = uk.user_id
            ORDER BY uk.user_id
        `);
        
        console.log(`\n📋 ${result.rows.length} chaves encontradas no banco:\n`);
        
        result.rows.forEach((row, index) => {
            console.log(`👤 Usuário ${index + 1}:`);
            console.log(`   🆔 ID: ${row.user_id}`);
            console.log(`   📧 Email: ${row.email || 'N/A'}`);
            console.log(`   👤 Nome: ${row.full_name || 'N/A'}`);
            console.log(`   🔑 API Key: "${row.api_key}"`);
            console.log(`   🔐 Secret: "${row.secret_key}"`);
            console.log(`   ⚡ Ativo: ${row.is_active}`);
            console.log(`   📅 Criado: ${row.created_at}`);
            console.log('');
        });
        
        // Procurar especificamente pela Luiza
        const luizaQuery = await pool.query(`
            SELECT uk.*, u.full_name, u.email
            FROM user_api_keys uk
            LEFT JOIN users u ON u.id = uk.user_id
            WHERE u.email ILIKE '%luiza%' OR u.full_name ILIKE '%luiza%' OR u.email ILIKE '%maria%'
        `);
        
        console.log('\n🔍 FOCO NA LUIZA:');
        console.log('-'.repeat(40));
        
        if (luizaQuery.rows.length > 0) {
            const luiza = luizaQuery.rows[0];
            console.log(`👤 Usuária: ${luiza.full_name || luiza.email}`);
            console.log(`📧 Email: ${luiza.email}`);
            console.log(`🔑 API Key no banco: "${luiza.api_key}"`);
            console.log(`🔐 Secret no banco: "${luiza.secret_key}"`);
            console.log('');
            
            // Chaves corretas da imagem
            const chaveCorreta = '9HZy9BiUW95iXprVRl';
            const secretCorreto = 'QUjDXNmSI0qiqaKTUk7FHAHZnjiEN8AaRKQO';
            
            console.log('🎯 COMPARAÇÃO COM CHAVES CORRETAS DA IMAGEM:');
            console.log(`📝 Chave correta: "${chaveCorreta}"`);
            console.log(`📝 Secret correto: "${secretCorreto}"`);
            console.log('');
            
            // Verificar se são iguais
            const chaveIgual = luiza.api_key === chaveCorreta;
            const secretIgual = luiza.secret_key === secretCorreto;
            
            console.log(`✅ API Key igual: ${chaveIgual ? '✅ SIM' : '❌ NÃO'}`);
            console.log(`✅ Secret igual: ${secretIgual ? '✅ SIM' : '❌ NÃO'}`);
            
            if (!chaveIgual) {
                console.log(`\n🔍 DIFERENÇA NA API KEY:`);
                console.log(`   📦 No banco: "${luiza.api_key}" (${luiza.api_key.length} caracteres)`);
                console.log(`   🎯 Correto: "${chaveCorreta}" (${chaveCorreta.length} caracteres)`);
                
                // Análise caractere por caractere
                console.log(`\n🔬 ANÁLISE CARACTERE POR CARACTERE:`);
                const minLen = Math.min(luiza.api_key.length, chaveCorreta.length);
                for (let i = 0; i < Math.max(luiza.api_key.length, chaveCorreta.length); i++) {
                    const charBanco = luiza.api_key[i] || '(vazio)';
                    const charCorreto = chaveCorreta[i] || '(vazio)';
                    const igual = charBanco === charCorreto;
                    console.log(`   ${i.toString().padStart(2, '0')}: "${charBanco}" vs "${charCorreto}" ${igual ? '✅' : '❌'}`);
                }
            }
            
            if (!secretIgual) {
                console.log(`\n🔍 DIFERENÇA NO SECRET:`);
                console.log(`   📦 No banco: "${luiza.secret_key}" (${luiza.secret_key.length} caracteres)`);
                console.log(`   🎯 Correto: "${secretCorreto}" (${secretCorreto.length} caracteres)`);
                
                // Análise caractere por caractere para o secret
                console.log(`\n🔬 ANÁLISE CARACTERE POR CARACTERE DO SECRET:`);
                for (let i = 0; i < Math.max(luiza.secret_key.length, secretCorreto.length); i++) {
                    const charBanco = luiza.secret_key[i] || '(vazio)';
                    const charCorreto = secretCorreto[i] || '(vazio)';
                    const igual = charBanco === charCorreto;
                    console.log(`   ${i.toString().padStart(2, '0')}: "${charBanco}" vs "${charCorreto}" ${igual ? '✅' : '❌'}`);
                }
            }
            
            // Se encontramos diferenças, vamos corrigir
            if (!chaveIgual || !secretIgual) {
                console.log('\n🔧 APLICANDO CORREÇÃO NO BANCO:');
                
                const updateResult = await pool.query(`
                    UPDATE user_api_keys 
                    SET api_key = $1, secret_key = $2, updated_at = NOW()
                    WHERE user_id = $3
                `, [chaveCorreta, secretCorreto, luiza.user_id]);
                
                console.log(`✅ Chaves atualizadas para ${luiza.full_name || luiza.email}`);
                console.log(`📊 ${updateResult.rowCount} registro(s) atualizado(s)`);
                
                // Verificar se a atualização funcionou
                const verificacao = await pool.query(`
                    SELECT api_key, secret_key FROM user_api_keys WHERE user_id = $1
                `, [luiza.user_id]);
                
                const novaChave = verificacao.rows[0];
                console.log('\n🔍 VERIFICAÇÃO PÓS-ATUALIZAÇÃO:');
                console.log(`🔑 Nova API Key: "${novaChave.api_key}"`);
                console.log(`🔐 Novo Secret: "${novaChave.secret_key}"`);
                console.log(`✅ Correção aplicada: ${novaChave.api_key === chaveCorreta && novaChave.secret_key === secretCorreto ? '✅ SUCESSO' : '❌ FALHOU'}`);
            } else {
                console.log('\n✅ CHAVES JÁ ESTÃO CORRETAS NO BANCO!');
            }
            
        } else {
            console.log('❌ Nenhuma entrada da Luiza encontrada no banco!');
            
            // Listar todos os emails para debug
            const todosUsers = await pool.query('SELECT id, email, full_name FROM users');
            console.log('\n📋 TODOS OS USUÁRIOS NO BANCO:');
            todosUsers.rows.forEach(user => {
                console.log(`   ${user.id}: ${user.email} - ${user.full_name}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar banco:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
        console.log('\n🔚 Conexão com banco fechada.');
    }
}

verificarChavesBanco();
