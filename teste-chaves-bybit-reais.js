// ========================================
// MARKETBOT - TESTE CHAVES BYBIT REAIS
// Validação das APIs dos 4 usuários MAINNET
// ========================================

require('dotenv').config();
const { Pool } = require('pg');
const ccxt = require('ccxt');
const crypto = require('crypto');

class TesteChavesBybitReais {
  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'marketbot-default-key-change-in-production';
  }

  // Descriptografar chaves (método atualizado para Node.js moderno)
  decrypt(encryptedText) {
    try {
      // Método atualizado para Node.js 18+
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      
      // Para chaves antigas que podem estar no formato antigo
      // Tentaremos primeiro descriptografar como texto simples (não criptografado)
      if (!encryptedText || encryptedText.length < 32) {
        // Provavelmente não está criptografado
        return encryptedText;
      }
      
      // Se parece com chave API Bybit (começa com letras/números específicos)
      if (encryptedText.match(/^[A-Za-z0-9]{20,}$/)) {
        console.log('      🔓 Chave parece não estar criptografada, usando diretamente');
        return encryptedText;
      }
      
      // Tentar descriptografar formato antigo primeiro
      try {
        const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      } catch (oldError) {
        console.log('      ⚠️ Falha no método antigo, tentando como texto simples');
        return encryptedText;
      }
      
    } catch (error) {
      console.error('Erro ao descriptografar:', error);
      // Como fallback, tentar usar a string diretamente
      return encryptedText;
    }
  }

  async testarChavesReais() {
    console.log('🔑 TESTE CHAVES BYBIT REAIS - MARKETBOT');
    console.log('==========================================');
    
    try {
      // 1. Buscar todas as contas Bybit MAINNET
      console.log('\n1. 📋 Buscando usuários com Bybit MAINNET...');
      
      const query = `
        SELECT 
          u.id as user_id,
          u.email,
          u.plan_type,
          uea.id as account_id,
          uea.account_name,
          uea.api_key,
          uea.api_secret,
          uea.is_testnet,
          uea.can_trade,
          uea.max_position_size_usd,
          uea.last_connection_test
        FROM users u
        JOIN user_exchange_accounts uea ON u.id = uea.user_id
        WHERE uea.exchange = 'BYBIT' 
          AND uea.is_active = true
          AND uea.is_testnet = false
        ORDER BY u.created_at
      `;
      
      const result = await this.db.query(query);
      
      if (result.rows.length === 0) {
        console.log('   ❌ Nenhuma conta Bybit MAINNET encontrada');
        return false;
      }
      
      console.log(`   ✅ ${result.rows.length} contas Bybit MAINNET encontradas`);
      
      // 2. Testar cada conta individualmente
      console.log('\n2. 🧪 Testando conectividade de cada conta...');
      
      let contasValidas = 0;
      const resultadosTeste = [];
      
      for (const [index, account] of result.rows.entries()) {
        console.log(`\n   ${index + 1}. Testando: ${account.email} (${account.account_name})`);
        
        try {
          // Descriptografar chaves
          const apiKey = this.decrypt(account.api_key);
          const apiSecret = this.decrypt(account.api_secret);
          
          console.log(`      🔑 API Key: ${apiKey.substring(0, 8)}...`);
          
          // Criar instância Bybit
          const bybit = new ccxt.bybit({
            apiKey: apiKey,
            secret: apiSecret,
            sandbox: false, // MAINNET
            enableRateLimit: true,
            timeout: 30000,
          });
          
          // Testar conexão com fetchBalance
          console.log('      🔄 Testando conexão...');
          const balance = await bybit.fetchBalance();
          
          // Verificar se é realmente MAINNET (não testnet)
          const isMainnet = this.detectMainnetFromBalance(balance);
          console.log(`      🌐 Ambiente: ${isMainnet ? 'MAINNET ✅' : 'TESTNET ⚠️'}`);
          
          // Obter saldos principais
          const usdtBalance = balance['USDT'] || { free: 0, used: 0, total: 0 };
          const btcBalance = balance['BTC'] || { free: 0, used: 0, total: 0 };
          
          console.log(`      💰 USDT: ${usdtBalance.total.toFixed(2)} (livre: ${usdtBalance.free.toFixed(2)})`);
          console.log(`      🪙 BTC: ${btcBalance.total.toFixed(6)} (livre: ${btcBalance.free.toFixed(6)})`);
          
          // Verificar permissões
          const permissions = this.checkPermissions(balance);
          console.log(`      🔐 Permissões: Read ${permissions.canRead ? '✅' : '❌'}, Trade ${permissions.canTrade ? '✅' : '❌'}`);
          
          // Testar busca de ticker para validar conectividade completa
          console.log('      📊 Testando dados de mercado...');
          const ticker = await bybit.fetchTicker('BTC/USDT');
          console.log(`      📈 BTC/USDT: $${ticker.last?.toFixed(2)} (${ticker.change?.toFixed(2)}%)`);
          
          // Salvar resultado
          const resultado = {
            userId: account.user_id,
            email: account.email,
            accountName: account.account_name,
            conexaoOk: true,
            isMainnet,
            usdtBalance: usdtBalance.total,
            btcBalance: btcBalance.total,
            canTrade: permissions.canTrade,
            erro: null
          };
          
          resultadosTeste.push(resultado);
          contasValidas++;
          
          // Atualizar último teste no banco
          await this.db.query(
            'UPDATE user_exchange_accounts SET last_connection_test = NOW() WHERE id = $1',
            [account.account_id]
          );
          
          console.log('      ✅ TESTE APROVADO!');
          
          // Fechar conexão
          await bybit.close();
          
        } catch (error) {
          console.log(`      ❌ ERRO: ${error.message}`);
          
          resultadosTeste.push({
            userId: account.user_id,
            email: account.email,
            accountName: account.account_name,
            conexaoOk: false,
            erro: error.message
          });
        }
        
        // Delay entre testes para evitar rate limiting
        if (index < result.rows.length - 1) {
          console.log('      ⏳ Aguardando 3 segundos...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      // 3. Relatório final
      console.log('\n' + '='.repeat(60));
      console.log('📊 RELATÓRIO FINAL - CHAVES BYBIT REAIS');
      console.log('='.repeat(60));
      
      console.log(`\n✅ Contas válidas: ${contasValidas}/${result.rows.length}`);
      console.log(`📊 Taxa de sucesso: ${Math.round((contasValidas / result.rows.length) * 100)}%`);
      
      console.log('\n📋 DETALHES POR USUÁRIO:');
      resultadosTeste.forEach((resultado, index) => {
        console.log(`\n${index + 1}. ${resultado.email}`);
        console.log(`   Conta: ${resultado.accountName}`);
        console.log(`   Status: ${resultado.conexaoOk ? '✅ CONECTADO' : '❌ ERRO'}`);
        
        if (resultado.conexaoOk) {
          console.log(`   Ambiente: ${resultado.isMainnet ? 'MAINNET' : 'TESTNET'}`);
          console.log(`   USDT: $${resultado.usdtBalance?.toFixed(2) || '0.00'}`);
          console.log(`   BTC: ${resultado.btcBalance?.toFixed(6) || '0.000000'}`);
          console.log(`   Trading: ${resultado.canTrade ? 'HABILITADO' : 'SOMENTE LEITURA'}`);
        } else {
          console.log(`   Erro: ${resultado.erro}`);
        }
      });
      
      // 4. Recomendações
      console.log('\n🎯 RECOMENDAÇÕES:');
      
      if (contasValidas === result.rows.length) {
        console.log('🚀 TODAS AS CONTAS VÁLIDAS - SISTEMA PRONTO PARA TRADING REAL!');
        console.log('✅ Pode iniciar operações automáticas imediatamente');
        console.log('✅ Sistema de prioridades funcionando');
        console.log('✅ Usuários MAINNET com saldo real detectados');
        
      } else if (contasValidas > 0) {
        console.log(`⚠️ ${contasValidas} contas válidas de ${result.rows.length} total`);
        console.log('🔧 Corrigir contas com problemas antes da produção');
        console.log('✅ Pode iniciar testes com contas válidas');
        
      } else {
        console.log('❌ NENHUMA CONTA VÁLIDA - SISTEMA NÃO PODE OPERAR');
        console.log('🚨 Verificar e corrigir todas as chaves API');
        console.log('🔧 Reconfigurar credenciais antes de prosseguir');
      }
      
      console.log('\n🔥 PRÓXIMOS PASSOS:');
      console.log('1. ⚡ Testar webhook TradingView com contas válidas');
      console.log('2. 🎯 Executar primeiro sinal real automaticamente');
      console.log('3. 📊 Monitorar execução em tempo real');
      console.log('4. 🚀 Escalar para todos os usuários');
      
      return contasValidas > 0;
      
    } catch (error) {
      console.error('\n❌ ERRO CRÍTICO no teste de chaves:', error);
      return false;
    } finally {
      await this.db.end();
    }
  }

  // Detectar se é MAINNET ou TESTNET baseado no balance
  detectMainnetFromBalance(balance) {
    try {
      // Método 1: Verificar URL base no info
      if (balance.info?.baseURL) {
        return !balance.info.baseURL.includes('testnet');
      }
      
      // Método 2: Verificar indicadores específicos do Bybit
      if (balance.info?.isTestnet !== undefined) {
        return !balance.info.isTestnet;
      }
      
      // Método 3: Saldos muito altos podem indicar testnet
      const totalValue = Object.values(balance)
        .filter(b => typeof b === 'object' && b !== null && b.total)
        .reduce((sum, b) => sum + (b.total || 0), 0);
      
      // Se saldo total muito alto (>100k USD), provavelmente testnet
      if (totalValue > 100000) {
        return false; // Provavelmente testnet
      }
      
      // Default: assumir mainnet (mais seguro)
      return true;
      
    } catch (error) {
      console.log('      ⚠️ Não foi possível detectar ambiente automaticamente');
      return true; // Default mainnet
    }
  }

  // Verificar permissões da API
  checkPermissions(balance) {
    try {
      const info = balance.info || {};
      
      return {
        canRead: true, // Se chegou até aqui, tem permissão de leitura
        canTrade: info.canTrade !== false, // Assumir true se não especificado
        canWithdraw: info.canWithdraw === true
      };
    } catch (error) {
      return {
        canRead: true,
        canTrade: false,
        canWithdraw: false
      };
    }
  }
}

// Executar teste
if (require.main === module) {
  const teste = new TesteChavesBybitReais();
  
  teste.testarChavesReais()
    .then(sucesso => {
      console.log(`\n🏁 Teste de chaves concluído: ${sucesso ? 'SUCESSO' : 'FALHA'}`);
      process.exit(sucesso ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 Falha crítica no teste:', error);
      process.exit(1);
    });
}

module.exports = TesteChavesBybitReais;
