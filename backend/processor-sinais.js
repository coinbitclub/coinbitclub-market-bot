/**
 * 🔧 PROCESSADOR DE SINAIS - COINBITCLUB MARKET BOT V3.0.0
 * Processamento inteligente de sinais TradingView para operações
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
    ssl: { rejectUnauthorized: false }
});

console.log('🔧 PROCESSADOR DE SINAIS - Iniciando...');

class SignalProcessor {
    constructor() {
        this.isProcessing = false;
        this.processedCount = 0;
        this.errorCount = 0;
    }

    async processarSinaisPendentes() {
        if (this.isProcessing) {
            console.log('⏳ Processamento já em andamento...');
            return;
        }

        this.isProcessing = true;
        console.log('\n🔍 Buscando sinais pendentes...');

        try {
            // Buscar sinais não processados
            const sinaisResult = await pool.query(`
                SELECT * FROM trading_signals 
                WHERE processed = false 
                AND processing_status = 'pending'
                ORDER BY received_at ASC 
                LIMIT 10
            `);

            const sinais = sinaisResult.rows;
            
            if (sinais.length === 0) {
                console.log('✅ Nenhum sinal pendente encontrado');
                this.isProcessing = false;
                return;
            }

            console.log(`📊 Encontrados ${sinais.length} sinais para processar`);

            for (const sinal of sinais) {
                await this.processarSinalIndividual(sinal);
                // Delay pequeno entre processamentos
                await new Promise(resolve => setTimeout(resolve, 500));
            }

        } catch (error) {
            console.error('❌ Erro no processamento:', error.message);
            this.errorCount++;
        } finally {
            this.isProcessing = false;
        }
    }

    async processarSinalIndividual(sinal) {
        console.log(`\n🔄 Processando sinal ID: ${sinal.id}`);
        console.log(`📈 ${sinal.symbol} | ${sinal.action} | ${sinal.price || 'Market'}`);

        try {
            // Marcar como processando
            await pool.query(`
                UPDATE trading_signals 
                SET processing_status = 'processing',
                    processed_at = NOW()
                WHERE id = $1
            `, [sinal.id]);

            // Buscar usuários ativos com chaves API válidas
            const usuariosAtivos = await pool.query(`
                SELECT DISTINCT u.id, u.name, u.is_active, u.balance, u.available_balance,
                       k.api_key, k.secret_key, k.is_active as api_active
                FROM users u
                INNER JOIN user_api_keys k ON u.id = k.user_id
                WHERE u.is_active = true 
                AND k.is_active = true
                AND u.available_balance > 10
            `);

            if (usuariosAtivos.rows.length === 0) {
                console.log('⚠️ Nenhum usuário ativo com saldo disponível');
                await this.marcarSinalComoProcessado(sinal.id, 'no_users', 'Nenhum usuário elegível');
                return;
            }

            console.log(`👥 ${usuariosAtivos.rows.length} usuários elegíveis encontrados`);

            // Processar para cada usuário ativo
            for (const usuario of usuariosAtivos.rows) {
                await this.criarOperacaoParaUsuario(sinal, usuario);
            }

            // Marcar sinal como processado com sucesso
            await this.marcarSinalComoProcessado(sinal.id, 'success', 'Processado com sucesso');
            this.processedCount++;

            console.log(`✅ Sinal ${sinal.id} processado com sucesso`);

        } catch (error) {
            console.error(`❌ Erro ao processar sinal ${sinal.id}:`, error.message);
            await this.marcarSinalComoProcessado(sinal.id, 'error', error.message);
            this.errorCount++;
        }
    }

    async criarOperacaoParaUsuario(sinal, usuario) {
        try {
            // Calcular quantidade baseada no saldo disponível (2% do saldo)
            const riskPercentage = 0.02; // 2%
            const riskAmount = usuario.available_balance * riskPercentage;
            const price = sinal.price || 50000; // Preço padrão se não especificado
            const quantity = Math.floor((riskAmount / price) * 10000) / 10000; // 4 casas decimais

            if (quantity <= 0) {
                console.log(`⚠️ Quantidade inválida para ${usuario.name}: ${quantity}`);
                return;
            }

            // Determinar side baseado na ação
            const side = sinal.action.toLowerCase() === 'buy' ? 'Buy' : 'Sell';
            
            // Gerar order_link_id único
            const order_link_id = `CBB_${Date.now()}_${usuario.id}_${Math.random().toString(36).substr(2, 5)}`;

            // Inserir operação na tabela user_operations
            const operationResult = await pool.query(`
                INSERT INTO user_operations (
                    user_id, signal_id, symbol, side, quantity,
                    entry_price, current_price, order_type,
                    status, order_link_id, time_in_force,
                    reduce_only, position_idx, stop_loss,
                    take_profit, created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
                ) RETURNING id
            `, [
                usuario.id,
                sinal.id,
                sinal.symbol,
                side,
                quantity,
                price,
                price,
                'Market', // Order type padrão
                'pending', // Status inicial
                order_link_id,
                'GTC', // Good Till Cancelled
                false, // reduce_only
                0, // position_idx
                null, // stop_loss
                null  // take_profit
            ]);

            console.log(`📊 Operação criada para ${usuario.name}: ${side} ${quantity} ${sinal.symbol} - ID: ${operationResult.rows[0].id}`);

        } catch (error) {
            console.error(`❌ Erro ao criar operação para ${usuario.name}:`, error.message);
            throw error;
        }
    }

    async marcarSinalComoProcessado(signalId, status, message) {
        try {
            await pool.query(`
                UPDATE trading_signals 
                SET processed = true,
                    processing_status = $1,
                    processing_message = $2,
                    processed_at = NOW()
                WHERE id = $3
            `, [status, message, signalId]);

        } catch (error) {
            console.error('❌ Erro ao marcar sinal como processado:', error.message);
        }
    }

    async obterEstatisticas() {
        try {
            const stats = await pool.query(`
                SELECT 
                    COUNT(*) as total_signals,
                    COUNT(*) FILTER (WHERE processed = true) as processed_signals,
                    COUNT(*) FILTER (WHERE processing_status = 'success') as successful_signals,
                    COUNT(*) FILTER (WHERE processing_status = 'error') as failed_signals,
                    COUNT(*) FILTER (WHERE processing_status = 'pending') as pending_signals
                FROM trading_signals
                WHERE created_at > NOW() - INTERVAL '24 hours'
            `);

            return stats.rows[0];
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error.message);
            return null;
        }
    }

    async executarCicloProcessamento() {
        console.log(`\n🔄 Ciclo de processamento iniciado - ${new Date().toISOString()}`);
        
        await this.processarSinaisPendentes();
        
        const stats = await this.obterEstatisticas();
        if (stats) {
            console.log('\n📊 ESTATÍSTICAS (últimas 24h):');
            console.log(`   Total de sinais: ${stats.total_signals}`);
            console.log(`   Processados: ${stats.processed_signals}`);
            console.log(`   Sucessos: ${stats.successful_signals}`);
            console.log(`   Falhas: ${stats.failed_signals}`);
            console.log(`   Pendentes: ${stats.pending_signals}`);
        }

        console.log(`✅ Ciclo concluído - Processados nesta sessão: ${this.processedCount} | Erros: ${this.errorCount}`);
    }

    iniciar() {
        console.log('🚀 Processador de Sinais iniciado');
        console.log('⏰ Processamento a cada 10 segundos');
        
        // Processar imediatamente
        this.executarCicloProcessamento();
        
        // Configurar interval de 10 segundos
        setInterval(() => {
            this.executarCicloProcessamento();
        }, 10000);
    }
}

// Inicializar processador
const processor = new SignalProcessor();
processor.iniciar();

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🔄 Encerrando processador...');
    await pool.end();
    console.log('✅ Processador encerrado');
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🔄 Encerrando processador...');
    await pool.end();
    console.log('✅ Processador encerrado');
    process.exit(0);
});
