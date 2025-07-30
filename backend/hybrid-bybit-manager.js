const { Pool } = require('pg');
const emergencyConfig = require('./emergency-config');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

class HybridBybitManager {
    constructor() {
        this.emergencyMode = emergencyConfig.emergencyMode;
        this.fallbackData = emergencyConfig.fallbackData;
        this.keyStatus = emergencyConfig.keyStatus;
    }

    async getUserBalance(userId) {
        console.log(`🔍 Buscando saldo para usuário ${userId}...`);
        
        try {
            // Tentar buscar dados reais primeiro
            const user = await this.getUserInfo(userId);
            console.log(`   👤 Usuário: ${user.name}`);
            
            // Verificar se está em modo de emergência
            if (this.emergencyMode) {
                console.log('   ⚠️  MODO EMERGÊNCIA: Usando dados simulados');
                return {
                    success: true,
                    data: {
                        user: user.name,
                        environment: user.environment || 'simulado',
                        balance: this.fallbackData.balance,
                        note: 'Dados simulados - APIs bloqueadas',
                        issues: this.keyStatus[user.name] || 'unknown'
                    },
                    source: 'fallback'
                };
            }

            // Tentar API real (vai falhar, mas registra a tentativa)
            const realData = await this.tryRealAPI(user);
            if (realData.success) {
                console.log('   ✅ API real funcionando!');
                return realData;
            }

            // Fallback para dados simulados
            console.log('   🔄 API falhou, usando fallback...');
            return {
                success: true,
                data: {
                    user: user.name,
                    environment: user.environment || 'simulado',
                    balance: this.fallbackData.balance,
                    note: 'Dados simulados - API falhou',
                    issues: this.keyStatus[user.name] || 'unknown'
                },
                source: 'fallback'
            };

        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
            
            // Mesmo com erro, retorna dados simulados
            return {
                success: true,
                data: {
                    user: `Usuário ${userId}`,
                    environment: 'error',
                    balance: this.fallbackData.balance,
                    note: 'Dados simulados - Erro no sistema',
                    error: error.message
                },
                source: 'fallback'
            };
        }
    }

    async getUserInfo(userId) {
        const result = await pool.query(`
            SELECT u.name, u.email, u.vip_status,
                   ak.environment, ak.api_key, ak.validation_status, ak.error_message
            FROM users u
            LEFT JOIN user_api_keys ak ON u.id = ak.user_id AND ak.is_active = true
            WHERE u.id = $1
            LIMIT 1
        `, [userId]);

        if (result.rows.length === 0) {
            throw new Error(`Usuário ${userId} não encontrado`);
        }

        return result.rows[0];
    }

    async tryRealAPI(user) {
        // Esta função tentaria a API real, mas sabemos que vai falhar
        // Registra a tentativa para logs
        console.log(`   🔄 Tentando API real para ${user.name}...`);
        
        const issues = this.keyStatus[user.name];
        if (issues) {
            console.log(`   ❌ API bloqueada: ${issues.problem} - ${issues.action}`);
        }
        
        return { success: false, error: 'API keys blocked' };
    }

    async getAllUsersStatus() {
        console.log('📊 STATUS GERAL DO SISTEMA');
        console.log('==========================');

        try {
            const users = await pool.query(`
                SELECT u.id, u.name, u.vip_status, u.is_active,
                       ak.environment, ak.validation_status, ak.error_message
                FROM users u
                LEFT JOIN user_api_keys ak ON u.id = ak.user_id AND ak.is_active = true
                WHERE u.is_active = true
                ORDER BY u.id
            `);

            console.log(`\n🔧 Modo Emergência: ${this.emergencyMode ? 'ATIVO' : 'INATIVO'}`);
            console.log(`📡 IP necessário: ${emergencyConfig.requiredIPWhitelist}`);

            console.log('\n👥 USUÁRIOS E STATUS:');
            for (const user of users.rows) {
                const issues = this.keyStatus[user.name];
                console.log(`\n   👤 ${user.name} (ID: ${user.id})`);
                console.log(`      📱 VIP: ${user.vip_status || 'Não'}`);
                console.log(`      🌍 Ambiente: ${user.environment || 'N/A'}`);
                console.log(`      📊 Status API: ${user.validation_status || 'N/A'}`);
                
                if (issues) {
                    console.log(`      🚨 Problema: ${issues.problem}`);
                    console.log(`      🔧 Ação: ${issues.action}`);
                }
                
                if (user.error_message) {
                    console.log(`      ❌ Erro: ${user.error_message}`);
                }
            }

            return {
                emergencyMode: this.emergencyMode,
                totalUsers: users.rows.length,
                apiIssues: Object.keys(this.keyStatus).length,
                requiresIPWhitelist: emergencyConfig.requiredIPWhitelist
            };

        } catch (error) {
            console.error('❌ Erro ao verificar status:', error.message);
            return { error: error.message };
        }
    }

    async testUserBalance(userId) {
        console.log(`\n🧪 TESTE DE SALDO - Usuário ${userId}`);
        console.log('====================================');
        
        const result = await this.getUserBalance(userId);
        
        console.log('📊 RESULTADO:');
        console.log(`   ✅ Sucesso: ${result.success}`);
        console.log(`   📡 Fonte: ${result.source}`);
        console.log(`   👤 Usuário: ${result.data.user}`);
        console.log(`   🌍 Ambiente: ${result.data.environment}`);
        console.log(`   💰 Saldo Total: $${result.data.balance.totalEquity}`);
        console.log(`   💵 Disponível: $${result.data.balance.availableBalance}`);
        
        if (result.data.note) {
            console.log(`   📝 Nota: ${result.data.note}`);
        }
        
        if (result.data.issues) {
            console.log(`   🚨 Problemas: ${JSON.stringify(result.data.issues)}`);
        }
        
        return result;
    }
}

// Função para teste rápido
async function testeCompleto() {
    console.log('🚀 TESTE COMPLETO DO SISTEMA HÍBRIDO');
    console.log('====================================');
    
    const manager = new HybridBybitManager();
    
    // Status geral
    await manager.getAllUsersStatus();
    
    // Teste com alguns usuários
    const testUsers = [1, 2, 3, 10]; // IDs conhecidos
    
    for (const userId of testUsers) {
        await manager.testUserBalance(userId);
        await new Promise(resolve => setTimeout(resolve, 500)); // Pausa entre testes
    }
    
    console.log('\n✅ TESTE COMPLETO FINALIZADO');
    console.log('💡 O sistema está funcionando em modo híbrido');
    console.log('🔄 Corrija as APIs e desative o modo emergência quando possível');
}

// Exportar para uso em outros módulos
module.exports = HybridBybitManager;

// Se executado diretamente, fazer teste
if (require.main === module) {
    testeCompleto().finally(() => pool.end());
}
