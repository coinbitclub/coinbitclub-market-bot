let nodemailerModule;
try {
  nodemailerModule = await import('nodemailer');
} catch (err) {
  console.warn('nodemailer not installed, using console logger');
  nodemailerModule = {
    createTransport: () => ({
      async sendMail(opts) {
        console.log('Mock email', opts);
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

export async function sendEmail(order) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: order.email,
    subject: 'Order Executed',
    text: JSON.stringify(order)
  });
}
