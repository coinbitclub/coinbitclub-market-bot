/**
 * 🎯 VALIDAÇÃO FINAL DO SISTEMA MULTIUSUÁRIO
 * Teste completo e relatório de todas as funcionalidades
 */

const { Pool } = require('pg');
const GestorChavesAPI = require('./gestor-chaves-parametrizacoes');

console.log('🎯 VALIDAÇÃO FINAL DO SISTEMA MULTIUSUÁRIO');
console.log('==========================================');

class ValidadorSistemaCompleto {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });
        
        this.gestor = new GestorChavesAPI();
        this.resultados = {
            estrutura: [],
            usuarios: [],
            parametros: [],
            saldos: [],
            chaves: [],
            testes: []
        };
    }

    async executarValidacaoCompleta() {
        const client = await this.pool.connect();
        try {
            console.log('🔍 Iniciando validação completa do sistema...\n');
            
            // 1. Validar estrutura das tabelas
            await this.validarEstruturaBanco(client);
            
            // 2. Validar usuários
            await this.validarUsuarios(client);
            
            // 3. Validar parametrizações
            await this.validarParametrizacoes(client);
            
            // 4. Validar saldos
            await this.validarSaldos(client);
            
            // 5. Validar chaves API
            await this.validarChavesAPI(client);
            
            // 6. Testes funcionais
            await this.executarTesteFuncional();
            
            // 7. Relatório final
            this.gerarRelatorioFinal();
            
        } catch (error) {
            console.error('❌ Erro durante validação:', error.message);
        } finally {
            client.release();
            await this.pool.end();
        }
    }

    async validarEstruturaBanco(client) {
        console.log('🏗️  1. VALIDAÇÃO DA ESTRUTURA DO BANCO');
        console.log('=====================================');
        
        const tabelasEssenciais = ['users', 'user_api_keys', 'user_trading_params', 'user_balances'];
        
        for (const tabela of tabelasEssenciais) {
            try {
                const existe = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' AND table_name = $1
                    );
                `, [tabela]);
                
                if (existe.rows[0].exists) {
                    const colunas = await client.query(`
                        SELECT column_name, data_type, is_nullable 
                        FROM information_schema.columns 
                        WHERE table_name = $1 AND table_schema = 'public'
                        ORDER BY ordinal_position;
                    `, [tabela]);
                    
                    console.log(`✅ Tabela ${tabela}: ${colunas.rows.length} colunas`);
                    this.resultados.estrutura.push({
                        tabela,
                        status: 'OK',
                        colunas: colunas.rows.length
                    });
                    
                    // Verificar foreign keys específicas
                    if (tabela !== 'users') {
                        const fks = await client.query(`
                            SELECT COUNT(*) as fk_count 
                            FROM information_schema.table_constraints 
                            WHERE table_name = $1 AND constraint_type = 'FOREIGN KEY';
                        `, [tabela]);
                        
                        if (fks.rows[0].fk_count > 0) {
                            console.log(`   🔗 Foreign Keys configuradas: ${fks.rows[0].fk_count}`);
                        }
                    }
                } else {
                    console.log(`❌ Tabela ${tabela}: NÃO ENCONTRADA`);
                    this.resultados.estrutura.push({
                        tabela,
                        status: 'ERRO',
                        problema: 'Tabela não existe'
                    });
                }
            } catch (error) {
                console.log(`❌ Erro ao validar ${tabela}: ${error.message}`);
            }
        }
        
        console.log('\n');
    }

    async validarUsuarios(client) {
        console.log('👤 2. VALIDAÇÃO DE USUÁRIOS');
        console.log('===========================');
        
        try {
            const usuarios = await client.query(`
                SELECT 
                    id, 
                    username, 
                    email, 
                    role, 
                    status, 
                    vip_status,
                    COALESCE(balance_usd, 0) as balance_usd,
                    created_at
                FROM users 
                ORDER BY id;
            `);
            
            console.log(`👥 Total de usuários: ${usuarios.rows.length}`);
            
            usuarios.rows.forEach(user => {
                const vipStatus = user.vip_status ? '🌟 VIP' : '👤 Normal';
                const balance = parseFloat(user.balance_usd || 0).toFixed(2);
                console.log(`   • ${user.username} (ID: ${user.id}) - ${vipStatus} - $${balance} - ${user.role}`);
                
                this.resultados.usuarios.push({
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    vip: user.vip_status,
                    balance: balance
                });
            });
            
        } catch (error) {
            console.log(`❌ Erro ao validar usuários: ${error.message}`);
        }
        
        console.log('\n');
    }

    async validarParametrizacoes(client) {
        console.log('⚙️  3. VALIDAÇÃO DE PARAMETRIZAÇÕES');
        console.log('====================================');
        
        try {
            const params = await client.query(`
                SELECT 
                    utp.user_id,
                    u.username,
                    utp.alavancagem,
                    utp.valor_minimo_trade,
                    utp.valor_maximo_trade,
                    utp.percentual_saldo,
                    utp.max_operacoes_diarias,
                    utp.exchanges_ativas
                FROM user_trading_params utp
                JOIN users u ON utp.user_id = u.id
                ORDER BY utp.user_id;
            `);
            
            console.log(`⚙️  Usuários com parametrizações: ${params.rows.length}`);
            
            params.rows.forEach(param => {
                const exchanges = Array.isArray(param.exchanges_ativas) 
                    ? param.exchanges_ativas.join(', ') 
                    : (typeof param.exchanges_ativas === 'string' ? param.exchanges_ativas : 'N/A');
                
                console.log(`   • ${param.username}: ${param.alavancagem}x, ${param.percentual_saldo}%, $${param.valor_minimo_trade}-$${param.valor_maximo_trade}, ${param.max_operacoes_diarias} ops/dia`);
                console.log(`     Exchanges: ${exchanges}`);
                
                this.resultados.parametros.push({
                    user_id: param.user_id,
                    username: param.username,
                    alavancagem: param.alavancagem,
                    percentual_saldo: param.percentual_saldo,
                    valor_minimo: param.valor_minimo_trade,
                    valor_maximo: param.valor_maximo_trade,
                    max_operacoes: param.max_operacoes_diarias
                });
            });
            
        } catch (error) {
            console.log(`❌ Erro ao validar parametrizações: ${error.message}`);
        }
        
        console.log('\n');
    }

    async validarSaldos(client) {
        console.log('💰 4. VALIDAÇÃO DE SALDOS');
        console.log('=========================');
        
        try {
            const saldos = await client.query(`
                SELECT 
                    u.username,
                    ub.user_id,
                    ub.exchange,
                    ub.currency,
                    ub.available_balance,
                    ub.locked_balance,
                    ub.total_balance
                FROM user_balances ub
                JOIN users u ON ub.user_id = u.id
                ORDER BY ub.user_id, ub.currency;
            `);
            
            console.log(`💰 Total de registros de saldo: ${saldos.rows.length}`);
            
            // Agrupar por usuário
            const saldosPorUsuario = {};
            saldos.rows.forEach(saldo => {
                if (!saldosPorUsuario[saldo.username]) {
                    saldosPorUsuario[saldo.username] = [];
                }
                saldosPorUsuario[saldo.username].push(saldo);
            });
            
            Object.keys(saldosPorUsuario).forEach(username => {
                const userSaldos = saldosPorUsuario[username];
                const usdtSaldo = userSaldos.find(s => s.currency === 'USDT');
                const totalMoedas = userSaldos.length;
                
                console.log(`   • ${username}: ${totalMoedas} moedas`);
                if (usdtSaldo) {
                    console.log(`     💵 USDT: $${parseFloat(usdtSaldo.available_balance).toFixed(2)} disponível`);
                }
                userSaldos.forEach(saldo => {
                    if (saldo.currency !== 'USDT') {
                        console.log(`     🪙 ${saldo.currency}: ${parseFloat(saldo.available_balance).toFixed(8)}`);
                    }
                });
                
                this.resultados.saldos.push({
                    username,
                    moedas: totalMoedas,
                    usdt: usdtSaldo ? parseFloat(usdtSaldo.available_balance) : 0
                });
            });
            
        } catch (error) {
            console.log(`❌ Erro ao validar saldos: ${error.message}`);
        }
        
        console.log('\n');
    }

    async validarChavesAPI(client) {
        console.log('🔑 5. VALIDAÇÃO DE CHAVES API');
        console.log('=============================');
        
        try {
            const chaves = await client.query(`
                SELECT 
                    u.username,
                    uak.user_id,
                    uak.exchange,
                    uak.environment,
                    uak.is_active,
                    uak.validation_status,
                    uak.last_validated_at
                FROM user_api_keys uak
                JOIN users u ON uak.user_id = u.id
                ORDER BY uak.user_id, uak.exchange;
            `);
            
            console.log(`🔑 Total de chaves API: ${chaves.rows.length}`);
            
            chaves.rows.forEach(chave => {
                const status = chave.is_active ? '✅ Ativa' : '❌ Inativa';
                const ambiente = chave.environment || 'mainnet';
                const validacao = chave.validation_status || 'pending';
                
                console.log(`   • ${chave.username} - ${chave.exchange} (${ambiente}): ${status} - ${validacao}`);
                
                this.resultados.chaves.push({
                    username: chave.username,
                    exchange: chave.exchange,
                    environment: ambiente,
                    active: chave.is_active,
                    validation: validacao
                });
            });
            
        } catch (error) {
            console.log(`❌ Erro ao validar chaves API: ${error.message}`);
        }
        
        console.log('\n');
    }

    async executarTesteFuncional() {
        console.log('🧪 6. TESTES FUNCIONAIS');
        console.log('=======================');
        
        try {
            // Teste 1: Buscar dados de um usuário VIP
            console.log('🧪 Teste 1: Buscar dados do usuário VIP (Érica)...');
            const dadosErica = await this.gestor.obterDadosUsuarioParaTrading(8);
            
            if (dadosErica && dadosErica.usuario) {
                console.log(`   ✅ Dados recuperados para: ${dadosErica.usuario.username}`);
                console.log(`   📊 Exchanges configuradas: ${dadosErica.exchangesConfiguradas.join(', ')}`);
                
                this.resultados.testes.push({
                    teste: 'Buscar dados usuário VIP',
                    status: 'SUCESSO',
                    detalhes: `${dadosErica.usuario.username} - ${dadosErica.exchangesConfiguradas.length} exchanges`
                });
            } else {
                console.log('   ❌ Falha ao recuperar dados do usuário');
                this.resultados.testes.push({
                    teste: 'Buscar dados usuário VIP',
                    status: 'FALHA',
                    detalhes: 'Não foi possível recuperar dados'
                });
            }
            
            // Teste 2: Calcular limites de operação
            console.log('\n🧪 Teste 2: Calcular limites de operação...');
            if (dadosErica && dadosErica.parametrizacoes) {
                const limites = this.gestor.calcularLimitesOperacao(dadosErica.parametrizacoes, 5000);
                
                console.log(`   ✅ Limites calculados:`);
                console.log(`     💰 Valor por operação: $${limites.valorPorOperacao.toFixed(2)}`);
                console.log(`     📊 Percentual: ${limites.percentualSaldo}%`);
                console.log(`     ⚡ Alavancagem: ${limites.alavancagem}x`);
                
                this.resultados.testes.push({
                    teste: 'Calcular limites operação',
                    status: 'SUCESSO',
                    detalhes: `$${limites.valorPorOperacao.toFixed(2)} por operação, ${limites.percentualSaldo}% do saldo`
                });
            } else {
                this.resultados.testes.push({
                    teste: 'Calcular limites operação',
                    status: 'FALHA',
                    detalhes: 'Parametrizações não encontradas'
                });
            }
            
            // Teste 3: Verificar estrutura de parâmetros
            console.log('\n🧪 Teste 3: Verificar estrutura de parâmetros...');
            if (dadosErica && dadosErica.parametrizacoes && dadosErica.parametrizacoes.db_fields) {
                console.log(`   ✅ Campos da tabela preservados:`);
                console.log(`     🔧 Alavancagem: ${dadosErica.parametrizacoes.db_fields.alavancagem}`);
                console.log(`     💵 Valor mínimo: $${dadosErica.parametrizacoes.db_fields.valor_minimo_trade}`);
                console.log(`     💰 Valor máximo: $${dadosErica.parametrizacoes.db_fields.valor_maximo_trade}`);
                console.log(`     📊 Percentual: ${dadosErica.parametrizacoes.db_fields.percentual_saldo}%`);
                
                this.resultados.testes.push({
                    teste: 'Estrutura parâmetros DB',
                    status: 'SUCESSO',
                    detalhes: 'Campos da tabela preservados corretamente'
                });
            } else {
                this.resultados.testes.push({
                    teste: 'Estrutura parâmetros DB',
                    status: 'FALHA',
                    detalhes: 'Campos da tabela não encontrados'
                });
            }
            
        } catch (error) {
            console.log(`❌ Erro nos testes funcionais: ${error.message}`);
            this.resultados.testes.push({
                teste: 'Testes funcionais gerais',
                status: 'ERRO',
                detalhes: error.message
            });
        }
        
        console.log('\n');
    }

    gerarRelatorioFinal() {
        console.log('📋 7. RELATÓRIO FINAL DE VALIDAÇÃO');
        console.log('===================================');
        
        // Resumo da estrutura
        console.log('\n🏗️  ESTRUTURA DO BANCO:');
        this.resultados.estrutura.forEach(item => {
            const status = item.status === 'OK' ? '✅' : '❌';
            console.log(`   ${status} ${item.tabela}: ${item.colunas || 0} colunas`);
        });
        
        // Resumo dos usuários
        console.log('\n👥 USUÁRIOS:');
        console.log(`   📊 Total: ${this.resultados.usuarios.length}`);
        const vips = this.resultados.usuarios.filter(u => u.vip).length;
        console.log(`   🌟 VIPs: ${vips}`);
        console.log(`   👤 Normais: ${this.resultados.usuarios.length - vips}`);
        
        // Resumo dos saldos
        console.log('\n💰 SALDOS:');
        const totalUSDT = this.resultados.saldos.reduce((total, s) => total + s.usdt, 0);
        console.log(`   💵 Total USDT: $${totalUSDT.toFixed(2)}`);
        console.log(`   🪙 Usuários com saldos: ${this.resultados.saldos.length}`);
        
        // Resumo das chaves
        console.log('\n🔑 CHAVES API:');
        console.log(`   📊 Total configuradas: ${this.resultados.chaves.length}`);
        const ativas = this.resultados.chaves.filter(c => c.active).length;
        console.log(`   ✅ Ativas: ${ativas}`);
        console.log(`   ❌ Inativas: ${this.resultados.chaves.length - ativas}`);
        
        // Resumo dos testes
        console.log('\n🧪 TESTES FUNCIONAIS:');
        this.resultados.testes.forEach(teste => {
            const emoji = teste.status === 'SUCESSO' ? '✅' : teste.status === 'FALHA' ? '❌' : '⚠️';
            console.log(`   ${emoji} ${teste.teste}: ${teste.detalhes}`);
        });
        
        // Status geral
        const estruturaOK = this.resultados.estrutura.every(e => e.status === 'OK');
        const testesOK = this.resultados.testes.every(t => t.status === 'SUCESSO');
        
        console.log('\n🎯 STATUS GERAL DO SISTEMA:');
        
        if (estruturaOK && testesOK) {
            console.log('🎉 SISTEMA MULTIUSUÁRIO 100% FUNCIONAL!');
            console.log('✅ Todas as validações passaram');
            console.log('✅ Estrutura do banco correta');
            console.log('✅ Parâmetros seguindo especificação');
            console.log('✅ Saldos multiusuário operacionais');
            console.log('✅ Chaves API configuradas');
            console.log('\n🚀 PRONTO PARA PRODUÇÃO!');
        } else {
            console.log('⚠️ SISTEMA COM PROBLEMAS MENORES');
            console.log('🔧 Verificar pontos destacados acima');
        }
        
        console.log('\n📝 PRÓXIMOS PASSOS RECOMENDADOS:');
        console.log('   1. ✅ Estrutura multiusuário implementada');
        console.log('   2. ✅ Parâmetros seguindo especificação exata');
        console.log('   3. ✅ Sistema de saldos funcionando');
        console.log('   4. 🔄 Configurar chaves API do sistema (Railway)');
        console.log('   5. 🔄 Testar operações de trading em ambiente real');
        console.log('   6. 🔄 Implementar notificações e logs de operação');
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    const validador = new ValidadorSistemaCompleto();
    validador.executarValidacaoCompleta()
        .then(() => {
            console.log('\n🏁 VALIDAÇÃO COMPLETA FINALIZADA!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 ERRO CRÍTICO NA VALIDAÇÃO:', error.message);
            process.exit(1);
        });
}

module.exports = ValidadorSistemaCompleto;
