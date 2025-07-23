import logger from '../../common/logger.js';

let nodemailerModule;
try {
  nodemailerModule = await import('nodemailer');
} catch (err) {
  logger.warn('nodemailer not installed, using console logger');
  nodemailerModule = {
    createTransport: () => ({
      async sendMail(opts) {
        logger.info({ opts }, 'Mock email');
      }
    })
  };
}

const transporter = nodemailerModule.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendEmail(info) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: info.to,
    subject: info.subject,
    text: info.message
  });
}
