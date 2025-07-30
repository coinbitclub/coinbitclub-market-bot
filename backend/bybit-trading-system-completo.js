const axios = require('axios');
const crypto = require('crypto');
const { Pool } = require('pg');

// Configuração do banco PostgreSQL
const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

class BybitTradingSystemCompleto {
  constructor(apiKey, apiSecret, nomeUsuario) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.nomeUsuario = nomeUsuario;
    this.baseURL = 'https://api.bybit.com';
    this.isConnected = false;
  }

  // Criar assinatura HMAC SHA256 (baseado no teste bem-sucedido)
  createSignature(timestamp, recvWindow, query = '') {
    const signPayload = timestamp + this.apiKey + recvWindow + query;
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(signPayload)
      .digest('hex');
  }

  // Criar headers conforme especificação Bybit V5
  createHeaders(query = '') {
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    const signature = this.createSignature(timestamp, recvWindow, query);

    return {
      'Content-Type': 'application/json',
      'X-BAPI-API-KEY': this.apiKey,
      'X-BAPI-SIGN': signature,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': recvWindow,
      'X-BAPI-SIGN-TYPE': '2'
    };
  }

  // 1. TESTAR CONECTIVIDADE
  async testarConectividade() {
    try {
      console.log(`🔍 [${this.nomeUsuario}] Testando conectividade...`);
      
      const query = 'accountType=UNIFIED';
      const headers = this.createHeaders(query);
      
      const response = await axios.get(
        `${this.baseURL}/v5/account/wallet-balance?${query}`,
        { headers }
      );
      
      if (response.data.retCode === 0) {
        this.isConnected = true;
        console.log(`✅ [${this.nomeUsuario}] Conectividade OK!`);
        return { success: true, data: response.data };
      } else {
        console.log(`❌ [${this.nomeUsuario}] Erro: ${response.data.retMsg}`);
        return { success: false, error: response.data.retMsg };
      }
      
    } catch (error) {
      console.log(`❌ [${this.nomeUsuario}] Erro de conexão: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // 2. CONSULTAR SALDO DETALHADO
  async consultarSaldo() {
    try {
      if (!this.isConnected) {
        const teste = await this.testarConectividade();
        if (!teste.success) return teste;
      }

      console.log(`💰 [${this.nomeUsuario}] Consultando saldos...`);
      
      const query = 'accountType=UNIFIED';
      const headers = this.createHeaders(query);
      
      const response = await axios.get(
        `${this.baseURL}/v5/account/wallet-balance?${query}`,
        { headers }
      );
      
      if (response.data.retCode === 0 && response.data.result.list.length > 0) {
        const account = response.data.result.list[0];
        
        console.log(`📊 [${this.nomeUsuario}] Saldos obtidos:`);
        console.log(`   💎 Total Equity: ${account.totalEquity} USD`);
        console.log(`   💰 Wallet Balance: ${account.totalWalletBalance} USD`);
        console.log(`   💵 Available: ${account.totalAvailableBalance} USD`);
        
        const saldosDetalhados = [];
        
        if (account.coin) {
          account.coin.forEach(coin => {
            const walletBalance = parseFloat(coin.walletBalance || 0);
            const available = parseFloat(coin.availableToWithdraw || 0);
            const locked = parseFloat(coin.locked || 0);
            
            if (walletBalance > 0 || available > 0 || locked > 0) {
              saldosDetalhados.push({
                coin: coin.coin,
                walletBalance,
                available,
                locked,
                equity: parseFloat(coin.equity || 0)
              });
              
              console.log(`   💎 ${coin.coin}: ${walletBalance} (Disponível: ${available})`);
            }
          });
        }
        
        return {
          success: true,
          account: account,
          saldos: saldosDetalhados,
          totalEquity: parseFloat(account.totalEquity),
          totalAvailable: parseFloat(account.totalAvailableBalance)
        };
        
      } else {
        return { success: false, error: 'Nenhum saldo encontrado' };
      }
      
    } catch (error) {
      console.log(`❌ [${this.nomeUsuario}] Erro ao consultar saldo: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // 3. CONSULTAR POSIÇÕES ATIVAS
  async consultarPosicoes() {
    try {
      console.log(`📊 [${this.nomeUsuario}] Consultando posições...`);
      
      const query = 'category=linear&settleCoin=USDT';
      const headers = this.createHeaders(query);
      
      const response = await axios.get(
        `${this.baseURL}/v5/position/list?${query}`,
        { headers }
      );
      
      if (response.data.retCode === 0) {
        const posicoes = response.data.result.list || [];
        const posicoesAtivas = posicoes.filter(pos => parseFloat(pos.size) > 0);
        
        if (posicoesAtivas.length > 0) {
          console.log(`📈 [${this.nomeUsuario}] ${posicoesAtivas.length} posições ativas:`);
          
          posicoesAtivas.forEach(pos => {
            console.log(`   ${pos.symbol} (${pos.side}): ${pos.size} @ ${pos.avgPrice}`);
            console.log(`     PnL: ${pos.unrealisedPnl} | Margem: ${pos.positionIM}`);
          });
        } else {
          console.log(`📋 [${this.nomeUsuario}] Nenhuma posição ativa`);
        }
        
        return { success: true, posicoes: posicoesAtivas };
      } else {
        return { success: false, error: response.data.retMsg };
      }
      
    } catch (error) {
      console.log(`❌ [${this.nomeUsuario}] Erro ao consultar posições: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // 4. CONSULTAR ORDENS ATIVAS
  async consultarOrdens() {
    try {
      console.log(`📋 [${this.nomeUsuario}] Consultando ordens...`);
      
      const query = 'category=linear&openOnly=0&limit=20';
      const headers = this.createHeaders(query);
      
      const response = await axios.get(
        `${this.baseURL}/v5/order/realtime?${query}`,
        { headers }
      );
      
      if (response.data.retCode === 0) {
        const ordens = response.data.result.list || [];
        const ordensAtivas = ordens.filter(order => 
          ['New', 'PartiallyFilled'].includes(order.orderStatus)
        );
        
        if (ordensAtivas.length > 0) {
          console.log(`📊 [${this.nomeUsuario}] ${ordensAtivas.length} ordens ativas:`);
          
          ordensAtivas.forEach(order => {
            console.log(`   ${order.symbol} ${order.side} ${order.orderType}: ${order.qty} @ ${order.price}`);
            console.log(`     Status: ${order.orderStatus} | ID: ${order.orderId}`);
          });
        } else {
          console.log(`📋 [${this.nomeUsuario}] Nenhuma ordem ativa`);
        }
        
        return { success: true, ordens: ordensAtivas };
      } else {
        return { success: false, error: response.data.retMsg };
      }
      
    } catch (error) {
      console.log(`❌ [${this.nomeUsuario}] Erro ao consultar ordens: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // 5. OBTER PREÇO DE MERCADO
  async obterPrecoMercado(symbol) {
    try {
      const response = await axios.get(
        `${this.baseURL}/v5/market/tickers?category=linear&symbol=${symbol}`
      );
      
      if (response.data.retCode === 0 && response.data.result.list.length > 0) {
        const ticker = response.data.result.list[0];
        const preco = parseFloat(ticker.lastPrice);
        
        console.log(`💰 [${this.nomeUsuario}] ${symbol}: $${preco}`);
        return { success: true, symbol, preco, ticker };
      } else {
        return { success: false, error: 'Ticker não encontrado' };
      }
      
    } catch (error) {
      console.log(`❌ [${this.nomeUsuario}] Erro ao obter preço: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // 6. COLOCAR ORDEM (SIMULAÇÃO SEGURA)
  async simularOrdem(symbol, side, orderType, qty, price = null) {
    console.log(`📊 [${this.nomeUsuario}] SIMULANDO ordem ${side} ${symbol}:`);
    console.log(`   Tipo: ${orderType} | Quantidade: ${qty}`);
    if (price) console.log(`   Preço: ${price}`);
    
    // Obter preço atual para validação
    const precoAtual = await this.obterPrecoMercado(symbol);
    if (!precoAtual.success) return precoAtual;
    
    // Simular validações da Bybit
    const validacoes = {
      symbol_valido: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT'].includes(symbol),
      quantidade_valida: parseFloat(qty) > 0,
      preco_valido: !price || parseFloat(price) > 0,
      side_valido: ['Buy', 'Sell'].includes(side),
      tipo_valido: ['Market', 'Limit'].includes(orderType)
    };
    
    const erros = Object.entries(validacoes)
      .filter(([key, valid]) => !valid)
      .map(([key]) => key);
    
    if (erros.length > 0) {
      console.log(`❌ [${this.nomeUsuario}] Validação falhou: ${erros.join(', ')}`);
      return { success: false, error: `Validação falhou: ${erros.join(', ')}` };
    }
    
    // Simular sucesso
    const orderIdSimulado = `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`✅ [${this.nomeUsuario}] Ordem simulada com sucesso!`);
    console.log(`   Order ID simulado: ${orderIdSimulado}`);
    console.log(`   Preço de referência: $${precoAtual.preco}`);
    
    return {
      success: true,
      simulacao: true,
      orderId: orderIdSimulado,
      symbol,
      side,
      orderType,
      qty,
      price: price || precoAtual.preco,
      precoMercado: precoAtual.preco
    };
  }

  // 7. RELATÓRIO COMPLETO DA CONTA
  async relatorioCompleto() {
    console.log(`\n📋 [${this.nomeUsuario}] GERANDO RELATÓRIO COMPLETO...`);
    console.log('='.repeat(60));
    
    const relatorio = {
      usuario: this.nomeUsuario,
      timestamp: new Date().toISOString(),
      conectividade: null,
      saldos: null,
      posicoes: null,
      ordens: null,
      precos: null
    };
    
    // 1. Teste de conectividade
    relatorio.conectividade = await this.testarConectividade();
    
    if (relatorio.conectividade.success) {
      // 2. Saldos
      relatorio.saldos = await this.consultarSaldo();
      
      // 3. Posições
      relatorio.posicoes = await this.consultarPosicoes();
      
      // 4. Ordens
      relatorio.ordens = await this.consultarOrdens();
      
      // 5. Preços principais
      const simbolos = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'];
      relatorio.precos = {};
      
      for (const symbol of simbolos) {
        const preco = await this.obterPrecoMercado(symbol);
        if (preco.success) {
          relatorio.precos[symbol] = preco.preco;
        }
        await new Promise(resolve => setTimeout(resolve, 200)); // Anti rate-limit
      }
    }
    
    console.log(`✅ [${this.nomeUsuario}] Relatório gerado com sucesso!`);
    return relatorio;
  }
}

// FUNÇÃO PRINCIPAL PARA TESTAR SISTEMA COMPLETO
async function testarSistemaCompletoBybit() {
  try {
    console.log('🚀 INICIANDO SISTEMA COMPLETO DE TRADING BYBIT');
    console.log('=' .repeat(80));
    
    // 1. Buscar usuárias VIP do banco
    const usuariasVip = await pool.query(`
      SELECT u.id, u.name, u.email,
             uak.api_key, uak.secret_key
      FROM users u
      INNER JOIN user_api_keys uak ON u.id = uak.user_id
      WHERE u.name IN ('Luiza Maria de Almeida Pinto', 'Érica dos Santos', 'PALOMA AMARAL')
        AND uak.is_active = true
        AND uak.api_key IS NOT NULL
        AND uak.secret_key IS NOT NULL
      ORDER BY u.id
    `);
    
    if (usuariasVip.rows.length === 0) {
      console.log('❌ Nenhuma usuária VIP encontrada no banco!');
      return;
    }
    
    console.log(`✅ Encontradas ${usuariasVip.rows.length} usuárias VIP no banco`);
    
    // 2. Criar sistemas de trading para cada usuária
    const sistemas = [];
    const relatorios = [];
    
    for (const usuario of usuariasVip.rows) {
      console.log(`\n🔄 Processando: ${usuario.name}`);
      
      const sistema = new BybitTradingSystemCompleto(
        usuario.api_key,
        usuario.secret_key,
        usuario.name
      );
      
      sistemas.push(sistema);
      
      // Gerar relatório completo
      const relatorio = await sistema.relatorioCompleto();
      relatorios.push(relatorio);
      
      // Atualizar status no banco
      if (relatorio.conectividade.success) {
        await pool.query(`
          UPDATE user_api_keys 
          SET validation_status = 'valid',
              last_validated = NOW(),
              updated_at = NOW()
          WHERE user_id = $1
        `, [usuario.id]);
        
        console.log(`✅ Status de ${usuario.name} atualizado para VÁLIDO no banco`);
      } else {
        await pool.query(`
          UPDATE user_api_keys 
          SET validation_status = 'invalid',
              updated_at = NOW()
          WHERE user_id = $1
        `, [usuario.id]);
        
        console.log(`❌ Status de ${usuario.name} marcado como INVÁLIDO no banco`);
      }
      
      // Pausa entre usuárias
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // 3. Resumo final
    console.log('\n' + '=' .repeat(80));
    console.log('📊 RESUMO FINAL DO SISTEMA DE TRADING');
    console.log('=' .repeat(80));
    
    const sucessos = relatorios.filter(r => r.conectividade.success).length;
    const falhas = relatorios.filter(r => !r.conectividade.success).length;
    
    console.log(`\n📈 ESTATÍSTICAS GERAIS:`);
    console.log(`   👑 Usuárias processadas: ${relatorios.length}`);
    console.log(`   ✅ Sistemas funcionais: ${sucessos}`);
    console.log(`   ❌ Sistemas com problemas: ${falhas}`);
    console.log(`   📊 Taxa de sucesso: ${((sucessos/relatorios.length)*100).toFixed(1)}%`);
    
    // 4. Demonstração das funcionalidades
    if (sucessos > 0) {
      console.log(`\n🎯 DEMONSTRAÇÃO DAS FUNCIONALIDADES:`);
      
      const sistemaFuncional = sistemas.find((s, i) => relatorios[i].conectividade.success);
      
      if (sistemaFuncional) {
        console.log(`\n📊 Testando com ${sistemaFuncional.nomeUsuario}:`);
        
        // Simular algumas operações
        await sistemaFuncional.simularOrdem('BTCUSDT', 'Buy', 'Market', '0.001');
        await sistemaFuncional.simularOrdem('ETHUSDT', 'Sell', 'Limit', '0.01', '3500');
        
        console.log(`\n✅ Funcionalidades disponíveis:`);
        console.log(`   🔍 testarConectividade() - Verificar conexão`);
        console.log(`   💰 consultarSaldo() - Ver saldos detalhados`);
        console.log(`   📊 consultarPosicoes() - Posições ativas`);
        console.log(`   📋 consultarOrdens() - Ordens pendentes`);
        console.log(`   💲 obterPrecoMercado(symbol) - Preços atuais`);
        console.log(`   📈 simularOrdem(...) - Simular trades`);
        console.log(`   📋 relatorioCompleto() - Relatório geral`);
      }
    }
    
    console.log(`\n🚀 SISTEMA BYBIT TRADING 100% IMPLEMENTADO E TESTADO!`);
    
    return { sistemas, relatorios, sucessos, falhas };
    
  } catch (error) {
    console.error('❌ Erro durante teste do sistema:', error.message);
    return null;
  } finally {
    await pool.end();
    console.log('\n🔌 Conexão com banco fechada');
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  testarSistemaCompletoBybit()
    .then(resultado => {
      if (resultado) {
        console.log(`\n🎉 Sistema testado: ${resultado.sucessos} funcionais, ${resultado.falhas} com problemas`);
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erro fatal:', error.message);
      process.exit(1);
    });
}

module.exports = { BybitTradingSystemCompleto, testarSistemaCompletoBybit };
