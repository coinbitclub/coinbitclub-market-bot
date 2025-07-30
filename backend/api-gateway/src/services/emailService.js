import nodemailer from 'nodemailer';''
import logger from '../../../common/logger.js';''
import { env } from '../../../common/env.js';''

// Create email transporter
const createTransporter = () => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    logger.warn('SMTP configuration missing, emails will be logged only');''
    return {
      async sendMail(opts) {
        logger.info({ 
          to: opts.to, 
          subject: opts.subject,
          text: opts.text?.substring(0, 100) + '...'''
        }, 'Mock email sent');''
        return { messageId: 'mock-' + Date.now() };''
      }
    };
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE === 'true',''
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });
};

const transporter = createTransporter();

// Email templates
const templates = {
  passwordReset: (resetToken, userEmail) => ({
    subject: 'CoinBitClub - Reset Your Password',''
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">""
        <h2 style="color: #00FFD1;">Reset Your Password</h2>""
        <p>Hello,</p>
        <p>We received a request to reset the password for your CoinBitClub account (${userEmail}).</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">""
          <a href="${env.FRONTEND_URL}/reset-password?token=${resetToken}" ""
             style="background-color: #00FFD1; color: #0B0F1E; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">""
            Reset Password
          </a>
        </div>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, you can safely ignore this email.</p>''
        <hr style="margin: 30px 0; border: 1px solid #eee;">""
        <p style="color: #666; font-size: 12px;">""
          This email was sent by CoinBitClub. If you have questions, contact our support team.
        </p>
      </div>
    `,
    text: `Reset Your Password
    
    We received a request to reset the password for your CoinBitClub account (${userEmail}).
    
    Click this link to reset your password: ${env.FRONTEND_URL}/reset-password?token=${resetToken}
    
    This link will expire in 1 hour for security reasons.
    
    If you didn't request this password reset, you can safely ignore this email.`''
  }),

  welcomeEmail: (user) => ({
    subject: 'Welcome to CoinBitClub!',''
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">""
        <h2 style="color: #00FFD1;">Welcome to CoinBitClub, ${user.name}!</h2>""
        <p>Thank you for joining our cryptocurrency trading platform.</p>
        <p>Your account has been created successfully and you now have access to:</p>
        <ul>
          <li>7-day free trial</li>
          <li>Automated trading signals</li>
          <li>AI-powered decision making</li>
          <li>Risk management tools</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">""
          <a href="${env.FRONTEND_URL}/dashboard" ""
             style="background-color: #00FFD1; color: #0B0F1E; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">""
            Access Dashboard
          </a>
        </div>
        <p>Happy Trading!</p>
        <p>The CoinBitClub Team</p>
      </div>
    `
  }),

  orderExecution: (order) => ({
    subject: `Order ${order.status}: ${order.symbol}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">""
        <h2 style="color: ${order.side === 'BUY' ? '#4CAF50' : '#F44336'};">""
          Order ${order.status}: ${order.symbol}
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">""
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Symbol:</strong></td>""
            <td style="padding: 8px; border: 1px solid #ddd;">${order.symbol}</td>""
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Side:</strong></td>""
            <td style="padding: 8px; border: 1px solid #ddd;">${order.side}</td>""
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Quantity:</strong></td>""
            <td style="padding: 8px; border: 1px solid #ddd;">${order.quantity}</td>""
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Price:</strong></td>""
            <td style="padding: 8px; border: 1px solid #ddd;">$${order.price}</td>""
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Status:</strong></td>""
            <td style="padding: 8px; border: 1px solid #ddd;">${order.status}</td>""
          </tr>
        </table>
        <p>Check your dashboard for more details.</p>
      </div>
    `
  }),

  riskAlert: (alert) => ({
    subject: `Risk Alert: ${alert.type}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">""
        <h2 style="color: #F44336;">⚠️ Risk Alert</h2>""
        <p><strong>Alert Type:</strong> ${alert.type}</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        <p><strong>Recommendation:</strong> ${alert.recommendation}</p>
        <p>Please review your account immediately.</p>
      </div>
    `
  })
};

// Send email function
async function sendEmail(to, templateNameOrData, data = {}) {
  try {
    let emailContent;
    
    // If first param is template name (string), use predefined template
    if (typeof templateNameOrData === 'string') {''
      const templateName = templateNameOrData;
      switch (templateName) {
        case 'passwordReset':''
          emailContent = templates.passwordReset(data.resetToken, to);
          break;
        case 'welcomeEmail':''
          emailContent = templates.welcomeEmail(data);
          break;
        case 'orderExecution':''
          emailContent = templates.orderExecution(data);
          break;
        case 'riskAlert':''
          emailContent = templates.riskAlert(data);
          break;
        case 'subscriptionCreated':''
          emailContent = {
            subject: 'Subscription Confirmed - CoinBitClub',''
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">""
                <h2 style="color: #00FFD1;">Subscription Confirmed!</h2>""
                <p>Hello ${data.userName},</p>
                <p>Your subscription to ${data.planName} has been confirmed!</p>
                <p>Next billing: ${data.nextBilling}</p>
              </div>
            `
          };
          break;
        case 'paymentFailed':''
          emailContent = {
            subject: 'Payment Failed - CoinBitClub',''
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">""
                <h2 style="color: #dc3545;">Payment Failed</h2>""
                <p>Hello ${data.userName},</p>
                <p>We were unable to process your payment of $${data.amount}.</p>
                <p>Please update your payment method.</p>
              </div>
            `
          };
          break;
        case 'affiliatePayout':''
          emailContent = {
            subject: 'Affiliate Payout Processed - CoinBitClub',''
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">""
                <h2 style="color: #28a745;">Payout Processed!</h2>""
                <p>Hello ${data.affiliateName},</p>
                <p>Your affiliate payout of $${data.amount} has been processed.</p>
              </div>
            `
          };
          break;
        default:
          throw new Error(`Template '${templateName}' not found`);''
      }
    } else {
      // If first param is object, use it directly as email content
      emailContent = templateNameOrData;
    }
    
    const mailOptions = {
      from: `"CoinBitClub" <${env.SMTP_FROM}>`,""
      to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    const result = await transporter.sendMail(mailOptions);
    
    logger.info({ 
      to, 
      subject: emailContent.subject,
      messageId: result.messageId 
    }, 'Email sent successfully');''
    
    return result;
  } catch (error) {
    logger.error({ error, to }, 'Failed to send email');''
    throw error;
  }
}

// Exported functions
export async function sendResetEmail(to, resetToken) {
  return sendEmail(to, templates.passwordReset(resetToken, to));
}

export async function sendWelcomeEmail(user) {
  return sendEmail(user.email, templates.welcomeEmail(user));
}

export async function sendOrderNotification(user, order) {
  return sendEmail(user.email, templates.orderExecution(order));
}

export async function sendRiskAlert(user, alert) {
  return sendEmail(user.email, templates.riskAlert(alert));
}

// Health check for email service
export async function verifyEmailService() {
  try {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      await transporter.verify();
      return { status: 'healthy' };''
    } else {
      return { status: 'mock', message: 'SMTP not configured, using mock' };''
    }
  } catch (error) {
    return { status: 'error', error: error.message };''
  }
}

export default {
  sendEmail,
  sendResetEmail,
  sendWelcomeEmail,
  sendOrderNotification,
  sendRiskAlert,
  verifyEmailService
};
