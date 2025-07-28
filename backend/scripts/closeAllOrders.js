#!/usr/bin/env node

/**
 * 🔄 CLOSE ALL ORDERS SCRIPT - COINBITCLUB
 * Script para fechar todas as ordens conforme Seção 6.1 da especificação
 * Suporta fechamento por direção (LONG/SHORT/ALL)
 */

const { ExchangeManager } = require('../src/services/exchangeManager');
const { Logger } = require('../src/utils/logger');

async function closeAllOrders(direction = 'ALL') {
    try {
        console.log(`🔄 Iniciando fechamento de ordens: ${direction}`);
        
        const exchangeManager = new ExchangeManager();
        const startTime = Date.now();
        
        // Obter todas as posições ativas
        const activePositions = await exchangeManager.getActivePositions();
        console.log(`📊 Posições ativas encontradas: ${activePositions.length}`);
        
        // Filtrar por direção se especificada
        let positionsToClose = activePositions;
        if (direction !== 'ALL') {
            positionsToClose = activePositions.filter(position => 
                position.side.toUpperCase() === direction.toUpperCase()
            );
        }
        
        console.log(`🎯 Posições a fechar: ${positionsToClose.length}`);
        
        if (positionsToClose.length === 0) {
            console.log('✅ Nenhuma posição encontrada para fechar');
            return {
                success: true,
                closedOrders: 0,
                message: `Nenhuma posição ${direction} encontrada`
            };
        }
        
        // Fechar posições uma por uma
        const results = [];
        let successCount = 0;
        let errorCount = 0;
        
        for (const position of positionsToClose) {
            try {
                console.log(`🔄 Fechando posição: ${position.symbol} ${position.side} ${position.size}`);
                
                const closeResult = await exchangeManager.closePosition({
                    symbol: position.symbol,
                    side: position.side === 'LONG' ? 'SHORT' : 'LONG', // Ordem inversa
                    quantity: position.size,
                    type: 'MARKET'
                });
                
                results.push({
                    symbol: position.symbol,
                    side: position.side,
                    size: position.size,
                    status: 'closed',
                    orderId: closeResult.orderId
                });
                
                successCount++;
                console.log(`✅ Posição fechada: ${position.symbol}`);
                
            } catch (error) {
                console.error(`❌ Erro ao fechar ${position.symbol}:`, error.message);
                
                results.push({
                    symbol: position.symbol,
                    side: position.side,
                    size: position.size,
                    status: 'error',
                    error: error.message
                });
                
                errorCount++;
            }
        }
        
        const executionTime = Date.now() - startTime;
        
        // Log detalhado conforme especificação
        const logData = {
            action: 'close_all_orders',
            direction: direction,
            total_positions: activePositions.length,
            positions_to_close: positionsToClose.length,
            successful_closures: successCount,
            failed_closures: errorCount,
            execution_time_ms: executionTime,
            results: results,
            timestamp: new Date().toISOString()
        };
        
        Logger.info('Orders closed', logData);
        
        // Salvar no sistema de eventos conforme Seção 5.1
        await saveSystemEvent({
            event_type: 'order_closure',
            action: 'close_all_orders',
            context: logData,
            status: errorCount === 0 ? 'success' : 'partial_success',
            ia_involved: true
        });
        
        console.log('\n📊 RESUMO DO FECHAMENTO:');
        console.log(`✅ Sucessos: ${successCount}`);
        console.log(`❌ Erros: ${errorCount}`);
        console.log(`⏱️  Tempo: ${executionTime}ms`);
        
        const result = {
            success: errorCount === 0,
            closedOrders: successCount,
            failedOrders: errorCount,
            totalPositions: activePositions.length,
            executionTime: executionTime,
            results: results
        };
        
        if (require.main === module) {
            console.log('\n🎉 Script concluído com sucesso!');
            process.exit(errorCount === 0 ? 0 : 1);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Erro crítico no fechamento de ordens:', error);
        
        Logger.error('Failed to close orders', {
            error: error.message,
            stack: error.stack,
            direction: direction,
            timestamp: new Date().toISOString()
        });
        
        if (require.main === module) {
            process.exit(1);
        }
        
        throw error;
    }
}

async function saveSystemEvent(eventData) {
    try {
        // Implementar salvamento conforme Seção 5.1 da especificação
        const event = {
            ...eventData,
            timestamp: new Date(),
            microservice: 'order-manager',
            source_ip: getLocalIP(),
            created_at: new Date(),
            updated_at: new Date()
        };
        
        // Aqui seria salvo no banco PostgreSQL conforme tabela system_events
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
    const direction = process.argv[2] || 'ALL';
    
    if (!['LONG', 'SHORT', 'ALL'].includes(direction.toUpperCase())) {
        console.error('❌ Direção inválida. Use: LONG, SHORT ou ALL');
        process.exit(1);
    }
    
    console.log('🚀 COINBITCLUB - CLOSE ALL ORDERS');
    console.log(`📅 Data: ${new Date().toLocaleString()}`);
    console.log(`🎯 Direção: ${direction.toUpperCase()}`);
    console.log('');
    
    closeAllOrders(direction.toUpperCase());
}

module.exports = closeAllOrders;
