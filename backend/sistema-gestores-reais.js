const { Pool } = require('pg');
const WebSocket = require('ws');
const EventEmitter = require('events');

// Sistema de Gestores Reais CoinBitClub
class SistemaGestoresReais extends EventEmitter {
  constructor() {
    super();
    
    this.pool = new Pool({
      connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway'
    });
    
    this.gestores = new Map();
    this.ativo = false;
    this.intervalos = new Map();
    
    this.inicializarGestores();
  }

  async inicializarGestores() {
    console.log('🚀 Inicializando Sistema de Gestores Reais...');
    
    // Criar gestores reais no banco se não existirem
    await this.criarGestoresNoBanco();
    
    // Inicializar cada gestor
    this.gestores.set('signals_manager', new GestorSinais(this.pool));
    this.gestores.set('operations_manager', new GestorOperacoes(this.pool));
    this.gestores.set('fear_greed_manager', new GestorFearGreed(this.pool));
    this.gestores.set('financial_supervisor', new SupervisorFinanceiro(this.pool));
    this.gestores.set('trade_supervisor', new SupervisorTrades(this.pool));
    this.gestores.set('users_manager', new GestorUsuarios(this.pool));
    this.gestores.set('risk_manager', new GestorRisco(this.pool));
    this.gestores.set('analytics_manager', new GestorAnalytics(this.pool));
    
    console.log('✅ Gestores inicializados:', this.gestores.size);
  }

  async criarGestoresNoBanco() {
    try {
      console.log('📝 Criando gestores no banco de dados...');
      
      const gestoresParaCriar = [
        { username: 'signals_manager', email: 'signals@coinbitclub.com', user_type: 'manager', status: 'active' },
        { username: 'operations_manager', email: 'operations@coinbitclub.com', user_type: 'manager', status: 'active' },
        { username: 'fear_greed_manager', email: 'feargreed@coinbitclub.com', user_type: 'manager', status: 'active' },
        { username: 'financial_supervisor', email: 'financial@coinbitclub.com', user_type: 'supervisor', status: 'active' },
        { username: 'trade_supervisor', email: 'trades@coinbitclub.com', user_type: 'supervisor', status: 'active' },
        { username: 'users_manager', email: 'users@coinbitclub.com', user_type: 'manager', status: 'active' },
        { username: 'risk_manager', email: 'risk@coinbitclub.com', user_type: 'manager', status: 'active' },
        { username: 'analytics_manager', email: 'analytics@coinbitclub.com', user_type: 'manager', status: 'active' }
      ];

      for (const gestor of gestoresParaCriar) {
        await this.pool.query(`
          INSERT INTO users (username, email, password, user_type, status, vip_status, created_at, last_login)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          ON CONFLICT (username) DO UPDATE SET
            user_type = $4,
            status = $5,
            last_login = NOW()
        `, [
          gestor.username,
          gestor.email,
          'hashed_password_gestor',
          gestor.user_type,
          gestor.status,
          true
        ]);
      }
      
      console.log('✅ Gestores criados/atualizados no banco!');
    } catch (error) {
      console.error('❌ Erro ao criar gestores no banco:', error.message);
    }
  }

  async ativarTodosGestores() {
    if (this.ativo) {
      console.log('⚠️ Gestores já estão ativos!');
      return;
    }

    console.log('🟢 ATIVANDO TODOS OS GESTORES...');
    this.ativo = true;

    // Ativar cada gestor
    for (const [nome, gestor] of this.gestores) {
      try {
        await gestor.ativar();
        console.log(`✅ ${nome} ativado`);
        
        // Programar execução periódica
        const intervalo = setInterval(async () => {
          if (this.ativo) {
            await gestor.executar();
          }
        }, gestor.intervalo || 30000); // 30 segundos padrão
        
        this.intervalos.set(nome, intervalo);
        
      } catch (error) {
        console.error(`❌ Erro ao ativar ${nome}:`, error.message);
      }
    }

    // Logs periódicos do sistema
    const intervalStatus = setInterval(() => {
      if (this.ativo) {
        this.logStatusSistema();
      }
    }, 60000); // A cada minuto
    
    this.intervalos.set('status_logger', intervalStatus);

    console.log('🚀 SISTEMA DE GESTORES TOTALMENTE ATIVO!');
    console.log(`📊 ${this.gestores.size} gestores em execução`);
  }

  async desativarTodosGestores() {
    console.log('🔴 DESATIVANDO TODOS OS GESTORES...');
    this.ativo = false;

    // Parar todos os intervalos
    for (const [nome, intervalo] of this.intervalos) {
      clearInterval(intervalo);
      console.log(`🛑 ${nome} desativado`);
    }
    this.intervalos.clear();

    // Desativar gestores
    for (const [nome, gestor] of this.gestores) {
      await gestor.desativar();
    }

    console.log('✅ Todos os gestores desativados');
  }

  async logStatusSistema() {
    const timestamp = new Date().toLocaleString('pt-BR');
    console.log(`\n📊 [${timestamp}] STATUS DO SISTEMA:`);
    console.log(`🤖 Gestores Ativos: ${this.gestores.size}`);
    
    for (const [nome, gestor] of this.gestores) {
      const status = await gestor.getStatus();
      console.log(`   - ${nome}: ${status.status} (Execuções: ${status.execucoes})`);
    }
  }

  async getGestoresParaDashboard() {
    const gestores = [];
    
    for (const [nome, gestor] of this.gestores) {
      const status = await gestor.getStatus();
      gestores.push({
        user_id: nome,
        status: status.status,
        last_action: status.ultima_acao,
        profit_loss: status.profit_loss || 0,
        active_trades: status.trades_ativos || 0,
        execucoes: status.execucoes,
        ultimo_update: new Date().toISOString()
      });
    }
    
    return gestores;
  }
}

// Classe base para gestores
class GestorBase {
  constructor(pool, nome) {
    this.pool = pool;
    this.nome = nome;
    this.ativo = false;
    this.execucoes = 0;
    this.ultima_acao = 'Inicializando...';
    this.intervalo = 30000; // 30 segundos padrão
  }

  async ativar() {
    this.ativo = true;
    this.ultima_acao = 'Gestor ativado';
    console.log(`✅ ${this.nome} ativado`);
  }

  async desativar() {
    this.ativo = false;
    this.ultima_acao = 'Gestor desativado';
    console.log(`🛑 ${this.nome} desativado`);
  }

  async executar() {
    if (!this.ativo) return;
    
    try {
      this.execucoes++;
      await this.processar();
    } catch (error) {
      console.error(`❌ Erro em ${this.nome}:`, error.message);
      this.ultima_acao = `Erro: ${error.message}`;
    }
  }

  async processar() {
    // Implementado pelos gestores específicos
    throw new Error('Método processar deve ser implementado');
  }

  async getStatus() {
    return {
      status: this.ativo ? 'active' : 'inactive',
      execucoes: this.execucoes,
      ultima_acao: this.ultima_acao
    };
  }
}

// Gestor de Sinais
class GestorSinais extends GestorBase {
  constructor(pool) {
    super(pool, 'Gestor de Sinais');
    this.intervalo = 15000; // 15 segundos
  }

  async processar() {
    // Verificar novos sinais
    const sinaisRecentes = await this.pool.query(`
      SELECT COUNT(*) as novos_sinais 
      FROM trading_signals 
      WHERE created_at > NOW() - INTERVAL '1 minute'
    `);
    
    const novos = parseInt(sinaisRecentes.rows[0].novos_sinais);
    
    if (novos > 0) {
      this.ultima_acao = `Processados ${novos} sinais novos`;
      
      // Analisar sinais e gerar alertas
      await this.analisarSinais();
    } else {
      this.ultima_acao = 'Monitorando sinais...';
    }
  }

  async analisarSinais() {
    // Lógica de análise de sinais
    const sinais = await this.pool.query(`
      SELECT * FROM trading_signals 
      WHERE created_at > NOW() - INTERVAL '5 minutes'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Processar cada sinal
    for (const sinal of sinais.rows) {
      await this.processarSinal(sinal);
    }
  }

  async processarSinal(sinal) {
    // Implementar lógica de processamento de sinal
    console.log(`📡 Processando sinal: ${sinal.symbol} ${sinal.action}`);
  }
}

// Gestor de Operações
class GestorOperacoes extends GestorBase {
  constructor(pool) {
    super(pool, 'Gestor de Operações');
    this.intervalo = 20000; // 20 segundos
  }

  async processar() {
    // Monitorar operações ativas
    const operacoesAtivas = await this.pool.query(`
      SELECT COUNT(*) as ativas 
      FROM trading_operations 
      WHERE status IN ('pending', 'active', 'partially_filled')
    `);
    
    const ativas = parseInt(operacoesAtivas.rows[0].ativas);
    this.ultima_acao = `Monitorando ${ativas} operações ativas`;
    
    if (ativas > 0) {
      await this.gerenciarOperacoes();
    }
  }

  async gerenciarOperacoes() {
    // Lógica de gerenciamento de operações
    const operacoes = await this.pool.query(`
      SELECT * FROM trading_operations 
      WHERE status IN ('pending', 'active', 'partially_filled')
      ORDER BY created_at DESC
    `);

    for (const op of operacoes.rows) {
      await this.verificarOperacao(op);
    }
  }

  async verificarOperacao(operacao) {
    // Verificar se operação precisa de ação
    console.log(`⚡ Verificando operação: ${operacao.id}`);
  }

  async getStatus() {
    const base = await super.getStatus();
    
    // Adicionar métricas específicas
    const operacoes = await this.pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendentes
      FROM trading_operations 
      WHERE created_at > NOW() - INTERVAL '1 hour'
    `);
    
    return {
      ...base,
      trades_ativos: parseInt(operacoes.rows[0].pendentes) || 0
    };
  }
}

// Gestor Fear & Greed
class GestorFearGreed extends GestorBase {
  constructor(pool) {
    super(pool, 'Gestor Fear & Greed');
    this.intervalo = 300000; // 5 minutos
  }

  async processar() {
    try {
      // Buscar último índice
      const ultimo = await this.pool.query(`
        SELECT * FROM fear_greed_index 
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      
      if (ultimo.rows.length > 0) {
        const indice = ultimo.rows[0];
        this.ultima_acao = `Fear & Greed: ${indice.value} (${indice.classificacao_pt})`;
        
        // Analisar tendências
        await this.analisarTendencias();
      } else {
        this.ultima_acao = 'Aguardando dados Fear & Greed';
      }
      
    } catch (error) {
      this.ultima_acao = 'Erro ao processar Fear & Greed';
    }
  }

  async analisarTendencias() {
    // Analisar tendências do Fear & Greed
    const historico = await this.pool.query(`
      SELECT * FROM fear_greed_index 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
    `);
    
    if (historico.rows.length >= 2) {
      const atual = historico.rows[0];
      const anterior = historico.rows[1];
      
      const diferenca = atual.value - anterior.value;
      if (Math.abs(diferenca) > 10) {
        console.log(`📈 Mudança significativa no Fear & Greed: ${diferenca > 0 ? '+' : ''}${diferenca}`);
      }
    }
  }
}

// Supervisor Financeiro
class SupervisorFinanceiro extends GestorBase {
  constructor(pool) {
    super(pool, 'Supervisor Financeiro');
    this.intervalo = 45000; // 45 segundos
  }

  async processar() {
    // Supervisionar transações financeiras
    const transacoes = await this.pool.query(`
      SELECT 
        SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END) as lucros,
        SUM(CASE WHEN pnl < 0 THEN pnl ELSE 0 END) as perdas
      FROM trading_operations 
      WHERE completed_at > NOW() - INTERVAL '1 hour'
    `);
    
    const lucros = parseFloat(transacoes.rows[0].lucros) || 0;
    const perdas = parseFloat(transacoes.rows[0].perdas) || 0;
    
    this.ultima_acao = `P&L 1h: +$${lucros.toFixed(2)} / -$${Math.abs(perdas).toFixed(2)}`;
    
    await this.verificarRiscos(lucros, perdas);
  }

  async verificarRiscos(lucros, perdas) {
    const perdaTotal = Math.abs(perdas);
    
    if (perdaTotal > 1000) {
      console.log('⚠️ ALERTA: Perdas elevadas detectadas!');
    }
    
    if (lucros > 500) {
      console.log('🎉 Bom desempenho: Lucros acima de $500 na última hora');
    }
  }

  async getStatus() {
    const base = await super.getStatus();
    
    const pnl = await this.pool.query(`
      SELECT SUM(pnl) as total_pnl 
      FROM trading_operations 
      WHERE completed_at > NOW() - INTERVAL '24 hours'
    `);
    
    return {
      ...base,
      profit_loss: parseFloat(pnl.rows[0].total_pnl) || 0
    };
  }
}

// Supervisor de Trades
class SupervisorTrades extends GestorBase {
  constructor(pool) {
    super(pool, 'Supervisor de Trades');
    this.intervalo = 25000; // 25 segundos
  }

  async processar() {
    // Supervisionar trades em tempo real
    const tradesAtivos = await this.pool.query(`
      SELECT COUNT(*) as ativos 
      FROM trading_operations 
      WHERE status IN ('active', 'partially_filled')
    `);
    
    const ativos = parseInt(tradesAtivos.rows[0].ativos);
    this.ultima_acao = `Supervisionando ${ativos} trades ativos`;
    
    if (ativos > 0) {
      await this.monitorarTrades();
    }
  }

  async monitorarTrades() {
    const trades = await this.pool.query(`
      SELECT * FROM trading_operations 
      WHERE status IN ('active', 'partially_filled')
      AND created_at > NOW() - INTERVAL '1 hour'
    `);
    
    for (const trade of trades.rows) {
      await this.verificarTrade(trade);
    }
  }

  async verificarTrade(trade) {
    // Verificar performance do trade
    if (trade.pnl && trade.pnl < -100) {
      console.log(`⚠️ Trade com perda elevada: ${trade.id} (${trade.pnl})`);
    }
  }
}

// Gestor de Usuários
class GestorUsuarios extends GestorBase {
  constructor(pool) {
    super(pool, 'Gestor de Usuários');
    this.intervalo = 60000; // 1 minuto
  }

  async processar() {
    // Gerenciar usuários ativos
    const usuarios = await this.pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN last_login > NOW() - INTERVAL '1 hour' THEN 1 END) as online
      FROM users
    `);
    
    const total = parseInt(usuarios.rows[0].total);
    const online = parseInt(usuarios.rows[0].online);
    
    this.ultima_acao = `Gerenciando ${total} usuários (${online} online)`;
  }
}

// Gestor de Risco
class GestorRisco extends GestorBase {
  constructor(pool) {
    super(pool, 'Gestor de Risco');
    this.intervalo = 30000; // 30 segundos
  }

  async processar() {
    // Analisar riscos do sistema
    const riscos = await this.pool.query(`
      SELECT 
        COUNT(CASE WHEN pnl < -50 THEN 1 END) as trades_risco,
        AVG(pnl) as pnl_medio
      FROM trading_operations 
      WHERE created_at > NOW() - INTERVAL '1 hour'
    `);
    
    const tradesRisco = parseInt(riscos.rows[0].trades_risco) || 0;
    const pnlMedio = parseFloat(riscos.rows[0].pnl_medio) || 0;
    
    this.ultima_acao = `${tradesRisco} trades de risco | P&L médio: ${pnlMedio.toFixed(2)}`;
    
    if (tradesRisco > 5) {
      console.log('🚨 ALERTA DE RISCO: Muitos trades com perdas!');
    }
  }
}

// Gestor de Analytics
class GestorAnalytics extends GestorBase {
  constructor(pool) {
    super(pool, 'Gestor de Analytics');
    this.intervalo = 120000; // 2 minutos
  }

  async processar() {
    // Gerar analytics do sistema
    const stats = await this.pool.query(`
      SELECT 
        COUNT(DISTINCT user_id) as usuarios_ativos,
        COUNT(*) as total_operacoes,
        AVG(pnl) as pnl_medio
      FROM trading_operations 
      WHERE created_at > NOW() - INTERVAL '1 hour'
    `);
    
    const row = stats.rows[0];
    this.ultima_acao = `Analytics: ${row.usuarios_ativos} usuários, ${row.total_operacoes} ops`;
  }
}

// Inicializar e exportar sistema
const sistemaGestores = new SistemaGestoresReais();

// Auto-inicialização
(async () => {
  try {
    await sistemaGestores.ativarTodosGestores();
    
    // Manter processo ativo
    process.on('SIGINT', async () => {
      console.log('\n🛑 Desligando sistema de gestores...');
      await sistemaGestores.desativarTodosGestores();
      await sistemaGestores.pool.end();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Erro ao inicializar sistema:', error);
  }
})();

module.exports = sistemaGestores;
