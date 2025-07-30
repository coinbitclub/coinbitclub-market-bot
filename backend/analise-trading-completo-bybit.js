/**
 * 🔍 ANÁLISE ABERTURA E FECHAMENTO DE POSIÇÕES BYBIT
 * Verificar se banco está alinhado para operações de trading completas
 */

const { Pool } = require('pg');
const axios = require('axios');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

// CHAVES CORRETAS DA LUIZA
const API_KEY = '9HZy9BiUW95iXprVRl';
const API_SECRET = 'QUjDXNmSI0qiqaKTUk7FHAHZnjiEN8AaRKQO';

console.log('🔍 ANÁLISE ABERTURA E FECHAMENTO DE POSIÇÕES BYBIT');
console.log('='.repeat(60));

class BybitTradingAnalyzer {
    constructor() {
        this.baseURL = 'https://api.bybit.com';
    }

    // Gerar assinatura para autenticação
    generateSignature(timestamp, params) {
        const recvWindow = '5000';
        const signPayload = timestamp + API_KEY + recvWindow + params;
        return crypto.createHmac('sha256', API_SECRET).update(signPayload).digest('hex');
    }

    // Cabeçalhos para requisições
    getHeaders(signature, timestamp) {
        return {
            'Content-Type': 'application/json',
            'X-BAPI-API-KEY': API_KEY,
            'X-BAPI-SIGN': signature,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-RECV-WINDOW': '5000',
            'X-BAPI-SIGN-TYPE': '2'
        };
    }

    // Análise 1: Estrutura para Place Order (Abertura)
    async analisarPlaceOrder() {
        console.log('📊 ANÁLISE 1: PLACE ORDER (ABERTURA DE POSIÇÃO)');
        console.log('-'.repeat(50));
        
        console.log('🎯 CAMPOS NECESSÁRIOS PARA PLACE ORDER:');
        const camposPlaceOrder = [
            { campo: 'category', valor: 'linear', descricao: 'Categoria do produto (linear, spot, option)' },
            { campo: 'symbol', valor: 'BTCUSDT', descricao: 'Símbolo do par' },
            { campo: 'side', valor: 'Buy/Sell', descricao: 'Lado da ordem' },
            { campo: 'orderType', valor: 'Market/Limit', descricao: 'Tipo da ordem' },
            { campo: 'qty', valor: '0.01', descricao: 'Quantidade' },
            { campo: 'price', valor: '50000', descricao: 'Preço (para ordens Limit)' },
            { campo: 'timeInForce', valor: 'GTC', descricao: 'Validade da ordem' },
            { campo: 'orderLinkId', valor: 'unique_id', descricao: 'ID customizado da ordem' },
            { campo: 'reduceOnly', valor: 'false', descricao: 'Se é ordem de redução apenas' },
            { campo: 'closeOnTrigger', valor: 'false', descricao: 'Se fecha posição ao trigger' }
        ];

        camposPlaceOrder.forEach((item, index) => {
            console.log(`   ${(index + 1).toString().padStart(2, '0')}. ${item.campo}: ${item.valor}`);
            console.log(`       📝 ${item.descricao}`);
        });

        console.log('\n🎯 RESPOSTA ESPERADA DO PLACE ORDER:');
        const responseFields = [
            'orderId', 'orderLinkId', 'symbol', 'side', 'orderType',
            'qty', 'price', 'orderStatus', 'createdTime'
        ];
        
        responseFields.forEach(field => {
            console.log(`   ✅ ${field}`);
        });
    }

    // Análise 2: Estrutura para Cancel Order / Close Position
    async analisarCancelOrder() {
        console.log('\n📊 ANÁLISE 2: CANCEL ORDER / CLOSE POSITION');
        console.log('-'.repeat(50));
        
        console.log('🎯 CAMPOS NECESSÁRIOS PARA CANCEL ORDER:');
        const camposCancelOrder = [
            { campo: 'category', valor: 'linear', descricao: 'Categoria do produto' },
            { campo: 'symbol', valor: 'BTCUSDT', descricao: 'Símbolo do par' },
            { campo: 'orderId', valor: 'order_id', descricao: 'ID da ordem a cancelar' },
            { campo: 'orderLinkId', valor: 'custom_id', descricao: 'ID customizado alternativo' }
        ];

        camposCancelOrder.forEach((item, index) => {
            console.log(`   ${(index + 1).toString().padStart(2, '0')}. ${item.campo}: ${item.valor}`);
            console.log(`       📝 ${item.descricao}`);
        });

        console.log('\n🎯 CAMPOS PARA FECHAR POSIÇÃO (Close Position):');
        const camposClosePosition = [
            { campo: 'category', valor: 'linear', descricao: 'Categoria' },
            { campo: 'symbol', valor: 'BTCUSDT', descricao: 'Símbolo' },
            { campo: 'side', valor: 'Sell', descricao: 'Lado oposto da posição' },
            { campo: 'orderType', valor: 'Market', descricao: 'Ordem a mercado para fechamento' },
            { campo: 'qty', valor: '0.01', descricao: 'Quantidade total da posição' },
            { campo: 'reduceOnly', valor: 'true', descricao: 'Apenas reduzir posição' }
        ];

        camposClosePosition.forEach((item, index) => {
            console.log(`   ${(index + 1).toString().padStart(2, '0')}. ${item.campo}: ${item.valor}`);
            console.log(`       📝 ${item.descricao}`);
        });
    }

    // Análise 3: Verificar estrutura do banco
    async verificarEstruturaBanco() {
        console.log('\n📊 ANÁLISE 3: ESTRUTURA DO BANCO PARA TRADING');
        console.log('-'.repeat(50));

        try {
            // Verificar campos da tabela user_operations
            const estrutura = await pool.query(`
                SELECT column_name, data_type, character_maximum_length, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'user_operations'
                ORDER BY ordinal_position
            `);

            console.log('🗃️ CAMPOS ATUAIS NO BANCO:');
            
            const camposEssenciais = [
                'order_id', 'symbol', 'side', 'order_type', 'quantity', 'price',
                'status', 'operation_type', 'created_at', 'updated_at',
                'entry_price', 'exit_price', 'current_price', 'pnl', 'unrealized_pnl',
                'take_profit', 'stop_loss', 'leverage', 'closing_reason'
            ];

            const camposExistentes = estrutura.rows.map(row => row.column_name);
            
            console.log('\n✅ CAMPOS PARA TRADING:');
            camposEssenciais.forEach(campo => {
                const existe = camposExistentes.includes(campo);
                const tipo = existe ? estrutura.rows.find(r => r.column_name === campo) : null;
                console.log(`   ${existe ? '✅' : '❌'} ${campo.padEnd(20)} ${existe ? `(${tipo.data_type})` : '(FALTANDO)'}`);
            });

            // Verificar campos específicos para controle de ordens
            console.log('\n🔍 CAMPOS ESPECÍFICOS PARA CONTROLE DE ORDENS:');
            const camposControle = [
                { campo: 'order_link_id', tipo: 'VARCHAR(100)', descricao: 'ID customizado da ordem' },
                { campo: 'time_in_force', tipo: 'VARCHAR(20)', descricao: 'Validade da ordem (GTC, IOC, FOK)' },
                { campo: 'reduce_only', tipo: 'BOOLEAN', descricao: 'Se é ordem apenas para reduzir' },
                { campo: 'close_on_trigger', tipo: 'BOOLEAN', descricao: 'Se fecha posição no trigger' },
                { campo: 'order_iv', tipo: 'VARCHAR(50)', descricao: 'Implied volatility' },
                { campo: 'trigger_price', tipo: 'NUMERIC(20,8)', descricao: 'Preço de trigger' },
                { campo: 'order_filter', tipo: 'VARCHAR(50)', descricao: 'Filtro da ordem' }
            ];

            const camposFaltando = [];
            camposControle.forEach(({ campo, tipo, descricao }) => {
                const existe = camposExistentes.includes(campo);
                console.log(`   ${existe ? '✅' : '❌'} ${campo.padEnd(20)} ${existe ? '(existe)' : '(FALTANDO)'}`);
                console.log(`       📝 ${descricao}`);
                if (!existe) camposFaltando.push({ campo, tipo, descricao });
            });

            return camposFaltando;

        } catch (error) {
            console.error('❌ Erro ao verificar estrutura:', error.message);
            return [];
        }
    }

    // Análise 4: Fluxo completo de trading
    async analisarFluxoCompleto() {
        console.log('\n📊 ANÁLISE 4: FLUXO COMPLETO DE TRADING');
        console.log('-'.repeat(50));

        console.log('🔄 FLUXO DE ABERTURA DE POSIÇÃO:');
        console.log('   1. 📊 Receber sinal TradingView');
        console.log('   2. 🔍 Validar sinal (IA Supervisors)');
        console.log('   3. 💰 Verificar saldo disponível');
        console.log('   4. 📋 Criar ordem na Bybit (Place Order)');
        console.log('   5. 💾 Salvar ordem no banco');
        console.log('   6. ⏱️ Monitorar execução da ordem');
        console.log('   7. 📈 Atualizar posição quando executada');

        console.log('\n🔄 FLUXO DE FECHAMENTO DE POSIÇÃO:');
        console.log('   1. 🎯 Detectar condição de fechamento (TP/SL/Sinal reverso)');
        console.log('   2. 📊 Verificar posição atual');
        console.log('   3. 📋 Criar ordem de fechamento (reduceOnly=true)');
        console.log('   4. 💾 Atualizar status no banco');
        console.log('   5. ⏱️ Monitorar execução');
        console.log('   6. 💰 Calcular P&L final');
        console.log('   7. 📝 Registrar fechamento no banco');

        console.log('\n🎯 ESTADOS DE ORDEM NO BANCO:');
        const estados = [
            'PENDING', 'FILLED', 'PARTIALLY_FILLED', 'CANCELLED',
            'REJECTED', 'OPEN', 'CLOSED', 'TRIGGERED'
        ];
        
        estados.forEach(estado => {
            console.log(`   📌 ${estado}`);
        });

        console.log('\n🔍 TIPOS DE OPERAÇÃO NO BANCO:');
        const tipos = [
            'SIGNAL_BUY', 'SIGNAL_SELL', 'TAKE_PROFIT', 'STOP_LOSS',
            'POSITION_OPEN', 'POSITION_CLOSE', 'ORDER_CANCEL', 'BALANCE_UPDATE'
        ];
        
        tipos.forEach(tipo => {
            console.log(`   📋 ${tipo}`);
        });
    }

    // Executar análise completa
    async executarAnaliseCompleta() {
        console.log('🚀 INICIANDO ANÁLISE COMPLETA DE TRADING...\n');
        
        await this.analisarPlaceOrder();
        await this.analisarCancelOrder();
        const camposFaltando = await this.verificarEstruturaBanco();
        await this.analisarFluxoCompleto();

        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMO DA ANÁLISE');
        console.log('='.repeat(60));

        if (camposFaltando.length > 0) {
            console.log('❌ CAMPOS NECESSÁRIOS QUE ESTÃO FALTANDO:');
            camposFaltando.forEach(({ campo, tipo, descricao }) => {
                console.log(`   📝 ${campo}: ${tipo}`);
                console.log(`      ${descricao}`);
            });

            console.log('\n🔧 SCRIPT PARA ADICIONAR CAMPOS FALTANTES:');
            camposFaltando.forEach(({ campo, tipo }) => {
                console.log(`   ALTER TABLE user_operations ADD COLUMN ${campo} ${tipo};`);
            });
        } else {
            console.log('✅ ESTRUTURA DO BANCO ESTÁ COMPLETA PARA TRADING!');
        }

        console.log('\n🎯 PRÓXIMOS PASSOS:');
        console.log('   1. ✅ Estrutura do banco verificada');
        console.log('   2. 🔧 Adicionar campos faltantes (se houver)');
        console.log('   3. 🚀 Implementar funções de Place Order');
        console.log('   4. 🚀 Implementar funções de Cancel Order');
        console.log('   5. 📊 Implementar monitoramento de posições');
        console.log('   6. 🧪 Testes de abertura/fechamento');

        return camposFaltando;
    }
}

// Executar análise
async function main() {
    const analyzer = new BybitTradingAnalyzer();
    
    try {
        const camposFaltando = await analyzer.executarAnaliseCompleta();
        
        if (camposFaltando.length > 0) {
            console.log('\n⚠️ AÇÃO NECESSÁRIA: Adicionar campos faltantes ao banco');
        } else {
            console.log('\n🎉 BANCO 100% PRONTO PARA TRADING COMPLETO!');
        }
        
    } catch (error) {
        console.error('❌ Erro na análise:', error.message);
    } finally {
        await pool.end();
        console.log('\n🔚 Análise finalizada.');
    }
}

main();
