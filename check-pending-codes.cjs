#!/usr/bin/env node

const { Pool } = require('pg');

// Configuração do banco
const pool = new Pool({
    host: 'autorack.proxy.rlwy.net',
    port: 17089,
    database: 'railway',
    user: 'postgres',
    password: 'dWpajeMBclUlEAkrCVdKZGvyJzxQWJzl'
});

async function checkPendingVerifications() {
    console.log('🔍 Verificando códigos pendentes no banco...\n');
    
    try {
        // Verificar usuários com códigos pendentes
        const userQuery = `
            SELECT 
                id,
                email,
                whatsapp,
                whatsapp_verified,
                whatsapp_verification_code,
                whatsapp_verification_expires,
                whatsapp_verification_attempts,
                NOW() as current_time,
                (whatsapp_verification_expires > NOW()) as is_valid
            FROM users 
            WHERE whatsapp_verification_code IS NOT NULL
            ORDER BY whatsapp_verification_expires DESC
        `;
        
        const userResult = await pool.query(userQuery);
        
        console.log('👥 USUÁRIOS COM CÓDIGOS PENDENTES:');
        console.log('Total encontrados:', userResult.rows.length);
        
        userResult.rows.forEach((user, index) => {
            console.log(`\n${index + 1}. Usuário ID: ${user.id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   WhatsApp: ${user.whatsapp}`);
            console.log(`   Verificado: ${user.whatsapp_verified}`);
            console.log(`   Código: ${user.whatsapp_verification_code}`);
            console.log(`   Expira em: ${user.whatsapp_verification_expires}`);
            console.log(`   Tentativas: ${user.whatsapp_verification_attempts}`);
            console.log(`   Ainda válido: ${user.is_valid}`);
        });
        
        // Verificar logs de verificação
        const logsQuery = `
            SELECT *
            FROM whatsapp_verification_logs
            ORDER BY created_at DESC
            LIMIT 10
        `;
        
        const logsResult = await pool.query(logsQuery);
        
        console.log('\n📋 ÚLTIMOS LOGS DE VERIFICAÇÃO:');
        console.log('Total encontrados:', logsResult.rows.length);
        
        logsResult.rows.forEach((log, index) => {
            console.log(`\n${index + 1}. Log ID: ${log.id}`);
            console.log(`   Usuário ID: ${log.user_id}`);
            console.log(`   WhatsApp: ${log.whatsapp_number}`);
            console.log(`   Status: ${log.status}`);
            console.log(`   Tipo: ${log.verification_type}`);
            console.log(`   Criado em: ${log.created_at}`);
            if (log.error_message) {
                console.log(`   Erro: ${log.error_message}`);
            }
        });
        
        // Limpar códigos expirados manualmente
        console.log('\n🧹 LIMPANDO CÓDIGOS EXPIRADOS...');
        
        const cleanupQuery = `
            UPDATE users 
            SET 
                whatsapp_verification_code = NULL,
                whatsapp_verification_expires = NULL,
                whatsapp_verification_attempts = 0
            WHERE whatsapp_verification_expires < NOW()
            AND whatsapp_verification_code IS NOT NULL
        `;
        
        const cleanupResult = await pool.query(cleanupQuery);
        console.log('✅ Códigos limpos:', cleanupResult.rowCount);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

checkPendingVerifications();
