// API para configurações do sistema
import { NextApiRequest, NextApiResponse } from 'next';

const systemSettings = {
  general: {
    company_name: 'CoinBitClub',
    company_logo: '/logo.png',
    timezone: 'America/Sao_Paulo',
    default_language: 'pt-BR',
    currency: 'USD',
    maintenance_mode: false,
    support_email: 'support@coinbitclub.com',
    support_phone: '+55 11 99999-9999'
  },
  trading: {
    max_simultaneous_operations: 5,
    default_risk_percentage: 2.0,
    max_risk_percentage: 10.0,
    auto_stop_loss: true,
    default_stop_loss: 3.0,
    auto_take_profit: true,
    default_take_profit: 6.0,
    trading_hours_enabled: true,
    trading_start_time: '09:00',
    trading_end_time: '18:00'
  },
  security: {
    two_factor_required: true,
    session_timeout: 30,
    max_login_attempts: 5,
    password_expiry_days: 90,
    require_email_verification: true,
    require_kyc_verification: true,
    ip_whitelist_enabled: false,
    api_rate_limit: 1000,
    encryption_enabled: true
  },
  notifications: {
    email_notifications: true,
    sms_notifications: true,
    push_notifications: true,
    telegram_notifications: true,
    signal_notifications: true,
    operation_notifications: true,
    balance_notifications: true,
    daily_reports: true,
    weekly_reports: true,
    monthly_reports: true
  },
  financial: {
    minimum_deposit: 100.0,
    maximum_deposit: 50000.0,
    minimum_withdrawal: 50.0,
    withdrawal_fee_percentage: 1.5,
    auto_reinvest: false,
    commission_percentage: 10.0,
    affiliate_commission_tiers: {
      bronze: 5.0,
      silver: 7.5,
      gold: 10.0,
      diamond: 15.0
    }
  },
  integrations: {
    tradingview_enabled: true,
    tradingview_api_key: '***hidden***',
    binance_enabled: true,
    binance_api_key: '***hidden***',
    telegram_bot_enabled: true,
    telegram_bot_token: '***hidden***',
    smtp_enabled: true,
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    sms_provider: 'twilio',
    sms_api_key: '***hidden***'
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;

  try {
    switch (method) {
      case 'GET':
        const { category } = query;
        
        if (category && category !== 'all') {
          const categorySettings = systemSettings[category as keyof typeof systemSettings];
          if (!categorySettings) {
            return res.status(404).json({ success: false, message: 'Categoria não encontrada' });
          }
          res.status(200).json({
            success: true,
            settings: { [category as string]: categorySettings },
            timestamp: new Date().toISOString()
          });
        } else {
          res.status(200).json({
            success: true,
            settings: systemSettings,
            timestamp: new Date().toISOString()
          });
        }
        break;

      case 'PUT':
        const { category: updateCategory } = query;
        
        if (!updateCategory) {
          return res.status(400).json({ success: false, message: 'Categoria é obrigatória' });
        }

        if (!systemSettings[updateCategory as keyof typeof systemSettings]) {
          return res.status(404).json({ success: false, message: 'Categoria não encontrada' });
        }

        // Atualizar configurações da categoria
        systemSettings[updateCategory as keyof typeof systemSettings] = {
          ...systemSettings[updateCategory as keyof typeof systemSettings],
          ...req.body
        };

        res.status(200).json({
          success: true,
          message: 'Configurações atualizadas com sucesso',
          settings: systemSettings[updateCategory as keyof typeof systemSettings],
          timestamp: new Date().toISOString()
        });
        break;

      case 'POST':
        // Backup das configurações
        const backupData = {
          id: `backup_${Date.now()}`,
          settings: { ...systemSettings },
          created_at: new Date().toISOString(),
          created_by: req.body.user_id || 'admin'
        };

        res.status(200).json({
          success: true,
          message: 'Backup criado com sucesso',
          backup: backupData,
          timestamp: new Date().toISOString()
        });
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'POST']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Erro na API de configurações:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
}
