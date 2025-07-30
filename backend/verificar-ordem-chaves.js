const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function verificarChavesNoBanco() {
    try {
        console.log('🔍 VERIFICAÇÃO DAS CHAVES NO BANCO DE DADOS');
        console.log('============================================');
        
        // Buscar todas as chaves com detalhes completos
        const chavesCompletas = await pool.query(`
            SELECT 
                u.id as user_id,
                u.name,
                u.email,
                u.balance_usd,
                k.id as key_id,
                k.exchange,
                k.api_key,
                k.secret_key,
                k.environment,
                k.validation_status,
                k.is_active,
                k.created_at,
                k.updated_at
            FROM users u
            INNER JOIN user_api_keys k ON u.id = k.user_id
            WHERE u.is_active = true
            ORDER BY u.name, k.created_at
        `);
        
        console.log(`\n📊 ENCONTRADAS ${chavesCompletas.rows.length} CHAVES API:`);
        console.log('='.repeat(80));
        
        chavesCompletas.rows.forEach((chave, index) => {
            console.log(`\n${index + 1}. 👤 USUÁRIO: ${chave.name}`);
            console.log(`   📧 Email: ${chave.email}`);
            console.log(`   💰 Saldo: $${chave.balance_usd} USDT`);
            console.log(`   🆔 User ID: ${chave.user_id}`);
            console.log(`   🔑 Key ID: ${chave.key_id}`);
            console.log(`   📡 Exchange: ${chave.exchange}`);
            console.log(`   🌍 Ambiente: ${chave.environment}`);
            console.log(`   ✅ Status: ${chave.validation_status}`);
            console.log(`   🔄 Ativo: ${chave.is_active}`);
            console.log(`   📅 Criado: ${chave.created_at}`);
            console.log(`   📅 Atualizado: ${chave.updated_at}`);
            console.log(`   🔐 API Key: ${chave.api_key}`);
            console.log(`   🗝️  Secret Key: ${chave.secret_key}`);
            console.log('-'.repeat(70));
        });
        
        console.log('\n📋 COMPARAÇÃO COM AS IMAGENS ENVIADAS:');
        console.log('======================================');
        
        // Verificar chaves específicas mencionadas
        console.log('\n🔍 VERIFICANDO CHAVES ESPECÍFICAS:');
        
        // Chave da Luiza Maria (do attachment anterior)
        const luizaChave = chavesCompletas.rows.find(c => c.name.includes('Luiza Maria'));
        if (luizaChave) {
            console.log('\n👤 LUIZA MARIA DE ALMEIDA PINTO:');
            console.log(`   🔑 API Key no banco: ${luizaChave.api_key}`);
            console.log(`   🗝️  Secret no banco: ${luizaChave.secret_key}`);
            console.log(`   ⚠️  Chave esperada: 9HSZqEUJW9kDxHOA`);
            console.log(`   ⚠️  Secret esperado: OjJxNksLOqajkTUcTFFtlsKzjqFNBKabOCU`);
            
            const apiMatch = luizaChave.api_key === '9HSZqEUJW9kDxHOA';
            const secretMatch = luizaChave.secret_key === 'OjJxNmsLOqajkTUcTFFtlsKzjqFNBKabOCU';
            
            console.log(`   ${apiMatch ? '✅' : '❌'} API Key: ${apiMatch ? 'CORRETO' : 'DIFERENTE'}`);
            console.log(`   ${secretMatch ? '✅' : '❌'} Secret: ${secretMatch ? 'CORRETO' : 'DIFERENTE'}`);
        }
        
        // Chave da Érica (do attachment anterior)
        const ericaChave = chavesCompletas.rows.find(c => c.name.includes('Érica'));
        if (ericaChave) {
            console.log('\n👤 ÉRICA DOS SANTOS:');
            console.log(`   🔑 API Key no banco: ${ericaChave.api_key}`);
            console.log(`   🗝️  Secret no banco: ${ericaChave.secret_key}`);
            console.log(`   ⚠️  Chave esperada: g1HWyxEfWxobzJGew`);
            console.log(`   ⚠️  Secret esperado: gOGv9nokGvfFoB0CSFyudZrOE8XnyA1nmR4r`);
            
            const apiMatch = ericaChave.api_key === 'g1HWyxEfWxobzJGew';
            const secretMatch = ericaChave.secret_key === 'gOGv9nokGvfFoB0CSFyudZrOE8XnyA1nmR4r';
            
            console.log(`   ${apiMatch ? '✅' : '❌'} API Key: ${apiMatch ? 'CORRETO' : 'DIFERENTE'}`);
            console.log(`   ${secretMatch ? '✅' : '❌'} Secret: ${secretMatch ? 'CORRETO' : 'DIFERENTE'}`);
        }
        
        console.log('\n🎯 RESUMO DA VERIFICAÇÃO:');
        console.log('=========================');
        
        const totalChaves = chavesCompletas.rows.length;
        const chavesAtivas = chavesCompletas.rows.filter(c => c.is_active).length;
        const chavesValidadas = chavesCompletas.rows.filter(c => c.validation_status === 'validated').length;
        
        console.log(`📊 Total de chaves: ${totalChaves}`);
        console.log(`✅ Chaves ativas: ${chavesAtivas}`);
        console.log(`🔓 Chaves validadas: ${chavesValidadas}`);
        console.log(`❌ Chaves com erro: ${totalChaves - chavesValidadas}`);
        
        if (chavesValidadas === 0) {
            console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
            console.log('===========================');
            console.log('❌ Nenhuma chave está validada');
            console.log('🔍 Possíveis causas:');
            console.log('   1. Chaves não correspondem às das imagens');
            console.log('   2. Ordem incorreta na inserção');
            console.log('   3. Caracteres extras ou faltando');
            console.log('   4. Cópia incorreta das imagens');
        }
        
        console.log('\n📝 PRÓXIMOS PASSOS:');
        console.log('===================');
        console.log('1. 🔍 Compare as chaves acima com as imagens enviadas');
        console.log('2. 📋 Verifique se a ordem está correta');
        console.log('3. 🔄 Corrija qualquer discrepância encontrada');
        console.log('4. ✅ Execute o teste novamente após correções');
        
    } catch (error) {
        console.error('❌ Erro na verificação:', error.message);
    } finally {
        pool.end();
    }
}

verificarChavesNoBanco();
