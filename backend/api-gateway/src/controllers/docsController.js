import express from 'express';

const router = express.Router();

// API Documentation endpoint
router.get('/', (req, res) => {
  const documentation = {
    apiVersion: "2.0.0",
    title: "CoinBitClub Market Bot API",
    description: "Sistema completo de trading automatizado com IA",
    lastUpdated: new Date().toISOString(),
    
    endpoints: {
      authentication: {
        "/auth/login": {
          method: "POST",
          description: "Login de usuário",
          body: {
            email: "string",
            password: "string"
          },
          response: {
            token: "string",
            refreshToken: "string",
            user: "object"
          }
        },
        "/auth/register": {
          method: "POST",
          description: "Registro de novo usuário",
          body: {
            name: "string",
            email: "string",
            password: "string",
            phone: "string (optional)",
            affiliate_code: "string (optional)"
          }
        },
        "/auth/forgot-password": {
          method: "POST",
          description: "Solicitação de recuperação de senha",
          body: {
            email: "string"
          }
        },
        "/auth/reset-password": {
          method: "POST",
          description: "Reset de senha com token",
          body: {
            token: "string",
            newPassword: "string"
          }
        }
      },
      
      dashboard: {
        "/dashboard/user": {
          method: "GET",
          description: "Dashboard completo do usuário",
          auth: "required",
          response: {
            user: "object",
            balances: "object",
            performance: "object",
            operations: "object",
            charts: "object",
            aiInsights: "object"
          }
        },
        "/dashboard/admin": {
          method: "GET",
          description: "Dashboard operacional (admin)",
          auth: "admin",
          response: {
            metrics: "object",
            operations: "array",
            aiMarketReading: "object",
            tradingViewSignals: "array",
            coinStatsData: "object",
            recentAlerts: "array"
          }
        },
        "/dashboard/affiliate": {
          method: "GET",
          description: "Dashboard do afiliado",
          auth: "required",
          response: {
            stats: "object",
            affiliate: "object",
            recentReferrals: "array",
            commissionHistory: "array",
            monthlyTrend: "array"
          }
        },
        "/dashboard/health": {
          method: "GET",
          description: "Status do sistema",
          auth: "none",
          response: {
            status: "string",
            services: "object",
            metrics: "object"
          }
        }
      },

      subscriptions: {
        "/subscriptions": {
          method: "GET",
          description: "Listar assinaturas do usuário",
          auth: "required"
        },
        "/subscriptions": {
          method: "POST",
          description: "Criar nova assinatura",
          auth: "required",
          body: {
            planId: "string",
            paymentMethod: "stripe",
            affiliateCode: "string (optional)"
          }
        },
        "/subscriptions/:id/cancel": {
          method: "POST",
          description: "Cancelar assinatura",
          auth: "required"
        },
        "/subscriptions/webhook": {
          method: "POST",
          description: "Webhook do Stripe",
          auth: "none",
          headers: {
            "stripe-signature": "string"
          }
        }
      },

      affiliate: {
        "/affiliate/dashboard": {
          method: "GET",
          description: "Dashboard de afiliado",
          auth: "required"
        },
        "/affiliate/analytics": {
          method: "GET",
          description: "Analytics detalhado do afiliado",
          auth: "required",
          query: {
            period: "7d|30d|90d|1y"
          }
        },
        "/affiliate/payouts": {
          method: "GET",
          description: "Histórico de pagamentos",
          auth: "required"
        },
        "/affiliate/payouts/request": {
          method: "POST",
          description: "Solicitar pagamento",
          auth: "required",
          body: {
            amount: "number",
            paymentMethod: "pix|bank_transfer|paypal"
          }
        }
      },

      settings: {
        "/settings": {
          method: "GET",
          description: "Configurações completas do usuário",
          auth: "required"
        },
        "/settings/risk": {
          method: "PUT",
          description: "Atualizar parâmetros de risco",
          auth: "required",
          body: {
            leverage: "number (1-10)",
            capitalPerOrder: "number (1-100)",
            maxStopLoss: "number (1-50)",
            riskLevel: "conservative|moderate|aggressive"
          }
        },
        "/settings/trading": {
          method: "PUT",
          description: "Atualizar preferências de trading",
          auth: "required",
          body: {
            preferredExchange: "bybit|binance|both",
            preferredAssets: "array",
            tradingHours: "object",
            enableWeekendTrading: "boolean"
          }
        },
        "/settings/notifications": {
          method: "PUT",
          description: "Atualizar preferências de notificação",
          auth: "required",
          body: {
            email: "object",
            push: "object",
            sms: "object"
          }
        },
        "/settings/auto-trading": {
          method: "PUT",
          description: "Ativar/desativar trading automático",
          auth: "required",
          body: {
            enabled: "boolean"
          }
        },
        "/settings/reset": {
          method: "POST",
          description: "Resetar configurações para padrão",
          auth: "required",
          body: {
            type: "risk|trading|notifications|all"
          }
        },
        "/settings/options": {
          method: "GET",
          description: "Opções disponíveis para configuração",
          auth: "required"
        }
      },

      analytics: {
        "/analytics/user": {
          method: "GET",
          description: "Analytics detalhado do usuário",
          auth: "required",
          query: {
            period: "24h|7d|30d|90d|1y",
            exchange: "all|bybit|binance"
          }
        },
        "/analytics/system": {
          method: "GET",
          description: "Analytics do sistema (admin)",
          auth: "admin",
          query: {
            period: "24h|7d|30d|90d"
          }
        },
        "/analytics/realtime": {
          method: "GET",
          description: "Métricas em tempo real",
          auth: "required"
        }
      },

      notifications: {
        "/notifications": {
          method: "GET",
          description: "Listar notificações do usuário",
          auth: "required",
          query: {
            limit: "number",
            offset: "number",
            type: "alert|info|success|error"
          }
        },
        "/notifications/:id/read": {
          method: "PUT",
          description: "Marcar notificação como lida",
          auth: "required"
        },
        "/notifications/preferences": {
          method: "GET",
          description: "Preferências de notificação",
          auth: "required"
        },
        "/notifications/preferences": {
          method: "PUT",
          description: "Atualizar preferências",
          auth: "required"
        },
        "/notifications/send-bulk": {
          method: "POST",
          description: "Enviar notificação em massa (admin)",
          auth: "admin",
          body: {
            title: "string",
            message: "string",
            type: "string",
            recipients: "array"
          }
        }
      },

      admin: {
        "/admin/users": {
          method: "GET",
          description: "Listar usuários",
          auth: "admin",
          query: {
            page: "number",
            limit: "number",
            search: "string",
            status: "active|inactive|banned"
          }
        },
        "/admin/users": {
          method: "POST",
          description: "Criar usuário",
          auth: "admin"
        },
        "/admin/users/:id": {
          method: "PUT",
          description: "Atualizar usuário",
          auth: "admin"
        },
        "/admin/users/:id": {
          method: "DELETE",
          description: "Deletar usuário",
          auth: "admin"
        },
        "/admin/dashboard": {
          method: "GET",
          description: "Dashboard administrativo",
          auth: "admin"
        }
      }
    },

    features: {
      "Dashboard Operacional": {
        description: "Dashboard em tempo real para administradores",
        metrics: [
          "Operações em andamento e fechadas",
          "Taxa de assertividade diária e histórica",
          "Usuários ativos e assinantes",
          "Sinais do TradingView",
          "Dados do CoinStats",
          "Alertas recentes"
        ]
      },
      
      "Dashboard do Usuário": {
        description: "Dashboard personalizado para cada usuário",
        features: [
          "Saldos das exchanges (Bybit/Binance)",
          "Rentabilidade acumulada e diária",
          "Operações em andamento",
          "Histórico de operações",
          "Relatório da IA",
          "Gráficos de performance"
        ]
      },

      "Sistema de Afiliados": {
        description: "Sistema completo de afiliação",
        features: [
          "Dashboard com métricas de conversão",
          "Links personalizados de afiliado",
          "QR codes para compartilhamento",
          "Histórico de comissões",
          "Solicitação de pagamentos",
          "Analytics detalhado"
        ]
      },

      "Configurações Personalizadas": {
        description: "Personalização completa dos parâmetros de trading",
        features: [
          "Parâmetros de risco (alavancagem, capital, stop loss)",
          "Preferências de trading (exchanges, ativos, horários)",
          "Configurações de notificação",
          "Modo trading automático",
          "Reset para padrões do sistema"
        ]
      },

      "Analytics Avançado": {
        description: "Analytics detalhado para usuários e administradores",
        features: [
          "Performance por período",
          "Métricas de risco (Sharpe ratio, VaR)",
          "Performance por ativo",
          "Métricas do sistema",
          "Usuários mais ativos",
          "Distribuição por exchange"
        ]
      },

      "Sistema de Notificações": {
        description: "Sistema completo de notificações",
        features: [
          "Notificações por email",
          "Notificações push (futuro)",
          "SMS para alertas urgentes",
          "Preferências personalizáveis",
          "Notificações em massa (admin)",
          "Templates personalizados"
        ]
      },

      "Integração Stripe": {
        description: "Sistema completo de pagamentos",
        features: [
          "Assinaturas recorrentes",
          "Webhooks automáticos",
          "Comissões de afiliado",
          "Múltiplos planos",
          "Cancelamento automático",
          "Histórico de pagamentos"
        ]
      },

      "Admin Panel": {
        description: "Painel administrativo completo",
        features: [
          "Gestão de usuários",
          "Dashboard operacional",
          "Analytics do sistema",
          "Auditoria de ações",
          "Notificações em massa",
          "Monitoramento em tempo real"
        ]
      }
    },

    businessLogic: {
      "Resolução Autônoma de Problemas": {
        description: "O frontend agora pode resolver problemas autonomamente através dos endpoints:",
        capabilities: [
          "Reset de senha por email",
          "Gestão completa de assinaturas",
          "Configuração de parâmetros de risco",
          "Solicitação de pagamentos de afiliado",
          "Personalização de notificações",
          "Análise de performance detalhada"
        ]
      },
      
      "Automação de Processos": {
        description: "Processos automatizados no backend:",
        processes: [
          "Cálculo automático de comissões",
          "Processamento de webhooks do Stripe",
          "Envio de emails transacionais",
          "Coleta de métricas de performance",
          "Auditoria de ações",
          "Sincronização de dados financeiros"
        ]
      }
    },

    database: {
      newTables: [
        "user_risk_parameters",
        "user_trading_preferences", 
        "operation_history",
        "system_metrics",
        "performance_snapshots"
      ],
      enhancedTables: [
        "users (affiliate_code, auto_trading_enabled)",
        "subscriptions (enhanced with Stripe)",
        "affiliate_commissions (complete workflow)",
        "notifications (preferences and bulk)",
        "audit_logs (comprehensive tracking)"
      ]
    }
  };

  res.json(documentation);
});

export default router;
