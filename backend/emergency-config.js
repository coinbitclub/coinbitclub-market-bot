// CONFIGURAÇÃO DE EMERGÊNCIA - Sistema Híbrido
// Gerado automaticamente em: 2025-01-29T17:39:00.000Z
// IP do Railway: 132.255.160.140

module.exports = {
    emergencyMode: true,
    fallbackEnabled: true,
    requiredIPWhitelist: '132.255.160.140',
    lastAPICheck: '2025-01-29T17:39:00.000Z',
    
    // Status das chaves por usuário
    keyStatus: {
        'MAURO ALVES': { env: 'testnet', problem: '10003', action: 'recriar_key' },
        'PALOMA AMARAL': { env: 'mainnet', problem: '10004', action: 'whitelist_ip_e_verificar_secret' },
        'Érica dos Santos': { env: 'mainnet', problem: '10003', action: 'recriar_key' },
        'Luiza Maria de Almeida Pinto': { env: 'mainnet', problem: '10004', action: 'whitelist_ip_e_verificar_secret' }
    },
    
    // Dados de fallback para demonstração
    fallbackData: {
        balance: {
            totalEquity: "1000.00",
            availableBalance: "950.00", 
            unrealizedPnl: "0.00"
        },
        positions: [],
        orders: []
    },
    
    // Instruções para correção
    instructions: {
        ip_whitelist: {
            ip: '132.255.160.140',
            where: 'Bybit → API Management → IP Whitelist',
            priority: 'CRÍTICA'
        },
        key_recreation: {
            mauro: 'Testnet: Recriar API key completamente',
            erica: 'Mainnet: Recriar API key completamente', 
            paloma: 'Mainnet: Verificar secret key após whitelist IP',
            luiza: 'Mainnet: Verificar secret key após whitelist IP'
        }
    }
};
