const { Resend } = require('resend');
const env = require('../config/env');

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

async function sendEmail({ from, to, subject, html }) {
  const sender = from || env.emailFrom;

  if (!resend) {
    console.log(`[Resend Skipped] From: ${sender} | To: ${to} | Subject: ${subject}`);
    console.log(`[Content] ${html}`);
    return { skipped: true, reason: 'RESEND_API_KEY not configured' };
  }

  try {
    await resend.emails.send({
      from: sender,
      to,
      subject,
      html,
    });
    return { skipped: false };
  } catch (error) {
    // We log the error but do NOT throw it.
    // Throwing it would completely abort the calling transaction (e.g. signup),
    // causing a 500 error for the user even if their account was successfully created.
    console.error('Failed to send email via Resend (check your API key and verified domains):', error.message);
    return { skipped: true, error: error.message };
  }
}

async function sendVerificationEmail(email, verifyUrl) {
  return sendEmail({
    from: env.emailFromAuth,
    to: email,
    subject: 'Verify your account',
    html: `<h1>Verify Email</h1><a href="${verifyUrl}">Verify Account</a>`,
  });
}

async function sendMagicLinkEmail(email, magicUrl) {
  return sendEmail({
    from: env.emailFromAuth,
    to: email,
    subject: 'Login Link',
    html: `<a href="${magicUrl}">Login</a>`,
  });
}

async function sendPasswordResetEmail(email, resetUrl) {
  return sendEmail({
    from: env.emailFromAuth,
    to: email,
    subject: 'Reset Password',
    html: `<a href="${resetUrl}">Reset Password</a>`,
  });
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendMagicLinkEmail,
  sendPasswordResetEmail,
};
