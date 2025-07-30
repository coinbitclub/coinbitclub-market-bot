/**
 * 🔥 ATUALIZADOR FEAR & GREED INDEX - EMERGENCIAL
 * Força a atualização do índice de medo e ganância no banco
 */

const { Pool } = require('pg');
const axios = require('axios');

// Configuração do banco de dados
const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔥 ATUALIZADOR FEAR & GREED - EMERGENCIAL');
console.log('=========================================');

class AtualizadorFearGreed {
    constructor() {
        this.apis = [
            {
                name: 'CoinStats',
                url: 'https://openapiv1.coinstats.app/insights/fear-and-greed',
                headers: {
                    'X-API-KEY': 'ZFIxigBcVaCyXDL1Qp/Ork7TOL3+h07NM2f3YoSrMkI=',
                    'Accept': 'application/json'
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
            },
            {
                name: 'Alternative.me',
                url: 'https://api.alternative.me/fng/?limit=1',
                headers: {},
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
            }
        ];
    }

    async obterDadosAtuais() {
        console.log('📊 Buscando dados atuais...');
        
        for (const api of this.apis) {
            try {
                console.log(`🔍 Tentando ${api.name}...`);
                
                const response = await axios.get(api.url, {
                    headers: api.headers,
                    timeout: 15000
                });
                
                console.log(`   Status: ${response.status}`);
                
                const dados = api.parser(response.data);
                if (dados && dados.value) {
                    console.log(`   ✅ Sucesso! Valor: ${dados.value}, Classificação: ${dados.classification}`);
                    return {
                        ...dados,
                        source: api.name.toUpperCase()
                    };
                } else {
                    console.log(`   ❌ Parser falhou`);
                }
                
            } catch (error) {
                console.log(`   ❌ Erro em ${api.name}: ${error.message}`);
            }
        }
        
        // Fallback - usar valor neutro
        console.log('⚠️ Todas APIs falharam, usando FALLBACK = 50');
        return {
            value: 50,
            classification: 'Neutral',
            timestamp: new Date().toISOString(),
            source: 'FALLBACK'
        };
    }

    obterClassificacaoPortugues(classification) {
        const map = {
            'Extreme Fear': 'Medo Extremo',
            'Fear': 'Medo',
            'Neutral': 'Neutro',
            'Greed': 'Ganância',
            'Extreme Greed': 'Ganância Extrema'
        };
        return map[classification] || 'Neutro';
    }

    obterDirecaoPermitida(value) {
        if (value < 30) {
            return {
                direction: 'LONG_ONLY',
                description: 'Apenas operações LONG permitidas (Medo extremo)',
                color: '🔴'
            };
        } else if (value > 80) {
            return {
                direction: 'SHORT_ONLY', 
                description: 'Apenas operações SHORT permitidas (Ganância extrema)',
                color: '🟢'
            };
        } else {
            return {
                direction: 'BOTH',
                description: 'LONG e SHORT permitidos (Mercado equilibrado)',
                color: '🟡'
            };
        }
    }

    async salvarNoBanco(dados) {
        console.log('💾 Salvando no banco de dados...');
        
        try {
            const client = await pool.connect();
            
            const classificacaoPt = this.obterClassificacaoPortugues(dados.classification);
            const direcao = this.obterDirecaoPermitida(dados.value);
            
            // Buscar valor anterior para calcular mudança
            const ultimoRegistro = await client.query(`
                SELECT value FROM fear_greed_index 
                ORDER BY created_at DESC 
                LIMIT 1
            `);
            
            const valorAnterior = ultimoRegistro.rows.length > 0 ? ultimoRegistro.rows[0].value : null;
            const mudanca24h = valorAnterior ? dados.value - valorAnterior : 0;
            
            const result = await client.query(`
                INSERT INTO fear_greed_index (
                    timestamp_data,
                    value, 
                    classification,
                    classificacao_pt,
                    value_previous,
                    change_24h,
                    source,
                    raw_payload
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, created_at
            `, [
                dados.timestamp ? new Date(dados.timestamp) : new Date(),
                dados.value,
                dados.classification,
                classificacaoPt,
                valorAnterior,
                mudanca24h,
                dados.source,
                JSON.stringify(dados)
            ]);
            
            console.log(`   ✅ Salvo com sucesso! ID: ${result.rows[0].id}`);
            console.log(`   📊 Valor: ${dados.value}`);
            console.log(`   🏷️ Classificação: ${dados.classification} (${classificacaoPt})`);
            console.log(`   ${direcao.color} Direção: ${direcao.description}`);
            console.log(`   📈 Mudança: ${mudanca24h > 0 ? '+' : ''}${mudanca24h}`);
            
            client.release();
            
            return {
                success: true,
                id: result.rows[0].id,
                dados: dados,
                direcao: direcao
            };
            
        } catch (error) {
            console.error('❌ Erro ao salvar no banco:', error.message);
            return { success: false, error: error.message };
        }
    }

    async verificarStatusAtual() {
        console.log('🔍 Verificando status atual do sistema...');
        
        try {
            const client = await pool.connect();
            
            // Último registro
            const ultimo = await client.query(`
                SELECT 
                    value,
                    classification,
                    classificacao_pt,
                    source,
                    created_at,
                    EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as horas_atras
                FROM fear_greed_index 
                ORDER BY created_at DESC 
                LIMIT 1
            `);
            
            if (ultimo.rows.length > 0) {
                const reg = ultimo.rows[0];
                console.log(`📊 Último registro:`);
                console.log(`   Valor: ${reg.value} (${reg.classification})`);
                console.log(`   Fonte: ${reg.source}`);
                console.log(`   Há: ${reg.horas_atras.toFixed(1)} horas`);
                
                if (reg.horas_atras > 2) {
                    console.log(`⚠️ DADOS DESATUALIZADOS - Necessária atualização!`);
                    return { needsUpdate: true, lastValue: reg.value };
                } else {
                    console.log(`✅ Dados atualizados recentemente`);
                    return { needsUpdate: false, lastValue: reg.value };
                }
            } else {
                console.log(`❌ Nenhum registro encontrado!`);
                return { needsUpdate: true, lastValue: null };
            }
            
            client.release();
            
        } catch (error) {
            console.error('❌ Erro ao verificar status:', error.message);
            return { needsUpdate: true, lastValue: null };
        }
    }

    async executarAtualizacao() {
        console.log('🚀 Iniciando atualização do Fear & Greed...\n');
        
        try {
            // 1. Verificar status atual
            const status = await this.verificarStatusAtual();
            
            // 2. Obter novos dados
            const dadosAtuais = await this.obterDadosAtuais();
            
            // 3. Verificar se valor mudou significativamente
            if (status.lastValue && Math.abs(dadosAtuais.value - status.lastValue) < 2) {
                console.log(`📊 Valor similar ao anterior (${status.lastValue} → ${dadosAtuais.value})`);
                
                if (!status.needsUpdate) {
                    console.log(`✅ Sistema já atualizado, não é necessário inserir novo registro`);
                    return { success: true, updated: false, reason: 'already_updated' };
                }
            }
            
            // 4. Salvar no banco
            const resultado = await this.salvarNoBanco(dadosAtuais);
            
            if (resultado.success) {
                console.log('\n🎯 ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!');
                console.log('====================================');
                
                const direcao = resultado.direcao;
                console.log(`📊 Fear & Greed Index: ${dadosAtuais.value}/100`);
                console.log(`🏷️ Classificação: ${dadosAtuais.classification}`);
                console.log(`${direcao.color} Trading: ${direcao.description}`);
                console.log(`📡 Fonte: ${dadosAtuais.source}`);
                console.log(`🕒 Atualizado: ${new Date().toLocaleString('pt-BR')}`);
                
                return { 
                    success: true, 
                    updated: true, 
                    data: dadosAtuais,
                    direction: direcao
                };
            } else {
                throw new Error(resultado.error);
            }
            
        } catch (error) {
            console.error('\n❌ ERRO NA ATUALIZAÇÃO:', error.message);
            return { success: false, error: error.message };
        }
    }
}

// Função para criar endpoint na API principal
async function criarEndpointFearGreed() {
    console.log('\n🔧 VERIFICANDO ENDPOINT FEAR & GREED NA API...');
    
    // Código para adicionar ao main.js
    const endpointCode = `
// Endpoint para consultar Fear & Greed Index atual
app.get('/api/fear-greed/current', async (req, res) => {
    try {
        const client = await pool.connect();
        
        const result = await client.query(\`
            SELECT 
                value,
                classification,
                classificacao_pt,
                source,
                created_at,
                CASE 
                    WHEN value < 30 THEN 'LONG_ONLY'
                    WHEN value > 80 THEN 'SHORT_ONLY'
                    ELSE 'BOTH'
                END as direction_allowed
            FROM fear_greed_index 
            ORDER BY created_at DESC 
            LIMIT 1
        \`);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Fear & Greed data not found',
                message: 'No recent data available'
            });
        }
        
        const data = result.rows[0];
        
        res.json({
            success: true,
            fear_greed: {
                value: data.value,
                classification: data.classification,
                classificacao_pt: data.classificacao_pt,
                direction_allowed: data.direction_allowed,
                source: data.source,
                last_update: data.created_at,
                trading_recommendation: data.value < 30 ? 'LONG_ONLY' : 
                                       data.value > 80 ? 'SHORT_ONLY' : 'BOTH'
            },
            timestamp: new Date().toISOString()
        });
        
        client.release();
        
    } catch (error) {
        console.error('❌ Erro ao consultar Fear & Greed:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});
`;

    console.log('📋 Código do endpoint criado. Para ativar, adicione ao main.js:');
    console.log(endpointCode);
}

// Executar atualização
async function main() {
    const atualizador = new AtualizadorFearGreed();
    
    try {
        const resultado = await atualizador.executarAtualizacao();
        
        if (resultado.success) {
            await criarEndpointFearGreed();
            
            console.log('\n📝 PRÓXIMOS PASSOS:');
            console.log('==================');
            console.log('1. ✅ Dados atualizados no banco');
            console.log('2. 🔧 Adicionar endpoint ao main.js');
            console.log('3. 🔄 Configurar atualização automática');
            console.log('4. 🎯 Testar validação de sinais');
            
            console.log('\n🌐 Teste o endpoint após adicionar ao main.js:');
            console.log('GET /api/fear-greed/current');
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    } finally {
        await pool.end();
    }
}

main();
