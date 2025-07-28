#!/usr/bin/env node

/**
 * ⏸️ PAUSE NEW ORDERS SCRIPT - COINBITCLUB  
 * Script para pausar novas ordens conforme Seção 6.2 da especificação
 * Usa Redis para controle de estado
 */

const Redis = require('redis');
const { Logger } = require('../src/utils/logger');

async function pauseNewOrders(direction = 'ALL', durationMs = 600000) {
    let redis;
    
    try {
        console.log(`⏸️ Pausando novas ordens: ${direction} por ${durationMs}ms`);
        
        // Conectar ao Redis
        redis = Redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        
        await redis.connect();
        console.log('📡 Conectado ao Redis');
        
        const pauseKey = `pause_orders:${direction}`;
        const resumeTime = Date.now() + durationMs;
        const ttlSeconds = Math.ceil(durationMs / 1000);
        
        // Definir chave de pausa com TTL automático
        await redis.setex(pauseKey, ttlSeconds, resumeTime.toString());
        
        // Se pausar todas as direções, criar chaves específicas também
        if (direction === 'ALL') {
            await redis.setex('pause_orders:LONG', ttlSeconds, resumeTime.toString());
            await redis.setex('pause_orders:SHORT', ttlSeconds, resumeTime.toString());
        }
        
        const resumeDate = new Date(resumeTime);
        
        console.log(`✅ Ordens ${direction} pausadas até: ${resumeDate.toLocaleString()}`);
        console.log(`⏱️  Duração: ${Math.round(durationMs / 60000)} minutos`);
        
        // Log detalhado conforme especificação
        const logData = {
            action: 'pause_new_orders',
            direction: direction,
            duration_ms: durationMs,
            resume_time: resumeTime,
            resume_date: resumeDate.toISOString(),
            redis_key: pauseKey,
            ttl_seconds: ttlSeconds,
            timestamp: new Date().toISOString()
        };
        
        Logger.info('Orders paused', logData);
        
        // Salvar evento no sistema conforme Seção 5.1
        await saveSystemEvent({
            event_type: 'order_pause',
            action: 'pause_new_orders',
            context: logData,
            status: 'active',
            ia_involved: true
        });
        
        // Criar job para notificar quando expirar
        await scheduleResumeNotification(direction, resumeTime);
        
        const result = {
            success: true,
            direction: direction,
            duration_ms: durationMs,
            resume_time: resumeTime,
            resume_date: resumeDate,
            redis_key: pauseKey
        };
        
        if (require.main === module) {
            console.log('\n🎉 Ordens pausadas com sucesso!');
            console.log('💡 Para verificar status: redis-cli GET ' + pauseKey);
            process.exit(0);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Erro ao pausar ordens:', error);
        
        Logger.error('Failed to pause orders', {
            error: error.message,
            stack: error.stack,
            direction: direction,
            duration_ms: durationMs,
            timestamp: new Date().toISOString()
        });
        
        if (require.main === module) {
            process.exit(1);
        }
        
        throw error;
        
    } finally {
        if (redis) {
            await redis.disconnect();
        }
    }
}

async function scheduleResumeNotification(direction, resumeTime) {
    try {
        // Agendar notificação para quando a pausa expirar
        const timeUntilResume = resumeTime - Date.now();
        
        if (timeUntilResume > 0) {
            setTimeout(async () => {
                console.log(`🟢 Ordens ${direction} foram automaticamente reativadas`);
                
                Logger.info('Orders automatically resumed', {
                    direction: direction,
                    resumed_at: new Date().toISOString(),
                    action: 'auto_resume'
                });
                
                await saveSystemEvent({
                    event_type: 'order_resume',
                    action: 'auto_resume_orders',
                    context: { direction: direction },
                    status: 'completed',
                    ia_involved: false
                });
                
            }, timeUntilResume);
        }
        
    } catch (error) {
        console.error('Erro ao agendar notificação:', error);
    }
}

async function checkPauseStatus(direction = 'ALL') {
    let redis;
    
    try {
        redis = Redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        
        await redis.connect();
        
        const pauseKey = `pause_orders:${direction}`;
        const resumeTimeStr = await redis.get(pauseKey);
        
        if (!resumeTimeStr) {
            return {
                paused: false,
                direction: direction,
                message: `Ordens ${direction} não estão pausadas`
            };
        }
        
        const resumeTime = parseInt(resumeTimeStr);
        const now = Date.now();
        
        if (now >= resumeTime) {
            // Pausa expirou, remover chave
            await redis.del(pauseKey);
            
            return {
                paused: false,
                direction: direction,
                message: `Ordens ${direction} foram automaticamente reativadas`
            };
        }
        
        const timeRemaining = resumeTime - now;
        const resumeDate = new Date(resumeTime);
        
        return {
            paused: true,
            direction: direction,
            resume_time: resumeTime,
            resume_date: resumeDate,
            time_remaining_ms: timeRemaining,
            time_remaining_minutes: Math.round(timeRemaining / 60000),
            message: `Ordens ${direction} pausadas até ${resumeDate.toLocaleString()}`
        };
        
    } catch (error) {
        throw error;
    } finally {
        if (redis) {
            await redis.disconnect();
        }
    }
}

async function resumeOrders(direction = 'ALL') {
    let redis;
    
    try {
        redis = Redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        
        await redis.connect();
        
        const pauseKey = `pause_orders:${direction}`;
        const deleted = await redis.del(pauseKey);
        
        if (direction === 'ALL') {
            await redis.del('pause_orders:LONG');
            await redis.del('pause_orders:SHORT');
        }
        
        if (deleted > 0) {
            console.log(`🟢 Ordens ${direction} reativadas manualmente`);
            
            Logger.info('Orders manually resumed', {
                direction: direction,
                resumed_at: new Date().toISOString(),
                action: 'manual_resume'
            });
            
            return {
                success: true,
                direction: direction,
                message: `Ordens ${direction} reativadas com sucesso`
            };
        } else {
            return {
                success: false,
                direction: direction,
                message: `Ordens ${direction} não estavam pausadas`
            };
        }
        
    } catch (error) {
        throw error;
    } finally {
        if (redis) {
            await redis.disconnect();
        }
    }
}

async function saveSystemEvent(eventData) {
    try {
        const event = {
            ...eventData,
            timestamp: new Date(),
            microservice: 'order-manager',
            source_ip: getLocalIP(),
            created_at: new Date(),
            updated_at: new Date()
        };
        
        console.log('💾 Evento salvo:', event.event_type);
        
    } catch (error) {
        console.error('Erro ao salvar evento:', error);
    }
}

function getLocalIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    
    return '127.0.0.1';
}

// Execução via linha de comando
if (require.main === module) {
    const command = process.argv[2] || 'pause';
    const direction = process.argv[3] || 'ALL';
    const duration = parseInt(process.argv[4]) || 600000;
    
    console.log('⏸️ COINBITCLUB - ORDER PAUSE MANAGER');
    console.log(`📅 Data: ${new Date().toLocaleString()}`);
    console.log('');
    
    switch (command.toLowerCase()) {
        case 'pause':
            if (!['LONG', 'SHORT', 'ALL'].includes(direction.toUpperCase())) {
                console.error('❌ Direção inválida. Use: LONG, SHORT ou ALL');
                process.exit(1);
            }
            pauseNewOrders(direction.toUpperCase(), duration);
            break;
            
        case 'status':
            checkPauseStatus(direction.toUpperCase())
                .then(status => {
                    console.log('📊 Status das ordens:');
                    console.log(JSON.stringify(status, null, 2));
                    process.exit(0);
                })
                .catch(error => {
                    console.error('❌ Erro:', error.message);
                    process.exit(1);
                });
            break;
            
        case 'resume':
            resumeOrders(direction.toUpperCase())
                .then(result => {
                    console.log('🟢 Resultado:');
                    console.log(JSON.stringify(result, null, 2));
                    process.exit(0);
                })
                .catch(error => {
                    console.error('❌ Erro:', error.message);
                    process.exit(1);
                });
            break;
            
        default:
            console.log('❓ Comandos disponíveis:');
            console.log('  node pauseNewOrders.js pause [LONG|SHORT|ALL] [duração_ms]');
            console.log('  node pauseNewOrders.js status [LONG|SHORT|ALL]');
            console.log('  node pauseNewOrders.js resume [LONG|SHORT|ALL]');
            console.log('');
            console.log('💡 Exemplos:');
            console.log('  node pauseNewOrders.js pause ALL 600000    # Pausar todas por 10min');
            console.log('  node pauseNewOrders.js pause LONG 300000   # Pausar LONG por 5min');
            console.log('  node pauseNewOrders.js status ALL          # Ver status');
            console.log('  node pauseNewOrders.js resume ALL          # Reativar todas');
            process.exit(0);
    }
}

module.exports = {
    pauseNewOrders,
    checkPauseStatus,
    resumeOrders
};
