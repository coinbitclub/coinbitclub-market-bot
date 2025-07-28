import cron from 'node-cron';
import { FinancialCronJobs } from './financialCronJobs.js';
import { getFearAndGreed, getBtcDominance } from '../../../signal-ingestor/src/coinStatsClient.js';
import { aiService } from './aiService.js';
import { WhatsAppService } from './whatsappService.js';
import { db } from '../../../common/db.js';
import logger from '../../../common/logger.js';

/**
 * 🎯 SISTEMA COMPLETO DE CRON JOBS - COINBITCLUB
 * Todos os processos automáticos centralizados
 */
export class AllCronJobs {
  static isInitialized = false;
  static jobs = new Map();

  static init() {
    if (this.isInitialized) {
      logger.info('Cron jobs já inicializados');
      return;
    }

    logger.info('🚀 Inicializando TODOS os cron jobs automáticos...');

    // 1. CRON JOBS FINANCEIROS
    this.setupFinancialCrons();

    // 2. CRON JOBS DE MERCADO
    this.setupMarketCrons();

    // 3. CRON JOBS DE IA E RELATÓRIOS
    this.setupAICrons();

    // 4. CRON JOBS DE NOTIFICAÇÕES
    this.setupNotificationCrons();

    // 5. CRON JOBS DE MANUTENÇÃO
    this.setupMaintenanceCrons();

    this.isInitialized = true;
    logger.info('✅ Todos os cron jobs inicializados com sucesso!');
  }

  /**
   * 💰 CRON JOBS FINANCEIROS
   */
  static setupFinancialCrons() {
    // Processamento automático de saques - a cada 30min (horário comercial)
    this.scheduleJob('process-withdrawals', '*/30 8-18 * * 1-5', async () => {
      await FinancialCronJobs.processWithdrawalsAutomatically();
    });

    // Reconciliação diária - 2h da manhã
    this.scheduleJob('daily-reconciliation', '0 2 * * *', async () => {
      await FinancialCronJobs.runDailyReconciliation();
    });

    // Relatório financeiro diário - 7h da manhã
    this.scheduleJob('daily-financial-report', '0 7 * * *', async () => {
      await FinancialCronJobs.generateDailyFinancialReport();
    });

    // Snapshot Stripe - a cada 4 horas
    this.scheduleJob('stripe-snapshot', '0 */4 * * *', async () => {
      await FinancialCronJobs.captureStripeBalanceSnapshot();
    });

    // Verificar pagamentos pendentes - a cada 30 minutos
    this.scheduleJob('check-pending-payments', '*/30 * * * *', async () => {
      await FinancialCronJobs.checkPendingPayments();
    });

    logger.info('✅ Cron jobs financeiros configurados');
  }

  /**
   * 📊 CRON JOBS DE MERCADO
   */
  static setupMarketCrons() {
    // CoinStats data - a cada 30 minutos
    this.scheduleJob('coinstats-data', '*/30 * * * *', async () => {
      const fg = await getFearAndGreed();
      const dom = await getBtcDominance();
      await db('cointars').insert({ 
        fear_greed_index: fg, 
        btc_dominance: dom, 
        timestamp: new Date() 
      });
    });

    // Limpeza de dados antigos - a cada 3 dias às 0h
    this.scheduleJob('cleanup-old-data', '0 0 */3 * *', async () => {
      await db('raw_webhook').where('created_at', '<', db.raw('NOW() - INTERVAL \'3 days\'')).del();
      await db('signals').where('created_at', '<', db.raw('NOW() - INTERVAL \'7 days\'')).del();
      logger.info('Dados antigos removidos');
    });

    // Verificar preços para stop loss/take profit - a cada 5 minutos
    this.scheduleJob('check-active-trades', '*/5 * * * *', async () => {
      await this.checkActiveTradesForStopLoss();
    });

    logger.info('✅ Cron jobs de mercado configurados');
  }

  /**
   * 🤖 CRON JOBS DE IA E RELATÓRIOS
   */
  static setupAICrons() {
    // RADAR DA ÁGUIA - a cada 4 horas
    this.scheduleJob('radar-da-aguia', '0 */4 * * *', async () => {
      await this.generateRadarDaAguiaReport();
    });

    // Análise de sinais IA - a cada 15 minutos
    this.scheduleJob('ai-signal-analysis', '*/15 * * * *', async () => {
      await this.analyzeRecentSignalsWithAI();
    });

    // Relatório de performance diário - 19h
    this.scheduleJob('daily-performance-report', '0 19 * * *', async () => {
      await this.generateDailyPerformanceReport();
    });

    // Previsões de mercado - 6h da manhã
    this.scheduleJob('market-predictions', '0 6 * * *', async () => {
      await this.generateMarketPredictions();
    });

    logger.info('✅ Cron jobs de IA configurados');
  }

  /**
   * 🔔 CRON JOBS DE NOTIFICAÇÕES
   */
  static setupNotificationCrons() {
    // Resumo diário para usuários - 18h
    this.scheduleJob('daily-user-summary', '0 18 * * *', async () => {
      await this.sendDailySummaryToUsers();
    });

    // Alertas de sistema - a cada 10 minutos
    this.scheduleJob('system-alerts', '*/10 * * * *', async () => {
      await this.checkSystemHealthAndAlert();
    });

    // Comissões de afiliados - dia 5 de cada mês às 9h
    this.scheduleJob('affiliate-commissions', '0 9 5 * *', async () => {
      await this.processAffiliateCommissions();
    });

    // Notificações de operações importantes - tempo real
    this.scheduleJob('important-operations', '*/2 * * * *', async () => {
      await this.checkImportantOperations();
    });

    logger.info('✅ Cron jobs de notificações configurados');
  }

  /**
   * 🧹 CRON JOBS DE MANUTENÇÃO
   */
  static setupMaintenanceCrons() {
    // Limpeza de logs - domingo às 3h
    this.scheduleJob('cleanup-logs', '0 3 * * 0', async () => {
      await this.cleanupSystemLogs();
    });

    // Backup de dados críticos - todo dia às 4h
    this.scheduleJob('backup-critical-data', '0 4 * * *', async () => {
      await this.backupCriticalData();
    });

    // Verificação de integridade - a cada 2 horas
    this.scheduleJob('integrity-check', '0 */2 * * *', async () => {
      await this.runIntegrityCheck();
    });

    // Otimização de banco - sábado às 5h
    this.scheduleJob('database-optimization', '0 5 * * 6', async () => {
      await this.optimizeDatabase();
    });

    logger.info('✅ Cron jobs de manutenção configurados');
  }

  /**
   * 📅 Agendar job individual
   */
  static scheduleJob(name, schedule, task) {
    try {
      const job = cron.schedule(schedule, async () => {
        logger.info(`⏰ Executando: ${name}`);
        const startTime = Date.now();
        
        try {
          await task();
          const duration = Date.now() - startTime;
          logger.info(`✅ ${name} concluído em ${duration}ms`);
        } catch (error) {
          logger.error(`❌ Erro em ${name}:`, error);
          await this.handleJobError(name, error);
        }
      }, {
        scheduled: false,
        timezone: "America/Sao_Paulo"
      });
      
      this.jobs.set(name, job);
      job.start();
      
      logger.info(`📅 Job agendado: ${name} (${schedule})`);
      
    } catch (error) {
      logger.error(`Erro ao agendar ${name}:`, error);
    }
  }

  /**
   * 🎯 IMPLEMENTAÇÕES DOS JOBS ESPECÍFICOS
   */

  // RADAR DA ÁGUIA REPORT
  static async generateRadarDaAguiaReport() {
    try {
      const marketData = await this.getMarketDataForAI();
      const aiReport = await aiService.generateRadarDaAguiaReport(marketData);
      
      // Salvar no banco
      const reportId = await db('ai_reports').insert({
        type: 'radar_da_aguia',
        title: aiReport.title,
        content: aiReport.content,
        summary: aiReport.summary,
        confidence: aiReport.confidence,
        market_data: JSON.stringify(marketData),
        created_at: new Date()
      }).returning('id');

      // Enviar para usuários VIP
      await this.notifyVIPUsers(aiReport);
      
      logger.info(`Relatório RADAR DA ÁGUIA gerado: ${reportId[0]}`);
    } catch (error) {
      logger.error('Erro ao gerar RADAR DA ÁGUIA:', error);
    }
  }

  // Verificar trades ativos para stop loss
  static async checkActiveTradesForStopLoss() {
    try {
      const activeOperations = await db('operations')
        .where('status', 'active')
        .whereNotNull('stop_loss');

      for (const operation of activeOperations) {
        // Obter preço atual
        const currentPrice = await this.getCurrentPrice(operation.symbol);
        
        if (this.shouldTriggerStopLoss(operation, currentPrice)) {
          await this.executeStopLoss(operation, currentPrice);
        }
        
        if (this.shouldTriggerTakeProfit(operation, currentPrice)) {
          await this.executeTakeProfit(operation, currentPrice);
        }
      }
    } catch (error) {
      logger.error('Erro ao verificar trades ativos:', error);
    }
  }

  // Enviar resumo diário para usuários
  static async sendDailySummaryToUsers() {
    try {
      const activeUsers = await db('users')
        .join('user_profiles', 'users.id', 'user_profiles.user_id')
        .join('subscriptions', 'users.id', 'subscriptions.user_id')
        .where('subscriptions.status', 'active')
        .whereNotNull('user_profiles.whatsapp')
        .select('users.*', 'user_profiles.whatsapp', 'user_profiles.nome_completo');

      for (const user of activeUsers) {
        const dailyStats = await this.getUserDailyStats(user.id);
        
        if (dailyStats.hasActivity) {
          const message = this.buildDailySummaryMessage(user, dailyStats);
          await WhatsAppService.sendMessage(user.whatsapp, message);
          
          // Delay para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      logger.info(`Resumo diário enviado para ${activeUsers.length} usuários`);
    } catch (error) {
      logger.error('Erro ao enviar resumo diário:', error);
    }
  }

  // Verificar saúde do sistema
  static async checkSystemHealthAndAlert() {
    try {
      const healthChecks = await Promise.all([
        this.checkDatabaseHealth(),
        this.checkAPIHealth(),
        this.checkExchangeConnections(),
        this.checkWebhookHealth()
      ]);

      const failedChecks = healthChecks.filter(check => !check.healthy);
      
      if (failedChecks.length > 0) {
        await this.createSystemAlert('system_health', failedChecks);
      }
    } catch (error) {
      logger.error('Erro ao verificar saúde do sistema:', error);
    }
  }

  /**
   * 🔧 FUNÇÕES AUXILIARES
   */

  static async handleJobError(jobName, error) {
    try {
      await db('system_alerts').insert({
        type: 'cron_job_error',
        severity: 'high',
        title: `Falha no job: ${jobName}`,
        message: error.message,
        data: JSON.stringify({
          job_name: jobName,
          error_stack: error.stack,
          timestamp: new Date().toISOString()
        })
      });
    } catch (alertError) {
      logger.error('Erro ao criar alerta de job:', alertError);
    }
  }

  static async getMarketDataForAI() {
    const [btcPrice, ethPrice, fearGreed, dominance] = await Promise.all([
      this.getCurrentPrice('BTCUSDT'),
      this.getCurrentPrice('ETHUSDT'),
      getFearAndGreed(),
      getBtcDominance()
    ]);

    return {
      btcPrice,
      ethPrice,
      fearGreedIndex: fearGreed,
      btcDominance: dominance,
      timestamp: new Date()
    };
  }

  static async getCurrentPrice(symbol) {
    // Implementar integração com exchange
    return 0; // Placeholder
  }

  static shouldTriggerStopLoss(operation, currentPrice) {
    if (!operation.stop_loss) return false;
    
    return (operation.side === 'BUY' && currentPrice <= operation.stop_loss) ||
           (operation.side === 'SELL' && currentPrice >= operation.stop_loss);
  }

  static shouldTriggerTakeProfit(operation, currentPrice) {
    if (!operation.take_profit) return false;
    
    return (operation.side === 'BUY' && currentPrice >= operation.take_profit) ||
           (operation.side === 'SELL' && currentPrice <= operation.take_profit);
  }

  static buildDailySummaryMessage(user, stats) {
    return `
📊 *RESUMO DIÁRIO - ${new Date().toLocaleDateString('pt-BR')}*

👋 Olá ${user.nome_completo}!

💰 Saldo: $${stats.currentBalance.toFixed(2)}
📈 P&L do dia: ${stats.dailyPnL >= 0 ? '+' : ''}$${stats.dailyPnL.toFixed(2)}
🎯 Trades: ${stats.totalTrades}
✅ Taxa de sucesso: ${stats.successRate.toFixed(1)}%

🔗 Dashboard: ${process.env.FRONTEND_URL}/user/dashboard
    `.trim();
  }

  /**
   * 🛑 CONTROLES DO SISTEMA
   */
  static stopAllJobs() {
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`Job parado: ${name}`);
    });
    this.jobs.clear();
    this.isInitialized = false;
  }

  static getJobsStatus() {
    const status = {};
    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.running,
        scheduled: job.scheduled
      };
    });
    return status;
  }
}

export default AllCronJobs;
