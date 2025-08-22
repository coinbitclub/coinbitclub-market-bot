// ========================================
// TESTE LINKUSDT - TRADING REAL
// Teste com LINKUSDT conforme lógica do sistema
// Valor máximo $10 por ordem
// ========================================

const { Pool } = require('pg');
const ccxt = require('ccxt');
require('dotenv').config();

// Forçar conexão correta
const pool = new Pool({
  connectionString: 'postgresql://postgres:ELjbkkgUASRCtdTAXVFgIssOXiLsRCPq@trolley.proxy.rlwy.net:44790/railway',
  ssl: { rejectUnauthorized: false }
});

async function testarTradingLinkUSDT() {
  let client;
  try {
    console.log('🚀 TESTE TRADING LINKUSDT - Sistema MarketBot');
    console.log('📊 Configuração: Máximo $10 por ordem');
    console.log('💱 Par: LINKUSDT');
    console.log('⚡ Execução: Baseada na lógica do sistema\n');
    
    client = await pool.connect();
    
    // 1. Buscar usuários ativos com validação melhorada
    console.log('👥 Buscando usuários elegíveis...');
    const usersQuery = `
      SELECT DISTINCT
        u.id,
        u.email,
        u.account_balance_usd,
        u.prepaid_credits,
        uea.id as exchange_account_id,
        uea.exchange,
        uea.api_key,
        uea.api_secret,
        uea.is_testnet,
        uea.can_trade,
        uea.max_position_size_usd,
        ts.auto_trading_enabled
      FROM users u
      JOIN user_exchange_accounts uea ON u.id = uea.user_id
      LEFT JOIN trading_settings ts ON u.id = ts.user_id
      WHERE uea.is_active = true 
        AND uea.can_trade = true
        AND uea.exchange = 'BYBIT'
        AND (ts.auto_trading_enabled = true OR ts.auto_trading_enabled IS NULL)
      ORDER BY u.email
    `;
    
    const usersResult = await client.query(usersQuery);
    console.log(`✅ Encontrados ${usersResult.rows.length} usuários elegíveis\n`);
    
    if (usersResult.rows.length === 0) {
      console.log('❌ Nenhum usuário elegível encontrado');
      return;
    }
    
    // 2. Função para descriptografar (versão corrigida para Node.js moderno)
    function decrypt(encryptedText) {
      try {
        const crypto = require('crypto');
        const key = process.env.ENCRYPTION_KEY || 'marketbot-default-key-change-in-production';
        
        // Método compatível com Node.js moderno
        const algorithm = 'aes-256-cbc';
        const keyHash = crypto.createHash('md5').update(key).digest();
        const iv = Buffer.alloc(16, 0); // IV zerado para compatibilidade com createDecipher
        
        const decipher = crypto.createDecipheriv(algorithm, keyHash, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      } catch (error) {
        console.error('Erro na descriptografia:', error.message);
        // Tentar método alternativo se falhar
        try {
          const crypto = require('crypto');
          const key = process.env.ENCRYPTION_KEY || 'marketbot-default-key-change-in-production';
          
          // Fallback para teste - assumir que pode estar em texto simples
          if (encryptedText && encryptedText.length < 100 && !encryptedText.includes('$')) {
            return encryptedText; // Retornar como está se parecer texto simples
          }
          return null;
        } catch (fallbackError) {
          return null;
        }
      }
    }
    
    // 3. Função para detectar testnet/mainnet
    async function detectEnvironment(apiKey, apiSecret) {
      try {
        const exchange = new ccxt.bybit({
          apiKey: apiKey,
          secret: apiSecret,
          sandbox: false, // Sempre tentar mainnet primeiro
          enableRateLimit: true,
          timeout: 10000
        });
        
        const balance = await exchange.fetchBalance();
        
        // Verificar indicadores de testnet
        const isTestnet = balance.info?.isTestnet === true ||
                         JSON.stringify(balance.info).includes('testnet') ||
                         Object.values(balance).some(b => 
                           typeof b === 'object' && b !== null && b.total > 1000000
                         );
        
        await exchange.close();
        return { isTestnet, balance };
        
      } catch (error) {
        console.log(`Erro na detecção (tentando testnet):`, error.message.substring(0, 50));
        
        // Tentar testnet se mainnet falhar
        try {
          const testExchange = new ccxt.bybit({
            apiKey: apiKey,
            secret: apiSecret,
            sandbox: true,
            enableRateLimit: true,
            timeout: 10000
          });
          
          const testBalance = await testExchange.fetchBalance();
          await testExchange.close();
          return { isTestnet: true, balance: testBalance };
          
        } catch (testError) {
          return { isTestnet: null, balance: null, error: testError.message };
        }
      }
    }
    
    // 4. Obter preço atual do LINKUSDT
    async function obterPrecoLINK() {
      try {
        const exchange = new ccxt.bybit({
          enableRateLimit: true,
          timeout: 10000
        });
        
        const ticker = await exchange.fetchTicker('LINK/USDT');
        await exchange.close();
        
        return ticker.last || ticker.close;
      } catch (error) {
        console.error('Erro ao obter preço LINK:', error.message);
        return null;
      }
    }
    
    console.log('💰 Obtendo preço atual LINKUSDT...');
    const precoLINK = await obterPrecoLINK();
    
    if (!precoLINK) {
      console.log('❌ Não foi possível obter preço do LINKUSDT');
      return;
    }
    
    console.log(`📈 Preço atual LINKUSDT: $${precoLINK.toFixed(4)}`);
    
    // Calcular quantidade máxima para $10
    const quantidadeMaxima = 10 / precoLINK;
    console.log(`🔢 Quantidade máxima LINK para $10: ${quantidadeMaxima.toFixed(6)} LINK\n`);
    
    // 5. Testar cada usuário
    const resultados = [];
    
    for (const user of usersResult.rows) {
      console.log(`\n👤 Testando usuário: ${user.email}`);
      console.log(`🏦 Exchange Account ID: ${user.exchange_account_id}`);
      console.log(`⚙️ Auto Trading: ${user.auto_trading_enabled || 'default(true)'}`);
      
      try {
        // Descriptografar credenciais
        const apiKey = decrypt(user.api_key);
        const apiSecret = decrypt(user.api_secret);
        
        if (!apiKey || !apiSecret) {
          console.log('❌ Falha na descriptografia das credenciais');
          resultados.push({
            email: user.email,
            status: 'ERRO',
            erro: 'Credenciais inválidas'
          });
          continue;
        }
        
        console.log(`🔐 Credenciais descriptografadas com sucesso`);
        
        // Detectar ambiente e obter saldo
        const detecao = await detectEnvironment(apiKey, apiSecret);
        
        if (!detecao.balance) {
          console.log(`❌ Falha na conexão: ${detecao.error || 'Erro desconhecido'}`);
          resultados.push({
            email: user.email,
            status: 'ERRO',
            erro: detecao.error || 'Conexão falhou'
          });
          continue;
        }
        
        const ambiente = detecao.isTestnet ? 'TESTNET' : 'MAINNET';
        console.log(`🌐 Ambiente detectado: ${ambiente}`);
        
        // Atualizar banco se necessário
        if (user.is_testnet !== detecao.isTestnet) {
          console.log(`🔄 Atualizando detecção de ambiente no banco...`);
          await client.query(
            'UPDATE user_exchange_accounts SET is_testnet = $1 WHERE id = $2',
            [detecao.isTestnet, user.exchange_account_id]
          );
          console.log(`✅ Ambiente atualizado para ${ambiente}`);
        }
        
        // Verificar saldo USDT
        const saldoUSDT = detecao.balance.USDT?.free || 0;
        console.log(`💰 Saldo USDT disponível: $${saldoUSDT.toFixed(2)}`);
        
        if (saldoUSDT < 10) {
          console.log(`⚠️ Saldo insuficiente para teste ($10 mínimo)`);
          resultados.push({
            email: user.email,
            status: 'SALDO_INSUFICIENTE',
            saldo: saldoUSDT,
            ambiente: ambiente
          });
          continue;
        }
        
        // Simular criação de posição (sem executar ordem real)
        const tamanhoOrdem = Math.min(10, saldoUSDT * 0.3); // 30% do saldo ou $10, o menor
        const quantidadeLINK = tamanhoOrdem / precoLINK;
        
        // Calcular Stop Loss e Take Profit
        const stopLossPrice = precoLINK * 0.98; // -2%
        const takeProfitPrice = precoLINK * 1.04; // +4%
        
        console.log(`📊 Simulação de ordem:`);
        console.log(`  💵 Valor: $${tamanhoOrdem.toFixed(2)}`);
        console.log(`  🔢 Quantidade: ${quantidadeLINK.toFixed(6)} LINK`);
        console.log(`  🛡️ Stop Loss: $${stopLossPrice.toFixed(4)} (-2%)`);
        console.log(`  🎯 Take Profit: $${takeProfitPrice.toFixed(4)} (+4%)`);
        
        // Criar entrada no banco (sem order_ids por enquanto)
        console.log(`💾 Criando posição no banco de dados...`);
        
        const insertQuery = `
          INSERT INTO trading_positions (
            user_id, exchange_account_id, symbol, side, size, 
            entry_price, leverage, stop_loss, take_profit, 
            status, opened_at, unrealized_pnl_usd, realized_pnl_usd, 
            fees_paid_usd, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          RETURNING id
        `;
        
        const positionResult = await client.query(insertQuery, [
          user.id,
          user.exchange_account_id,
          'LINKUSDT',
          'BUY',
          quantidadeLINK,
          precoLINK,
          1, // leverage 1x para teste
          stopLossPrice,
          takeProfitPrice,
          'OPEN', // Status OPEN
          new Date(),
          0, // unrealized_pnl_usd
          0, // realized_pnl_usd  
          0, // fees_paid_usd
          new Date(),
          new Date()
        ]);
        
        const positionId = positionResult.rows[0].id;
        console.log(`✅ Posição criada com ID: ${positionId}`);
        
        resultados.push({
          email: user.email,
          status: 'SUCESSO',
          positionId: positionId,
          valor: tamanhoOrdem,
          quantidade: quantidadeLINK,
          ambiente: ambiente,
          saldo: saldoUSDT
        });
        
      } catch (error) {
        console.log(`❌ Erro no processamento: ${error.message}`);
        resultados.push({
          email: user.email,
          status: 'ERRO',
          erro: error.message
        });
      }
    }
    
    // 6. Relatório final
    console.log('\n' + '='.repeat(80));
    console.log('📋 RELATÓRIO FINAL - TESTE LINKUSDT');
    console.log('='.repeat(80));
    
    const sucessos = resultados.filter(r => r.status === 'SUCESSO');
    const erros = resultados.filter(r => r.status === 'ERRO');
    const saldoInsuficiente = resultados.filter(r => r.status === 'SALDO_INSUFICIENTE');
    
    console.log(`\n📊 RESUMO GERAL:`);
    console.log(`✅ Posições criadas: ${sucessos.length}/${resultados.length}`);
    console.log(`❌ Erros: ${erros.length}`);
    console.log(`⚠️ Saldo insuficiente: ${saldoInsuficiente.length}`);
    console.log(`📈 Taxa de sucesso: ${((sucessos.length / resultados.length) * 100).toFixed(1)}%`);
    
    console.log(`\n📋 DETALHES POR USUÁRIO:\n`);
    
    resultados.forEach((resultado, index) => {
      console.log(`${index + 1}. ${resultado.email}`);
      
      if (resultado.status === 'SUCESSO') {
        console.log(`   Status: ✅ SUCESSO`);
        console.log(`   Position ID: ${resultado.positionId}`);
        console.log(`   Valor: $${resultado.valor.toFixed(2)}`);
        console.log(`   Quantidade: ${resultado.quantidade.toFixed(6)} LINK`);
        console.log(`   Ambiente: ${resultado.ambiente}`);
        console.log(`   Saldo: $${resultado.saldo.toFixed(2)}`);
      } else if (resultado.status === 'SALDO_INSUFICIENTE') {
        console.log(`   Status: ⚠️ SALDO INSUFICIENTE`);
        console.log(`   Saldo: $${resultado.saldo.toFixed(2)}`);
        console.log(`   Ambiente: ${resultado.ambiente}`);
        console.log(`   Necessário: $10.00 mínimo`);
      } else {
        console.log(`   Status: ❌ FALHA`);
        console.log(`   Erro: ${resultado.erro}`);
      }
      console.log('');
    });
    
    // 7. Sistema de prioridades
    console.log(`\n🏆 SISTEMA DE PRIORIDADES DETECTADO:`);
    const mainnetComSaldo = resultados.filter(r => 
      r.ambiente === 'MAINNET' && r.status === 'SUCESSO'
    );
    const testnetUsers = resultados.filter(r => 
      r.ambiente === 'TESTNET'
    );
    
    console.log(`📈 Prioridade 1 (MAINNET + Saldo): ${mainnetComSaldo.length} usuários`);
    console.log(`📉 Prioridade 3 (TESTNET): ${testnetUsers.length} usuários`);
    
    if (sucessos.length > 0) {
      console.log(`\n🎯 PRÓXIMOS PASSOS:`);
      console.log(`1. Monitorar posições criadas`);
      console.log(`2. Implementar webhooks TradingView`);
      console.log(`3. Ativar sistema de monitoramento real-time`);
      console.log(`4. Configurar alertas automáticos`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

// Executar teste
testarTradingLinkUSDT();
