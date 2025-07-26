// 🔍 VERIFICAÇÃO COMPLETA DE VARIÁVEIS DE AMBIENTE PARA PRODUÇÃO
// ================================================================

// Verificar qual banco está sendo usado atualmente
const currentUrl = process.env.DATABASE_URL || 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway';

console.log('🔍 VERIFICAÇÃO COMPLETA DE AMBIENTE DE PRODUÇÃO');
console.log('===============================================');
console.log('🌐 Frontend Vercel: https://github.com/coinbitclub/coinbitclub-market-bot.git');
console.log('🚀 Backend Railway: https://coinbitclub-market-bot-v3.up.railway.app');
console.log('🗄️ Banco PostgreSQL:', currentUrl.substring(0, 50) + '...');
console.log('');

// =====================================================================
// VARIÁVEIS OBRIGATÓRIAS PARA PRODUÇÃO
// =====================================================================

const requiredVariables = {
  // 🔐 SEGURANÇA & AUTENTICAÇÃO
  security: {
    JWT_SECRET: {
      required: true,
      description: 'Chave secreta para JWT tokens',
      example: 'VictoreLais2025CoinBitClub_SuperSecretKey_2025!',
      current: process.env.JWT_SECRET,
      minLength: 32
    },
    ADMIN_TOKEN: {
      required: true,
      description: 'Token de acesso administrativo',
      example: 'COINBITCLUB_SUPERADMIN_2024',
      current: process.env.ADMIN_TOKEN
    },
    WEBHOOK_TOKEN: {
      required: true,
      description: 'Token para webhooks TradingView',
      example: '210406',
      current: process.env.WEBHOOK_TOKEN
    },
    SESSION_SECRET: {
      required: false,
      description: 'Chave para sessões (se usado)',
      current: process.env.SESSION_SECRET
    }
  },

  // 🗄️ BANCO DE DADOS
  database: {
    DATABASE_URL: {
      required: true,
      description: 'URL completa do PostgreSQL',
      example: 'postgresql://postgres:password@host:port/database',
      current: process.env.DATABASE_URL
    },
    DATABASE_SSL: {
      required: true,
      description: 'SSL obrigatório no Railway',
      example: 'true',
      current: process.env.DATABASE_SSL
    }
  },

  // 💳 STRIPE PAYMENT SYSTEM
  stripe: {
    STRIPE_SECRET_KEY: {
      required: true,
      description: 'Chave secreta do Stripe (PRODUÇÃO)',
      example: 'sk_live_...',
      current: process.env.STRIPE_SECRET_KEY,
      isLive: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')
    },
    STRIPE_PUBLISHABLE_KEY: {
      required: true,
      description: 'Chave pública do Stripe (PRODUÇÃO)',
      example: 'pk_live_...',
      current: process.env.STRIPE_PUBLISHABLE_KEY,
      isLive: process.env.STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_')
    },
    STRIPE_WEBHOOK_SECRET: {
      required: true,
      description: 'Secret do webhook Stripe',
      example: 'whsec_...',
      current: process.env.STRIPE_WEBHOOK_SECRET
    },
    STRIPE_SUCCESS_URL: {
      required: true,
      description: 'URL de sucesso pós-pagamento',
      example: 'https://frontend.vercel.app/sucesso?session_id={CHECKOUT_SESSION_ID}',
      current: process.env.STRIPE_SUCCESS_URL
    },
    STRIPE_CANCEL_URL: {
      required: true,
      description: 'URL de cancelamento de pagamento',
      example: 'https://frontend.vercel.app/cancelado',
      current: process.env.STRIPE_CANCEL_URL
    }
  },

  // 🤖 INTELIGÊNCIA ARTIFICIAL
  ai: {
    OPENAI_API_KEY: {
      required: true,
      description: 'Chave da API OpenAI para análises IA',
      example: 'sk-proj-... ou sk-svcacct-...',
      current: process.env.OPENAI_API_KEY
    },
    USE_REAL_AI: {
      required: true,
      description: 'Usar IA real em produção',
      example: 'true',
      current: process.env.USE_REAL_AI
    }
  },

  // 📊 APIS DE TRADING
  trading: {
    COINSTATS_API_KEY: {
      required: true,
      description: 'API para dados de mercado',
      example: 'ZFIxigBcVaCyXDL1Qp...',
      current: process.env.COINSTATS_API_KEY
    },
    BYBIT_BASE_URL_REAL: {
      required: true,
      description: 'URL da API Bybit produção',
      example: 'https://api.bybit.com',
      current: process.env.BYBIT_BASE_URL_REAL
    },
    BYBIT_BASE_URL_TEST: {
      required: true,
      description: 'URL da API Bybit teste',
      example: 'https://api-testnet.bybit.com',
      current: process.env.BYBIT_BASE_URL_TEST
    },
    BINANCE_API_BASE: {
      required: true,
      description: 'URL da API Binance produção',
      example: 'https://api.binance.com',
      current: process.env.BINANCE_API_BASE
    },
    BINANCE_API_BASE_TEST: {
      required: true,
      description: 'URL da API Binance teste',
      example: 'https://testnet.binance.vision',
      current: process.env.BINANCE_API_BASE_TEST
    }
  },

  // 📧 NOTIFICAÇÕES
  notifications: {
    ZAPI_INSTANCE: {
      required: true,
      description: 'Instância WhatsApp Zapi',
      example: '3E0819291FB89055AED996E82C2DBF10',
      current: process.env.ZAPI_INSTANCE
    },
    ZAPI_TOKEN: {
      required: true,
      description: 'Token WhatsApp Zapi',
      example: '2ECE7BD31B3B8E299FC68D6C',
      current: process.env.ZAPI_TOKEN
    }
  },

  // 🔧 CONFIGURAÇÕES DO SERVIDOR
  server: {
    NODE_ENV: {
      required: true,
      description: 'Ambiente de execução',
      example: 'production',
      current: process.env.NODE_ENV,
      expectedValue: 'production'
    },
    PORT: {
      required: false,
      description: 'Porta do servidor (Railway define automaticamente)',
      example: '3000',
      current: process.env.PORT
    }
  },

  // 👤 ADMIN DASHBOARD
  admin: {
    DASHBOARD_USER: {
      required: true,
      description: 'Usuário admin do dashboard',
      example: 'erica.andrade.santos@hotmail.com',
      current: process.env.DASHBOARD_USER
    },
    DASHBOARD_PASS: {
      required: true,
      description: 'Senha admin do dashboard',
      example: 'Apelido22@',
      current: process.env.DASHBOARD_PASS,
      sensitive: true
    }
  },

  // 🌐 FRONTEND INTEGRATION
  frontend: {
    REACT_APP_API_URL: {
      required: true,
      description: 'URL da API para o frontend',
      example: 'https://coinbitclub-market-bot-v3.up.railway.app',
      current: process.env.REACT_APP_API_URL
    },
    CORS_ORIGIN: {
      required: false,
      description: 'URLs permitidas para CORS',
      example: 'https://coinbitclub-market-bot.vercel.app',
      current: process.env.CORS_ORIGIN
    }
  }
};

// =====================================================================
// VERIFICAÇÃO E RELATÓRIO
// =====================================================================

function checkEnvironmentVariables() {
  let totalVariables = 0;
  let configuredVariables = 0;
  let missingCritical = [];
  let warnings = [];
  let recommendations = [];

  console.log('📋 ANÁLISE DETALHADA POR CATEGORIA:');
  console.log('===================================');

  for (const [category, variables] of Object.entries(requiredVariables)) {
    console.log(`\n🔸 ${category.toUpperCase()}`);
    console.log('─'.repeat(50));

    for (const [varName, config] of Object.entries(variables)) {
      totalVariables++;
      const isConfigured = !!config.current;
      
      if (isConfigured) {
        configuredVariables++;
        
        // Verificações específicas
        if (config.minLength && config.current.length < config.minLength) {
          warnings.push(`⚠️ ${varName}: muito curta (mín. ${config.minLength} chars)`);
        }
        
        if (config.expectedValue && config.current !== config.expectedValue) {
          warnings.push(`⚠️ ${varName}: valor esperado '${config.expectedValue}', atual '${config.current}'`);
        }

        if (config.isLive !== undefined && !config.isLive && category === 'stripe') {
          warnings.push(`⚠️ ${varName}: usando chave de TESTE em produção!`);
        }

        console.log(`  ✅ ${varName}: ${config.sensitive ? '***' : config.current}`);
      } else {
        if (config.required) {
          missingCritical.push(varName);
          console.log(`  ❌ ${varName}: NÃO CONFIGURADA (OBRIGATÓRIA)`);
        } else {
          console.log(`  ⚪ ${varName}: não configurada (opcional)`);
        }
      }
      
      console.log(`     📝 ${config.description}`);
      if (!isConfigured) {
        console.log(`     💡 Exemplo: ${config.example}`);
      }
    }
  }

  // =====================================================================
  // VERIFICAÇÕES ESPECÍFICAS DE INTEGRAÇÃO
  // =====================================================================

  console.log('\n🔗 VERIFICAÇÕES DE INTEGRAÇÃO:');
  console.log('==============================');

  // Verificar se Stripe está em modo de produção
  const isStripeProduction = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') && 
                            process.env.STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_');
  
  if (isStripeProduction) {
    console.log('  ✅ Stripe: Configurado para PRODUÇÃO');
  } else {
    console.log('  ⚠️ Stripe: Usando chaves de TESTE');
    warnings.push('Stripe configurado para teste - verifique se é intencional');
  }

  // Verificar URLs do frontend
  const frontendUrl = process.env.REACT_APP_API_URL || process.env.STRIPE_SUCCESS_URL;
  if (frontendUrl?.includes('vercel.app')) {
    console.log('  ✅ Frontend: Detectado Vercel deployment');
  } else if (frontendUrl?.includes('localhost')) {
    console.log('  ⚠️ Frontend: URLs apontando para localhost');
    warnings.push('URLs do frontend apontando para desenvolvimento');
  }

  // Verificar banco de dados atual
  if (process.env.DATABASE_URL?.includes('maglev.proxy.rlwy.net:42095')) {
    console.log('  ✅ Banco: Conectado ao novo banco migrado');
  } else {
    console.log('  ⚠️ Banco: Pode estar usando banco antigo');
    warnings.push('Verificar se está usando o banco migrado correto');
  }

  // =====================================================================
  // RELATÓRIO FINAL
  // =====================================================================

  console.log('\n📊 RELATÓRIO FINAL:');
  console.log('===================');
  console.log(`✅ Configuradas: ${configuredVariables}/${totalVariables} (${Math.round(configuredVariables/totalVariables*100)}%)`);
  console.log(`❌ Faltando: ${missingCritical.length} críticas`);
  console.log(`⚠️ Avisos: ${warnings.length}`);

  if (missingCritical.length === 0) {
    console.log('\n🎉 SISTEMA PRONTO PARA PRODUÇÃO!');
    console.log('✅ Todas as variáveis críticas estão configuradas');
  } else {
    console.log('\n🚨 VARIÁVEIS CRÍTICAS FALTANDO:');
    missingCritical.forEach(varName => {
      console.log(`  ❌ ${varName}`);
    });
  }

  if (warnings.length > 0) {
    console.log('\n⚠️ AVISOS E RECOMENDAÇÕES:');
    warnings.forEach(warning => {
      console.log(`  ${warning}`);
    });
  }

  // =====================================================================
  // COMANDOS RAILWAY PARA CONFIGURAÇÃO
  // =====================================================================

  if (missingCritical.length > 0) {
    console.log('\n🔧 COMANDOS PARA CONFIGURAR VARIÁVEIS FALTANDO:');
    console.log('===============================================');
    
    missingCritical.forEach(varName => {
      const config = Object.values(requiredVariables)
        .flatMap(cat => Object.entries(cat))
        .find(([name]) => name === varName)?.[1];
      
      if (config) {
        console.log(`railway variables set "${varName}=${config.example}"`);
      }
    });
  }

  // =====================================================================
  // VERIFICAÇÕES DE ENDPOINT
  // =====================================================================

  console.log('\n🌐 ENDPOINTS PARA TESTE:');
  console.log('========================');
  console.log('🏥 Health Check: https://coinbitclub-market-bot-v3.up.railway.app/health');
  console.log('📊 API Data: https://coinbitclub-market-bot-v3.up.railway.app/api/data');
  console.log('📡 Webhook TradingView: https://coinbitclub-market-bot-v3.up.railway.app/api/webhooks/tradingview');
  console.log('💳 Stripe Webhook: https://coinbitclub-market-bot-v3.up.railway.app/api/stripe/webhook');
  console.log('👤 Admin: https://coinbitclub-market-bot-v3.up.railway.app/admin');

  return {
    totalVariables,
    configuredVariables,
    missingCritical,
    warnings,
    isProductionReady: missingCritical.length === 0
  };
}

// =====================================================================
// VERIFICAÇÕES ESPECÍFICAS DO SISTEMA
// =====================================================================

async function checkSystemHealth() {
  console.log('\n🏥 VERIFICAÇÃO DE SAÚDE DO SISTEMA:');
  console.log('===================================');

  // Verificar conexão com banco
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    const result = await client.query('SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema = $1', ['public']);
    const tableCount = result.rows[0].tables;
    
    console.log(`✅ Banco de dados: ${tableCount} tabelas encontradas`);
    
    client.release();
    await pool.end();
  } catch (error) {
    console.log(`❌ Banco de dados: Erro de conexão - ${error.message}`);
  }

  // Verificar serviços principais
  const services = [
    { name: 'API Gateway', path: '/health' },
    { name: 'Trading Data', path: '/api/data?test=true' },
    { name: 'Webhook TradingView', path: '/api/webhooks/tradingview', method: 'POST' }
  ];

  console.log('\n🔧 Status dos Serviços:');
  for (const service of services) {
    console.log(`  📡 ${service.name}: Configurado para testar`);
  }
}

// =====================================================================
// EXECUTAR VERIFICAÇÃO
// =====================================================================

if (require.main === module) {
  console.log('🚀 Iniciando verificação completa...\n');
  
  const result = checkEnvironmentVariables();
  
  checkSystemHealth().then(() => {
    console.log('\n' + '='.repeat(60));
    
    if (result.isProductionReady) {
      console.log('🎉 SISTEMA 100% PRONTO PARA PRODUÇÃO!');
      console.log('✅ Todas as configurações necessárias estão definidas');
      console.log('🚀 Pode fazer deploy com segurança');
    } else {
      console.log('🚨 SISTEMA NÃO ESTÁ PRONTO PARA PRODUÇÃO');
      console.log(`❌ ${result.missingCritical.length} variáveis críticas faltando`);
      console.log('🔧 Configure as variáveis faltando antes do deploy');
    }
    
    console.log('\n💡 Próximos passos:');
    console.log('  1. Configure as variáveis faltando');
    console.log('  2. Execute: railway deploy');
    console.log('  3. Teste todos os endpoints');
    console.log('  4. Configure webhooks do TradingView');
    console.log('  5. Teste o sistema completo');
  });
}

module.exports = { checkEnvironmentVariables, checkSystemHealth };
