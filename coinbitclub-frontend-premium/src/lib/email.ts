import nodemailer from 'nodemailer';

// Configuração do transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  }
});

// Verificar conexão SMTP
export const verifyEmailConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log('✅ Servidor de email conectado');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão do email:', error);
    return false;
  }
};

// Template base para emails
const getEmailTemplate = (title: string, content: string, buttonText?: string, buttonUrl?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #000000, #1a1a1c); color: #fff; padding: 30px; text-align: center; }
    .logo { font-size: 24px; font-weight: bold; background: linear-gradient(45deg, #FFD700, #FFA500); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .content { padding: 30px; color: #333; line-height: 1.6; }
    .button { display: inline-block; background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8f8f8; padding: 20px; text-align: center; color: #666; font-size: 14px; }
    .social { margin: 20px 0; }
    .social a { color: #FFD700; text-decoration: none; margin: 0 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚡ CoinBitClub</div>
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${content}
      ${buttonText && buttonUrl ? `<div style="text-align: center;"><a href="${buttonUrl}" class="button">${buttonText}</a></div>` : ''}
    </div>
    <div class="footer">
      <div class="social">
        <a href="https://coinbitclub.com">Website</a> |
        <a href="https://t.me/coinbitclub">Telegram</a> |
        <a href="mailto:suporte@coinbitclub.com">Suporte</a>
      </div>
      <p>© 2025 CoinBitClub. Todos os direitos reservados.</p>
      <p style="font-size: 12px; color: #999;">
        Se você não solicitou este email, pode ignorá-lo com segurança.
      </p>
    </div>
  </div>
</body>
</html>
`;

// Enviar email de verificação
export const sendVerificationEmail = async (
  email: string, 
  name: string, 
  token: string
): Promise<boolean> => {
  try {
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/auth/verify-email?token=${token}`;
    
    const content = `
      <h2>Olá, ${name}! 👋</h2>
      <p>Bem-vindo ao CoinBitClub! Para começar a usar nossa plataforma de trading inteligente, você precisa verificar seu email.</p>
      <p>Clique no botão abaixo para confirmar sua conta:</p>
      <p><strong>⏰ Este link expira em 24 horas.</strong></p>
      <p>Se você não se cadastrou no CoinBitClub, pode ignorar este email.</p>
    `;

    await transporter.sendMail({
      from: `"CoinBitClub" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: '🔗 Confirme sua conta no CoinBitClub',
      html: getEmailTemplate(
        'Confirme sua conta',
        content,
        '✅ Verificar Email',
        verificationUrl
      )
    });

    console.log(`📧 Email de verificação enviado para: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email de verificação:', error);
    return false;
  }
};

// Enviar email de recuperação de senha
export const sendPasswordResetEmail = async (
  email: string, 
  name: string, 
  token: string
): Promise<boolean> => {
  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/auth/reset-password?token=${token}`;
    
    const content = `
      <h2>Olá, ${name}! 🔐</h2>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta no CoinBitClub.</p>
      <p>Clique no botão abaixo para criar uma nova senha:</p>
      <p><strong>⏰ Este link expira em 1 hora por segurança.</strong></p>
      <p>Se você não solicitou esta alteração, pode ignorar este email. Sua senha permanecerá inalterada.</p>
    `;

    await transporter.sendMail({
      from: `"CoinBitClub" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: '🔑 Redefinir senha - CoinBitClub',
      html: getEmailTemplate(
        'Redefinir Senha',
        content,
        '🔄 Redefinir Senha',
        resetUrl
      )
    });

    console.log(`📧 Email de reset enviado para: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email de reset:', error);
    return false;
  }
};

// Enviar email de boas-vindas
export const sendWelcomeEmail = async (
  email: string, 
  name: string
): Promise<boolean> => {
  try {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/dashboard`;
    
    const content = `
      <h2>🎉 Bem-vindo ao CoinBitClub, ${name}!</h2>
      <p>Sua conta foi criada com sucesso! Agora você tem acesso a:</p>
      <ul>
        <li>🤖 <strong>IA Avançada</strong> - Análise de mercado 24/7</li>
        <li>📈 <strong>Trading Automatizado</strong> - Execução de sinais inteligentes</li>
        <li>🛡️ <strong>Gestão de Risco</strong> - Proteção do seu capital</li>
        <li>📊 <strong>Dashboard Completo</strong> - Métricas em tempo real</li>
        <li>💰 <strong>Programa de Afiliados</strong> - Ganhe comissões</li>
      </ul>
      <p><strong>🎁 Seu teste gratuito de 7 dias já está ativo!</strong></p>
      <p>Acesse sua conta agora e comece a lucrar:</p>
    `;

    await transporter.sendMail({
      from: `"CoinBitClub" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: '🚀 Bem-vindo ao CoinBitClub - Seu teste gratuito começou!',
      html: getEmailTemplate(
        'Bem-vindo!',
        content,
        '🚀 Acessar Dashboard',
        dashboardUrl
      )
    });

    console.log(`📧 Email de boas-vindas enviado para: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email de boas-vindas:', error);
    return false;
  }
};

// Enviar notificação de pagamento
export const sendPaymentConfirmationEmail = async (
  email: string, 
  name: string, 
  planType: string,
  amount: number
): Promise<boolean> => {
  try {
    const content = `
      <h2>🎉 Pagamento confirmado, ${name}!</h2>
      <p>Seu pagamento foi processado com sucesso:</p>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Plano:</strong> ${planType.toUpperCase()}</p>
        <p><strong>Valor:</strong> R$ ${amount.toFixed(2)}</p>
        <p><strong>Status:</strong> ✅ Confirmado</p>
      </div>
      <p>Agora você tem acesso completo a todos os recursos premium da plataforma!</p>
      <p>Continue acompanhando seus resultados no dashboard:</p>
    `;

    await transporter.sendMail({
      from: `"CoinBitClub" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: '✅ Pagamento confirmado - CoinBitClub',
      html: getEmailTemplate(
        'Pagamento Confirmado',
        content,
        '📊 Ver Dashboard',
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/dashboard`
      )
    });

    console.log(`📧 Email de confirmação de pagamento enviado para: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email de confirmação:', error);
    return false;
  }
};

// Enviar lembrete de trial expirando
export const sendTrialExpiringEmail = async (
  email: string, 
  name: string, 
  daysRemaining: number
): Promise<boolean> => {
  try {
    const upgradeUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/upgrade`;
    
    const content = `
      <h2>⏰ Atenção, ${name}!</h2>
      <p>Seu teste gratuito no CoinBitClub expira em <strong>${daysRemaining} dia${daysRemaining > 1 ? 's' : ''}!</strong></p>
      <p>Não perca o acesso aos nossos recursos premium:</p>
      <ul>
        <li>Sinais de trading em tempo real</li>
        <li>IA avançada para análise de mercado</li>
        <li>Trading automatizado</li>
        <li>Gestão profissional de risco</li>
      </ul>
      <p>Faça upgrade agora e continue lucrando:</p>
    `;

    await transporter.sendMail({
      from: `"CoinBitClub" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: `⏰ Seu teste expira em ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''}!`,
      html: getEmailTemplate(
        'Trial Expirando',
        content,
        '🚀 Fazer Upgrade',
        upgradeUrl
      )
    });

    console.log(`📧 Email de trial expirando enviado para: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email de trial:', error);
    return false;
  }
};
