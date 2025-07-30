const MultiUserApiKeyManager = require('./multiuser-api-manager');

class BybitApiHelper {
    constructor() {
        this.manager = new MultiUserApiKeyManager();
    }

    // Buscar chaves API de um usuário específico
    async getApiKeysForUser(userId) {
        try {
            const keys = await this.manager.getUserApiKeys(userId, 'bybit');
            
            if (!keys) {
                console.log(`⚠️  Usuário ${userId} não possui chaves válidas`);
                return null;
            }

            // Verificar se não são placeholders
            if (keys.api_key.includes('PENDING') || keys.api_key.includes('VIP_API_KEY')) {
                console.log(`⚠️  Usuário ${userId} tem chaves placeholder - requer configuração real`);
                return null;
            }

            return {
                apiKey: keys.api_key,
                secretKey: keys.secret_key,
                environment: keys.environment
            };
        } catch (error) {
            console.error(`❌ Erro ao buscar chaves do usuário ${userId}:`, error.message);
            return null;
        }
    }

    // Fazer uma requisição autenticada para a API da Bybit
    async makeAuthenticatedRequest(userId, endpoint, params = {}) {
        const keys = await this.getApiKeysForUser(userId);
        
        if (!keys) {
            throw new Error(`Usuário ${userId} não possui chaves API válidas`);
        }

        // Aqui você implementaria a lógica de assinatura da Bybit
        console.log(`🔄 Fazendo requisição para ${endpoint} com chaves do usuário ${userId}`);
        
        // Exemplo de estrutura para implementar depois:
        return {
            success: true,
            message: `Requisição simulada para ${endpoint}`,
            userKeys: keys.apiKey.substring(0, 10) + '...'
        };
    }

    // Verificar se um usuário pode fazer operações
    async canUserTrade(userId) {
        const keys = await this.getApiKeysForUser(userId);
        return keys !== null;
    }

    // Listar usuários que podem operar
    async getActiveTraders() {
        const allUsers = await this.manager.listAllUsersWithKeys();
        
        const activeTraders = allUsers.filter(user => 
            user.key_id && 
            user.key_active && 
            user.validation_status === 'valid' &&
            !user.api_key_preview.includes('PENDING')
        );

        return activeTraders.map(user => ({
            userId: user.id,
            name: user.name,
            email: user.email,
            isVip: user.vip_status,
            exchange: user.exchange,
            environment: user.environment
        }));
    }

    // Exemplo de uso para operações de trading
    async executeTrade(userId, symbol, side, quantity) {
        try {
            console.log(`🔄 Executando trade para usuário ${userId}:`);
            console.log(`   📈 ${symbol} | ${side} | ${quantity}`);

            // Verificar se usuário pode operar
            if (!(await this.canUserTrade(userId))) {
                throw new Error(`Usuário ${userId} não pode operar - chaves inválidas ou ausentes`);
            }

            // Fazer requisição (simulada)
            const result = await this.makeAuthenticatedRequest(userId, '/v2/private/order/create', {
                symbol,
                side,
                qty: quantity,
                order_type: 'Market'
            });

            console.log(`✅ Trade executado com sucesso para usuário ${userId}`);
            return result;

        } catch (error) {
            console.error(`❌ Erro ao executar trade para usuário ${userId}:`, error.message);
            throw error;
        }
    }

    // Fechar conexão
    async close() {
        await this.manager.close();
    }
}

// Exemplo de uso
async function exemploUso() {
    const helper = new BybitApiHelper();

    try {
        console.log('🚀 EXEMPLO DE USO DO SISTEMA MULTIUSUÁRIO');
        console.log('=========================================');

        // 1. Listar traders ativos
        const activeTraders = await helper.getActiveTraders();
        console.log('\n👥 TRADERS ATIVOS:');
        activeTraders.forEach(trader => {
            console.log(`   ✅ ${trader.name} (ID: ${trader.userId}) - ${trader.exchange} ${trader.environment}`);
        });

        // 2. Testar operação para cada trader ativo
        console.log('\n🔄 TESTANDO OPERAÇÕES:');
        for (const trader of activeTraders) {
            try {
                await helper.executeTrade(trader.userId, 'BTCUSDT', 'Buy', 0.001);
            } catch (error) {
                console.log(`   ❌ Falha para ${trader.name}: ${error.message}`);
            }
        }

        // 3. Verificar usuário específico
        console.log('\n🔍 VERIFICAÇÃO DE USUÁRIO ESPECÍFICO:');
        const userId = 4; // Luiza
        const canTrade = await helper.canUserTrade(userId);
        console.log(`   Usuário ${userId} pode operar: ${canTrade ? '✅ Sim' : '❌ Não'}`);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await helper.close();
    }
}

// Executar exemplo se chamado diretamente
if (require.main === module) {
    exemploUso();
}

module.exports = BybitApiHelper;
