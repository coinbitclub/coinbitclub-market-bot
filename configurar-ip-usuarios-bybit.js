/**
 * 🔧 CONFIGURAÇÃO IP RAILWAY NAS CONTAS BYBIT DOS USUÁRIOS
 * 
 * O sistema Railway tem IP fixo (132.255.160.140)
 * Mas as contas dos usuários na Bybit não têm esse IP configurado
 * Este script mostra exatamente o que precisa ser feito
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 CONFIGURAÇÃO IP RAILWAY NAS CONTAS BYBIT');
console.log('===========================================');

async function configurarIPUsuarios() {
    try {
        // Confirmar IP atual do Railway
        console.log('\n🌐 1. CONFIRMANDO IP DO RAILWAY:');
        console.log('==============================');
        
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const ipRailway = data.ip;
        
        console.log(`📍 IP atual do Railway: ${ipRailway}`);
        console.log('✅ Este IP precisa ser adicionado nas contas Bybit dos usuários');
        
        // Buscar usuários com chaves Bybit
        console.log('\n👥 2. USUÁRIOS QUE PRECISAM CONFIGURAR IP:');
        console.log('=========================================');
        
        const usuarios = await pool.query(`
            SELECT DISTINCT
                u.name,
                u.email,
                COUNT(uak.id) as total_chaves,
                STRING_AGG(uak.environment, ', ') as ambientes
            FROM users u
            JOIN user_api_keys uak ON u.id = uak.user_id
            WHERE uak.exchange = 'bybit' AND uak.is_active = true
            GROUP BY u.id, u.name, u.email
            ORDER BY u.name
        `);
        
        if (usuarios.rows.length === 0) {
            console.log('❌ Nenhum usuário com chaves Bybit encontrado');
            return;
        }
        
        console.log(`📋 ${usuarios.rows.length} usuário(s) encontrado(s):\n`);
        
        for (const [index, usuario] of usuarios.rows.entries()) {
            console.log(`${index + 1}. 👤 ${usuario.name}`);
            console.log(`   📧 Email: ${usuario.email}`);
            console.log(`   🔑 Chaves: ${usuario.total_chaves}`);
            console.log(`   🌍 Ambientes: ${usuario.ambientes}`);
            console.log(`   🎯 Ação: Adicionar IP ${ipRailway} na conta Bybit`);
            console.log('');
        }
        
        // Instruções específicas
        console.log('🎯 3. INSTRUÇÕES PASSO-A-PASSO:');
        console.log('===============================');
        
        console.log('\n📱 PARA CADA USUÁRIO ACIMA:');
        console.log('---------------------------');
        console.log('1. 🌐 Acessar: https://www.bybit.com');
        console.log('2. 🔑 Fazer login com o email listado');
        console.log('3. 👤 Ir em: Account & Security');
        console.log('4. 🔧 Clicar em: API Management');
        console.log('5. 📝 Localizar suas chaves API');
        console.log('6. ✏️  Clicar em "Edit" em cada chave');
        console.log('7. 🌍 Na seção "IP Access":');
        console.log(`   📌 Adicionar IP: ${ipRailway}`);
        console.log('   💡 OU marcar "Unrestricted" (mais simples)');
        console.log('8. 💾 Salvar as alterações');
        console.log('9. ⏰ Aguardar 1-2 minutos para propagação');
        
        console.log('\n🚨 DETALHES IMPORTANTES:');
        console.log('========================');
        console.log(`• 🎯 IP exato para adicionar: ${ipRailway}`);
        console.log('• 🔑 Configurar em TODAS as chaves do usuário');
        console.log('• 📱 Pode precisar de autenticação 2FA');
        console.log('• ⏰ Mudanças levam 1-5 minutos para ativar');
        console.log('• 💾 CONFIRMAR que salvou em cada chave');
        
        console.log('\n💡 OPÇÕES DE CONFIGURAÇÃO:');
        console.log('=========================');
        console.log('📍 OPÇÃO 1 - Adicionar IP específico:');
        console.log(`   • IP Access → Add IP → ${ipRailway}`);
        console.log('   • Mais seguro');
        console.log('   • Precisa reconfigurar se IP mudar');
        console.log('');
        console.log('🌍 OPÇÃO 2 - Sem restrição (RECOMENDADO):');
        console.log('   • IP Access → "Unrestricted"');
        console.log('   • Mais simples');
        console.log('   • Não afetado por mudanças de IP');
        console.log('   • Ainda é seguro (chaves criptografadas)');
        
        // Mostrar detalhes por usuário
        console.log('\n📋 4. CHECKLIST POR USUÁRIO:');
        console.log('============================');
        
        for (const [index, usuario] of usuarios.rows.entries()) {
            console.log(`\n${index + 1}. ✅ ${usuario.name}:`);
            console.log(`   📧 Login: ${usuario.email}`);
            console.log(`   🔑 Chaves para configurar: ${usuario.total_chaves}`);
            console.log(`   📝 Status: ⏳ Aguardando configuração`);
            
            // Buscar chaves específicas deste usuário
            const chavesUsuario = await pool.query(`
                SELECT api_key, environment
                FROM user_api_keys
                WHERE user_id = (SELECT id FROM users WHERE email = $1)
                AND exchange = 'bybit' AND is_active = true
            `, [usuario.email]);
            
            chavesUsuario.rows.forEach((chave, i) => {
                console.log(`   ${i + 1}. 🔐 ${chave.api_key.substring(0, 12)}... (${chave.environment})`);
            });
        }
        
        console.log('\n🧪 5. TESTE PÓS-CONFIGURAÇÃO:');
        console.log('=============================');
        console.log('Após TODOS os usuários configurarem:');
        console.log('');
        console.log('   node diagnostico-publico-vs-privado.js');
        console.log('');
        console.log('✅ RESULTADO ESPERADO:');
        console.log('   • Endpoints públicos: ✅ OK');
        console.log('   • Endpoints privados: ✅ OK');
        console.log('   • Erro 10003: ❌ Eliminado');
        console.log('   • Sistema: 🚀 100% Funcional');
        
        console.log('\n⏱️  TEMPO ESTIMADO:');
        console.log('==================');
        console.log('• 👤 Por usuário: 3-5 minutos');
        console.log(`• 👥 Total (${usuarios.rows.length} usuários): ${usuarios.rows.length * 4} minutos`);
        console.log('• ⏰ Propagação: 2-5 minutos');
        console.log('• 🧪 Teste final: 1 minuto');
        console.log(`• 🎯 TOTAL: ~${usuarios.rows.length * 4 + 7} minutos`);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar configuração
configurarIPUsuarios().catch(console.error);
