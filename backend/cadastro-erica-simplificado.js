/**
 * 🎯 CADASTRO USUÁRIA VIP: ÉRICA DOS SANTOS ANDRADE - VERSÃO SIMPLIFICADA
 * Cadastro sem user_balances devido a inconsistência UUID
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const GestorChavesAPI = require('./gestor-chaves-parametrizacoes');

console.log('👤 CADASTRO ÉRICA DOS SANTOS ANDRADE - VIP (SIMPLIFICADO)');
console.log('========================================================');

class CadastroEricaSimplificado {
    constructor() {
        // Conexão PostgreSQL Railway
        this.pool = new Pool({
            connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
            ssl: { rejectUnauthorized: false }
        });

        this.gestorChaves = new GestorChavesAPI();
    }

    async executarCadastroSimplificado() {
        const client = await this.pool.connect();
        
        try {
            console.log('🔄 Iniciando transação para cadastro...');
            await client.query('BEGIN');

            // 1. DADOS DA USUÁRIA
            const dadosUsuaria = {
                username: 'erica_santos_andrade',
                email: 'erica.andrade.santos@hotmail.com',
                password: 'Apelido22@',
                full_name: 'Érica dos Santos Andrade',
                phone: '+55 21 987386645',
                role: 'vip',
                status: 'active',
                api_bybit: {
                    api_key: 'Xr8BnMkLj5PqNvCsYt9EwR2DzF4GuH6I',
                    secret_key: 'NhqPtmdSJYdKjVHjA7dPzWrcxcNyYdNbTpYsDhHpzsqJf74pWqYhjv8A2e2HKLJj'
                }
            };

            // 2. CRIAR USUÁRIA NO BANCO
            console.log('👤 Criando usuária Érica dos Santos Andrade...');
            
            const senhaHash = await bcrypt.hash(dadosUsuaria.password, 12);
            
            const resultadoUsuario = await client.query(`
                INSERT INTO users (
                    username, email, password, name, 
                    whatsapp, role, status, vip_status, vip_tier,
                    whatsapp_verified, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
                RETURNING id, username, email, role, vip_status, vip_tier;
            `, [
                dadosUsuaria.username,
                dadosUsuaria.email,
                senhaHash,
                dadosUsuaria.full_name,
                dadosUsuaria.phone,
                dadosUsuaria.role,
                dadosUsuaria.status,
                true,       // vip_status (boolean)
                'premium',  // vip_tier (string)
                true        // whatsapp_verified (VIP)
            ]);

            const usuarioId = resultadoUsuario.rows[0].id;
            console.log(`✅ Usuária criada com sucesso! ID: ${usuarioId}`);
            console.log(`📧 Email: ${dadosUsuaria.email}`);
            console.log(`📱 WhatsApp: ${dadosUsuaria.phone}`);
            console.log(`👑 Role: ${dadosUsuaria.role.toUpperCase()}`);
            console.log(`👑 VIP Status: ${resultadoUsuario.rows[0].vip_status}`);
            console.log(`👑 VIP Tier: ${resultadoUsuario.rows[0].vip_tier}`);

            // 3. CONFIGURAR PARÂMETROS DE TRADING VIP
            console.log('⚙️ Configurando parâmetros de trading VIP...');
            
            await client.query(`
                INSERT INTO user_trading_params (
                    user_id, alavancagem, valor_minimo_trade, valor_maximo_trade,
                    percentual_saldo, take_profit_multiplier, stop_loss_multiplier,
                    max_operacoes_diarias, exchanges_ativas, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW());
            `, [
                usuarioId,
                10,       // alavancagem VIP
                25.00,    // valor_minimo_trade VIP
                10000.00, // valor_maximo_trade VIP
                40.00,    // percentual_saldo VIP (40% vs 30% padrão)
                3.5,      // take_profit_multiplier VIP
                2.5,      // stop_loss_multiplier VIP  
                30,       // max_operacoes_diarias VIP
                JSON.stringify(['bybit', 'binance']) // exchanges_ativas
            ]);

            console.log('✅ Parâmetros VIP configurados!');
            console.log('   📊 Alavancagem: 10x (VIP)');
            console.log('   💵 Min/Max Trade: $25 - $10,000');
            console.log('   📈 Percentual saldo: 40% (VIP)');
            console.log('   🎯 TP/SL: 3.5x / 2.5x');
            console.log('   🏆 30 operações diárias máximas (VIP)');

            // 4. ADICIONAR CHAVES BYBIT REAIS
            console.log('🔐 Adicionando chaves Bybit reais...');
            
            try {
                // Usar o GestorChavesAPI para validar e adicionar as chaves
                const resultadoChaves = await this.gestorChaves.adicionarChaveAPI(
                    usuarioId,
                    'bybit',
                    dadosUsuaria.api_bybit.api_key,
                    dadosUsuaria.api_bybit.secret_key,
                    false, // produção (não testnet)
                    null   // sem passphrase para Bybit
                );

                console.log('✅ Chaves Bybit adicionadas e validadas!');
                console.log(`   🔑 API Key: ${dadosUsuaria.api_bybit.api_key.substring(0, 8)}...`);
                console.log(`   🔒 Status: ${resultadoChaves.sucesso ? 'VALIDADA' : 'ERRO'}`);
                console.log(`   📊 Permissões:`, resultadoChaves.permissoes);
                
                if (resultadoChaves.saldoInicial) {
                    console.log(`   💰 Saldo Bybit detectado:`, Object.keys(resultadoChaves.saldoInicial));
                }

            } catch (error) {
                console.warn(`⚠️ Aviso: Erro ao validar chaves Bybit: ${error.message}`);
                console.log('   📝 Salvando chaves no banco sem validação...');
                
                // Salvar chaves mesmo sem validação (para casos de IP restrito, etc.)
                await client.query(`
                    INSERT INTO user_api_keys (
                        user_id, exchange, api_key, secret_key, 
                        environment, is_active, validation_status, 
                        created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW());
                `, [
                    usuarioId,
                    'bybit',
                    dadosUsuaria.api_bybit.api_key,
                    dadosUsuaria.api_bybit.secret_key,
                    'mainnet',  // environment
                    true,       // is_active
                    'pending_validation'
                ]);
                
                console.log('✅ Chaves Bybit salvas (validação pendente)');
            }

            // 5. COMMIT DA TRANSAÇÃO
            await client.query('COMMIT');
            console.log('✅ Transação finalizada com sucesso!');

            // 6. RESUMO FINAL
            console.log('\n🎉 CADASTRO ÉRICA DOS SANTOS ANDRADE CONCLUÍDO!');
            console.log('================================================');
            console.log(`👤 Nome: ${dadosUsuaria.full_name}`);
            console.log(`📧 Email: ${dadosUsuaria.email}`);
            console.log(`📱 WhatsApp: ${dadosUsuaria.phone}`);
            console.log(`🆔 User ID: ${usuarioId}`);
            console.log(`👑 Status: VIP PREMIUM`);
            console.log(`🔐 Bybit API: Configurada (${dadosUsuaria.api_bybit.api_key.substring(0, 8)}...)`);
            console.log(`⚙️ Parâmetros: VIP (40% saldo, 10x alavancagem)`);
            console.log(`🎯 Trading: Habilitado com limites VIP`);
            console.log(`⚠️ Nota: Saldo deve ser adicionado manualmente devido a inconsistência UUID`);

            return {
                sucesso: true,
                usuarioId: usuarioId,
                dados: dadosUsuaria,
                configuracoes: 'VIP_PREMIUM'
            };

        } catch (error) {
            console.error('❌ Erro durante o cadastro:', error.message);
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async verificarCadastro(usuarioId) {
        console.log(`🔍 Verificando cadastro do usuário ID: ${usuarioId}`);
        
        const client = await this.pool.connect();
        try {
            // Verificar dados do usuário
            const usuario = await client.query(`
                SELECT id, username, email, name, whatsapp, role, status, 
                       vip_status, vip_tier, created_at
                FROM users WHERE id = $1;
            `, [usuarioId]);

            // Verificar chaves API
            const chaves = await client.query(`
                SELECT exchange, environment, is_active, validation_status
                FROM user_api_keys WHERE user_id = $1;
            `, [usuarioId]);

            // Verificar parâmetros
            const parametros = await client.query(`
                SELECT alavancagem, valor_minimo_trade, valor_maximo_trade,
                       percentual_saldo, take_profit_multiplier, stop_loss_multiplier,
                       max_operacoes_diarias, exchanges_ativas
                FROM user_trading_params WHERE user_id = $1;
            `, [usuarioId]);

            console.log('\n📊 VERIFICAÇÃO DO CADASTRO');
            console.log('==========================');
            
            if (usuario.rows.length > 0) {
                const u = usuario.rows[0];
                console.log(`✅ Usuário: ${u.name} (${u.email})`);
                console.log(`   Username: ${u.username}`);
                console.log(`   WhatsApp: ${u.whatsapp}`);
                console.log(`   Role: ${u.role} | Status: ${u.status}`);
                console.log(`   VIP Status: ${u.vip_status} | VIP Tier: ${u.vip_tier}`);
            }

            console.log('\n🔐 Chaves API:');
            chaves.rows.forEach(c => {
                console.log(`   ${c.exchange}: ${c.environment} | ${c.validation_status} | Ativa: ${c.is_active}`);
            });

            console.log('\n⚙️ Parâmetros Trading:');
            if (parametros.rows.length > 0) {
                const p = parametros.rows[0];
                console.log(`   Percentual saldo: ${p.percentual_saldo}%`);
                console.log(`   Alavancagem: ${p.alavancagem}x`);
                console.log(`   Min trade: $${p.valor_minimo_trade}`);
                console.log(`   Max trade: $${p.valor_maximo_trade}`);
                console.log(`   TP Multiplier: ${p.take_profit_multiplier}x`);
                console.log(`   SL Multiplier: ${p.stop_loss_multiplier}x`);
                console.log(`   Max operações/dia: ${p.max_operacoes_diarias}`);
                console.log(`   Exchanges: ${p.exchanges_ativas}`);
            }

            return {
                usuario: usuario.rows[0],
                chaves: chaves.rows,
                parametros: parametros.rows[0]
            };

        } catch (error) {
            console.error('❌ Erro na verificação:', error.message);
            throw error;
        } finally {
            client.release();
        }
    }
}

// EXECUTAR CADASTRO
async function executarCadastroErica() {
    try {
        const cadastrador = new CadastroEricaSimplificado();
        
        console.log('🚀 Iniciando cadastro da Érica dos Santos Andrade...\n');
        
        const resultado = await cadastrador.executarCadastroSimplificado();
        
        if (resultado.sucesso) {
            console.log('\n🔍 Verificando cadastro...');
            await cadastrador.verificarCadastro(resultado.usuarioId);
            
            console.log('\n✅ CADASTRO ÉRICA VIP FINALIZADO COM SUCESSO!');
            console.log('Sistema pronto para operações de trading com Bybit');
            console.log('Saldo deve ser adicionado separadamente');
        }
        
    } catch (error) {
        console.error('\n❌ ERRO NO CADASTRO:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    executarCadastroErica();
}

module.exports = CadastroEricaSimplificado;
