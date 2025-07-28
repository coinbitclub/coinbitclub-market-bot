#!/usr/bin/env node

/**
 * 🔄 RETRIGGER WEBHOOK SCRIPT - COINBITCLUB
 * Script para retriggering de webhooks conforme Seção 6.3 da especificação
 * Inclui retry automático e logging detalhado
 */

const axios = require('axios');
const { Logger } = require('../src/utils/logger');

async function retriggerWebhook(endpoint, retries = 3, timeoutMs = 5000) {
    console.log(`🔄 Iniciando retrigger do webhook: ${endpoint}`);
    console.log(`🔢 Tentativas máximas: ${retries}`);
    console.log(`⏱️  Timeout: ${timeoutMs}ms`);
    console.log('');
    
    let lastError = null;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`🚀 Tentativa ${attempt}/${retries}...`);
            
            const startTime = Date.now();
            
            const response = await axios.post(endpoint, {
                retrigger: true,
                attempt: attempt,
                timestamp: Date.now(),
                triggered_by: 'ai_monitoring_system',
                source: 'retrigger_script'
            }, {
                timeout: timeoutMs,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'CoinbitClub-Retriggerer/1.0',
                    'X-Retrigger-Attempt': attempt.toString(),
                    'X-Source': 'ai_monitoring'
                },
                validateStatus: (status) => status < 500 // Aceitar 4xx mas não 5xx
            });
            
            const responseTime = Date.now() - startTime;
            
            if (response.status === 200) {
                console.log(`✅ Webhook retriggered com sucesso!`);
                console.log(`📊 Status: ${response.status}`);
                console.log(`⏱️  Tempo de resposta: ${responseTime}ms`);
                console.log(`📝 Dados retornados:`, response.data);
                
                // Log de sucesso conforme especificação
                const logData = {
                    action: 'webhook_retrigger_success',
                    endpoint: endpoint,
                    attempt: attempt,
                    response_status: response.status,
                    response_time_ms: responseTime,
                    response_data: response.data,
                    timestamp: new Date().toISOString()
                };
                
                Logger.info('Webhook retriggered successfully', logData);
                
                // Salvar evento no sistema
                await saveSystemEvent({
                    event_type: 'webhook_retrigger',
                    action: 'retrigger_success',
                    context: logData,
                    status: 'success',
                    ia_involved: true
                });
                
                return {
                    success: true,
                    attempt: attempt,
                    responseTime: responseTime,
                    status: response.status,
                    data: response.data
                };
                
            } else {
                console.log(`⚠️  Resposta não-sucesso: ${response.status}`);
                lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
                
                // Log de warning
                Logger.warn('Webhook retrigger non-success response', {
                    endpoint: endpoint,
                    attempt: attempt,
                    status: response.status,
                    statusText: response.statusText
                });
            }
            
        } catch (error) {
            lastError = error;
            
            console.log(`❌ Tentativa ${attempt} falhou:`, error.message);
            
            // Log detalhado do erro
            const errorLog = {
                action: 'webhook_retrigger_failed',
                endpoint: endpoint,
                attempt: attempt,
                error_message: error.message,
                error_code: error.code,
                error_type: error.name,
                timestamp: new Date().toISOString()
            };
            
            if (error.response) {
                errorLog.response_status = error.response.status;
                errorLog.response_data = error.response.data;
            }
            
            Logger.warn('Webhook retrigger failed', errorLog);
            
            // Aguardar antes da próxima tentativa (backoff exponencial)
            if (attempt < retries) {
                const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
                console.log(`⏳ Aguardando ${waitTime}ms antes da próxima tentativa...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
    
    // Todas as tentativas falharam
    console.log(`❌ Todas as ${retries} tentativas falharam`);
    console.log(`❌ Último erro:`, lastError.message);
    
    const finalErrorLog = {
        action: 'webhook_retrigger_all_failed',
        endpoint: endpoint,
        total_attempts: retries,
        final_error: lastError.message,
        timestamp: new Date().toISOString()
    };
    
    Logger.error('All webhook retrigger attempts failed', finalErrorLog);
    
    // Salvar evento de falha crítica
    await saveSystemEvent({
        event_type: 'webhook_retrigger_failed',
        action: 'all_attempts_failed',
        context: finalErrorLog,
        status: 'failed',
        ia_involved: true
    });
    
    if (require.main === module) {
        process.exit(1);
    }
    
    return {
        success: false,
        attempts: retries,
        lastError: lastError.message
    };
}

async function testWebhookHealth(endpoint) {
    try {
        console.log(`🔍 Testando saúde do webhook: ${endpoint}`);
        
        const response = await axios.get(endpoint + '/health', {
            timeout: 3000,
            validateStatus: () => true // Aceitar qualquer status
        });
        
        console.log(`📊 Status de saúde: ${response.status}`);
        
        return {
            healthy: response.status === 200,
            status: response.status,
            response: response.data
        };
        
    } catch (error) {
        console.log(`❌ Erro no teste de saúde:`, error.message);
        
        return {
            healthy: false,
            error: error.message
        };
    }
}

async function bulkRetriggerWebhooks(endpoints, options = {}) {
    const { 
        retries = 3, 
        timeoutMs = 5000, 
        concurrent = 3,
        delayBetweenMs = 1000 
    } = options;
    
    console.log(`🔄 Retriggering em lote de ${endpoints.length} webhooks`);
    console.log(`🔢 Máx. ${concurrent} simultâneos, ${delayBetweenMs}ms de delay`);
    console.log('');
    
    const results = [];
    
    // Processar em batches para não sobrecarregar
    for (let i = 0; i < endpoints.length; i += concurrent) {
        const batch = endpoints.slice(i, i + concurrent);
        
        console.log(`📦 Processando batch ${Math.floor(i/concurrent) + 1}: ${batch.length} webhooks`);
        
        const batchPromises = batch.map(async (endpoint) => {
            try {
                const result = await retriggerWebhook(endpoint, retries, timeoutMs);
                return { endpoint, ...result };
            } catch (error) {
                return { 
                    endpoint, 
                    success: false, 
                    error: error.message 
                };
            }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Delay entre batches
        if (i + concurrent < endpoints.length) {
            console.log(`⏳ Aguardando ${delayBetweenMs}ms antes do próximo batch...`);
            await new Promise(resolve => setTimeout(resolve, delayBetweenMs));
        }
    }
    
    // Resumo final
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('\n📊 RESUMO DO RETRIGGER EM LOTE:');
    console.log(`✅ Sucessos: ${successful}/${endpoints.length}`);
    console.log(`❌ Falhas: ${failed}/${endpoints.length}`);
    console.log(`📈 Taxa de sucesso: ${Math.round((successful/endpoints.length)*100)}%`);
    
    Logger.info('Bulk webhook retrigger completed', {
        total_webhooks: endpoints.length,
        successful: successful,
        failed: failed,
        success_rate: successful/endpoints.length,
        results: results
    });
    
    return {
        total: endpoints.length,
        successful: successful,
        failed: failed,
        successRate: successful/endpoints.length,
        results: results
    };
}

async function saveSystemEvent(eventData) {
    try {
        const event = {
            ...eventData,
            timestamp: new Date(),
            microservice: 'webhook-handler',
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
    const command = process.argv[2];
    
    if (!command) {
        console.log('🔄 COINBITCLUB - WEBHOOK RETRIGGER SCRIPT');
        console.log('');
        console.log('❓ Comandos disponíveis:');
        console.log('  node retriggerWebhook.js <endpoint> [tentativas] [timeout]');
        console.log('  node retriggerWebhook.js test <endpoint>');
        console.log('  node retriggerWebhook.js bulk <endpoint1,endpoint2,...>');
        console.log('');
        console.log('💡 Exemplos:');
        console.log('  node retriggerWebhook.js http://localhost:3000/webhook/tradingview');
        console.log('  node retriggerWebhook.js http://localhost:3000/webhook/stripe 5 10000');
        console.log('  node retriggerWebhook.js test http://localhost:3000/webhook/test');
        console.log('  node retriggerWebhook.js bulk "http://localhost:3000/webhook/tv,http://localhost:3000/webhook/stripe"');
        process.exit(0);
    }
    
    if (command === 'test') {
        const endpoint = process.argv[3];
        if (!endpoint) {
            console.error('❌ Endpoint obrigatório para teste');
            process.exit(1);
        }
        
        testWebhookHealth(endpoint)
            .then(result => {
                console.log('🔍 Resultado do teste:');
                console.log(JSON.stringify(result, null, 2));
                process.exit(result.healthy ? 0 : 1);
            })
            .catch(error => {
                console.error('❌ Erro no teste:', error.message);
                process.exit(1);
            });
            
    } else if (command === 'bulk') {
        const endpointsStr = process.argv[3];
        if (!endpointsStr) {
            console.error('❌ Lista de endpoints obrigatória para bulk');
            process.exit(1);
        }
        
        const endpoints = endpointsStr.split(',').map(e => e.trim());
        
        bulkRetriggerWebhooks(endpoints)
            .then(result => {
                console.log('\n🎉 Retrigger em lote concluído!');
                process.exit(result.failed === 0 ? 0 : 1);
            })
            .catch(error => {
                console.error('❌ Erro no retrigger em lote:', error.message);
                process.exit(1);
            });
            
    } else {
        // Retrigger simples
        const endpoint = command;
        const retries = parseInt(process.argv[3]) || 3;
        const timeout = parseInt(process.argv[4]) || 5000;
        
        if (!endpoint.startsWith('http')) {
            console.error('❌ Endpoint deve começar com http:// ou https://');
            process.exit(1);
        }
        
        console.log('🔄 COINBITCLUB - WEBHOOK RETRIGGER');
        console.log(`📅 Data: ${new Date().toLocaleString()}`);
        console.log('');
        
        retriggerWebhook(endpoint, retries, timeout)
            .then(result => {
                if (result.success) {
                    console.log('\n🎉 Retrigger concluído com sucesso!');
                    process.exit(0);
                } else {
                    console.log('\n❌ Retrigger falhou');
                    process.exit(1);
                }
            })
            .catch(error => {
                console.error('❌ Erro crítico:', error.message);
                process.exit(1);
            });
    }
}

module.exports = {
    retriggerWebhook,
    testWebhookHealth,
    bulkRetriggerWebhooks
};
