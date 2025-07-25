// Configuração de Email Service para CoinBitClub
// Integra com SendGrid, Nodemailer, ou outros provedores

const nodemailer = require('nodemailer');

// Configuração do transportador de email
const createEmailTransporter = () => {
  // Para produção, usar SendGrid ou outro provedor
  if (process.env.NODE_ENV === 'production') {
    // SendGrid
    if (process.env.SENDGRID_API_KEY) {
      return nodemailer.createTransporter({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
    }
    
    // SMTP genérico
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
  }
  
  // Para desenvolvimento, usar Ethereal Email (teste)
  return nodemailer.createTransporter({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
      pass: process.env.ETHEREAL_PASS || 'ethereal.pass'
    }
  });
};

// Template de email para reset de senha
const createResetEmailTemplate = (resetToken, email) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/redefinir-senha?token=${resetToken}`;
  
  return {
    subject: 'CoinBitClub - Redefinir Senha',
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinir Senha - CoinBitClub</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background-color: #f4f4f4; 
            margin: 0; 
            padding: 0; 
        }
        .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            border-radius: 12px; 
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .header { 
            background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: bold;
        }
        .content { 
            padding: 40px 30px; 
            color: #e2e8f0;
        }
        .content h2 { 
            color: #10b981; 
            margin-bottom: 20px;
            font-size: 24px;
        }
        .content p { 
            margin-bottom: 20px; 
            font-size: 16px;
            line-height: 1.8;
        }
        .reset-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 20px 0;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
            transition: all 0.3s ease;
        }
        .reset-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }
        .security-info { 
            background: rgba(16, 185, 129, 0.1); 
            border-left: 4px solid #10b981; 
            padding: 20px; 
            margin: 30px 0;
            border-radius: 0 8px 8px 0;
        }
        .security-info h3 {
            color: #10b981;
            margin-top: 0;
            font-size: 18px;
        }
        .security-info p {
            margin-bottom: 10px;
            font-size: 14px;
        }
        .footer { 
            background: #0f172a; 
            color: #64748b; 
            padding: 30px; 
            text-align: center; 
            font-size: 14px;
        }
        .footer a { 
            color: #10b981; 
            text-decoration: none; 
        }
        .footer a:hover { 
            text-decoration: underline; 
        }
        .warning {
            background: rgba(239, 68, 68, 0.1);
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .warning p {
            color: #fca5a5;
            margin: 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 CoinBitClub MarketBot</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Plataforma Premium de Trading</p>
        </div>
        
        <div class="content">
            <h2>Redefinir Sua Senha</h2>
            
            <p>Olá,</p>
            
            <p>Recebemos uma solicitação para redefinir a senha da sua conta CoinBitClub (<strong style="color: #10b981;">${email}</strong>).</p>
            
            <p>Para criar uma nova senha, clique no botão abaixo:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="reset-button">
                    🔑 Redefinir Minha Senha
                </a>
            </div>
            
            <div class="security-info">
                <h3>🛡️ Informações de Segurança:</h3>
                <p>• Este link expira em <strong>1 hora</strong></p>
                <p>• Use apenas uma vez</p>
                <p>• Se você não solicitou esta mudança, ignore este email</p>
                <p>• Sua conta permanece segura</p>
            </div>
            
            <div class="warning">
                <p><strong>⚠️ Atenção:</strong> Se você não conseguir clicar no botão, copie e cole este link no seu navegador:</p>
                <p style="word-break: break-all; margin-top: 10px;">${resetUrl}</p>
            </div>
            
            <p>Se você não solicitou esta redefinição de senha, pode ignorar este email com segurança. Sua conta não será afetada.</p>
            
            <p>Atenciosamente,<br>
            <strong style="color: #10b981;">Equipe CoinBitClub</strong></p>
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} CoinBitClub MarketBot. Todos os direitos reservados.</p>
            <p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}">Acessar Plataforma</a> | 
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/help">Central de Ajuda</a> | 
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/contact">Contato</a>
            </p>
            <p style="margin-top: 20px; font-size: 12px; opacity: 0.7;">
                Este é um email automático. Por favor, não responda.
            </p>
        </div>
    </div>
</body>
</html>
    `,
    text: `
CoinBitClub - Redefinir Senha

Olá,

Recebemos uma solicitação para redefinir a senha da sua conta CoinBitClub (${email}).

Para criar uma nova senha, acesse este link: ${resetUrl}

INFORMAÇÕES DE SEGURANÇA:
• Este link expira em 1 hora
• Use apenas uma vez  
• Se você não solicitou esta mudança, ignore este email
• Sua conta permanece segura

Se você não solicitou esta redefinição de senha, pode ignorar este email com segurança.

Atenciosamente,
Equipe CoinBitClub

© ${new Date().getFullYear()} CoinBitClub MarketBot. Todos os direitos reservados.
    `
  };
};

// Função principal para enviar email de reset
const sendResetEmail = async (email, resetToken) => {
  try {
    const transporter = createEmailTransporter();
    const emailTemplate = createResetEmailTemplate(resetToken, email);
    
    const mailOptions = {
      from: {
        name: 'CoinBitClub MarketBot',
        address: process.env.FROM_EMAIL || 'noreply@coinbitclub.com'
      },
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text
    };
    
    // Em ambiente de desenvolvimento, apenas simular
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n📧 EMAIL SIMULADO - Reset de Senha:');
      console.log(`Para: ${email}`);
      console.log(`Assunto: ${emailTemplate.subject}`);
      console.log(`Link: ${process.env.FRONTEND_URL || 'http://localhost:3001'}/redefinir-senha?token=${resetToken}`);
      console.log('⏰ Válido por: 1 hora\n');
      return { success: true, messageId: 'simulated-' + Date.now() };
    }
    
    // Enviar email real em produção
    const result = await transporter.sendMail(mailOptions);
    console.log('📧 Email de reset enviado:', result.messageId);
    
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    throw new Error('Falha no envio do email');
  }
};

// Configurar Ethereal Email para testes (se necessário)
const setupEtherealAccount = async () => {
  if (process.env.NODE_ENV === 'production') return;
  
  try {
    const nodemailer = require('nodemailer');
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('📧 Conta de teste Ethereal criada:');
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}`);
    console.log('   SMTP: smtp.ethereal.email:587');
    
    return testAccount;
  } catch (error) {
    console.log('⚠️ Não foi possível criar conta Ethereal:', error.message);
  }
};

module.exports = {
  sendResetEmail,
  createEmailTransporter,
  createResetEmailTemplate,
  setupEtherealAccount
};
