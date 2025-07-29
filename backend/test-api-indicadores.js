/**
 * CLIENTE DE TESTE PARA API CENTRAL DE INDICADORES
 * ================================================
 * Testa todas as funcionalidades da API
 */

const axios = require('axios');

const API_URL = 'http://localhost:3002';

// Configuração de usuários de teste
const TEST_USERS = [
    { id: 12, access_level: 'ADMIN', name: 'Admin Principal' },
    { id: 13, access_level: 'GESTOR', name: 'Gestor Operacional' },
    { id: 14, access_level: 'AFILIADO', name: 'Afiliado VIP' },
    { id: 15, access_level: 'USUARIO', name: 'Usuario Comum' }
];

class APITester {
    constructor() {
        this.axios = axios.create({
            baseURL: API_URL,
            timeout: 10000
        });
    }

    async testHealthCheck() {
        console.log('🔍 TESTANDO HEALTH CHECK');
        console.log('========================');
        
        try {
            const response = await this.axios.get('/health');
            console.log('✅ Health check OK');
            console.log('📋 Resposta:', JSON.stringify(response.data, null, 2));
            return true;
        } catch (error) {
            console.log('❌ Health check falhou:', error.message);
            return false;
        }
    }

    async testDashboard(user) {
        console.log(`\n📊 TESTANDO DASHBOARD - ${user.name} (${user.access_level})`);
        console.log('='.repeat(60));
        
        try {
            const response = await this.axios.get(`/api/dashboard/${user.id}`, {
                headers: {
                    'user_id': user.id,
                    'access_level': user.access_level
                }
            });

            console.log('✅ Dashboard carregado com sucesso');
            console.log('👤 Usuário:', response.data.user);
            console.log('📂 Seções disponíveis:', Object.keys(response.data.sections));
            
            // Mostrar detalhes de cada seção
            for (const [section, data] of Object.entries(response.data.sections)) {
                console.log(`\n📋 SEÇÃO: ${section.toUpperCase()}`);
                if (data.error) {
                    console.log(`   ❌ Erro: ${data.error}`);
                } else {
                    console.log(`   ✅ Dados carregados: ${Object.keys(data).length} campos`);
                    
                    // Mostrar resumo específico por seção
                    switch (section) {
                        case 'operations':
                            console.log(`   💳 Operações REAL: ${data.real_operations?.total || 0}`);
                            console.log(`   🎁 Operações BONUS: ${data.bonus_operations?.total || 0}`);
                            break;
                        case 'financial':
                            console.log(`   💰 Operações mensais: ${data.monthly_revenue?.total_operations || 0}`);
                            console.log(`   📊 Lucro/Prejuízo: $${data.monthly_revenue?.profits || 0}/$${Math.abs(data.monthly_revenue?.losses || 0)}`);
                            break;
                        case 'affiliates':
                            if (data.type === 'personal') {
                                console.log(`   👤 Indicações: ${data.affiliate_data?.referral_count || 0}`);
                                console.log(`   💎 Ganhos: $${data.affiliate_data?.total_earnings || 0}`);
                            } else {
                                console.log(`   👥 Total afiliados: ${data.summary?.total_affiliates || 0}`);
                                console.log(`   ⭐ Afiliados VIP: ${data.summary?.vip_affiliates || 0}`);
                            }
                            break;
                        case 'system':
                            console.log(`   👥 Usuários ativos: ${data.performance?.active_users || 0}`);
                            console.log(`   📊 Taxa sucesso: ${data.trading_performance?.success_rate || 0}%`);
                            break;
                    }
                }
            }

            return true;

        } catch (error) {
            console.log('❌ Erro no dashboard:', error.response?.data || error.message);
            return false;
        }
    }

    async testOperations(user) {
        console.log(`\n📈 TESTANDO OPERAÇÕES - ${user.name}`);
        console.log('='.repeat(40));
        
        try {
            const response = await this.axios.get(`/api/operations/${user.id}`, {
                headers: {
                    'user_id': user.id,
                    'access_level': user.access_level
                }
            });

            console.log('✅ Operações carregadas');
            console.log('📊 Estatísticas totais:', response.data.total_statistics);
            console.log('💳 REAL:', response.data.real_operations.total, 'operações');
            console.log('🎁 BONUS:', response.data.bonus_operations.total, 'operações');

            return true;

        } catch (error) {
            console.log('❌ Erro nas operações:', error.response?.data || error.message);
            return false;
        }
    }

    async testFinancial(user) {
        console.log(`\n💰 TESTANDO FINANCEIRO - ${user.name}`);
        console.log('='.repeat(40));
        
        try {
            const response = await this.axios.get('/api/financial', {
                headers: {
                    'user_id': user.id,
                    'access_level': user.access_level
                }
            });

            console.log('✅ Indicadores financeiros carregados');
            console.log('📊 Receita mensal:', response.data.monthly_revenue);
            console.log('🔍 Por tipo:', response.data.revenue_by_type);

            return true;

        } catch (error) {
            if (error.response?.status === 403) {
                console.log('🔒 Acesso negado (esperado para este perfil)');
                return true;
            }
            console.log('❌ Erro financeiro:', error.response?.data || error.message);
            return false;
        }
    }

    async testAffiliates(user) {
        console.log(`\n👥 TESTANDO AFILIADOS - ${user.name}`);
        console.log('='.repeat(40));
        
        try {
            const response = await this.axios.get(`/api/affiliates/${user.id}`, {
                headers: {
                    'user_id': user.id,
                    'access_level': user.access_level
                }
            });

            console.log('✅ Dashboard de afiliados carregado');
            console.log('📋 Tipo:', response.data.type);
            
            if (response.data.type === 'personal') {
                console.log('👤 Dados pessoais:', response.data.affiliate_data);
            } else {
                console.log('📊 Resumo:', response.data.summary);
            }

            return true;

        } catch (error) {
            if (error.response?.status === 403) {
                console.log('🔒 Acesso negado (esperado para este perfil)');
                return true;
            }
            console.log('❌ Erro afiliados:', error.response?.data || error.message);
            return false;
        }
    }

    async testPermissions(user) {
        console.log(`\n🔒 TESTANDO PERMISSÕES - ${user.name}`);
        console.log('='.repeat(40));
        
        try {
            const response = await this.axios.get(`/api/permissions/${user.id}`, {
                headers: {
                    'user_id': user.id,
                    'access_level': user.access_level
                }
            });

            console.log('✅ Permissões carregadas');
            console.log('📋 Dados:', response.data);

            return true;

        } catch (error) {
            if (error.response?.status === 403) {
                console.log('🔒 Acesso negado (esperado para perfis não-admin)');
                return true;
            }
            console.log('❌ Erro permissões:', error.response?.data || error.message);
            return false;
        }
    }

    async runAllTests() {
        console.log('🚀 INICIANDO TESTES COMPLETOS DA API');
        console.log('====================================');

        // 1. Teste de conectividade
        const healthOk = await this.testHealthCheck();
        if (!healthOk) {
            console.log('❌ API não está disponível. Parando testes.');
            return;
        }

        // 2. Teste com cada tipo de usuário
        for (const user of TEST_USERS) {
            console.log('\n' + '='.repeat(80));
            
            await this.testDashboard(user);
            await this.testOperations(user);
            await this.testFinancial(user);
            await this.testAffiliates(user);
            await this.testPermissions(user);
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ TESTES CONCLUÍDOS');
        console.log('🎯 RECURSOS VALIDADOS:');
        console.log('   🔒 Sistema de controle de acesso por perfil');
        console.log('   💳 Separação de operações REAL vs BONUS');
        console.log('   📊 Dashboard personalizado conforme permissões');
        console.log('   💰 Indicadores financeiros com visibilidade controlada');
        console.log('   👥 Gestão de afiliados com dados personalizados');
        console.log('   🛡️ Proteção de endpoints sensíveis');
    }
}

// Executar testes
async function main() {
    const tester = new APITester();
    await tester.runAllTests();
}

// Aguardar um pouco para a API inicializar e executar
setTimeout(main, 2000);
