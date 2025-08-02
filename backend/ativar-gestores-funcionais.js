const { Pool } = require('pg');
const EventEmitter = require('events');

// Conexão PostgreSQL
const pool = new Pool({
  connectionString: 'postgresql://postgres:FDjupFGvAzzwbuZMRyVxlJBXsQtphlHv@maglev.proxy.rlwy.net:42095/railway'
});

// Sistema de eventos para coordenar gestores
const sistemaEventos = new EventEmitter();

class GestorBase {
  constructor(nome, intervalo = 30000) {
    this.nome = nome;
    this.intervalo = intervalo;
    this.ativo = false;
    this.proximaExecucao = null;
    this.ultimaAtividade = null;
  }

  async iniciar() {
    this.ativo = true;
    this.ultimaAtividade = new Date();
    console.log(`🚀 ${this.nome} iniciado - Intervalo: ${this.intervalo/1000}s`);
    
    // Primeira execução imediata
    await this.executar();
    
    // Agendar próximas execuções
    this.agendar();
  }

  agendar() {
    if (!this.ativo) return;
    
    this.proximaExecucao = setTimeout(async () => {
      if (this.ativo) {
        await this.executar();
        this.agendar();
      }
    }, this.intervalo);
  }

  async parar() {
    this.ativo = false;
    if (this.proximaExecucao) {
      clearTimeout(this.proximaExecucao);
      this.proximaExecucao = null;
    }
    console.log(`🛑 ${this.nome} parado`);
  }

  async executar() {
    // Implementado pelas classes filhas
    this.ultimaAtividade = new Date();
  }
}

// 1. GESTOR DE SINAIS
class GestorSinais extends GestorBase {
  constructor() {
    super('🔄 Gestor de Sinais', 15000); // 15 segundos
  }

  async executar() {
    super.executar();
    try {
      // Buscar sinais recentes
      const result = await pool.query(`
        SELECT id, symbol, action, created_at 
        FROM trading_signals 
        WHERE created_at > NOW() - INTERVAL '5 minutes'
        ORDER BY created_at DESC 
        LIMIT 5
      `);

      console.log(`📡 ${this.nome}: ${result.rows.length} sinais processados`);
      
      // Emitir evento para outros gestores
      sistemaEventos.emit('sinais_processados', {
        gestor: this.nome,
        quantidade: result.rows.length,
        sinais: result.rows
      });

    } catch (error) {
      console.error(`❌ ${this.nome} erro:`, error.message);
    }
  }
}

// 2. GESTOR DE OPERAÇÕES
class GestorOperacoes extends GestorBase {
  constructor() {
    super('⚡ Gestor de Operações', 20000); // 20 segundos
  }

  async executar() {
    super.executar();
    try {
      // Monitorar operações ativas
      const result = await pool.query(`
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendentes,
               COUNT(CASE WHEN status = 'active' THEN 1 END) as ativas
        FROM trading_operations 
        WHERE status IN ('pending', 'active', 'partially_filled')
      `);

      const dados = result.rows[0];
      console.log(`⚡ ${this.nome}: ${dados.total} operações (${dados.pendentes} pendentes, ${dados.ativas} ativas)`);
      
      sistemaEventos.emit('operacoes_monitoradas', {
        gestor: this.nome,
        total: dados.total,
        pendentes: dados.pendentes,
        ativas: dados.ativas
      });

    } catch (error) {
      console.error(`❌ ${this.nome} erro:`, error.message);
    }
  }
}

// 3. GESTOR FEAR & GREED
class GestorFearGreed extends GestorBase {
  constructor() {
    super('📊 Gestor Fear & Greed', 60000); // 1 minuto
  }

  async executar() {
    super.executar();
    try {
      // Verificar último Fear & Greed
      const result = await pool.query(`
        SELECT value, classificacao_pt, created_at
        FROM fear_greed_index 
        ORDER BY created_at DESC 
        LIMIT 1
      `);

      if (result.rows.length > 0) {
        const fg = result.rows[0];
        console.log(`📊 ${this.nome}: Fear & Greed = ${fg.value} (${fg.classificacao_pt})`);
        
        sistemaEventos.emit('fear_greed_atualizado', {
          gestor: this.nome,
          valor: fg.value,
          classificacao: fg.classificacao_pt,
          timestamp: fg.created_at
        });
      }

    } catch (error) {
      console.error(`❌ ${this.nome} erro:`, error.message);
    }
  }
}

// 4. SUPERVISOR FINANCEIRO
class SupervisorFinanceiro extends GestorBase {
  constructor() {
    super('💰 Supervisor Financeiro', 45000); // 45 segundos
  }

  async executar() {
    super.executar();
    try {
      // Calcular P&L total
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_operacoes,
          SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END) as lucros,
          SUM(CASE WHEN pnl < 0 THEN pnl ELSE 0 END) as perdas,
          SUM(pnl) as pnl_total
        FROM trading_operations 
        WHERE completed_at > NOW() - INTERVAL '24 hours'
      `);

      const dados = result.rows[0];
      console.log(`💰 ${this.nome}: P&L 24h = $${parseFloat(dados.pnl_total || 0).toFixed(2)}`);
      
      sistemaEventos.emit('financeiro_supervisionado', {
        gestor: this.nome,
        pnl_total: parseFloat(dados.pnl_total || 0),
        lucros: parseFloat(dados.lucros || 0),
        perdas: parseFloat(dados.perdas || 0)
      });

    } catch (error) {
      console.error(`❌ ${this.nome} erro:`, error.message);
    }
  }
}

// 5. SUPERVISOR DE TRADES
class SupervisorTrades extends GestorBase {
  constructor() {
    super('📈 Supervisor de Trades', 25000); // 25 segundos
  }

  async executar() {
    super.executar();
    try {
      // Monitorar trades por símbolo
      const result = await pool.query(`
        SELECT 
          symbol,
          COUNT(*) as total,
          COUNT(CASE WHEN side = 'BUY' THEN 1 END) as buys,
          COUNT(CASE WHEN side = 'SELL' THEN 1 END) as sells
        FROM trading_operations 
        WHERE created_at > NOW() - INTERVAL '1 hour'
        GROUP BY symbol
        ORDER BY total DESC
        LIMIT 5
      `);

      console.log(`📈 ${this.nome}: ${result.rows.length} símbolos ativos na última hora`);
      
      sistemaEventos.emit('trades_supervisionados', {
        gestor: this.nome,
        simbolos_ativos: result.rows.length,
        detalhes: result.rows
      });

    } catch (error) {
      console.error(`❌ ${this.nome} erro:`, error.message);
    }
  }
}

// 6. GESTOR DE USUÁRIOS
class GestorUsuarios extends GestorBase {
  constructor() {
    super('👥 Gestor de Usuários', 90000); // 1.5 minutos
  }

  async executar() {
    super.executar();
    try {
      // Estatísticas de usuários
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as ativos,
          COUNT(CASE WHEN last_login_at > NOW() - INTERVAL '1 hour' THEN 1 END) as online_1h
        FROM users
        WHERE user_type = 'user'
      `);

      const dados = result.rows[0];
      console.log(`👥 ${this.nome}: ${dados.total} usuários (${dados.ativos} ativos, ${dados.online_1h} online)`);
      
      sistemaEventos.emit('usuarios_gerenciados', {
        gestor: this.nome,
        total: dados.total,
        ativos: dados.ativos,
        online_1h: dados.online_1h
      });

    } catch (error) {
      console.error(`❌ ${this.nome} erro:`, error.message);
    }
  }
}

// 7. GESTOR DE RISCO
class GestorRisco extends GestorBase {
  constructor() {
    super('⚠️ Gestor de Risco', 30000); // 30 segundos
  }

  async executar() {
    super.executar();
    try {
      // Analisar riscos por operações falhadas
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_falhas,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as falhas_1h
        FROM trading_operations 
        WHERE status = 'failed'
      `);

      const dados = result.rows[0];
      console.log(`⚠️ ${this.nome}: ${dados.total_falhas} falhas total (${dados.falhas_1h} na última hora)`);
      
      if (dados.falhas_1h > 5) {
        console.log(`🚨 ${this.nome}: ALERTA - Muitas falhas detectadas!`);
      }
      
      sistemaEventos.emit('risco_analisado', {
        gestor: this.nome,
        total_falhas: dados.total_falhas,
        falhas_1h: dados.falhas_1h,
        nivel_risco: dados.falhas_1h > 5 ? 'ALTO' : 'NORMAL'
      });

    } catch (error) {
      console.error(`❌ ${this.nome} erro:`, error.message);
    }
  }
}

// 8. GESTOR DE ANALYTICS
class GestorAnalytics extends GestorBase {
  constructor() {
    super('📋 Gestor de Analytics', 120000); // 2 minutos
  }

  async executar() {
    super.executar();
    try {
      // Gerar relatório resumido
      const result = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE status = 'active') as usuarios_ativos,
          (SELECT COUNT(*) FROM trading_signals WHERE created_at > NOW() - INTERVAL '1 hour') as sinais_1h,
          (SELECT COUNT(*) FROM trading_operations WHERE status IN ('pending', 'active')) as operacoes_ativas,
          (SELECT SUM(pnl) FROM trading_operations WHERE completed_at > NOW() - INTERVAL '24 hours') as pnl_24h
      `);

      const dados = result.rows[0];
      console.log(`📋 ${this.nome}: Relatório - ${dados.usuarios_ativos} usuários, ${dados.sinais_1h} sinais/h, ${dados.operacoes_ativas} ops ativas`);
      
      sistemaEventos.emit('analytics_gerado', {
        gestor: this.nome,
        usuarios_ativos: dados.usuarios_ativos,
        sinais_1h: dados.sinais_1h,
        operacoes_ativas: dados.operacoes_ativas,
        pnl_24h: parseFloat(dados.pnl_24h || 0)
      });

    } catch (error) {
      console.error(`❌ ${this.nome} erro:`, error.message);
    }
  }
}

// SISTEMA PRINCIPAL DE GESTORES
class SistemaGestores {
  constructor() {
    this.gestores = [];
    this.ativo = false;
  }

  async inicializar() {
    console.log('🚀 INICIANDO SISTEMA DE GESTORES COINBITCLUB');
    console.log('==========================================');

    // Criar todos os gestores
    this.gestores = [
      new GestorSinais(),
      new GestorOperacoes(),
      new GestorFearGreed(),
      new SupervisorFinanceiro(),
      new SupervisorTrades(),
      new GestorUsuarios(),
      new GestorRisco(),
      new GestorAnalytics()
    ];

    // Configurar eventos
    this.configurarEventos();

    // Iniciar todos os gestores
    this.ativo = true;
    for (const gestor of this.gestores) {
      await gestor.iniciar();
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1s entre cada início
    }

    console.log('\n✅ TODOS OS GESTORES ATIVADOS!');
    console.log(`📊 Total: ${this.gestores.length} gestores funcionando`);
    console.log('🔄 Sistema em operação contínua...\n');

    // Relatório de status a cada 2 minutos
    setInterval(() => this.relatorioStatus(), 120000);
  }

  configurarEventos() {
    sistemaEventos.on('sinais_processados', (dados) => {
      if (dados.quantidade > 0) {
        console.log(`📈 Novos sinais detectados: ${dados.quantidade}`);
      }
    });

    sistemaEventos.on('risco_analisado', (dados) => {
      if (dados.nivel_risco === 'ALTO') {
        console.log(`🚨 ALERTA DE RISCO: ${dados.falhas_1h} falhas na última hora!`);
      }
    });
  }

  relatorioStatus() {
    console.log('\n📋 RELATÓRIO DE STATUS DOS GESTORES');
    console.log('=====================================');
    
    const agora = new Date();
    let gestoresAtivos = 0;
    
    this.gestores.forEach(gestor => {
      const ultimaAtividade = gestor.ultimaAtividade;
      const tempoInativo = ultimaAtividade ? Math.floor((agora - ultimaAtividade) / 1000) : 'N/A';
      const status = gestor.ativo ? '🟢 ATIVO' : '🔴 INATIVO';
      
      console.log(`${status} ${gestor.nome} - Última atividade: ${tempoInativo}s atrás`);
      
      if (gestor.ativo) gestoresAtivos++;
    });
    
    console.log(`\n📊 Resumo: ${gestoresAtivos}/${this.gestores.length} gestores ativos`);
    console.log('=====================================\n');
  }

  async parar() {
    console.log('\n🛑 PARANDO SISTEMA DE GESTORES...');
    
    this.ativo = false;
    for (const gestor of this.gestores) {
      await gestor.parar();
    }
    
    await pool.end();
    console.log('✅ Sistema de gestores finalizado!');
  }
}

// INICIALIZAÇÃO
async function main() {
  const sistema = new SistemaGestores();
  
  // Capturar Ctrl+C para parada limpa
  process.on('SIGINT', async () => {
    console.log('\n⚠️ Interrupção detectada...');
    await sistema.parar();
    process.exit(0);
  });

  try {
    await sistema.inicializar();
    
    // Manter o processo rodando
    process.on('uncaughtException', (error) => {
      console.error('❌ Erro não capturado:', error.message);
    });

  } catch (error) {
    console.error('❌ Erro ao inicializar sistema:', error.message);
    process.exit(1);
  }
}

// Iniciar sistema
main();
