/**
 * Configuração do api-key-manager
 */

module.exports = {
    service: {
        name: 'api-key-manager',
        description: 'Gestão segura de chaves API',
        dependencies: [
        "orchestrator"
],
        priority: 2
    },
    
    // TODO: Adicionar configurações específicas
    
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        service: 'api-key-manager'
    }
};