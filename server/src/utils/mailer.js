const env = require('../config/env');

let transporter = null;

function getTransporter() {
  if (!env.emailEnabled) return null;
  if (!transporter) {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass }
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) return { sent: false, reason: 'email-not-configured' };
  try {
    await t.sendMail({ from: env.smtp.from, to, subject, text, html });
    return { sent: true };
  } catch (error) {
    console.error('Email delivery failed:', error.message);
    return { sent: false, reason: 'delivery-failed' };
  }
}

module.exports = { sendEmail };
