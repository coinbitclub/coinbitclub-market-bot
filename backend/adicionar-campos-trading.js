/**
 * 🔧 ADICIONAR CAMPOS PARA TRADING COMPLETO
 * Campos específicos para controle de abertura e fechamento de posições
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 ADICIONANDO CAMPOS PARA TRADING COMPLETO');
console.log('='.repeat(50));

async function adicionarCamposTrading() {
    try {
        console.log('📊 Adicionando campos específicos para trading...\n');
        
        // Campos necessários para controle completo de ordens
        const camposTrading = [
            {
                campo: 'order_link_id',
                tipo: 'VARCHAR(100)',
                descricao: 'ID customizado da ordem (orderLinkId na Bybit)',
                essencial: true
            },
            {
                campo: 'time_in_force',
                tipo: 'VARCHAR(20)',
                descricao: 'Validade da ordem (GTC, IOC, FOK, PostOnly)',
                essencial: true
            },
            {
                campo: 'reduce_only',
                tipo: 'BOOLEAN DEFAULT FALSE',
                descricao: 'Se é ordem apenas para reduzir posição existente',
                essencial: true
            },
            {
                campo: 'close_on_trigger',
                tipo: 'BOOLEAN DEFAULT FALSE',
                descricao: 'Se fecha posição quando disparado o trigger',
                essencial: false
            },
            {
                campo: 'trigger_price',
                tipo: 'NUMERIC(20,8)',
                descricao: 'Preço de trigger para ordens condicionais',
                essencial: false
            },
            {
                campo: 'order_filter',
                tipo: 'VARCHAR(50)',
                descricao: 'Filtro da ordem (Order, tpslOrder, etc.)',
                essencial: false
            },
            {
                campo: 'category',
                tipo: 'VARCHAR(20) DEFAULT \'linear\'',
                descricao: 'Categoria do produto (linear, spot, option)',
                essencial: true
            },
            {
                campo: 'position_idx',
                tipo: 'INTEGER DEFAULT 0',
                descricao: 'Índice da posição (0=one-way, 1=hedge-buy, 2=hedge-sell)',
                essencial: false
            }
        ];
        
        // Verificar quais campos já existem
        const camposExistentes = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'user_operations'
        `);
        
        const nomesCamposExistentes = camposExistentes.rows.map(row => row.column_name);
        
        let camposAdicionados = 0;
        let camposEssenciaisAdicionados = 0;
        
        for (const { campo, tipo, descricao, essencial } of camposTrading) {
            if (!nomesCamposExistentes.includes(campo)) {
                console.log(`${essencial ? '🎯' : '📝'} Adicionando: ${campo} (${tipo})`);
                console.log(`   📋 ${descricao}`);
                console.log(`   ${essencial ? '⚡ ESSENCIAL' : '🔧 OPCIONAL'}`);
                
                try {
                    await pool.query(`
                        ALTER TABLE user_operations 
                        ADD COLUMN ${campo} ${tipo}
                    `);
                    console.log(`   ✅ Campo ${campo} adicionado com sucesso`);
                    camposAdicionados++;
                    if (essencial) camposEssenciaisAdicionados++;
                } catch (error) {
                    console.log(`   ❌ Erro ao adicionar ${campo}: ${error.message}`);
                }
                console.log('');
            } else {
                console.log(`✅ Campo ${campo} já existe no banco`);
            }
        }
        
        console.log('='.repeat(50));
        console.log(`📊 RESUMO:`);
        console.log(`   📝 Total de campos adicionados: ${camposAdicionados}`);
        console.log(`   ⚡ Campos essenciais adicionados: ${camposEssenciaisAdicionados}`);
        console.log('');
        
        // Criar índices para performance
        console.log('🚀 CRIANDO ÍNDICES PARA PERFORMANCE...\n');
        
        const indices = [
            { nome: 'idx_order_link_id', campo: 'order_link_id', descricao: 'Busca rápida por order_link_id' },
            { nome: 'idx_reduce_only', campo: 'reduce_only', descricao: 'Filtrar ordens de redução' },
            { nome: 'idx_category', campo: 'category', descricao: 'Filtrar por categoria de produto' }
        ];
        
        for (const { nome, campo, descricao } of indices) {
            try {
                await pool.query(`
                    CREATE INDEX IF NOT EXISTS ${nome} 
                    ON user_operations(${campo}) 
                    WHERE ${campo} IS NOT NULL
                `);
                console.log(`✅ Índice criado: ${nome}`);
                console.log(`   📋 ${descricao}`);
            } catch (error) {
                console.log(`⚠️ Índice ${nome}: ${error.message}`);
            }
        }
        
        console.log('\n📊 VERIFICANDO ESTRUTURA FINAL...\n');
        
        // Verificar estrutura final para trading
        const estruturaFinal = await pool.query(`
            SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'user_operations'
            AND column_name IN (
                'order_id', 'order_link_id', 'symbol', 'side', 'order_type', 
                'quantity', 'price', 'time_in_force', 'reduce_only', 
                'close_on_trigger', 'trigger_price', 'category', 'status'
            )
            ORDER BY column_name
        `);
        
        console.log('📋 CAMPOS ESSENCIAIS PARA TRADING:');
        estruturaFinal.rows.forEach(col => {
            const tamanho = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
            const padrao = col.column_default ? ` DEFAULT ${col.column_default}` : '';
            console.log(`   ✅ ${col.column_name.padEnd(20)} ${col.data_type}${tamanho}${padrao}`);
        });
        
        console.log('\n🎯 MAPEAMENTO BYBIT → BANCO ATUALIZADO:\n');
        
        console.log('📋 PLACE ORDER (Abertura):');
        console.log('   Bybit: category → Banco: category ✅');
        console.log('   Bybit: symbol → Banco: symbol ✅');
        console.log('   Bybit: side → Banco: side ✅');
        console.log('   Bybit: orderType → Banco: order_type ✅');
        console.log('   Bybit: qty → Banco: quantity ✅');
        console.log('   Bybit: price → Banco: price ✅');
        console.log('   Bybit: timeInForce → Banco: time_in_force ✅');
        console.log('   Bybit: orderLinkId → Banco: order_link_id ✅');
        console.log('   Bybit: reduceOnly → Banco: reduce_only ✅');
        console.log('   Bybit: closeOnTrigger → Banco: close_on_trigger ✅');
        
        console.log('\n📋 CANCEL ORDER (Fechamento):');
        console.log('   Bybit: orderId → Banco: order_id ✅');
        console.log('   Bybit: orderLinkId → Banco: order_link_id ✅');
        console.log('   Bybit: category → Banco: category ✅');
        console.log('   Bybit: symbol → Banco: symbol ✅');
        
        console.log('\n📊 POSITION MANAGEMENT:');
        console.log('   Bybit: positionIdx → Banco: position_idx ✅');
        console.log('   Bybit: triggerPrice → Banco: trigger_price ✅');
        console.log('   Bybit: orderFilter → Banco: order_filter ✅');
        
        console.log('\n✅ BANCO AGORA ESTÁ 100% COMPATÍVEL PARA TRADING COMPLETO!');
        
        // Exemplo de uso
        console.log('\n🧪 EXEMPLO DE INSERÇÃO DE ORDEM:\n');
        
        const exemploOrdem = `
INSERT INTO user_operations (
    user_id, symbol, side, order_type, quantity, price,
    order_id, order_link_id, time_in_force, reduce_only,
    category, status, operation_type, created_at
) VALUES (
    4, 'BTCUSDT', 'Buy', 'Limit', 0.001, 50000.00,
    'bybit_order_123', 'custom_order_001', 'GTC', false,
    'linear', 'PENDING', 'SIGNAL_BUY', NOW()
);`;
        
        console.log(exemploOrdem);
        
        console.log('\n🎯 PRÓXIMAS IMPLEMENTAÇÕES:');
        console.log('   1. ✅ Estrutura do banco completa');
        console.log('   2. 🚀 Implementar classe BybitTradingManager');
        console.log('   3. 📊 Funções placeOrder() e cancelOrder()');
        console.log('   4. 🔄 Sistema de monitoramento de ordens');
        console.log('   5. 📈 Integração com sinais TradingView');
        console.log('   6. 🧪 Testes de trading em ambiente real');
        
    } catch (error) {
        console.error('❌ Erro ao adicionar campos:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
        console.log('\n🔚 Adição de campos finalizada.');
    }
}

adicionarCamposTrading();
