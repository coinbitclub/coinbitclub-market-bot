/**
 * 🔧 ATUALIZAR CHAVES API CONFORME BYBIT
 * Sincronizar banco com as chaves reais da conta Bybit
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function atualizarChavesReais() {
    console.log('🔧 ATUALIZANDO CHAVES API CONFORME BYBIT');
    console.log('='.repeat(45));
    
    try {
        console.log('📋 PROBLEMA IDENTIFICADO:');
        console.log('   As chaves no banco diferem das configuradas na Bybit');
        console.log('   IP foi adicionado nas chaves corretas da Bybit');
        console.log('   Mas testamos com chaves diferentes do banco');
        
        console.log('\n🔍 CHAVES ATUAIS NO BANCO:');
        const chavesAtuais = await pool.query(`
            SELECT u.full_name, uk.api_key, uk.secret_key
            FROM user_api_keys uk
            JOIN users u ON uk.user_id = u.id
            WHERE uk.exchange = 'bybit' AND uk.is_active = true
            ORDER BY uk.id
        `);
        
        chavesAtuais.rows.forEach(c => {
            console.log(`   • ${c.full_name}: ${c.api_key}`);
        });
        
        console.log('\n🎯 CHAVES CORRETAS DA BYBIT (conforme imagem):');
        console.log('   • COINBITCLUB_BOT: q3JH2TYGwCHaupbwgG');
        console.log('   • COINBITCLUB_ERICA: rg1HWyxEfWwxbzJGew');
        
        console.log('\n⚠️ OBSERVAÇÃO IMPORTANTE:');
        console.log('   Só atualizaremos se você confirmar que essas são as chaves corretas');
        console.log('   E se tiver os secret_keys correspondentes');
        
        console.log('\n💡 HIPÓTESES:');
        console.log('   1. Chaves no banco estão desatualizadas');
        console.log('   2. Você tem múltiplas API keys na Bybit');
        console.log('   3. As chaves foram recriadas recentemente');
        
        console.log('\n🔧 PARA RESOLVER:');
        console.log('   1. Verificar na Bybit quais são os SECRET KEYS');
        console.log('   2. Atualizar banco com chaves corretas');
        console.log('   3. Ou adicionar IP nas chaves que estão no banco');
        
        console.log('\n📝 PRÓXIMOS PASSOS:');
        console.log('   Opção A: Atualizar banco com chaves da imagem');
        console.log('   Opção B: Adicionar IP nas chaves antigas também');
        console.log('   Opção C: Verificar se temos as chaves certas');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        pool.end();
    }
}

atualizarChavesReais();
