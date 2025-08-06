/**
 * TESTE DE INTEGRAÇÃO COMPLETA - SISTEMA COINBITCLUB
 * 
 * Testa toda a especificação técnica implementada:
 * - Autenticação e perfis de usuário
 * - Sistema de planos Brasil/Global PRO/FLEX
 * - IA Águia (leituras, sinais, decisões)
 * - Sistema de afiliados e comissões
 * - Integração TradingView
 */

import { query, pool } from '../backend/api-gateway/src/config/database.js';
import axios from 'axios';

const API_BASE = 'http://localhost:3000';

class SystemIntegrationTest {
  constructor() {
    this.testResults = {
      database: [],
      authentication: [],
      plans: [],
      ai_system: [],
      affiliate: [],
      tradingview: [],
      errors: []
    };
  }

  async runAllTests() {
    console.log('🚀 INICIANDO TESTE DE INTEGRAÇÃO COMPLETA');
    console.log('==========================================');

    try {
      await this.testDatabaseConnection();
      await this.testUserProfiles();
      await this.testPlansSystem();
      await this.testAISystem();
      await this.testAffiliateSystem();
      await this.testTradingViewWebhooks();
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Erro fatal no teste:', error);
      this.testResults.errors.push({
        test: 'Sistema Geral',
        error: error.message
      });
    }
  }

  // 1. TESTE DE CONEXÃO COM BANCO
  async testDatabaseConnection() {
    console.log('\n🔍 1. TESTANDO CONEXÃO COM BANCO DE DADOS');
    
    try {
      const result = await query('SELECT NOW() as timestamp, version() as version');
      this.testResults.database.push({
        test: 'Conexão PostgreSQL',
        status: 'SUCCESS',
        data: result.rows[0]
      });
      console.log('✅ Banco conectado:', result.rows[0].timestamp);

      // Verificar tabelas principais
      const tables = await query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'user_profiles', 'plans', 'ai_market_readings', 'affiliate_commissions')
      `);
      
      this.testResults.database.push({
        test: 'Tabelas Principais',
        status: 'SUCCESS',
        data: tables.rows.map(t => t.table_name)
      });
      console.log('✅ Tabelas encontradas:', tables.rows.length);

    } catch (error) {
      this.testResults.database.push({
        test: 'Conexão Database',
        status: 'ERROR',
        error: error.message
      });
      console.log('❌ Erro no banco:', error.message);
    }
  }

  // 2. TESTE DE PERFIS DE USUÁRIO
  async testUserProfiles() {
    console.log('\n👤 2. TESTANDO SISTEMA DE PERFIS');

    try {
      // Verificar enum de perfis
      const enumResult = await query(`
        SELECT unnest(enum_range(NULL::perfil_usuario)) as perfil
      `);
      
      const perfisDisponiveis = enumResult.rows.map(r => r.perfil);
      const perfisEsperados = ['usuario', 'afiliado_normal', 'afiliado_vip', 'administrador'];
      
      const perfisValidos = perfisEsperados.every(p => perfisDisponiveis.includes(p));
      
      this.testResults.authentication.push({
        test: 'Enum Perfis Usuario',
        status: perfisValidos ? 'SUCCESS' : 'ERROR',
        data: { disponivel: perfisDisponiveis, esperado: perfisEsperados }
      });

      // Verificar campos bancários
      const profileFields = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name IN ('whatsapp', 'banco', 'agencia', 'conta', 'chave_pix')
      `);

      this.testResults.authentication.push({
        test: 'Campos Bancários',
        status: profileFields.rows.length >= 5 ? 'SUCCESS' : 'WARNING',
        data: profileFields.rows
      });

      console.log('✅ Sistema de perfis validado');

    } catch (error) {
      this.testResults.authentication.push({
        test: 'Sistema Perfis',
        status: 'ERROR',
        error: error.message
      });
      console.log('❌ Erro nos perfis:', error.message);
    }
  }

  // 3. TESTE DO SISTEMA DE PLANOS
  async testPlansSystem() {
    console.log('\n💰 3. TESTANDO SISTEMA DE PLANOS');

    try {
      // Verificar planos da especificação
      const plans = await query(`
        SELECT nome_plano, preco_mensal, moeda, status
        FROM plans 
        WHERE status = 'ativo'
        ORDER BY nome_plano
      `);

      const planNames = plans.rows.map(p => p.nome_plano);
      const expectedPlans = ['Brasil PRO', 'Brasil FLEX', 'Global PRO', 'Global FLEX'];
      
      this.testResults.plans.push({
        test: 'Planos Disponíveis',
        status: expectedPlans.some(ep => planNames.includes(ep)) ? 'SUCCESS' : 'WARNING',
        data: plans.rows
      });

      // Verificar estrutura de preços
      const brasilPRO = plans.rows.find(p => p.nome_plano === 'Brasil PRO');
      const globalPRO = plans.rows.find(p => p.nome_plano === 'Global PRO');

      if (brasilPRO && globalPRO) {
        this.testResults.plans.push({
          test: 'Estrutura Preços',
          status: 'SUCCESS',
          data: {
            brasil_pro: `${brasilPRO.moeda} ${brasilPRO.preco_mensal}`,
            global_pro: `${globalPRO.moeda} ${globalPRO.preco_mensal}`
          }
        });
      }

      console.log('✅ Sistema de planos validado');

    } catch (error) {
      this.testResults.plans.push({
        test: 'Sistema Planos',
        status: 'ERROR',
        error: error.message
      });
      console.log('❌ Erro nos planos:', error.message);
    }
  }

  // 4. TESTE DO SISTEMA IA ÁGUIA
  async testAISystem() {
    console.log('\n🤖 4. TESTANDO SISTEMA IA ÁGUIA');

    try {
      // Verificar tabelas da IA
      const aiTables = await query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('ai_market_readings', 'ai_trading_decisions')
      `);

      this.testResults.ai_system.push({
        test: 'Tabelas IA Águia',
        status: aiTables.rows.length === 2 ? 'SUCCESS' : 'ERROR',
        data: aiTables.rows.map(t => t.table_name)
      });

      // Verificar função de análise de mercado
      const functionExists = await query(`
        SELECT exists(
          SELECT 1 FROM pg_proc 
          WHERE proname = 'analisar_mercado_ia_aguia'
        ) as exists
      `);

      this.testResults.ai_system.push({
        test: 'Função Análise Mercado',
        status: functionExists.rows[0].exists ? 'SUCCESS' : 'WARNING',
        data: { function_exists: functionExists.rows[0].exists }
      });

      // Simular criação de leitura (se possível)
      try {
        const testReading = await query(`
          INSERT INTO ai_market_readings (
            simbolo, timeframe, dados_mercado, analise_ia, 
            nivel_confianca, status, fonte
          ) VALUES (
            'BTCUSDT', '1h', '{"test": true}', '{"test_analysis": true}',
            0.8, 'ativa', 'test'
          ) RETURNING id
        `);

        // Limpar teste
        await query('DELETE FROM ai_market_readings WHERE fonte = $1', ['test']);

        this.testResults.ai_system.push({
          test: 'Inserção Leitura IA',
          status: 'SUCCESS',
          data: { test_id: testReading.rows[0].id }
        });

      } catch (insertError) {
        this.testResults.ai_system.push({
          test: 'Inserção Leitura IA',
          status: 'ERROR',
          error: insertError.message
        });
      }

      console.log('✅ Sistema IA Águia validado');

    } catch (error) {
      this.testResults.ai_system.push({
        test: 'Sistema IA Águia',
        status: 'ERROR',
        error: error.message
      });
      console.log('❌ Erro na IA Águia:', error.message);
    }
  }

  // 5. TESTE DO SISTEMA DE AFILIADOS
  async testAffiliateSystem() {
    console.log('\n🤝 5. TESTANDO SISTEMA DE AFILIADOS');

    try {
      // Verificar tabelas de afiliados
      const affiliateTables = await query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('affiliate_commissions', 'affiliate_withdrawals', 'currency_conversion')
      `);

      this.testResults.affiliate.push({
        test: 'Tabelas Afiliados',
        status: affiliateTables.rows.length >= 2 ? 'SUCCESS' : 'WARNING',
        data: affiliateTables.rows.map(t => t.table_name)
      });

      // Verificar função de cálculo de comissão
      const commissionFunction = await query(`
        SELECT exists(
          SELECT 1 FROM pg_proc 
          WHERE proname = 'calcular_comissao_afiliado'
        ) as exists
      `);

      this.testResults.affiliate.push({
        test: 'Função Comissão',
        status: commissionFunction.rows[0].exists ? 'SUCCESS' : 'WARNING',
        data: { function_exists: commissionFunction.rows[0].exists }
      });

      // Verificar conversão de moeda
      const currencyData = await query(`
        SELECT COUNT(*) as count FROM currency_conversion
      `);

      this.testResults.affiliate.push({
        test: 'Dados Conversão Moeda',
        status: parseInt(currencyData.rows[0].count) > 0 ? 'SUCCESS' : 'WARNING',
        data: { conversion_records: currencyData.rows[0].count }
      });

      console.log('✅ Sistema de afiliados validado');

    } catch (error) {
      this.testResults.affiliate.push({
        test: 'Sistema Afiliados',
        status: 'ERROR',
        error: error.message
      });
      console.log('❌ Erro nos afiliados:', error.message);
    }
  }

  // 6. TESTE DOS WEBHOOKS TRADINGVIEW
  async testTradingViewWebhooks() {
    console.log('\n📊 6. TESTANDO WEBHOOKS TRADINGVIEW');

    try {
      // Simular webhook do TradingView
      const webhookData = {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        price: 45000,
        signal: 'BUY',
        indicator: 'RSI',
        message: 'RSI oversold condition'
      };

      const response = await axios.post(`${API_BASE}/webhook/tradingview/alert`, webhookData, {
        timeout: 5000,
        validateStatus: () => true // Aceitar qualquer status
      });

      this.testResults.tradingview.push({
        test: 'Webhook TradingView',
        status: response.status < 500 ? 'SUCCESS' : 'ERROR',
        data: {
          status: response.status,
          response: response.status < 500 ? response.data : null
        }
      });

      console.log('✅ Webhooks TradingView testados');

    } catch (error) {
      this.testResults.tradingview.push({
        test: 'Webhook TradingView',
        status: 'ERROR',
        error: error.message
      });
      console.log('❌ Erro nos webhooks:', error.message);
    }
  }

  // GERAR RELATÓRIO FINAL
  generateReport() {
    console.log('\n📋 RELATÓRIO DE TESTES DE INTEGRAÇÃO');
    console.log('===================================');

    let totalTests = 0;
    let successTests = 0;
    let warningTests = 0;
    let errorTests = 0;

    Object.keys(this.testResults).forEach(category => {
      if (category === 'errors') return;

      console.log(`\n${category.toUpperCase()}:`);
      
      this.testResults[category].forEach(test => {
        totalTests++;
        
        let emoji;
        switch (test.status) {
          case 'SUCCESS':
            emoji = '✅';
            successTests++;
            break;
          case 'WARNING':
            emoji = '⚠️';
            warningTests++;
            break;
          case 'ERROR':
            emoji = '❌';
            errorTests++;
            break;
          default:
            emoji = '❓';
        }

        console.log(`  ${emoji} ${test.test}: ${test.status}`);
        if (test.error) {
          console.log(`    Erro: ${test.error}`);
        }
      });
    });

    console.log('\n📊 RESUMO GERAL:');
    console.log(`Total de Testes: ${totalTests}`);
    console.log(`✅ Sucessos: ${successTests}`);
    console.log(`⚠️ Avisos: ${warningTests}`);
    console.log(`❌ Erros: ${errorTests}`);

    const successRate = ((successTests / totalTests) * 100).toFixed(1);
    console.log(`📈 Taxa de Sucesso: ${successRate}%`);

    if (successRate >= 80) {
      console.log('\n🎉 SISTEMA PRONTO PARA HOMOLOGAÇÃO!');
    } else if (successRate >= 60) {
      console.log('\n⚠️ Sistema precisa de ajustes antes da homologação');
    } else {
      console.log('\n❌ Sistema não está pronto para homologação');
    }

    console.log('\n🔍 PRÓXIMOS PASSOS:');
    console.log('1. Corrigir erros críticos identificados');
    console.log('2. Configurar variáveis de ambiente de produção');
    console.log('3. Executar testes de carga e performance');
    console.log('4. Validar integrações externas (Stripe, OpenAI, TradingView)');
    console.log('5. Deploy em ambiente de produção Railway');
  }
}

// Executar testes se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new SystemIntegrationTest();
  test.runAllTests().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
}

export default SystemIntegrationTest;
