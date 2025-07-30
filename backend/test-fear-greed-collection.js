/**
 * 🧪 TESTE DE COLETA DO FEAR & GREED INDEX
 * Verificar se o sistema está coletando dados de medo e ganância
 */

const { Pool } = require('pg');
const axios = require('axios');

// Configuração do banco de dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🧪 TESTE DE COLETA - FEAR & GREED INDEX');
console.log('=====================================');

async function verificarTabelaFearGreed() {
    console.log('\n1️⃣ VERIFICANDO TABELA FEAR_GREED_INDEX...');
    
    try {
        const client = await pool.connect();
        
        // Verificar se tabela existe
        const tabelaExiste = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'fear_greed_index'
            );
        `);
        
        if (tabelaExiste.rows[0].exists) {
            console.log('✅ Tabela fear_greed_index existe');
            
            // Verificar estrutura da tabela
            const estrutura = await client.query(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'fear_greed_index' 
                ORDER BY ordinal_position;
            `);
            
            console.log('📋 Estrutura da tabela:');
            estrutura.rows.forEach(col => {
                console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
            });
            
            // Verificar últimos registros
            const ultimosRegistros = await client.query(`
                SELECT 
                    id, 
                    value, 
                    classification, 
                    source, 
                    created_at,
                    EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as horas_atras
                FROM fear_greed_index 
                ORDER BY created_at DESC 
                LIMIT 5;
            `);
            
            console.log('\n📊 Últimos 5 registros:');
            if (ultimosRegistros.rows.length === 0) {
                console.log('❌ NENHUM REGISTRO ENCONTRADO - Sistema não está coletando dados!');
                return false;
            } else {
                ultimosRegistros.rows.forEach((registro, index) => {
                    console.log(`   ${index + 1}. Valor: ${registro.value}, Classificação: ${registro.classification}`);
                    console.log(`      Fonte: ${registro.source}, Há ${registro.horas_atras.toFixed(2)} horas`);
                });
                
                // Verificar se há dados recentes (últimas 2 horas)
                const dadosRecentes = ultimosRegistros.rows.filter(r => r.horas_atras < 2);
                if (dadosRecentes.length === 0) {
                    console.log('⚠️ DADOS ANTIGOS - Último registro há mais de 2 horas!');
                    return false;
                } else {
                    console.log(`✅ Dados recentes encontrados (${dadosRecentes.length} nos últimas 2 horas)`);
                    return true;
                }
            }
        } else {
            console.log('❌ Tabela fear_greed_index NÃO EXISTE!');
            console.log('💡 Criando tabela...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS fear_greed_index (
                    id SERIAL PRIMARY KEY,
                    value INTEGER NOT NULL,
                    classification VARCHAR(50),
                    direction_allowed VARCHAR(20) DEFAULT 'BOTH',
                    source VARCHAR(50) DEFAULT 'manual',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    api_timestamp TIMESTAMP,
                    change_24h DECIMAL(5,2),
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_fear_greed_created_at ON fear_greed_index(created_at);
                CREATE INDEX IF NOT EXISTS idx_fear_greed_value ON fear_greed_index(value);
            `);
            
            console.log('✅ Tabela fear_greed_index criada com sucesso!');
            return false;
        }
        
        client.release();
        
    } catch (error) {
        console.error('❌ Erro ao verificar tabela:', error.message);
        return false;
    }
}

async function testarAPIs() {
    console.log('\n2️⃣ TESTANDO APIS DE FEAR & GREED...');
    
    const apis = [
        {
            name: 'Alternative.me',
            url: 'https://api.alternative.me/fng/?limit=1',
            parser: (data) => {
                if (data && data.data && data.data[0]) {
                    return {
                        value: parseInt(data.data[0].value),
                        classification: data.data[0].value_classification,
                        timestamp: data.data[0].timestamp
                    };
                }
                return null;
            }
        },
        {
            name: 'CoinStats',
            url: 'https://openapiv1.coinstats.app/insights/fear-and-greed',
            headers: {
                'X-API-KEY': 'ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI='
            },
            parser: (data) => {
                if (data && data.now) {
                    return {
                        value: data.now.value,
                        classification: data.now.value_classification,
                        timestamp: data.now.update_time
                    };
                }
                return null;
            }
        }
    ];
    
    for (const api of apis) {
        console.log(`\n🔍 Testando ${api.name}...`);
        console.log(`   URL: ${api.url}`);
        
        try {
            const response = await axios.get(api.url, {
                headers: api.headers || {},
                timeout: 10000
            });
            
            console.log(`   Status: ${response.status}`);
            
            const dados = api.parser(response.data);
            if (dados) {
                console.log(`   ✅ Sucesso! Valor: ${dados.value}, Classificação: ${dados.classification}`);
                
                // Salvar no banco para teste
                await salvarFearGreedBanco(dados.value, dados.classification, api.name.toLowerCase());
            } else {
                console.log(`   ❌ Falha no parser - estrutura de dados inesperada`);
                console.log(`   Raw data:`, JSON.stringify(response.data, null, 2));
            }
            
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
            if (error.response) {
                console.log(`   Status code: ${error.response.status}`);
                console.log(`   Response:`, JSON.stringify(error.response.data, null, 2));
            }
        }
    }
}

async function salvarFearGreedBanco(value, classification, source) {
    try {
        const client = await pool.connect();
        
        // Determinar direção permitida baseada no valor
        let direction_allowed;
        if (value < 30) {
            direction_allowed = 'LONG_ONLY';
        } else if (value > 80) {
            direction_allowed = 'SHORT_ONLY';
        } else {
            direction_allowed = 'BOTH';
        }
        
        const result = await client.query(`
            INSERT INTO fear_greed_index (value, classification, direction_allowed, source, api_timestamp) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING id, created_at
        `, [value, classification, direction_allowed, source, new Date()]);
        
        console.log(`   💾 Salvo no banco! ID: ${result.rows[0].id}`);
        client.release();
        
    } catch (error) {
        console.error(`   ❌ Erro ao salvar no banco: ${error.message}`);
    }
}

async function verificarColetoresAtivos() {
    console.log('\n3️⃣ VERIFICANDO COLETORES AUTOMÁTICOS...');
    
    // Listar arquivos de gestores Fear & Greed
    const gestores = [
        'gestor-fear-greed-coinstats.js',
        'gestor-fear-greed-completo.js', 
        'gestor-medo-ganancia.js',
        'fear-greed-integration.js',
        'coinstats-integration.js'
    ];
    
    console.log('📁 Arquivos de gestores encontrados:');
    const fs = require('fs');
    const path = require('path');
    
    for (const gestor of gestores) {
        const caminho = path.join(__dirname, gestor);
        if (fs.existsSync(caminho)) {
            console.log(`   ✅ ${gestor} - EXISTE`);
            
            // Verificar se tem função de inicialização automática
            const conteudo = fs.readFileSync(caminho, 'utf8');
            if (conteudo.includes('setInterval') || conteudo.includes('cron') || conteudo.includes('schedule')) {
                console.log(`      🔄 Contém código de execução automática`);
            } else {
                console.log(`      ⚠️ Não parece ter execução automática`);
            }
        } else {
            console.log(`   ❌ ${gestor} - NÃO ENCONTRADO`);
        }
    }
}

async function simularColetaManual() {
    console.log('\n4️⃣ SIMULANDO COLETA MANUAL...');
    
    try {
        // Obter dados atuais de uma API
        const response = await axios.get('https://api.alternative.me/fng/?limit=1', {
            timeout: 10000
        });
        
        if (response.data && response.data.data && response.data.data[0]) {
            const dados = response.data.data[0];
            const value = parseInt(dados.value);
            const classification = dados.value_classification;
            
            console.log(`📊 Dados obtidos: Valor ${value}, Classificação ${classification}`);
            
            // Salvar no banco
            await salvarFearGreedBanco(value, classification, 'teste_manual');
            
            // Verificar direção de trading
            let recomendacao;
            if (value < 30) {
                recomendacao = 'APENAS LONG (Medo extremo - boa hora para comprar)';
            } else if (value > 80) {
                recomendacao = 'APENAS SHORT (Ganância extrema - boa hora para vender)';
            } else {
                recomendacao = 'LONG E SHORT PERMITIDOS (Mercado equilibrado)';
            }
            
            console.log(`🎯 Recomendação: ${recomendacao}`);
            console.log(`📈 Direção permitida para sinais: ${value < 30 ? 'LONG_ONLY' : value > 80 ? 'SHORT_ONLY' : 'BOTH'}`);
            
        } else {
            console.log('❌ Falha ao obter dados da API');
        }
        
    } catch (error) {
        console.error('❌ Erro na coleta manual:', error.message);
    }
}

async function gerarRelatorio() {
    console.log('\n5️⃣ RELATÓRIO FINAL...');
    
    try {
        const client = await pool.connect();
        
        // Estatísticas gerais
        const stats = await client.query(`
            SELECT 
                COUNT(*) as total_registros,
                MIN(created_at) as primeiro_registro,
                MAX(created_at) as ultimo_registro,
                AVG(value) as valor_medio,
                COUNT(DISTINCT source) as fontes_diferentes,
                COUNT(CASE WHEN direction_allowed = 'LONG_ONLY' THEN 1 END) as long_only,
                COUNT(CASE WHEN direction_allowed = 'SHORT_ONLY' THEN 1 END) as short_only,
                COUNT(CASE WHEN direction_allowed = 'BOTH' THEN 1 END) as both_allowed
            FROM fear_greed_index;
        `);
        
        if (stats.rows[0].total_registros > 0) {
            const s = stats.rows[0];
            console.log('📊 ESTATÍSTICAS DA TABELA:');
            console.log(`   Total de registros: ${s.total_registros}`);
            console.log(`   Primeiro registro: ${s.primeiro_registro}`);
            console.log(`   Último registro: ${s.ultimo_registro}`);
            console.log(`   Valor médio F&G: ${parseFloat(s.valor_medio).toFixed(2)}`);
            console.log(`   Fontes diferentes: ${s.fontes_diferentes}`);
            console.log(`   LONG ONLY: ${s.long_only} registros`);
            console.log(`   SHORT ONLY: ${s.short_only} registros`);
            console.log(`   BOTH allowed: ${s.both_allowed} registros`);
            
            // Status da coleta
            const agora = new Date();
            const ultimoRegistro = new Date(s.ultimo_registro);
            const horasDesdeUltimo = (agora - ultimoRegistro) / (1000 * 60 * 60);
            
            console.log('\n🔍 STATUS DO SISTEMA:');
            if (horasDesdeUltimo < 1) {
                console.log('✅ SISTEMA ATIVO - Dados atualizados na última hora');
            } else if (horasDesdeUltimo < 4) {
                console.log('⚠️ SISTEMA LENTO - Último registro há mais de 1 hora');
            } else {
                console.log('❌ SISTEMA INATIVO - Último registro há mais de 4 horas');
            }
            
        } else {
            console.log('❌ SISTEMA NÃO CONFIGURADO - Nenhum registro encontrado');
        }
        
        client.release();
        
    } catch (error) {
        console.error('❌ Erro ao gerar relatório:', error.message);
    }
}

// Função principal
async function executarTeste() {
    try {
        const tabelaOK = await verificarTabelaFearGreed();
        await testarAPIs();
        await verificarColetoresAtivos();
        await simularColetaManual();
        await gerarRelatorio();
        
        console.log('\n🎯 CONCLUSÕES:');
        console.log('================');
        
        if (tabelaOK) {
            console.log('✅ Sistema de Fear & Greed está operacional');
            console.log('📊 Dados sendo coletados e armazenados');
            console.log('🎯 Validação de direção de sinais funcionando');
        } else {
            console.log('⚠️ Sistema precisa de atenção:');
            console.log('   - Verificar se coletores automáticos estão rodando');
            console.log('   - Configurar agendamento de coleta');
            console.log('   - Monitorar APIs de dados');
        }
        
        console.log('\n📝 Para ativar coleta automática, execute:');
        console.log('   node gestor-fear-greed-coinstats.js');
        console.log('   node fear-greed-integration.js');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    } finally {
        await pool.end();
    }
}

// Executar teste
executarTeste();
