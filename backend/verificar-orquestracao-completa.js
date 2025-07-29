const { Pool } = require('pg');
const fs = require('fs');
const https = require('https');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Cores para console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(colors[color] + message + colors.reset);
}

async function verificarOrquestracaoCompleta() {
  log('🔍 VERIFICAÇÃO COMPLETA DE ORQUESTRAÇÃO DE SERVIÇOS', 'cyan');
  log('=' .repeat(60), 'cyan');
  
  const resultados = {
    database: { status: false, detalhes: [] },
    services: { status: false, detalhes: [] },
    integrations: { status: false, detalhes: [] },
    processes: { status: false, detalhes: [] },
    automation: { status: false, detalhes: [] }
  };

  try {
    // 1. VERIFICAÇÃO DO BANCO DE DADOS
    log('\n📊 1. VERIFICAÇÃO DO BANCO DE DADOS', 'blue');
    
    const dbTests = [
      {
        name: 'Conexão principal',
        query: 'SELECT NOW() as timestamp, version() as version'
      },
      {
        name: 'Tabela usuario_configuracoes',
        query: 'SELECT COUNT(*) as count FROM usuario_configuracoes'
      },
      {
        name: 'Usuários ativos',
        query: 'SELECT COUNT(*) as count FROM users WHERE is_active = true'
      },
      {
        name: 'Operações em andamento',
        query: 'SELECT COUNT(*) as count FROM operations WHERE status = \'OPEN\''
      },
      {
        name: 'Logs de sistema recentes',
        query: 'SELECT COUNT(*) as count FROM ai_logs WHERE created_at > NOW() - INTERVAL \'1 hour\''
      }
    ];

    for (const test of dbTests) {
      try {
        const result = await pool.query(test.query);
        const value = result.rows[0];
        log(`  ✅ ${test.name}: ${JSON.stringify(value)}`, 'green');
        resultados.database.detalhes.push({ test: test.name, status: true, value });
      } catch (error) {
        log(`  ❌ ${test.name}: ${error.message}`, 'red');
        resultados.database.detalhes.push({ test: test.name, status: false, error: error.message });
      }
    }
    
    resultados.database.status = resultados.database.detalhes.every(d => d.status);

    // 2. VERIFICAÇÃO DE ARQUIVOS DE SERVIÇOS
    log('\n🛠️  2. VERIFICAÇÃO DE ARQUIVOS DE SERVIÇOS', 'blue');
    
    const servicosEssenciais = [
      { arquivo: 'sistema-webhook-automatico.js', descricao: 'Sistema Webhook Principal (Port 3000)' },
      { arquivo: 'central-indicadores-final.js', descricao: 'Central de Indicadores (Port 3003)' },
      { arquivo: 'gestor-comissionamento-final.js', descricao: 'Gestor de Comissionamento' },
      { arquivo: 'monitor-inteligente-operacoes.js', descricao: 'Monitor de Operações' },
      { arquivo: 'usuario-configuracoes-tp-sl.js', descricao: 'Configurações TP/SL' },
      { arquivo: 'auditoria-completa-sistema.js', descricao: 'Sistema de Auditoria' }
    ];

    for (const servico of servicosEssenciais) {
      try {
        if (fs.existsSync(servico.arquivo)) {
          const stats = fs.statSync(servico.arquivo);
          const tamanho = (stats.size / 1024).toFixed(2);
          log(`  ✅ ${servico.descricao}: ${tamanho}KB`, 'green');
          resultados.services.detalhes.push({ 
            servico: servico.arquivo, 
            status: true, 
            tamanho: `${tamanho}KB`,
            modificado: stats.mtime.toISOString()
          });
        } else {
          log(`  ❌ ${servico.descricao}: Arquivo não encontrado`, 'red');
          resultados.services.detalhes.push({ servico: servico.arquivo, status: false, erro: 'Arquivo não encontrado' });
        }
      } catch (error) {
        log(`  ❌ ${servico.descricao}: ${error.message}`, 'red');
        resultados.services.detalhes.push({ servico: servico.arquivo, status: false, erro: error.message });
      }
    }
    
    resultados.services.status = resultados.services.detalhes.every(d => d.status);

    // 3. VERIFICAÇÃO DE INTEGRAÇÕES EXTERNAS
    log('\n🌐 3. VERIFICAÇÃO DE INTEGRAÇÕES EXTERNAS', 'blue');
    
    // Teste Fear & Greed API
    await new Promise((resolve) => {
      const req = https.get('https://api.alternative.me/fng/', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.data && json.data[0] && json.data[0].value) {
              log(`  ✅ Fear & Greed API: Valor atual ${json.data[0].value} (${json.data[0].value_classification})`, 'green');
              resultados.integrations.detalhes.push({ 
                api: 'Fear & Greed', 
                status: true, 
                valor: json.data[0].value,
                classificacao: json.data[0].value_classification
              });
            } else {
              log(`  ⚠️  Fear & Greed API: Resposta inválida`, 'yellow');
              resultados.integrations.detalhes.push({ api: 'Fear & Greed', status: false, erro: 'Resposta inválida' });
            }
          } catch (error) {
            log(`  ❌ Fear & Greed API: ${error.message}`, 'red');
            resultados.integrations.detalhes.push({ api: 'Fear & Greed', status: false, erro: error.message });
          }
          resolve();
        });
      });
      
      req.on('error', (error) => {
        log(`  ❌ Fear & Greed API: ${error.message}`, 'red');
        resultados.integrations.detalhes.push({ api: 'Fear & Greed', status: false, erro: error.message });
        resolve();
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        log(`  ❌ Fear & Greed API: Timeout`, 'red');
        resultados.integrations.detalhes.push({ api: 'Fear & Greed', status: false, erro: 'Timeout' });
        resolve();
      });
    });

    // Verificar variáveis de ambiente essenciais
    const envVars = ['DATABASE_URL', 'NODE_ENV'];
    for (const envVar of envVars) {
      if (process.env[envVar]) {
        log(`  ✅ Variável ${envVar}: Configurada`, 'green');
        resultados.integrations.detalhes.push({ tipo: 'env', nome: envVar, status: true });
      } else {
        log(`  ⚠️  Variável ${envVar}: Não configurada`, 'yellow');
        resultados.integrations.detalhes.push({ tipo: 'env', nome: envVar, status: false });
      }
    }
    
    resultados.integrations.status = resultados.integrations.detalhes.filter(d => d.status).length >= 2;

    // 4. VERIFICAÇÃO DE PROCESSOS AUTOMÁTICOS
    log('\n⚙️  4. VERIFICAÇÃO DE PROCESSOS AUTOMÁTICOS', 'blue');
    
    // Verificar logs recentes para evidência de processos
    const processChecks = [
      {
        name: 'Processamento de sinais',
        query: `SELECT COUNT(*) as count FROM signals WHERE created_at > NOW() - INTERVAL '24 hours'`
      },
      {
        name: 'Monitoramento IA',
        query: `SELECT COUNT(*) as count FROM ai_logs WHERE action_type = 'MONITOR' AND created_at > NOW() - INTERVAL '1 hour'`
      },
      {
        name: 'Comissionamento automático',
        query: `SELECT COUNT(*) as count FROM commissions WHERE created_at > NOW() - INTERVAL '7 days'`
      },
      {
        name: 'Webhook logs',
        query: `SELECT COUNT(*) as count FROM webhook_logs WHERE created_at > NOW() - INTERVAL '24 hours'`
      }
    ];

    for (const check of processChecks) {
      try {
        const result = await pool.query(check.query);
        const count = parseInt(result.rows[0].count);
        if (count > 0) {
          log(`  ✅ ${check.name}: ${count} eventos nas últimas horas`, 'green');
          resultados.processes.detalhes.push({ processo: check.name, status: true, eventos: count });
        } else {
          log(`  ⚠️  ${check.name}: Nenhum evento recente`, 'yellow');
          resultados.processes.detalhes.push({ processo: check.name, status: false, eventos: 0 });
        }
      } catch (error) {
        log(`  ❌ ${check.name}: ${error.message}`, 'red');
        resultados.processes.detalhes.push({ processo: check.name, status: false, erro: error.message });
      }
    }
    
    resultados.processes.status = resultados.processes.detalhes.filter(d => d.status).length >= 1;

    // 5. VERIFICAÇÃO DE AUTOMAÇÃO E ORQUESTRAÇÃO
    log('\n🤖 5. VERIFICAÇÃO DE AUTOMAÇÃO E ORQUESTRAÇÃO', 'blue');
    
    // Verificar estrutura de tabelas críticas
    const tabelasCriticas = [
      'users', 'operations', 'signals', 'commissions', 'affiliates', 
      'usuario_configuracoes', 'ai_logs', 'webhook_logs'
    ];
    
    for (const tabela of tabelasCriticas) {
      try {
        const result = await pool.query(`
          SELECT 
            COUNT(*) as registros,
            (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = $1) as colunas
          FROM ${tabela}
        `, [tabela]);
        
        const { registros, colunas } = result.rows[0];
        log(`  ✅ Tabela ${tabela}: ${registros} registros, ${colunas} colunas`, 'green');
        resultados.automation.detalhes.push({ 
          tabela, 
          status: true, 
          registros: parseInt(registros), 
          colunas: parseInt(colunas) 
        });
      } catch (error) {
        log(`  ❌ Tabela ${tabela}: ${error.message}`, 'red');
        resultados.automation.detalhes.push({ tabela, status: false, erro: error.message });
      }
    }
    
    resultados.automation.status = resultados.automation.detalhes.every(d => d.status);

    // RELATÓRIO FINAL
    log('\n📋 RELATÓRIO FINAL DE ORQUESTRAÇÃO', 'cyan');
    log('=' .repeat(60), 'cyan');
    
    const statusGeral = Object.values(resultados).every(r => r.status);
    
    log(`🗄️  Banco de Dados: ${resultados.database.status ? '✅ OK' : '❌ FALHA'}`, 
        resultados.database.status ? 'green' : 'red');
    log(`🛠️  Serviços: ${resultados.services.status ? '✅ OK' : '❌ FALHA'}`, 
        resultados.services.status ? 'green' : 'red');
    log(`🌐 Integrações: ${resultados.integrations.status ? '✅ OK' : '❌ FALHA'}`, 
        resultados.integrations.status ? 'green' : 'red');
    log(`⚙️  Processos: ${resultados.processes.status ? '✅ OK' : '⚠️  VERIFICAR'}`, 
        resultados.processes.status ? 'green' : 'yellow');
    log(`🤖 Automação: ${resultados.automation.status ? '✅ OK' : '❌ FALHA'}`, 
        resultados.automation.status ? 'green' : 'red');
    
    log(`\n🎯 STATUS GERAL: ${statusGeral ? '✅ SISTEMA COMPLETAMENTE ORQUESTRADO' : '⚠️  NECESSITA ATENÇÃO'}`, 
        statusGeral ? 'green' : 'yellow');

    // Salvar relatório detalhado
    const relatorio = {
      timestamp: new Date().toISOString(),
      status_geral: statusGeral,
      categorias: resultados,
      resumo: {
        database_ok: resultados.database.status,
        services_ok: resultados.services.status,
        integrations_ok: resultados.integrations.status,
        processes_ok: resultados.processes.status,
        automation_ok: resultados.automation.status
      }
    };
    
    fs.writeFileSync('relatorio-orquestracao-final.json', JSON.stringify(relatorio, null, 2));
    log('\n💾 Relatório detalhado salvo em: relatorio-orquestracao-final.json', 'cyan');

    if (statusGeral) {
      log('\n🎉 SUCESSO: Todos os serviços estão adequadamente orquestrados!', 'green');
      log('   Sistema operando com automação completa.', 'green');
    } else {
      log('\n⚠️  ATENÇÃO: Alguns componentes precisam de verificação.', 'yellow');
      log('   Consulte o relatório detalhado para mais informações.', 'yellow');
    }

  } catch (error) {
    log(`\n❌ ERRO CRÍTICO: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await pool.end();
    log('\n🔚 Verificação concluída.', 'white');
  }
}

// Executar verificação
verificarOrquestracaoCompleta().catch(console.error);
