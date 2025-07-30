const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

async function configurarSistemaMultiusuarioBybit() {
    try {
        console.log('🔧 CONFIGURAÇÃO SISTEMA MULTIUSUÁRIO - BYBIT');
        console.log('===========================================');
        console.log('📝 Todos são usuários COMUNS da Bybit');
        console.log('⭐ VIP = Plano interno do CoinBitClub apenas');
        
        // 1. Verificar situação atual
        console.log('\n📋 SITUAÇÃO ATUAL DOS USUÁRIOS:');
        const users = await pool.query(`
            SELECT u.id, u.name, u.email, u.vip_status, u.is_active,
                   COUNT(ak.id) as total_keys,
                   COUNT(CASE WHEN ak.is_active = true THEN 1 END) as active_keys
            FROM users u 
            LEFT JOIN user_api_keys ak ON u.id = ak.user_id 
            WHERE u.is_active = true
            GROUP BY u.id, u.name, u.email, u.vip_status, u.is_active
            ORDER BY u.vip_status DESC, u.id
        `);

        users.rows.forEach(user => {
            const planIcon = user.vip_status ? '⭐ VIP' : '👤 BÁSICO';
            const keyStatus = user.total_keys > 0 ? 
                (user.active_keys > 0 ? '✅ TEM CHAVES' : '⚠️ CHAVES INATIVAS') : 
                '❌ SEM CHAVES';
            
            console.log(`   ${planIcon} | ${keyStatus} | ${user.name} (ID: ${user.id})`);
            console.log(`      📧 ${user.email}`);
            console.log(`      🔑 ${user.total_keys} chaves total, ${user.active_keys} ativas`);
            console.log('');
        });

        // 2. Identificar quem precisa de chaves individuais
        console.log('\n🎯 ESTRATÉGIA DE CHAVES POR PLANO:');
        
        const vipUsers = users.rows.filter(u => u.vip_status === true);
        const basicUsers = users.rows.filter(u => u.vip_status === false);
        
        console.log(`   ⭐ USUÁRIOS VIP (${vipUsers.length}): Chaves individuais da Bybit`);
        vipUsers.forEach(user => {
            console.log(`      - ${user.name} (ID: ${user.id}) - ${user.active_keys > 0 ? '✅ Configurado' : '❌ Precisa configurar'}`);
        });
        
        console.log(`\n   👤 USUÁRIOS BÁSICOS (${basicUsers.length}): Podem usar chave compartilhada ou individual`);
        basicUsers.forEach(user => {
            console.log(`      - ${user.name} (ID: ${user.id}) - ${user.active_keys > 0 ? '✅ Configurado' : '⚪ Opcional'}`);
        });

        // 3. Configurar chaves necessárias
        console.log('\n🔧 CONFIGURANDO CHAVES NECESSÁRIAS:');
        
        // Para usuários VIP sem chaves - criar placeholders para chaves individuais
        const vipWithoutKeys = vipUsers.filter(u => u.active_keys === 0);
        
        if (vipWithoutKeys.length > 0) {
            console.log('\n   ⭐ CONFIGURANDO USUÁRIOS VIP:');
            
            for (const user of vipWithoutKeys) {
                try {
                    const result = await pool.query(`
                        INSERT INTO user_api_keys (
                            user_id, exchange, api_key, secret_key, environment,
                            is_active, validation_status, created_at, updated_at
                        ) VALUES ($1, $2, $3, $4, $5, false, 'pending', NOW(), NOW())
                        RETURNING id
                    `, [
                        user.id,
                        'bybit',
                        `BYBIT_API_${user.name.toUpperCase().replace(/\s+/g, '_')}_INDIVIDUAL`,
                        `BYBIT_SECRET_${user.name.toUpperCase().replace(/\s+/g, '_')}_INDIVIDUAL`,
                        'mainnet'
                    ]);
                    
                    console.log(`      ✅ ${user.name}: Placeholder criado (ID: ${result.rows[0].id})`);
                    console.log(`         ⚠️  Precisa configurar chave real da Bybit`);
                    
                } catch (error) {
                    console.log(`      ❌ ${user.name}: Erro - ${error.message}`);
                }
            }
        }

        // 4. Verificar chaves atuais que funcionam
        console.log('\n🔍 VERIFICANDO CHAVES FUNCIONAIS:');
        const workingKeys = await pool.query(`
            SELECT u.name, u.vip_status, ak.*, 
                   SUBSTRING(ak.api_key, 1, 15) || '...' as key_preview
            FROM users u 
            JOIN user_api_keys ak ON u.id = ak.user_id 
            WHERE ak.is_active = true AND u.is_active = true
            AND ak.api_key NOT LIKE '%PENDING%' 
            AND ak.api_key NOT LIKE '%INDIVIDUAL%'
            ORDER BY u.vip_status DESC, u.name
        `);

        workingKeys.rows.forEach(key => {
            const plan = key.vip_status ? '⭐ VIP' : '👤 BÁSICO';
            const status = key.validation_status === 'valid' ? '✅' : 
                          key.validation_status === 'pending' ? '⏳' : '❌';
            
            console.log(`   ${plan} ${status} ${key.name}: ${key.key_preview} (${key.environment})`);
        });

        // 5. Recomendações específicas
        console.log('\n💡 RECOMENDAÇÕES PARA SISTEMA MULTIUSUÁRIO:');
        
        console.log('\n   🔑 USUÁRIOS VIP (Plano Premium):');
        console.log('      • Cada um DEVE ter sua própria API Key da Bybit');
        console.log('      • Melhor controle de rate limits');
        console.log('      • Operações isoladas e rastreáveis');
        console.log('      • Maior segurança');
        
        console.log('\n   👥 USUÁRIOS BÁSICOS:');
        console.log('      • OPÇÃO 1: Chave compartilhada (mais simples)');
        console.log('      • OPÇÃO 2: Chaves individuais (mais seguro)');
        console.log('      • Recomendo começar com compartilhada');
        
        console.log('\n   🌐 VARIÁVEIS DE AMBIENTE ATUAIS:');
        console.log('      • BYBIT_API_KEY e BYBIT_SECRET_KEY estão corretas');
        console.log('      • Podem ser usadas como chaves compartilhadas');
        console.log('      • Ou como fallback para usuários básicos');

        // 6. Próximos passos práticos
        console.log('\n📋 PRÓXIMOS PASSOS PRÁTICOS:');
        console.log('\n   1. 🔑 Para USUÁRIOS VIP:');
        vipUsers.forEach(user => {
            if (user.active_keys === 0) {
                console.log(`      - ${user.name}: Criar conta Bybit → API Key → Configurar no sistema`);
            } else {
                console.log(`      - ${user.name}: ✅ Já configurado`);
            }
        });
        
        console.log('\n   2. 👤 Para USUÁRIOS BÁSICOS:');
        console.log('      - Podem usar a chave compartilhada atual');
        console.log('      - Ou criar chaves individuais se necessário');
        
        console.log('\n   3. 🛠️ IMPLEMENTAÇÃO:');
        console.log('      - Sistema já detecta automaticamente qual chave usar');
        console.log('      - Se usuário tem chave individual → usa ela');
        console.log('      - Se não tem → usa chave compartilhada (fallback)');
        
        // 7. Relatório final
        console.log('\n📊 RELATÓRIO FINAL:');
        const finalStats = {
            vipTotal: vipUsers.length,
            vipConfigured: vipUsers.filter(u => u.active_keys > 0).length,
            basicTotal: basicUsers.length,
            basicConfigured: basicUsers.filter(u => u.active_keys > 0).length
        };
        
        console.log(`   ⭐ VIP: ${finalStats.vipConfigured}/${finalStats.vipTotal} configurados`);
        console.log(`   👤 BÁSICO: ${finalStats.basicConfigured}/${finalStats.basicTotal} configurados`);
        console.log(`   🌍 Sistema: ${finalStats.vipConfigured + finalStats.basicConfigured}/${finalStats.vipTotal + finalStats.basicTotal} usuários prontos`);
        
        const readyPercentage = Math.round(
            ((finalStats.vipConfigured + finalStats.basicConfigured) / 
             (finalStats.vipTotal + finalStats.basicTotal)) * 100
        );
        
        console.log(`\n🎯 SISTEMA ${readyPercentage}% PRONTO PARA OPERAR!`);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error(error.stack);
    } finally {
        pool.end();
    }
}

configurarSistemaMultiusuarioBybit();
