/**
 * 🔐 UTILITÁRIO PARA ADICIONAR CHAVES SEGURAS
 * 
 * Interface para adicionar chaves API sem truncamento
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔐 UTILITÁRIO PARA ADICIONAR CHAVES SEGURAS');
console.log('==========================================');

class GerenciadorChaves {
    
    // Adicionar chave da Érica (exemplo com chaves completas)
    async adicionarChaveErica() {
        console.log('\n👤 ADICIONANDO CHAVE DA ÉRICA:');
        
        // IMPORTANTE: Substitua pelas chaves COMPLETAS da Érica
        const chavesErica = {
            userId: null, // Será encontrado automaticamente
            exchange: 'bybit',
            // ATENÇÃO: Estas são chaves de exemplo - substitua pelas REAIS
            apiKey: 'rg1HWyxEfWwobzJGew_CHAVE_COMPLETA_AQUI', // Substituir pela chave completa
            secretKey: 'sOGr9nokGvtfDB0CSFymJZrOE8XnyA1nmB4r_SECRET_COMPLETO', // Substituir pelo secret completo
            environment: 'mainnet'
        };
        
        // Encontrar ID da Érica
        const ericaQuery = await pool.query(`
            SELECT id FROM users WHERE name ILIKE '%érica%' OR email ILIKE '%erica%'
        `);
        
        if (ericaQuery.rows.length === 0) {
            console.log('❌ Usuária Érica não encontrada');
            return;
        }
        
        chavesErica.userId = ericaQuery.rows[0].id;
        console.log(`📋 ID da Érica: ${chavesErica.userId}`);
        
        console.log('⚠️  ATENÇÃO: Chaves de exemplo sendo usadas!');
        console.log('   📝 Substitua pelas chaves REAIS da Érica no código');
        console.log('   🔑 API Key atual: ' + chavesErica.apiKey.substring(0, 20) + '...');
        console.log('   🔐 Secret atual: ' + chavesErica.secretKey.substring(0, 20) + '...');
        
        // Comentado para evitar inserir chaves de exemplo
        // return await this.adicionarChaveSegura(chavesErica);
        console.log('🔒 Inserção bloqueada - use chaves reais');
        return { success: false, message: 'Chaves de exemplo não podem ser inseridas' };
    }
    
    // Adicionar chave do Mauro
    async adicionarChaveMauro() {
        console.log('\n👤 ADICIONANDO CHAVE DO MAURO:');
        
        const chavesMauro = {
            userId: null,
            exchange: 'bybit',
            // ATENÇÃO: Estas são chaves de exemplo - substitua pelas REAIS
            apiKey: 'JQVNAD0aCqNqPLvo25_CHAVE_COMPLETA_AQUI',
            secretKey: 'rQ1Qle81XBFJrQdqKoHg0JG8k5_SECRET_COMPLETO',
            environment: 'testnet'  // Mauro usa testnet
        };
        
        const mauroQuery = await pool.query(`
            SELECT id FROM users WHERE name ILIKE '%mauro%'
        `);
        
        if (mauroQuery.rows.length === 0) {
            console.log('❌ Usuário Mauro não encontrado');
            return;
        }
        
        chavesMauro.userId = mauroQuery.rows[0].id;
        console.log(`📋 ID do Mauro: ${chavesMauro.userId}`);
        
        console.log('⚠️  ATENÇÃO: Chaves de exemplo sendo usadas!');
        console.log('   📝 Substitua pelas chaves REAIS do Mauro no código');
        
        // Comentado para evitar inserir chaves de exemplo
        // return await this.adicionarChaveSegura(chavesMauro);
        console.log('🔒 Inserção bloqueada - use chaves reais');
        return { success: false, message: 'Chaves de exemplo não podem ser inseridas' };
    }
    
    // Função principal para adicionar chaves
    async adicionarChaveSegura(dadosChave) {
        try {
            console.log(`\n🔐 Adicionando chave ${dadosChave.exchange} para usuário ${dadosChave.userId}...`);
            
            // 1. Validar tamanhos
            const validacao = this.validarTamanhoChaves(dadosChave.exchange, dadosChave.apiKey, dadosChave.secretKey);
            if (!validacao.valida) {
                throw new Error(`Validação falhou: ${validacao.erro}`);
            }
            console.log('✅ Tamanhos validados');
            
            // 2. Testar chave
            console.log('🧪 Testando chave...');
            const teste = await this.testarChave(dadosChave);
            if (!teste.success) {
                throw new Error(`Teste falhou: ${teste.error}`);
            }
            console.log('✅ Chave testada e funcionando');
            
            // 3. Inserir no banco
            console.log('💾 Inserindo no banco...');
            const query = `
                INSERT INTO user_api_keys (
                    user_id, 
                    exchange, 
                    api_key, 
                    secret_key, 
                    environment, 
                    is_active, 
                    validation_status,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, true, 'valid', NOW(), NOW())
                ON CONFLICT (user_id, exchange, environment) 
                DO UPDATE SET 
                    api_key = EXCLUDED.api_key,
                    secret_key = EXCLUDED.secret_key,
                    validation_status = 'valid',
                    updated_at = NOW()
                RETURNING id
            `;
            
            const result = await pool.query(query, [
                dadosChave.userId,
                dadosChave.exchange,
                dadosChave.apiKey,
                dadosChave.secretKey,
                dadosChave.environment
            ]);
            
            console.log(`✅ Chave inserida com ID: ${result.rows[0].id}`);
            
            // 4. Verificar se foi salva corretamente
            const verificacao = await pool.query(`
                SELECT 
                    LENGTH(api_key) as api_len,
                    LENGTH(secret_key) as secret_len,
                    validation_status
                FROM user_api_keys 
                WHERE id = $1
            `, [result.rows[0].id]);
            
            const check = verificacao.rows[0];
            console.log(`📊 Verificação: API=${check.api_len} chars, Secret=${check.secret_len} chars, Status=${check.validation_status}`);
            
            return { 
                success: true, 
                keyId: result.rows[0].id,
                apiLength: check.api_len,
                secretLength: check.secret_len
            };
            
        } catch (error) {
            console.error(`❌ Erro: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    
    // Validar tamanhos das chaves
    validarTamanhoChaves(exchange, apiKey, secretKey) {
        const requisitos = {
            'bybit': { apiMin: 18, apiMax: 64, secretMin: 36, secretMax: 128 },
            'binance': { apiMin: 60, apiMax: 70, secretMin: 60, secretMax: 70 }
        };
        
        const req = requisitos[exchange];
        if (!req) {
            return { valida: false, erro: 'Exchange não suportada' };
        }
        
        if (apiKey.length < req.apiMin || apiKey.length > req.apiMax) {
            return { 
                valida: false, 
                erro: `API Key ${exchange} deve ter ${req.apiMin}-${req.apiMax} caracteres, tem ${apiKey.length}` 
            };
        }
        
        if (secretKey.length < req.secretMin || secretKey.length > req.secretMax) {
            return { 
                valida: false, 
                erro: `Secret Key ${exchange} deve ter ${req.secretMin}-${req.secretMax} caracteres, tem ${secretKey.length}` 
            };
        }
        
        return { valida: true };
    }
    
    // Testar chave
    async testarChave(dadosChave) {
        if (dadosChave.exchange === 'bybit') {
            return await this.testarChaveBybit(dadosChave);
        } else if (dadosChave.exchange === 'binance') {
            return await this.testarChaveBinance(dadosChave);
        }
        return { success: false, error: 'Exchange não suportada' };
    }
    
    // Testar Bybit
    async testarChaveBybit(dadosChave) {
        try {
            const baseUrl = dadosChave.environment === 'testnet' ? 
                'https://api-testnet.bybit.com' : 
                'https://api.bybit.com';
            
            const timestamp = Date.now().toString();
            const recvWindow = '5000';
            const query = 'accountType=UNIFIED';
            
            const signPayload = timestamp + dadosChave.apiKey + recvWindow + query;
            const signature = crypto.createHmac('sha256', dadosChave.secretKey).update(signPayload).digest('hex');
            
            const headers = {
                'Content-Type': 'application/json',
                'X-BAPI-API-KEY': dadosChave.apiKey,
                'X-BAPI-SIGN': signature,
                'X-BAPI-TIMESTAMP': timestamp,
                'X-BAPI-RECV-WINDOW': recvWindow,
                'X-BAPI-SIGN-TYPE': '2'
            };
            
            const response = await fetch(`${baseUrl}/v5/account/wallet-balance?accountType=UNIFIED`, {
                method: 'GET',
                headers: headers
            });
            
            const data = await response.json();
            
            if (data.retCode === 0) {
                return { success: true, data: data };
            } else {
                return { success: false, error: data.retMsg };
            }
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // Testar Binance
    async testarChaveBinance(dadosChave) {
        try {
            const baseUrl = dadosChave.environment === 'testnet' ? 
                'https://testnet.binance.vision' : 
                'https://api.binance.com';
            
            const timestamp = Date.now();
            const recvWindow = 5000;
            
            const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`;
            const signature = crypto.createHmac('sha256', dadosChave.secretKey).update(queryString).digest('hex');
            
            const headers = {
                'X-MBX-APIKEY': dadosChave.apiKey,
                'Content-Type': 'application/json'
            };
            
            const response = await fetch(`${baseUrl}/api/v3/account?${queryString}&signature=${signature}`, {
                method: 'GET',
                headers: headers
            });
            
            if (response.ok) {
                const data = await response.json();
                return { success: true, data: data };
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.msg };
            }
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // Listar chaves atuais
    async listarChavesAtuais() {
        console.log('\n📊 CHAVES ATUAIS NO SISTEMA:');
        
        const chaves = await pool.query(`
            SELECT 
                u.name,
                u.email,
                uak.exchange,
                uak.environment,
                LENGTH(uak.api_key) as api_len,
                LENGTH(uak.secret_key) as secret_len,
                uak.validation_status,
                uak.updated_at
            FROM user_api_keys uak
            JOIN users u ON uak.user_id = u.id
            ORDER BY u.name, uak.exchange
        `);
        
        chaves.rows.forEach((chave, i) => {
            console.log(`${i + 1}. ${chave.name} (${chave.email})`);
            console.log(`   🔑 ${chave.exchange} (${chave.environment})`);
            console.log(`   📏 API: ${chave.api_len} chars, Secret: ${chave.secret_len} chars`);
            console.log(`   📊 Status: ${chave.validation_status}`);
            console.log(`   📅 Atualizada: ${new Date(chave.updated_at).toLocaleString('pt-BR')}`);
            console.log('');
        });
    }
}

// Executar demonstração
async function demonstracaoGerenciador() {
    const gerenciador = new GerenciadorChaves();
    
    try {
        // Listar chaves atuais
        await gerenciador.listarChavesAtuais();
        
        // Tentar adicionar chave da Érica (modo demonstração)
        await gerenciador.adicionarChaveErica();
        
        // Tentar adicionar chave do Mauro (modo demonstração) 
        await gerenciador.adicionarChaveMauro();
        
        console.log('\n💡 PARA USAR EM PRODUÇÃO:');
        console.log('=========================');
        console.log('1. Substitua as chaves de exemplo pelas reais');
        console.log('2. Descomente as linhas de inserção');
        console.log('3. Execute novamente o script');
        console.log('4. As chaves serão validadas e testadas antes de salvar');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar
demonstracaoGerenciador();
