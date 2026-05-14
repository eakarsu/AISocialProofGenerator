const nodemailer = require('nodemailer');

// Create transporter - uses SMTP env vars if set, otherwise logs to console
function createTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
}

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = createTransporter();

  if (!transporter) {
    // Fallback: log to console in development
    console.log('=== EMAIL (no SMTP configured) ===');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text || html}`);
    console.log('==================================');
    return { success: true, message: 'Email logged (SMTP not configured)' };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html
    });
    console.log(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Email send error:', err.message);
    return { success: false, error: err.message };
  }
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  return sendEmail({
    to: email,
    subject: 'Password Reset Request - AI Social Proof Generator',
    text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you did not request this, please ignore this email.`,
    html: `<h2>Password Reset Request</h2><p>Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p>`
  });
};

const sendVerificationEmail = async (email, verificationToken) => {
  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
  return sendEmail({
    to: email,
    subject: 'Verify Your Email - AI Social Proof Generator',
    text: `Please verify your email by clicking this link:\n\n${verifyUrl}`,
    html: `<h2>Email Verification</h2><p>Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
  });
};

module.exports = { sendEmail, sendPasswordResetEmail, sendVerificationEmail };
